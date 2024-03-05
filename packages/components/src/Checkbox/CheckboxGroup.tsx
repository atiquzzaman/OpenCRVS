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
import * as React from 'react'
import { Checkbox } from './Checkbox'
import styled from 'styled-components'

const Wrapper = styled.div`
  margin-top: 8px;
  margin-bottom: 10px;
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

export interface ICheckboxOption {
  label: string
  value: string
}

export interface ICheckboxGroup {
  options: ICheckboxOption[]
  name: string
  id: string
  value: string[]
  onChange: (value: string[]) => void
}

export const CheckboxGroup = (props: ICheckboxGroup) => {
  const { options, value, name, ...restProps } = props

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    props.onChange(
      props.value.indexOf(value) > -1
        ? props.value.filter((val) => val !== value)
        : props.value.concat(value)
    )
  }

  return (
    <Wrapper>
      <List>
        {options.map((option) => {
          return (
            <Checkbox
              {...restProps}
              id={props.id + option.value}
              key={option.label}
              name={option.label}
              label={option.label}
              value={option.value}
              selected={value.includes(option.value)}
              onChange={handleChange}
            />
          )
        })}
      </List>
    </Wrapper>
  )
}
