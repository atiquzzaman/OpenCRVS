/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import {
  indexComposition,
  searchByCompositionId
} from '@search/elasticsearch/dbhelper'
import {
  createStatusHistory,
  detectBirthDuplicates,
  EVENT,
  getCreatedBy,
  getStatus,
  IBirthCompositionBody,
  NAME_EN,
  IOperationHistory,
  REJECTED_STATUS,
  DECLARED_STATUS,
  IN_PROGRESS_STATUS,
  updateCompositionWithDuplicates
} from '@search/elasticsearch/utils'
import {
  findEntry,
  findName,
  findNameLocale,
  findTask,
  findTaskExtension,
  findTaskIdentifier,
  findEntryResourceByUrl,
  addEventLocation,
  getdeclarationJurisdictionIds,
  addFlaggedAsPotentialDuplicate
} from '@search/features/fhir/fhir-utils'
import { logger } from '@search/logger'
import * as Hapi from '@hapi/hapi'
import { client } from '@search/elasticsearch/client'
import { getSubmittedIdentifier } from '@search/features/search/utils'
import {
  getComposition,
  SavedComposition,
  ValidRecord
} from '@opencrvs/commons/types'

const MOTHER_CODE = 'mother-details'
const FATHER_CODE = 'father-details'
const INFORMANT_CODE = 'informant-details'
const CHILD_CODE = 'child-details'
const BIRTH_ENCOUNTER_CODE = 'birth-encounter'

function getTypeFromTask(task: fhir.Task) {
  return task?.businessStatus?.coding?.[0]?.code
}

export async function upsertEvent(requestBundle: Hapi.Request) {
  const bundle = requestBundle.payload as ValidRecord
  const bundleEntries = bundle.entry
  const authHeader = requestBundle.headers.authorization

  await indexAndSearchComposition(
    getComposition(bundle),
    authHeader,
    bundleEntries
  )
}

async function indexAndSearchComposition(
  composition: SavedComposition,
  authHeader: string,
  bundleEntries?: fhir.BundleEntry[]
) {
  const compositionId = composition.id
  const result = await searchByCompositionId(compositionId, client)
  const task = findTask(bundleEntries)

  const body: IBirthCompositionBody = {
    event: EVENT.BIRTH,
    createdAt:
      (result &&
        result.body.hits.hits.length > 0 &&
        result.body.hits.hits[0]._source.createdAt) ||
      Date.now().toString(),
    modifiedAt: Date.now().toString(),
    operationHistories: (await getStatus(compositionId)) as IOperationHistory[]
  }

  body.type = getTypeFromTask(task)
  body.modifiedAt = Date.now().toString()

  if (body.type === REJECTED_STATUS) {
    const rejectAnnotation: fhir.Annotation = (task &&
      task.note &&
      Array.isArray(task.note) &&
      task.note.length > 0 &&
      task.note[task.note.length - 1]) || { text: '' }
    const nodeText = rejectAnnotation.text
    body.rejectReason =
      (task && task.statusReason && task.statusReason.text) || ''
    body.rejectComment = nodeText
  }

  const regLastUserIdentifier = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/regLastUser'
  )

  body.updatedBy =
    regLastUserIdentifier &&
    regLastUserIdentifier.valueReference &&
    regLastUserIdentifier.valueReference.reference &&
    regLastUserIdentifier.valueReference.reference.split('/')[1]

  await createIndexBody(body, composition, authHeader, bundleEntries)
  await indexComposition(compositionId, body, client)

  if (body.type === DECLARED_STATUS || body.type === IN_PROGRESS_STATUS) {
    await detectAndUpdateBirthDuplicates(compositionId, composition, body)
  }
}

async function createIndexBody(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  authHeader: string,
  bundleEntries?: fhir.BundleEntry[]
) {
  await createChildIndex(body, composition, bundleEntries)
  createMotherIndex(body, composition, bundleEntries)
  createFatherIndex(body, composition, bundleEntries)
  createInformantIndex(body, composition, bundleEntries)
  await createDeclarationIndex(body, composition, bundleEntries)
  const task = findTask(bundleEntries)
  await createStatusHistory(body, task, authHeader)
}

async function createChildIndex(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const child = findEntry<fhir.Patient>(CHILD_CODE, composition, bundleEntries)

  if (!child) {
    return
  }

  await addEventLocation(body, BIRTH_ENCOUNTER_CODE, composition)

  const childName = findName(NAME_EN, child.name)
  const childNameLocal = findNameLocale(child.name)

  body.childIdentifier =
    child.identifier && getSubmittedIdentifier(child.identifier)
  body.childFirstNames =
    childName && childName.given && childName.given.join(' ')
  body.childFamilyName = childName && childName.family && childName.family[0]
  body.childFirstNamesLocal =
    childNameLocal && childNameLocal.given && childNameLocal.given.join(' ')
  body.childFamilyNameLocal =
    childNameLocal && childNameLocal.family && childNameLocal.family[0]
  body.childDoB = child.birthDate
  body.gender = child.gender
}

function createMotherIndex(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const mother = findEntry<fhir.Patient>(
    MOTHER_CODE,
    composition,
    bundleEntries
  )

  if (!mother) {
    return
  }

  const motherName = findName(NAME_EN, mother.name)
  const motherNameLocal = findNameLocale(mother.name)

  body.motherFirstNames =
    motherName && motherName.given && motherName.given.join(' ')
  body.motherFamilyName =
    motherName && motherName.family && motherName.family[0]
  body.motherFirstNamesLocal =
    motherNameLocal && motherNameLocal.given && motherNameLocal.given.join(' ')
  body.motherFamilyNameLocal =
    motherNameLocal && motherNameLocal.family && motherNameLocal.family[0]
  body.motherDoB = mother.birthDate
  body.motherIdentifier =
    mother.identifier && getSubmittedIdentifier(mother.identifier)
}

function createFatherIndex(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const father = findEntry<fhir.Patient>(
    FATHER_CODE,
    composition,
    bundleEntries
  )

  if (!father) {
    return
  }

  const fatherName = findName(NAME_EN, father.name)
  const fatherNameLocal = findNameLocale(father.name)

  body.fatherFirstNames =
    fatherName && fatherName.given && fatherName.given.join(' ')
  body.fatherFamilyName =
    fatherName && fatherName.family && fatherName.family[0]
  body.fatherFirstNamesLocal =
    fatherNameLocal && fatherNameLocal.given && fatherNameLocal.given.join(' ')
  body.fatherFamilyNameLocal =
    fatherNameLocal && fatherNameLocal.family && fatherNameLocal.family[0]
  body.fatherDoB = father.birthDate
  body.fatherIdentifier =
    father.identifier && getSubmittedIdentifier(father.identifier)
}

function createInformantIndex(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const informantRef = findEntry<fhir.RelatedPerson>(
    INFORMANT_CODE,
    composition,
    bundleEntries
  )

  if (!informantRef || !informantRef.patient) {
    return
  }

  const informant = findEntryResourceByUrl<fhir.Patient>(
    informantRef.patient.reference,
    bundleEntries
  )

  if (!informant) {
    return
  }

  const informantName = findName(NAME_EN, informant.name)
  const informantNameLocal = findNameLocale(informant.name)

  body.informantFirstNames =
    informantName && informantName.given && informantName.given.join(' ')
  body.informantFamilyName =
    informantName && informantName.family && informantName.family[0]
  body.informantFirstNamesLocal =
    informantNameLocal &&
    informantNameLocal.given &&
    informantNameLocal.given.join(' ')
  body.informantFamilyNameLocal =
    informantNameLocal &&
    informantNameLocal.family &&
    informantNameLocal.family[0]
  body.informantDoB = informant.birthDate
  body.informantIdentifier =
    informant.identifier && getSubmittedIdentifier(informant.identifier)
}

async function createDeclarationIndex(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const task = findTask(bundleEntries)
  const contactPersonExtention = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/contact-person'
  )
  const contactPersonRelationshipExtention = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/contact-relationship'
  )
  const contactNumberExtension = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/contact-person-phone-number'
  )
  const emailExtension = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/contact-person-email'
  )
  const placeOfDeclarationExtension = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/regLastOffice'
  )

  const trackingIdIdentifier = findTaskIdentifier(
    task,
    'http://opencrvs.org/specs/id/birth-tracking-id'
  )

  const registrationNumberIdentifier = findTaskIdentifier(
    task,
    'http://opencrvs.org/specs/id/birth-registration-number'
  )

  const regLastUserIdentifier = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/regLastUser'
  )

  const regLastUser =
    regLastUserIdentifier &&
    regLastUserIdentifier.valueReference &&
    regLastUserIdentifier.valueReference.reference &&
    regLastUserIdentifier.valueReference.reference.split('/')[1]

  const compositionTypeCode =
    composition.type.coding &&
    composition.type.coding.find(
      (code) => code.system === 'http://opencrvs.org/doc-types'
    )

  body.informantType =
    (contactPersonRelationshipExtention &&
      contactPersonRelationshipExtention.valueString) ||
    (contactPersonExtention && contactPersonExtention.valueString)
  body.contactNumber =
    contactNumberExtension && contactNumberExtension.valueString
  body.contactEmail = emailExtension && emailExtension.valueString
  body.type = task && getTypeFromTask(task)
  body.dateOfDeclaration = task && task.lastModified
  body.trackingId = trackingIdIdentifier && trackingIdIdentifier.value
  body.registrationNumber =
    registrationNumberIdentifier && registrationNumberIdentifier.value
  body.declarationLocationId =
    placeOfDeclarationExtension &&
    placeOfDeclarationExtension.valueReference &&
    placeOfDeclarationExtension.valueReference.reference &&
    placeOfDeclarationExtension.valueReference.reference.split('/')[1]
  body.declarationJurisdictionIds = await getdeclarationJurisdictionIds(
    body.declarationLocationId
  )
  body.compositionType =
    (compositionTypeCode && compositionTypeCode.code) || 'birth-declaration'

  const createdBy = await getCreatedBy(composition.id || '')

  body.createdBy = createdBy || regLastUser
  body.updatedBy = regLastUser
}

async function detectAndUpdateBirthDuplicates(
  compositionId: string,
  composition: fhir.Composition,
  body: IBirthCompositionBody
) {
  const duplicates = await detectBirthDuplicates(compositionId, body)
  if (!duplicates.length) {
    return
  }
  logger.info(
    `Search/service:birth: ${duplicates.length} duplicate composition(s) found`
  )
  await addFlaggedAsPotentialDuplicate(
    duplicates.map((ite) => ite.trackingId).join(','),
    compositionId
  )
  return await updateCompositionWithDuplicates(
    composition,
    duplicates.map((it) => it.id)
  )
}
