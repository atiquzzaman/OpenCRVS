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
import { IAuthHeader } from '@opencrvs/commons'
import {
  ArchivedRecord,
  EVENT_TYPE,
  SavedBundle,
  Resource,
  Bundle,
  SavedTask,
  CertifiedRecord,
  ReadyForReviewRecord,
  RejectedRecord,
  ValidRecord,
  getTaskFromSavedBundle,
  getBusinessStatus
} from '@opencrvs/commons/types'
import { WORKFLOW_URL } from '@gateway/constants'
import fetch from '@gateway/fetch'
import {
  GQLBirthRegistrationInput,
  GQLCertificateInput,
  GQLCorrectionInput,
  GQLCorrectionRejectionInput,
  GQLDeathRegistrationInput,
  GQLMarriageRegistrationInput
} from '@gateway/graphql/schema'
import { hasScope } from '@gateway/features/user/utils/index'

const createRequest = async <T = any>(
  method: 'POST' | 'GET' | 'PUT' | 'DELETE',
  path: string,
  authHeader: IAuthHeader,
  body?: Record<string, any>
): Promise<T> => {
  const response = await fetch(new URL(path, WORKFLOW_URL).href, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    },
    body: body ? JSON.stringify(body) : undefined
  })

  if (!response.ok) {
    if (response.status === 400) {
      const data = await response.json()
      throw new Error(data.message)
    }

    throw new Error(response.statusText)
  }

  return response.json()
}

export function requestRegistrationCorrection(
  recordId: string,
  correctionDetails: GQLCorrectionInput,
  authHeader: IAuthHeader
) {
  return createRequest(
    'POST',
    `/records/${recordId}/request-correction`,
    authHeader,
    correctionDetails
  )
}

export function approveRegistrationCorrection(
  recordId: string,
  record:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput,
  authHeader: IAuthHeader
) {
  return createRequest<void>(
    'POST',
    `/records/${recordId}/approve-correction`,
    authHeader,
    record
  )
}

export function makeRegistrationCorrection(
  recordId: string,
  record:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput,
  authHeader: IAuthHeader
) {
  return createRequest<void>(
    'POST',
    `/records/${recordId}/make-correction`,
    authHeader,
    record
  )
}

export function rejectRegistrationCorrection(
  recordId: string,
  details: GQLCorrectionRejectionInput,
  authHeader: IAuthHeader
) {
  return createRequest<void>(
    'POST',
    `/records/${recordId}/reject-correction`,
    authHeader,
    details
  )
}

export async function createRegistration(
  record:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput,
  event: EVENT_TYPE,
  authHeader: IAuthHeader
) {
  const res = await createRequest<{
    compositionId: string
    trackingId: string
    isPotentiallyDuplicate: boolean
  }>('POST', '/create-record', authHeader, { record, event })

  if (hasScope(authHeader, 'validate') && !res.isPotentiallyDuplicate) {
    createRequest('POST', `/records/${res.compositionId}/validate`, authHeader)
  }

  if (hasScope(authHeader, 'register') && !res.isPotentiallyDuplicate) {
    createRequest('POST', `/records/${res.compositionId}/register`, authHeader)
  }

  return res
}

export async function updateRegistration(
  id: string,
  authHeader: IAuthHeader,
  details:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput,
  event: EVENT_TYPE
) {
  return await createRequest<void>(
    'POST',
    `/records/${id}/update`,
    authHeader,
    {
      details,
      event
    }
  )
}

export async function validateRegistration(
  id: string,
  authHeader: IAuthHeader
) {
  return await createRequest<Promise<void>>(
    'POST',
    `/records/${id}/validate`,
    authHeader
  )
}

export async function unassignRegistration(
  id: string,
  authHeader: IAuthHeader
) {
  return await createRequest<Bundle<SavedTask>>(
    'POST',
    '/unassign-record',
    authHeader,
    { id }
  )
}

export async function fetchRegistrationForDownloading(
  id: string,
  authHeader: IAuthHeader
) {
  return await createRequest<SavedBundle<Resource>>(
    'POST',
    '/download-record',
    authHeader,
    { id }
  )
}

export async function registerDeclaration(
  id: string,
  authHeader: IAuthHeader,
  event: EVENT_TYPE
) {
  return await createRequest('POST', `/records/${id}/register`, authHeader, {
    event
  })
}

export function certifyRegistration(
  recordId: string,
  certificate: GQLCertificateInput,
  event: EVENT_TYPE,
  authHeader: IAuthHeader
) {
  return createRequest<CertifiedRecord>(
    'POST',
    `/records/${recordId}/certify-record`,
    authHeader,
    {
      certificate,
      event
    }
  )
}

export async function archiveRegistration(
  id: string,
  authHeader: IAuthHeader,
  reason?: string,
  comment?: string,
  duplicateTrackingId?: string
) {
  const res: ArchivedRecord = await createRequest(
    'POST',
    `/records/${id}/archive`,
    authHeader,
    {
      reason,
      comment,
      duplicateTrackingId
    }
  )

  const taskEntry = res.entry.find((e) => e.resource.resourceType === 'Task')!

  return taskEntry
}

export async function duplicateRegistration(
  id: string,
  authHeader: IAuthHeader,
  reason?: string,
  comment?: string,
  duplicateTrackingId?: string
) {
  const res: ReadyForReviewRecord = await createRequest(
    'POST',
    `/records/${id}/duplicate`,
    authHeader,
    {
      reason,
      comment,
      duplicateTrackingId
    }
  )

  const taskEntry = res.entry.find((e) => e.resource.resourceType === 'Task')!

  return taskEntry
}

export async function rejectDeclaration(
  id: string,
  authHeader: IAuthHeader,
  reason: string,
  comment: string
) {
  const rejectedRecord: RejectedRecord = await createRequest(
    'POST',
    `/records/${id}/reject`,
    authHeader,
    {
      reason,
      comment
    }
  )

  return rejectedRecord.entry.find((e) => e.resource.resourceType === 'Task')
}

export async function reinstateRegistration(
  id: string,
  authHeader: IAuthHeader
) {
  const reinstatedRecord: ValidRecord = await createRequest(
    'POST',
    `/records/${id}/reinstate`,
    authHeader,
    {
      id
    }
  )

  const task = getTaskFromSavedBundle(reinstatedRecord)

  return { taskId: task.id, prevRegStatus: getBusinessStatus(task) }
}
