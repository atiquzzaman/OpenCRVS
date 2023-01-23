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
import { Text } from '../Text'
import { Stack } from '../Stack'
import styled from 'styled-components'

const HideOnLargeScreen = styled(Stack)`
  display: none;

  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    display: block;
  }
`

export const Row: React.FC<{
  label: React.ReactNode
  heading: { right: string; left: string }
  leftValue: React.ReactNode
  rightValue: React.ReactNode
}> = ({ label, leftValue, rightValue, heading }) => {
  return (
    <>
      <Stack>{label}</Stack>
      <Stack style={{ gap: '50%' }}>
        <HideOnLargeScreen>{heading.left}</HideOnLargeScreen>
        {leftValue}
      </Stack>
      <Stack style={{ gap: '50%' }}>
        <HideOnLargeScreen>{heading.right}</HideOnLargeScreen>
        {rightValue}
      </Stack>
    </>
  )
}
