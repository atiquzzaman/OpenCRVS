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
import * as React from 'react'
import styled from 'styled-components'
import { LinkButton } from '../../buttons'

const Container = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey200};
  padding: 16px 0px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    flex-direction: column;
  }
`
const DataContainer = styled.div`
  ${({ theme }) => theme.fonts.bigBody};
  display: flex;
  flex-grow: 1;
  max-width: 90%;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    flex-direction: column;
    width: 100%;
  }
`
const ValueContainer = styled.div`
  ${({ theme }) => theme.fonts.bigBody};
  width: 100%;
`
const Label = styled.label`
  ${({ theme }) => theme.fonts.bigBodyBoldStyle};
  flex: 1;
  margin-right: 16px;
  max-width: 40%;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    max-width: 100%;
    ${({ theme }) => theme.fonts.bodyBoldStyle};
  }
`
const Value = styled.div`
  ${({ theme }) => theme.fonts.bigBodyStyle};
  flex: 1;
  overflow-wrap: break-word;
  max-width: 50%;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    ${({ theme }) => theme.fonts.bodyStyle};
    max-width: 100%;
  }
`

const PlaceHolder = styled.div`
  ${({ theme }) => theme.fonts.bodyStyle};
  color: ${({ theme }) => theme.colors.placeholderCopy};
  flex: 1;
`
const Action = styled.div`
  width: auto;
`
interface IAction {
  id?: string
  label: string
  disabled?: boolean
  handler?: () => void
}

export interface IDataProps {
  id?: string
  label: string
  value?: React.ReactNode
  placeHolder?: string
  action?: IAction
  actionsMenu?: React.ReactNode
}

export class DataRow extends React.Component<IDataProps> {
  render() {
    const { id, label, value, placeHolder, action, actionsMenu } = this.props

    return (
      <Container id={id}>
        {label && (
          <>
            <DataContainer>
              <Label id={`${id}_label`}>{label}</Label>
              {value && <Value id={`${id}_value`}>{value}</Value>}
              {placeHolder && (
                <PlaceHolder id={`${id}_placeholder`}>
                  {placeHolder}
                </PlaceHolder>
              )}
            </DataContainer>
            {action && (
              <Action>
                <LinkButton
                  id={action.id}
                  disabled={action.disabled}
                  onClick={action.handler}
                >
                  {action.label}
                </LinkButton>
              </Action>
            )}
            {actionsMenu && <div>{actionsMenu}</div>}
          </>
        )}
        {!label && <ValueContainer>{value}</ValueContainer>}
      </Container>
    )
  }
}
