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
import * as Influx from 'influx'
import {
  INFLUX_DB,
  INFLUX_HOST,
  INFLUX_PORT
} from '@metrics/influxdb/constants'
import { logger } from '@metrics/logger'
import { IPoints } from '@metrics/features/registration'
import fetch from 'node-fetch'

export const influx = new Influx.InfluxDB({
  host: INFLUX_HOST,
  database: INFLUX_DB,
  port: INFLUX_PORT,
  schema: [
    {
      measurement: 'birth_reg',
      fields: {
        compositionId: Influx.FieldType.STRING,
        currentStatus: Influx.FieldType.STRING,
        ageInDays: Influx.FieldType.INTEGER
      },
      tags: [
        'regStatus',
        'gender',
        'officeLocation',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    },
    {
      measurement: 'death_reg',
      fields: {
        compositionId: Influx.FieldType.STRING,
        currentStatus: Influx.FieldType.STRING,
        ageInYears: Influx.FieldType.INTEGER,
        deathDays: Influx.FieldType.INTEGER
      },
      tags: [
        'regStatus',
        'gender',
        'mannerOfDeath',
        'causeOfDeath',
        'officeLocation',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    },
    {
      measurement: 'in_complete_fields',
      fields: {
        compositionId: Influx.FieldType.STRING
      },
      tags: [
        'regStatus',
        'missingFieldSectionId',
        'missingFieldGroupId',
        'missingFieldId',
        'eventType',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    },
    {
      measurement: 'declaration_time_logged',
      fields: {
        timeSpentEditing: Influx.FieldType.INTEGER,
        compositionId: Influx.FieldType.STRING
      },
      tags: [
        'currentStatus',
        'trackingId',
        'eventType',
        'practitionerId',
        'officeLocation',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    },
    {
      measurement: 'declaration_event_duration',
      fields: {
        durationInSeconds: Influx.FieldType.INTEGER,
        compositionId: Influx.FieldType.STRING,
        currentTaskId: Influx.FieldType.STRING,
        previousTaskId: Influx.FieldType.STRING
      },
      tags: ['currentStatus', 'previousStatus', 'eventType']
    },
    {
      measurement: 'certification_payment',
      fields: {
        total: Influx.FieldType.FLOAT,
        compositionId: Influx.FieldType.STRING
      },
      tags: [
        'eventType',
        'officeLocation',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    },
    {
      measurement: 'correction_payment',
      fields: {
        total: Influx.FieldType.FLOAT,
        compositionId: Influx.FieldType.STRING
      },
      tags: [
        'eventType',
        'officeLocation',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    },
    {
      measurement: 'declarations_started',
      fields: {
        role: Influx.FieldType.STRING,
        status: Influx.FieldType.STRING,
        compositionId: Influx.FieldType.STRING
      },
      tags: [
        'eventType',
        'practitionerId',
        'officeLocation',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    },
    {
      measurement: 'declarations_rejected',
      fields: {
        compositionId: Influx.FieldType.STRING
      },
      tags: [
        'eventType',
        'startedBy',
        'officeLocation',
        'locationLevel5',
        'locationLevel4',
        'locationLevel3',
        'locationLevel2'
      ]
    }
  ]
})

export const writePoints = (points: IPoints[]) => {
  return influx.writePoints(points).catch((err: Error) => {
    logger.error(`Error saving data to InfluxDB! ${err.stack}`)
    throw err
  })
}

export const query = <T = any>(q: string): Promise<T> => {
  try {
    return influx.query(q)
  } catch (err) {
    logger.error(`Error reading data from InfluxDB! ${err.stack}`)
    throw err
  }
}

export async function deleteMeasurements() {
  try {
    await Promise.all([
      influx.dropMeasurement('birth_reg', INFLUX_DB),
      influx.dropMeasurement('death_reg', INFLUX_DB),
      influx.dropMeasurement('in_complete_fields', INFLUX_DB),
      influx.dropMeasurement('declaration_time_logged', INFLUX_DB),
      influx.dropMeasurement('declaration_event_duration', INFLUX_DB),
      influx.dropMeasurement('certification_payment', INFLUX_DB),
      influx.dropMeasurement('correction_payment', INFLUX_DB),
      influx.dropMeasurement('declarations_started', INFLUX_DB),
      influx.dropMeasurement('declarations_rejected', INFLUX_DB)
    ])
    return {
      status: `Successfully deleted all the measurements form ${INFLUX_DB} database`
    }
  } catch (err) {
    logger.error(`Error deleting ${INFLUX_DB} database from InfluxDB! ${err}`)
    throw err
  }
}

export async function getCSV(measurement: string) {
  // This is done with a plain HTTP request so the result can be streamed
  const res = await fetch(
    `http://${INFLUX_HOST}:${INFLUX_PORT}/query?db=${INFLUX_DB}&q=SELECT * FROM ${measurement}`,
    {
      headers: {
        Accept: 'application/csv'
      }
    }
  )
  return res.body
}
