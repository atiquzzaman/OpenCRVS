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
import * as Hapi from '@hapi/hapi'
import {
  BundleEntry,
  CertifiedRecord,
  changeState,
  CorrectionRequestedRecord,
  Extension,
  findExtension,
  getCorrectionRequestedTask,
  getTaskFromSavedBundle,
  IssuedRecord,
  isPaymentReconciliationBundleEntry,
  PaymentReconciliation,
  Practitioner,
  RegisteredRecord,
  Task,
  sortTasksDescending,
  RecordWithPreviousTask,
  ValidatedRecord,
  Attachment,
  InProgressRecord,
  ReadyForReviewRecord,
  Encounter,
  SavedBundleEntry,
  ValidRecord,
  Bundle,
  SavedTask,
  WaitingForValidationRecord,
  EVENT_TYPE,
  getComposition,
  OPENCRVS_SPECIFICATION_URL,
  RegistrationNumber,
  RejectedRecord
} from '@opencrvs/commons/types'
import {
  REG_NUMBER_SYSTEM,
  SECTION_CODE
} from '@workflow/features/events/utils'
import {
  setupLastRegLocation,
  setupLastRegUser,
  updatePatientIdentifierWithRN,
  validateDeceasedDetails
} from '@workflow/features/registration/fhir/fhir-bundle-modifier'
import { IEventRegistrationCallbackPayload } from '@workflow/features/registration/handler'
import { ASSIGNED_EXTENSION_URL } from '@workflow/features/task/fhir/constants'
import { getTaskEventType } from '@workflow/features/task/fhir/utils'
import {
  ApproveRequestInput,
  CorrectionRejectionInput,
  CorrectionRequestInput,
  MakeCorrectionRequestInput,
  ChangedValuesInput
} from '@workflow/records/correction-request'
import {
  createCorrectedTask,
  createCorrectionEncounter,
  createCorrectionPaymentResources,
  createCorrectionProofOfLegalCorrectionDocument,
  createCorrectionRequestTask,
  createDownloadTask,
  createRegisterTask,
  createRejectTask,
  createUpdatedTask,
  createValidateTask,
  createWaitingForValidationTask,
  getTaskHistory
} from '@workflow/records/fhir'
import { ISystemModelData, IUserModelData } from '@workflow/records/user'

export async function toCorrected(
  record: RegisteredRecord | CertifiedRecord | IssuedRecord,
  practitioner: Practitioner,
  correctionDetails: MakeCorrectionRequestInput,
  proofOfLegalCorrectionAttachments: Attachment[],
  paymentAttachmentURL?: string
): Promise<RegisteredRecord> {
  const previousTask = getTaskFromSavedBundle(record)

  let correctionPaymentBundleEntries: BundleEntry[] = []

  if (correctionDetails.payment) {
    correctionPaymentBundleEntries = createCorrectionPaymentResources(
      correctionDetails.payment,
      paymentAttachmentURL
    )
  }

  const correctionEncounter = createCorrectionEncounter()
  const otherDocumentReferences = proofOfLegalCorrectionAttachments.map(
    (attachment) =>
      createCorrectionProofOfLegalCorrectionDocument(
        correctionEncounter.fullUrl,
        attachment.data!,
        attachment.type!
      )
  )

  const paymentReconciliation = correctionPaymentBundleEntries.find(
    isPaymentReconciliationBundleEntry
  )

  const correctedTask = createCorrectedTask(
    previousTask,
    correctionDetails,
    correctionEncounter,
    paymentReconciliation
  )

  const correctionRequestTaskWithPractitionerExtensions = setupLastRegUser(
    correctedTask,
    practitioner
  )

  const correctionRequestWithLocationExtensions = await setupLastRegLocation(
    correctionRequestTaskWithPractitionerExtensions,
    practitioner
  )

  const newEntries = [
    ...record.entry.filter((entry) => entry.resource.id !== previousTask.id),
    ...correctionPaymentBundleEntries,
    ...otherDocumentReferences,
    correctionEncounter,
    { resource: correctionRequestWithLocationExtensions }
  ]

  const updatedRecord = {
    ...record,
    entry: newEntries
  }

  return changeState(updatedRecord, 'REGISTERED')
}

export async function toCorrectionApproved(
  record: CorrectionRequestedRecord,
  practitioner: Practitioner,
  correctionDetails: ApproveRequestInput
): Promise<RecordWithPreviousTask<RegisteredRecord>> {
  const currentCorrectionRequestedTask = getCorrectionRequestedTask(record)

  const correctionAcceptedTask: Task = {
    ...currentCorrectionRequestedTask,
    status: 'accepted',
    extension: extensionsWithoutAssignment(
      currentCorrectionRequestedTask.extension
    )
  }

  const correctionEncounter = record.entry.find(
    (resource): resource is SavedBundleEntry<Encounter> =>
      resource.resource.id ===
      currentCorrectionRequestedTask.encounter.reference.split('/')[1]
  )
  if (!correctionEncounter) {
    throw new Error('No correction encounter found')
  }

  const correctionPaymentId = findExtension(
    'http://opencrvs.org/specs/extension/paymentDetails',
    currentCorrectionRequestedTask.extension
  )

  const paymentReconciliation = correctionPaymentId
    ? record.entry.find(
        (resource): resource is SavedBundleEntry<PaymentReconciliation> =>
          resource.resource.id ===
          correctionPaymentId.valueReference.reference.split('/')[1]
      )
    : undefined

  const correctedTask = createCorrectedTask(
    correctionAcceptedTask,
    correctionDetails,
    correctionEncounter,
    paymentReconciliation
  )

  const correctionRequestTaskWithPractitionerExtensions = setupLastRegUser(
    correctedTask,
    practitioner
  )

  const correctionRequestWithLocationExtensions = await setupLastRegLocation(
    correctionRequestTaskWithPractitionerExtensions,
    practitioner
  )

  return changeState(
    {
      ...record,
      entry: [
        ...record.entry.filter(
          (entry) => entry.resource.id !== correctionAcceptedTask.id
        ),
        { resource: correctionAcceptedTask },
        { resource: correctionRequestWithLocationExtensions }
      ]
    },
    'REGISTERED'
  ) as any as RecordWithPreviousTask<RegisteredRecord>
}

export async function toUpdated(
  record: InProgressRecord | ReadyForReviewRecord,
  practitioner: Practitioner,
  updatedDetails: ChangedValuesInput
): Promise<InProgressRecord | ReadyForReviewRecord> {
  const previousTask = getTaskFromSavedBundle(record)

  const updatedTask = createUpdatedTask(
    previousTask,
    updatedDetails,
    practitioner
  )
  const updatedTaskWithPractitionerExtensions = setupLastRegUser(
    updatedTask,
    practitioner
  )

  const updatedTaskWithLocationExtensions = await setupLastRegLocation(
    updatedTaskWithPractitionerExtensions,
    practitioner
  )

  const newEntries = [
    ...record.entry.map((entry) => {
      if (entry.resource.id !== previousTask.id) {
        return entry
      }
      return {
        ...entry,
        resource: updatedTaskWithLocationExtensions
      }
    })
  ]

  const updatedRecord = {
    ...record,
    entry: newEntries
  }
  return updatedRecord
}

export async function toDownloaded(
  record: ValidRecord,
  user: IUserModelData | ISystemModelData,
  extensionUrl:
    | 'http://opencrvs.org/specs/extension/regDownloaded'
    | 'http://opencrvs.org/specs/extension/regAssigned'
) {
  const previousTask = getTaskFromSavedBundle(record)

  const downloadedTask = await createDownloadTask(
    previousTask,
    user,
    extensionUrl
  )

  const downloadedRecord = {
    ...record,
    entry: [
      ...record.entry.filter((entry) => entry.resource.id !== previousTask.id),
      { resource: downloadedTask }
    ]
  }

  const downloadedRecordWithTaskOnly: Bundle<SavedTask> = {
    resourceType: 'Bundle',
    type: 'document',
    entry: [{ resource: downloadedTask }]
  }

  return { downloadedRecord, downloadedRecordWithTaskOnly }
}

export async function toRejected(
  record: ReadyForReviewRecord | ValidatedRecord,
  practitioner: Practitioner,
  statusReason: fhir3.CodeableConcept
): Promise<RejectedRecord> {
  const previousTask = getTaskFromSavedBundle(record)
  const rejectedTask = createRejectTask(
    previousTask,
    practitioner,
    statusReason
  )

  const rejectedTaskWithPractitionerExtensions = setupLastRegUser(
    rejectedTask,
    practitioner
  )

  const rejectedTaskWithLocationExtensions = await setupLastRegLocation(
    rejectedTaskWithPractitionerExtensions,
    practitioner
  )

  return changeState(
    {
      ...record,
      entry: [
        ...record.entry.filter(
          (entry) => entry.resource.id !== previousTask.id
        ),
        { resource: rejectedTaskWithLocationExtensions }
      ]
    },
    'REJECTED'
  )
}

export async function toWaitingForExternalValidationState(
  record: ReadyForReviewRecord | ValidatedRecord,
  practitioner: Practitioner
): Promise<WaitingForValidationRecord> {
  const previousTask = getTaskFromSavedBundle(record)
  const waitForValidationTask = createWaitingForValidationTask(
    previousTask,
    practitioner
  )

  const waitForValidationTaskWithPractitionerExtensions = setupLastRegUser(
    waitForValidationTask,
    practitioner
  )

  const waitForValidationTaskWithLocationExtensions =
    await setupLastRegLocation(
      waitForValidationTaskWithPractitionerExtensions,
      practitioner
    )

  return changeState(
    {
      ...record,
      entry: [
        ...record.entry.filter(
          (entry) => entry.resource.id !== previousTask.id
        ),
        { resource: waitForValidationTaskWithLocationExtensions }
      ]
    },
    'WAITING_VALIDATION'
  )
}

export async function toRegistered(
  request: Hapi.Request,
  record: WaitingForValidationRecord,
  practitioner: Practitioner,
  registrationNumber: IEventRegistrationCallbackPayload['compositionId'],
  childIdentifiers?: IEventRegistrationCallbackPayload['childIdentifiers']
): Promise<RegisteredRecord> {
  const previousTask = getTaskFromSavedBundle(record)
  const registeredTask = createRegisterTask(previousTask, practitioner)

  const registerTaskWithPractitionerExtensions = setupLastRegUser(
    registeredTask,
    practitioner
  )

  const event = getTaskEventType(registeredTask) as EVENT_TYPE
  const composition = getComposition(record)
  const patients = updatePatientIdentifierWithRN(
    record,
    composition,
    SECTION_CODE[event],
    REG_NUMBER_SYSTEM[event],
    registrationNumber
  )

  /* Setting registration number here */
  const system = `${OPENCRVS_SPECIFICATION_URL}id/${
    event.toLowerCase() as Lowercase<typeof event>
  }-registration-number` as const

  registeredTask.identifier.push({
    system,
    value: registrationNumber as RegistrationNumber
  })

  if (event === EVENT_TYPE.BIRTH && childIdentifiers) {
    // For birth event patients[0] is child and it should
    // already be initialized with the RN identifier
    childIdentifiers.forEach((childIdentifier) => {
      const previousIdentifier = patients[0].identifier!.find(
        ({ type }) => type?.coding?.[0].code === childIdentifier.type
      )
      if (!previousIdentifier) {
        patients[0].identifier!.push({
          type: {
            coding: [{ code: childIdentifier.type }]
          },
          value: childIdentifier.value
        })
      } else {
        previousIdentifier.value = childIdentifier.value
      }
    })
  }

  if (event === EVENT_TYPE.DEATH) {
    /** using first patient because for death event there is only one patient */
    patients[0] = await validateDeceasedDetails(patients[0], {
      Authorization: request.headers.authorization
    })
  }

  const registeredTaskWithLocationExtensions = await setupLastRegLocation(
    registerTaskWithPractitionerExtensions,
    practitioner
  )
  const patientIds = patients.map((p) => p.id)

  const entriesWithUpdatedPatients = [
    ...record.entry.map((e) => {
      if (!patientIds.includes(e.resource.id)) {
        return e
      }
      return {
        ...e,
        resource: patients.find(({ id }) => id === e.resource.id)!
      }
    })
  ]
  return changeState(
    {
      ...record,
      entry: [
        ...entriesWithUpdatedPatients.filter(
          (entry) => entry.resource.id !== previousTask.id
        ),
        { resource: registeredTaskWithLocationExtensions }
      ]
    },
    'REGISTERED'
  )
}

export async function toValidated(
  record: InProgressRecord | ReadyForReviewRecord,
  practitioner: Practitioner
): Promise<ValidatedRecord> {
  const previousTask = getTaskFromSavedBundle(record)
  const validatedTask = createValidateTask(previousTask, practitioner)

  const validatedTaskWithPractitionerExtensions = setupLastRegUser(
    validatedTask,
    practitioner
  )

  const validatedTaskWithLocationExtensions = await setupLastRegLocation(
    validatedTaskWithPractitionerExtensions,
    practitioner
  )

  return changeState(
    {
      ...record,
      entry: [
        ...record.entry.filter(
          (entry) => entry.resource.id !== previousTask.id
        ),
        { resource: validatedTaskWithLocationExtensions }
      ]
    },
    'VALIDATED'
  )
}

export async function toCorrectionRequested(
  record: RegisteredRecord | CertifiedRecord | IssuedRecord,
  practitioner: Practitioner,
  correctionDetails: CorrectionRequestInput,
  proofOfLegalCorrectionAttachments: Array<{ type: string; url: string }>,
  paymentAttachmentURL?: string
): Promise<CorrectionRequestedRecord> {
  const previousTask = getTaskFromSavedBundle(record)

  let correctionPaymentBundleEntries: BundleEntry[] = []

  if (correctionDetails.payment) {
    correctionPaymentBundleEntries = createCorrectionPaymentResources(
      correctionDetails.payment,
      paymentAttachmentURL
    )
  }

  const correctionEncounter = createCorrectionEncounter()
  const otherDocumentReferences = proofOfLegalCorrectionAttachments.map(
    (attachment) =>
      createCorrectionProofOfLegalCorrectionDocument(
        correctionEncounter.fullUrl,
        attachment.url,
        attachment.type
      )
  )

  const paymentReconciliation = correctionPaymentBundleEntries.find(
    isPaymentReconciliationBundleEntry
  )

  const correctionRequestTask = createCorrectionRequestTask(
    previousTask,
    correctionDetails,
    correctionEncounter,
    practitioner,
    paymentReconciliation
  )

  const correctionRequestTaskWithPractitionerExtensions = setupLastRegUser(
    correctionRequestTask,
    practitioner
  )

  const correctionRequestWithLocationExtensions = await setupLastRegLocation(
    correctionRequestTaskWithPractitionerExtensions,
    practitioner
  )

  return changeState(
    {
      ...record,
      entry: [
        ...record.entry.filter(
          (entry) => entry.resource.id !== previousTask.id
        ),
        ...correctionPaymentBundleEntries,
        ...otherDocumentReferences,
        correctionEncounter,
        { resource: correctionRequestWithLocationExtensions }
      ]
    },
    'CORRECTION_REQUESTED'
  )
}

export async function toCorrectionRejected(
  record: CorrectionRequestedRecord,
  practitioner: Practitioner,
  rejectionDetails: CorrectionRejectionInput
): Promise<
  RecordWithPreviousTask<RegisteredRecord | CertifiedRecord | IssuedRecord>
> {
  const currentCorrectionRequestedTask = getTaskFromSavedBundle(record)

  const correctionRejectionTask: Task = {
    ...currentCorrectionRequestedTask,
    status: 'rejected',
    reason: {
      text: rejectionDetails.reason
    },
    extension: extensionsWithoutAssignment(
      currentCorrectionRequestedTask.extension
    )
  }

  const correctionRejectionTaskWithPractitionerExtensions = setupLastRegUser(
    correctionRejectionTask,
    practitioner
  )

  const correctionRejectionWithLocationExtensions = await setupLastRegLocation(
    correctionRejectionTaskWithPractitionerExtensions,
    practitioner
  )

  const taskHistory = await getTaskHistory(currentCorrectionRequestedTask.id)

  const previousTaskBeforeCorrection = sortTasksDescending(
    taskHistory.entry.map((x) => x.resource)
  )

  const firstNonCorrectionTask = previousTaskBeforeCorrection.find((task) =>
    task.businessStatus?.coding?.some(
      (coding) => coding.code !== 'CORRECTION_REQUESTED'
    )
  )

  const previousStatus = firstNonCorrectionTask?.businessStatus?.coding?.[0]
    ?.code as 'REGISTERED' | 'CERTIFIED' | 'ISSUED'

  if (!firstNonCorrectionTask) {
    throw new Error(
      'Record did not have any tasks before correction. This should never happen'
    )
  }

  const previousTaskWithPractitionerExtensions = setupLastRegUser(
    firstNonCorrectionTask,
    practitioner
  )

  const previousTaskWithLocationExtensions = await setupLastRegLocation(
    previousTaskWithPractitionerExtensions,
    practitioner
  )

  // This is important as otherwise the when the older task is removed later on this one gets dropped out
  previousTaskWithPractitionerExtensions.lastModified = new Date().toISOString()

  const tasksToBeIncludedInBundle = [
    correctionRejectionWithLocationExtensions,
    previousTaskWithLocationExtensions
  ]

  return changeState(
    {
      ...record,
      entry: [
        ...record.entry.filter(
          (entry) => entry.resource.id !== currentCorrectionRequestedTask.id
        ),
        ...tasksToBeIncludedInBundle.map((resource) => ({ resource }))
      ]
    },
    previousStatus
  ) as any as RecordWithPreviousTask<
    RegisteredRecord | CertifiedRecord | IssuedRecord
  >
}

function extensionsWithoutAssignment(extensions: Extension[]) {
  return extensions.filter(
    (extension) => extension.url !== ASSIGNED_EXTENSION_URL
  )
}
