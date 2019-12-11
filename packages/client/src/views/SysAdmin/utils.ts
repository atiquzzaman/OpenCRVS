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
import { createUserMutation } from '@client/forms/user/fieldDefinitions/mutation/mutations'
import { draftToGqlTransformer } from '@client/transformer'
import {
  IFormField,
  ISelectFormFieldWithOptions,
  ISelectFormFieldWithDynamicOptions
} from '@client/forms'
import { userMessages } from '@client/i18n/messages'
import { deserializeFormSection } from '@client/forms/mappings/deserializer'
import { userSection } from '@client/forms/user/fieldDefinitions/user-section'
import { getRolesQuery } from '@client/forms/user/fieldDefinitions/query/queries'

export enum UserStatus {
  ACTIVE,
  PENDING,
  DISABLED
}

export const mockIncompleteFormData = {
  accountDetails: '',
  assignedRegisterOffice: '',
  device: '',
  familyName: 'হোসেন',
  familyNameEng: 'Hossain',
  firstNames: '',
  firstNamesEng: '',
  nid: '1014881922',
  phoneNumber: '',
  registrationOffice: '895cc945-94a9-4195-9a29-22e9310f3385',
  role: 'FIELD_AGENT',
  userDetails: '',
  username: ''
}

export const mockCompleteFormData = {
  accountDetails: '',
  assignedRegisterOffice: '',
  device: '',
  familyName: 'হোসেন',
  familyNameEng: 'Hossain',
  firstNames: '',
  firstNamesEng: '',
  nid: '1234567896',
  phoneNumber: '01662132132',
  registrationOffice: '895cc945-94a9-4195-9a29-22e9310f3385',
  role: 'FIELD_AGENT',
  type: 'HOSPITAL',
  userDetails: '',
  username: ''
}

export const mockDataWithRegistarRoleSelected = {
  accountDetails: '',
  assignedRegisterOffice: '',
  device: '',
  familyName: 'হোসেন',
  familyNameEng: 'Hossain',
  firstNames: '',
  firstNamesEng: '',
  nid: '1014881922',
  phoneNumber: '01662132132',
  registrationOffice: '895cc945-94a9-4195-9a29-22e9310f3385',
  role: 'LOCAL_REGISTRAR',
  type: 'SECRETARY',
  userDetails: '',
  username: '',
  signature: {
    type: 'image/png',
    data:
      'iVBORw0KGgoAAAANSUhEUgAAAAgAAAACCAYAAABllJ3tAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUt'
  }
}

export const mockUserGraphqlOperation = {
  request: {
    query: createUserMutation,
    variables: draftToGqlTransformer(
      { sections: [deserializeFormSection(userSection)] },
      { user: mockCompleteFormData }
    )
  },
  result: {
    data: { createUser: { username: 'hossain123', __typename: 'User' } }
  }
}

export const mockFetchRoleGraphqlOperation = {
  request: {
    query: getRolesQuery,
    variables: {}
  },
  result: {
    data: {
      getRoles: [
        {
          title: 'Field Agent',
          value: 'FIELD_AGENT',
          types: ['HOSPITAL', 'CHA']
        },
        {
          title: 'Registration Agent',
          value: 'REGISTRATION_AGENT',
          types: ['ENTREPENEUR', 'DATA_ENTRY_CLERK']
        },
        {
          title: 'Registrar',
          value: 'LOCAL_REGISTRAR',
          types: ['SECRETARY', 'CHAIRMAN', 'MAYOR']
        },
        {
          title: 'System admin (local)',
          value: 'LOCAL_SYSTEM_ADMIN',
          types: ['LOCAL_SYSTEM_ADMIN']
        },
        {
          title: 'System admin (national)',
          value: 'NATIONAL_SYSTEM_ADMIN',
          types: ['NATIONAL_SYSTEM_ADMIN']
        },
        {
          title: 'Performance Oversight',
          value: 'PERFORMANCE_OVERSIGHT',
          types: ['CABINET_DIVISION', 'BBS']
        },
        {
          title: 'Performance Management',
          value: 'PERFORMANCE_MANAGEMENT',
          types: ['HEALTH_DIVISION', 'ORG_DIVISION']
        }
      ]
    }
  }
}

export const transformRoleDataToDefinitions = (
  fields: IFormField[],
  data: any
): IFormField[] => {
  const roles = data.data.getRoles as Array<any>
  const transformTypes = (types: string[]) =>
    types.map(type => ({
      label: userMessages[type],
      value: type
    }))

  return fields.map(field => {
    if (field.name === 'role') {
      ;(field as ISelectFormFieldWithOptions).options = roles.map(
        ({ value }: { value: string }) => ({
          label: userMessages[value],
          value
        })
      )
      return field
    } else if (field.name === 'type') {
      ;(field as ISelectFormFieldWithDynamicOptions).dynamicOptions.options = roles.reduce(
        (options, { value, types }) => ({
          ...options,
          [value]: transformTypes(types)
        }),
        {}
      )
      return field
    } else return field
  })
}