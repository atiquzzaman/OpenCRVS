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

import { GQLRelatedPersonInput } from '@opencrvs/gateway/src/graphql/schema'
import { ICertificate, IFileValue, TransformedData } from '@client/forms'
import { omit } from 'lodash'

export function transformCertificateData(
  transformedData: TransformedData,
  certificateData: ICertificate,
  sectionId: string
) {
  transformedData[sectionId].certificates = [
    {
      ...omit(certificateData, 'collector')
    }
  ]
  // for collector mapping
  if (certificateData && certificateData.collector) {
    let collector: GQLRelatedPersonInput = {}
    if (certificateData.collector.type) {
      collector.relationship = certificateData.collector.type as string
    }
    if (certificateData.collector.relationship) {
      collector.otherRelationship = certificateData.collector
        .relationship as string
      collector = {
        name: [
          {
            use: 'en',
            firstNames: certificateData.collector.firstName as string,
            familyName: certificateData.collector.lastName as string
          }
        ],
        identifier: [
          {
            id: certificateData.collector.iD as string,
            type: certificateData.collector.iDType as string
          }
        ]
      }
    }
    if (certificateData.collector.affidavitFile) {
      collector.affidavit = [
        {
          contentType: (certificateData.collector.affidavitFile as IFileValue)
            .type,
          data: (certificateData.collector.affidavitFile as IFileValue).data
        }
      ]
    }
    transformedData[sectionId].certificates[0].collector = collector
  }
}
