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
import React from 'react'
import { MockedResponse } from '@apollo/client/testing'
import { CREATE_FORM_DRAFT } from '@client/views/SysAdmin/Config/Forms/mutations'
import { IFormDraft } from '@client/forms/configuration/formDrafts/utils'
import { DraftStatus, Event } from '@client/utils/gateway'
import { SaveActionContext, SaveActionModal } from './SaveActionModal'
import { AppStore, createStore } from '@client/store'
import { History } from 'history'
import { createTestComponent, flushPromises } from '@client/tests/util'
import { ReactWrapper } from 'enzyme'
import { ActionStatus } from '@client/views/SysAdmin/Config/Forms/utils'
import { Route } from 'react-router'

const draft: IFormDraft = {
  event: Event.Birth,
  status: DraftStatus.Draft,
  version: 1,
  history: [],
  updatedAt: Date.now(),
  createdAt: Date.now()
}

const graphqlMocks: MockedResponse[] = [
  {
    request: {
      query: CREATE_FORM_DRAFT,
      variables: {
        event: Event.Birth,
        comment: 'No comment',
        questions: [
          {
            fieldId: 'birth.child.child-view-group.vaccination',
            label: [
              {
                lang: 'en',
                descriptor: {
                  defaultMessage: 'What vaccinations has the child received?',
                  description: 'Label for form field: vaccination question',
                  id: 'form.field.label.vaccination'
                }
              }
            ],
            placeholder: [
              {
                lang: 'en',
                descriptor: {
                  defaultMessage: 'E.G. Polio, Diptheria',
                  description:
                    'Placeholder for form field: vaccination question',
                  id: 'form.field.label.vaccinationPlaceholder'
                }
              }
            ],
            description: [
              {
                lang: 'en',
                descriptor: {
                  defaultMessage: 'Vaccine name',
                  description: 'Input field for vaccination question',
                  id: 'form.field.label.vaccinationDescription'
                }
              }
            ],
            tooltip: [
              {
                lang: 'en',
                descriptor: {
                  defaultMessage: 'Enter the Vaccine name',
                  description: 'Tooltip for form field: vaccination question',
                  id: 'form.field.label.vaccinationTooltip'
                }
              }
            ],
            errorMessage: [
              {
                lang: 'en',
                descriptor: {
                  defaultMessage: 'Please enter the valid vaccine name',
                  description:
                    'Error Message for form field: vaccination question',
                  id: 'form.field.label.vaccinationErrorMessage'
                }
              }
            ],
            maxLength: 32,
            fieldName: 'vaccination',
            fieldType: 'TEXT',
            precedingFieldId: 'birth.child.child-view-group.attendantAtBirth',
            required: false,
            enabled: '',
            custom: true
          }
        ]
      }
    },
    result: {
      data: {
        createFormDraft: draft
      }
    }
  }
]

function WrappedSaveActionModal() {
  const [status, setStatus] = React.useState<ActionStatus>(ActionStatus.MODAL)
  return (
    <Route path={'/config/form/wizard/:event'}>
      <SaveActionContext.Provider value={{ status, setStatus }}>
        <SaveActionModal />
      </SaveActionContext.Provider>
    </Route>
  )
}

let component: ReactWrapper<{}, {}>

describe('SaveActionModal', () => {
  let store: AppStore
  let history: History

  beforeEach(async () => {
    ;({ store, history } = createStore())
    history.push('/config/form/wizard/birth')
    component = await createTestComponent(<WrappedSaveActionModal />, {
      store,
      history,
      graphqlMocks
    })
    // wait for next event loop to get success state
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    component.update()
  })

  it('should save draft properly', async () => {
    component
      .find('#save-comment')
      .hostNodes()
      .simulate('change', { target: { value: 'No comment' } })
    component.update()
    component.find('#save-btn').hostNodes().simulate('click')
    await flushPromises()
    expect(store.getState().formConfig.birth?.formDraft.version).toBe(1)
  })
})
