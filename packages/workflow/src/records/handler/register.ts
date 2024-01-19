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

import { getLoggedInPractitionerResource } from '@workflow/features/user/utils'
import { createRoute } from '@workflow/states'
import { getToken } from '@workflow/utils/authUtils'
import {
  toRejected,
  toWaitingForExternalValidationState
} from '@workflow/records/state-transitions'
import { sendBundleToHearth } from '@workflow/records/fhir'
import { indexBundle } from '@workflow/records/search'
import { invokeRegistrationValidation } from '@workflow/features/registration/fhir/fhir-bundle-modifier'
import { REG_NUMBER_GENERATION_FAILED } from '@workflow/features/registration/fhir/constants'

export const registerRoute = [
  createRoute({
    method: 'POST',
    path: '/records/{recordId}/register',
    allowedStartStates: ['READY_FOR_REVIEW', 'VALIDATED'],
    action: 'WAITING_VALIDATION',
    handler: async (request, record) => {
      const token = getToken(request)

      const practitioner = await getLoggedInPractitionerResource(token)
      const recordInWaitingValidationState =
        await toWaitingForExternalValidationState(record, practitioner)

      await sendBundleToHearth(recordInWaitingValidationState)
      await indexBundle(recordInWaitingValidationState, token)

      try {
        await invokeRegistrationValidation(
          recordInWaitingValidationState,
          request.headers
        )
      } catch (error) {
        const statusReason: fhir3.CodeableConcept = {
          text: REG_NUMBER_GENERATION_FAILED
        }
        const { rejectedRecord: recordInRejectedState } = await toRejected(
          record,
          practitioner,
          statusReason
        )

        await sendBundleToHearth(recordInRejectedState)
        await indexBundle(recordInRejectedState, token)

        return recordInRejectedState
      }

      return recordInWaitingValidationState
    }
  })
]
