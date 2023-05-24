/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
import { HEARTH_MONGO_URL, PRODUCTION, QA_ENV } from '@metrics/constants'
import { logger } from '@metrics/logger'
import { subMinutes } from 'date-fns'
import { MongoClient } from 'mongodb'

/*
 * This creates new simplified data views in MongoDB for Metabase to read its data from.
 * This is required because our FHIR schema is too complex for real-time aggregations
 *
 * There can only be one data update ongoing at one time. This is because
 * - It takes significant processing to form these views
 * - Views are created in two steps for which we do not use transaction for. Having two runs at the same time might cause inconsistency in the data.
 *
 * View refresher is controlled by two flags
 * - One that tracks whether an update is in progress
 * - One that tracks if an uodate has been requested after the first update run started
 */
import * as Hapi from '@hapi/hapi'

let updateInProgress = false
let nextUpdateRequested = false

export async function performanceDataRefreshHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  refresh().catch((error) => {
    logger.error(`Error on performance data refresh triggered: ${error}`)
  })
  return h.response({
    message: 'Successfully triggered performance data refresh',
    statusCode: 200
  })
}

export async function refresh() {
  if (updateInProgress) {
    logger.info('Performance materialised views already being refreshed')
    nextUpdateRequested = true
    return
  }
  logger.info('Refreshing performance materialised views')
  const client = new MongoClient(HEARTH_MONGO_URL)
  try {
    updateInProgress = true
    const connectedClient = await client.connect()
    await refreshPerformanceMaterialisedViews(connectedClient)
    logger.info('Performance materialised views refreshed')
  } catch (error) {
    logger.error(`Error refreshing performances materialised views ${error}`)
  } finally {
    await client.close()

    updateInProgress = false
    if (nextUpdateRequested) {
      nextUpdateRequested = false
      refresh()
    }
  }
}

async function refreshPerformanceMaterialisedViews(client: MongoClient) {
  const db = client.db()
  const REFRESH_AFTER_IN_MINUTE = PRODUCTION && !QA_ENV ? 1440 : 5
  const lastUpdatedAt = subMinutes(
    new Date(),
    REFRESH_AFTER_IN_MINUTE
  ).toISOString()
  await db
    .collection('Task')
    .aggregate(
      [
        {
          $match: {
            'meta.lastUpdated': { $gte: lastUpdatedAt }
          }
        },
        { $unwind: '$businessStatus.coding' },
        {
          $match: {
            'businessStatus.coding.code': {
              $in: ['CERTIFIED', 'REGISTERED', 'ISSUED']
            }
          }
        },
        {
          $addFields: {
            compositionId: {
              $arrayElemAt: [{ $split: ['$focus.reference', '/'] }, 1]
            }
          }
        },
        {
          $lookup: {
            from: 'Composition',
            localField: 'compositionId',
            foreignField: 'id',
            as: 'composition'
          }
        },
        { $unwind: '$composition' },
        { $addFields: { 'composition.latestTask': '$$ROOT' } },
        { $replaceRoot: { newRoot: '$composition' } },
        {
          $addFields: {
            extensions: {
              $arrayToObject: {
                $map: {
                  input: '$section',
                  as: 'el',
                  in: [
                    {
                      $let: {
                        vars: {
                          firstElement: {
                            $arrayElemAt: ['$$el.code.coding', 0]
                          }
                        },
                        in: '$$firstElement.code'
                      }
                    },
                    {
                      $let: {
                        vars: {
                          firstElement: { $arrayElemAt: ['$$el.entry', 0] }
                        },
                        in: {
                          $arrayElemAt: [
                            { $split: ['$$firstElement.reference', '/'] },
                            1
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Task',
            localField: 'latestTask.focus.reference',
            foreignField: 'focus.reference',
            as: 'task'
          }
        },
        {
          $lookup: {
            from: 'Task_history',
            localField: 'latestTask.focus.reference',
            foreignField: 'focus.reference',
            as: 'task_history'
          }
        },
        {
          $addFields: {
            allTasks: { $concatArrays: ['$task', '$task_history'] }
          }
        },
        {
          $addFields: {
            registerTask: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$allTasks',
                    cond: {
                      $eq: [
                        'REGISTERED',
                        {
                          $let: {
                            vars: {
                              coding: {
                                $arrayElemAt: [
                                  '$$this.businessStatus.coding',
                                  0
                                ]
                              }
                            },
                            in: '$$coding.code'
                          }
                        }
                      ]
                    }
                  }
                },
                0
              ]
            },
            firstTask: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$allTasks',
                    cond: {
                      $eq: [
                        {
                          $min: '$allTasks.meta.lastUpdated'
                        },
                        '$$this.meta.lastUpdated'
                      ]
                    }
                  }
                },
                0
              ]
            }
          }
        },
        {
          $addFields: {
            'firstTask.extensionsObject': {
              $arrayToObject: {
                $map: {
                  input: '$firstTask.extension',
                  as: 'el',
                  in: [
                    {
                      $replaceOne: {
                        input: '$$el.url',
                        find: 'http://opencrvs.org/specs/extension/',
                        replacement: ''
                      }
                    },
                    {
                      $arrayElemAt: [
                        { $split: ['$$el.valueReference.reference', '/'] },
                        1
                      ]
                    }
                  ]
                }
              }
            },
            'registerTask.extensionsObject': {
              $arrayToObject: {
                $map: {
                  input: '$registerTask.extension',
                  as: 'el',
                  in: [
                    {
                      $replaceOne: {
                        input: '$$el.url',
                        find: 'http://opencrvs.org/specs/extension/',
                        replacement: ''
                      }
                    },
                    {
                      $arrayElemAt: [
                        { $split: ['$$el.valueReference.reference', '/'] },
                        1
                      ]
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Patient',
            localField: 'extensions.mother-details',
            foreignField: 'id',
            as: 'mother'
          }
        },
        {
          $lookup: {
            from: 'Patient',
            localField: 'extensions.mother-details',
            foreignField: 'id',
            as: 'mother'
          }
        },
        {
          $lookup: {
            from: 'Patient',
            localField: 'extensions.father-details',
            foreignField: 'id',
            as: 'father'
          }
        },
        {
          $lookup: {
            from: 'Encounter',
            localField: 'extensions.birth-encounter',
            foreignField: 'id',
            as: 'encounter'
          }
        },
        { $unwind: '$encounter' },
        { $unwind: '$encounter.location' },
        {
          $addFields: {
            placeOfBirthLocationId: {
              $replaceOne: {
                input: '$encounter.location.location.reference',
                find: 'Location/',
                replacement: ''
              }
            }
          }
        },
        {
          $addFields: {
            encounterIdForJoining: { $concat: ['Encounter/', '$encounter.id'] }
          }
        },
        {
          $lookup: {
            from: 'Location',
            localField: 'placeOfBirthLocationId',
            foreignField: 'id',
            as: 'placeOfBirthLocation'
          }
        },
        {
          $lookup: {
            from: 'Patient',
            localField: 'extensions.child-details',
            foreignField: 'id',
            as: 'child'
          }
        },
        { $unwind: '$mother' },
        { $unwind: '$father' },
        { $unwind: '$child' },
        { $unwind: '$placeOfBirthLocation' },
        {
          $addFields: {
            childsAgeInDaysAtDeclaration: {
              $divide: [
                {
                  $subtract: [
                    { $toDate: '$date' },
                    { $toDate: '$child.birthDate' }
                  ]
                },
                1000 * 60 * 60 * 24
              ]
            },
            mothersAgeAtBirthOfChild: {
              $divide: [
                {
                  $subtract: [
                    { $toDate: '$child.birthDate' },
                    { $toDate: '$mother.birthDate' }
                  ]
                },
                1000 * 60 * 60 * 24 * 365
              ]
            },
            placeOfBirthType: {
              $arrayElemAt: ['$placeOfBirthLocation.type.coding.code', 0]
            },
            'mother.extensionsObject': {
              $arrayToObject: {
                $map: {
                  input: '$mother.extension',
                  as: 'el',
                  in: [
                    {
                      $replaceOne: {
                        input: '$$el.url',
                        find: 'http://opencrvs.org/specs/extension/',
                        replacement: ''
                      }
                    },
                    '$$el.valueString'
                  ]
                }
              }
            },
            'father.extensionsObject': {
              $arrayToObject: {
                $map: {
                  input: '$father.extension',
                  as: 'el',
                  in: [
                    {
                      $replaceOne: {
                        input: '$$el.url',
                        find: 'http://opencrvs.org/specs/extension/',
                        replacement: ''
                      }
                    },
                    '$$el.valueString'
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Practitioner',
            localField: 'registerTask.extensionsObject.regLastUser',
            foreignField: 'id',
            as: 'practitioner'
          }
        },
        { $unwind: '$practitioner' },
        { $unwind: '$practitioner.name' },
        {
          $addFields: {
            practitionerRoleForJoining: {
              $concat: ['Practitioner/', '$practitioner.id']
            },
            practitionerFirstname: {
              $reduce: {
                input: '$practitioner.name.given',
                initialValue: '',
                in: { $concat: ['$$value', ' ', '$$this'] }
              }
            },
            practitionerFamilyname: {
              $cond: {
                if: {
                  $isArray: '$practitioner.name.family'
                },
                then: {
                  $reduce: {
                    input: '$practitioner.name.family',
                    initialValue: '',
                    in: { $concat: ['$$value', ' ', '$$this'] }
                  }
                },
                else: '$practitioner.name.family'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'PractitionerRole',
            localField: 'practitionerRoleForJoining',
            foreignField: 'practitioner.reference',
            as: 'practitionerRole'
          }
        },
        { $unwind: '$practitionerRole' },
        {
          $addFields: {
            firstCode: { $slice: ['$practitionerRole.code', 1] }
          }
        },
        { $unwind: '$firstCode' },
        {
          $match: {
            'firstCode.coding.system': 'http://opencrvs.org/specs/roles'
          }
        },
        {
          $lookup: {
            from: 'Location',
            localField: 'firstTask.extensionsObject.regLastOffice',
            foreignField: 'id',
            as: 'office'
          }
        },
        { $unwind: '$office' },
        {
          $addFields: {
            'office.district': {
              $arrayElemAt: [{ $split: ['$office.partOf.reference', '/'] }, 1]
            }
          }
        },
        {
          $lookup: {
            from: 'Location',
            localField: 'office.district',
            foreignField: 'id',
            as: 'district'
          }
        },
        { $unwind: '$district' },
        {
          $addFields: {
            'district.state': {
              $arrayElemAt: [{ $split: ['$district.partOf.reference', '/'] }, 1]
            }
          }
        },
        {
          $lookup: {
            from: 'Location',
            localField: 'district.state',
            foreignField: 'id',
            as: 'state'
          }
        },
        { $unwind: '$state' },
        {
          $project: {
            _id: 1,
            id: 1,
            event: 'Birth',
            mothersLiteracy: '$mother.extensionsObject.literacy',
            fathersLiteracy: '$father.extensionsObject.literacy',
            mothersEducationalAttainment:
              '$mother.extensionsObject.educational-attainment',
            fathersEducationalAttainment:
              '$father.extensionsObject.educational-attainment',
            gender: '$child.gender',
            birthOrder: '$child.multipleBirthInteger',
            createdBy: '$firstTask.extensionsObject.regLastUser',
            officeName: '$office.name',
            districtName: '$district.name',
            stateName: '$state.name',
            createdAt: {
              $dateFromString: { dateString: '$firstTask.lastModified' }
            },
            status: '$latestTask.businessStatus.coding.code',
            childsAgeInDaysAtDeclaration: 1,
            mothersAgeAtBirthOfChildInYears: '$mothersAgeAtBirthOfChild',
            placeOfBirthType: 1,
            practitionerRole: { $arrayElemAt: ['$firstCode.coding.code', 0] },
            practitionerName: {
              $concat: [
                '$practitionerFamilyname',
                ', ',
                '$practitionerFirstname'
              ]
            }
          }
        },
        {
          $merge: {
            into: { db: 'performance', coll: 'registrations' },
            on: '_id',
            whenMatched: 'replace',
            whenNotMatched: 'insert'
          }
        }
      ],
      { allowDiskUse: true }
    )
    .toArray()

  await db
    .collection('Task')
    .aggregate(
      [
        {
          $unionWith: 'Task_history'
        },
        {
          $match: {
            'meta.lastUpdated': { $gte: lastUpdatedAt },
            'extension.url':
              'http://opencrvs.org/specs/extension/requestCorrection'
          }
        },
        {
          $addFields: {
            compositionId: {
              $arrayElemAt: [{ $split: ['$focus.reference', '/'] }, 1]
            },
            extensionsObject: {
              $arrayToObject: {
                $map: {
                  input: '$extension',
                  as: 'el',
                  in: [
                    {
                      $replaceOne: {
                        input: '$$el.url',
                        find: 'http://opencrvs.org/specs/extension/',
                        replacement: ''
                      }
                    },
                    {
                      $arrayElemAt: [
                        { $split: ['$$el.valueReference.reference', '/'] },
                        1
                      ]
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Composition',
            localField: 'compositionId',
            foreignField: 'id',
            as: 'composition'
          }
        },
        { $unwind: '$composition' },
        {
          $addFields: {
            extensions: {
              $arrayToObject: {
                $map: {
                  input: '$composition.section',
                  as: 'el',
                  in: [
                    {
                      $let: {
                        vars: {
                          firstElement: {
                            $arrayElemAt: ['$$el.code.coding', 0]
                          }
                        },
                        in: '$$firstElement.code'
                      }
                    },
                    {
                      $let: {
                        vars: {
                          firstElement: { $arrayElemAt: ['$$el.entry', 0] }
                        },
                        in: {
                          $arrayElemAt: [
                            { $split: ['$$firstElement.reference', '/'] },
                            1
                          ]
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: 'Patient',
            localField: 'extensions.child-details',
            foreignField: 'id',
            as: 'child'
          }
        },
        { $unwind: '$child' },
        {
          $lookup: {
            from: 'Location',
            localField: 'extensionsObject.regLastOffice',
            foreignField: 'id',
            as: 'office'
          }
        },
        { $unwind: '$office' },
        {
          $addFields: {
            'office.district': {
              $arrayElemAt: [{ $split: ['$office.partOf.reference', '/'] }, 1]
            }
          }
        },
        {
          $lookup: {
            from: 'Location',
            localField: 'office.district',
            foreignField: 'id',
            as: 'district'
          }
        },
        { $unwind: '$district' },
        {
          $addFields: {
            'district.state': {
              $arrayElemAt: [{ $split: ['$district.partOf.reference', '/'] }, 1]
            }
          }
        },
        {
          $lookup: {
            from: 'Location',
            localField: 'district.state',
            foreignField: 'id',
            as: 'state'
          }
        },
        { $unwind: '$state' },
        {
          $project: {
            _id: '$id',
            gender: '$child.gender',
            reason: '$reason.text',
            extensions: '$extensions',
            officeName: '$office.name',
            districtName: '$district.name',
            stateName: '$state.name',
            event: 'Birth',
            createdAt: {
              $dateFromString: { dateString: '$lastModified' }
            }
          }
        },
        {
          $merge: {
            into: { db: 'performance', coll: 'corrections' },
            on: '_id',
            whenMatched: 'replace',
            whenNotMatched: 'insert'
          }
        }
      ],
      { allowDiskUse: true }
    )
    .toArray()

  await db
    .collection('Location')
    .aggregate(
      [
        { $match: { 'identifier.1.value': 'STATE' } },
        {
          $addFields: {
            extensionsObject: {
              $arrayToObject: {
                $map: {
                  input: '$extension',
                  as: 'el',
                  in: [
                    {
                      $replaceOne: {
                        input: '$$el.url',
                        find: 'http://opencrvs.org/specs/id/',
                        replacement: ''
                      }
                    },
                    {
                      $function: {
                        body: `function (jsonString) {
                          return JSON.parse(jsonString)
                        }`,
                        args: ['$$el.valueString'],
                        lang: 'js'
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        { $unwind: '$extensionsObject.statistics-crude-birth-rates' },
        {
          $project: {
            name: 1,

            populations: {
              $reduce: {
                input: {
                  $map: {
                    input: '$extensionsObject.statistics-total-populations',
                    as: 'kv',
                    in: {
                      $map: {
                        input: { $objectToArray: '$$kv' },
                        as: 'kv2',
                        in: {
                          year: '$$kv2.k',
                          value: '$$kv2.v'
                        }
                      }
                    }
                  }
                },
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] }
              }
            },
            cbr: {
              $map: {
                input: {
                  $objectToArray:
                    '$extensionsObject.statistics-crude-birth-rates'
                },
                as: 'kv',
                in: {
                  year: '$$kv.k',
                  cbr: '$$kv.v'
                }
              }
            }
          }
        },
        { $unwind: '$cbr' },
        {
          $addFields: {
            daysInYear: {
              $function: {
                body: `function (row) {
                  function daysInYear(year) {
                    return (year % 4 === 0 && year % 100 > 0) || year % 400 == 0
                      ? 366
                      : 365
                  }
                  const year = row.cbr.year
                  const date = new Date(row.cbr.year, 1, 1)
                  const population = row.populations.find(
                    (p) => p.year === year
                  )
                  if (!population) {
                    return []
                  }
                  const totalDays = daysInYear(year)
                  return Array.from({ length: totalDays }, (value, index) => {
                    date.setDate(date.getDate() + 1)
                    return {
                      date: date.toISOString(),
                      estimatedNumberOfBirths:
                        ((population.value / 1000) * row.cbr.cbr) / totalDays
                    }
                  })
                }`,
                args: ['$$ROOT'],
                lang: 'js'
              }
            }
          }
        },
        { $unwind: '$daysInYear' },
        {
          $project: {
            _id: { $concat: [{ $toString: '$name' }, '$daysInYear.date'] },
            name: 1,
            date: { $dateFromString: { dateString: '$daysInYear.date' } },
            estimatedNumberOfBirths: '$daysInYear.estimatedNumberOfBirths',
            event: 'Birth'
          }
        },
        {
          $merge: {
            into: { db: 'performance', coll: 'populationEstimatesPerDay' },
            on: '_id',
            whenMatched: 'replace',
            whenNotMatched: 'insert'
          }
        }
      ],
      { allowDiskUse: true }
    )
    .toArray()
}
