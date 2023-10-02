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
import React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import { DateField } from './DateField'

export default {
  title: 'Input/Date input',
  component: DateField
} as ComponentMeta<typeof DateField>

const Template: ComponentStory<typeof DateField> = (args) => (
  <DateField {...args} />
)

export const DateFieldView = Template.bind({})
DateFieldView.args = {
  id: 'date-field',
  onChange: (value: string) => {
    // eslint-disable-next-line no-console
    console.log('Value is:', value)
  }
}
