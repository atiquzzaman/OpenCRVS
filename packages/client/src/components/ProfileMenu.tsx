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
import { connect } from 'react-redux'
import styled from '@client/styledComponents'
import {
  injectIntl,
  WrappedComponentProps as IntlShapeProps,
  IntlShape
} from 'react-intl'
import { IToggleMenuItem, ToggleMenu } from '@opencrvs/components/lib/interface'
import { SettingsBlack, LogoutBlack } from '@opencrvs/components/lib/icons'
import { AvatarSmall } from '@client/components/Avatar'
import { IStoreState } from '@client/store'
import { IUserDetails, getIndividualNameObj } from '@client/utils/userUtils'
import { getLanguage } from '@client/i18n/selectors'
import { getUserDetails } from '@client/profile/profileSelectors'
import { redirectToAuthentication } from '@client/profile/profileActions'
import { goToSettings } from '@client/navigation'
import { buttonMessages, userMessages } from '@client/i18n/messages'

const UserName = styled.div`
  color: ${({ theme }) => theme.colors.copy};
  ${({ theme }) => theme.fonts.h4};
  margin-bottom: 4px;
`

const UserRole = styled.div`
  color: ${({ theme }) => theme.colors.supportingCopy};
  ${({ theme }) => theme.fonts.reg12};
  margin-bottom: 4px;
`

interface IProps {
  language: string
  userDetails: IUserDetails | null
  redirectToAuthentication: typeof redirectToAuthentication
  goToSettings: typeof goToSettings
}

interface IState {
  showLogoutModal: boolean
}

type FullProps = IProps & IntlShapeProps

class ProfileMenuComponent extends React.Component<FullProps, IState> {
  getMenuItems = (intl: IntlShape): IToggleMenuItem[] => {
    const items = [] as IToggleMenuItem[]
    items.push({
      icon: <SettingsBlack />,
      label: intl.formatMessage(buttonMessages.settings),
      handler: this.props.goToSettings
    })
    items.push({
      icon: <LogoutBlack />,
      label: intl.formatMessage(buttonMessages.logout),
      handler: () => this.props.redirectToAuthentication()
    })
    return items
  }

  getUserName = (
    language: string,
    userDetails: IUserDetails | null
  ): string => {
    let userName = ''

    if (userDetails && userDetails.name) {
      const nameObj = getIndividualNameObj(userDetails.name, language)

      if (nameObj) {
        userName = `${String(nameObj.firstNames)} ${String(nameObj.familyName)}`
      }
    }

    return userName
  }

  getUserRole = (intl: IntlShape, userDetails: IUserDetails | null): string => {
    let userRole = ''

    if (userDetails && userDetails.role) {
      userRole = intl.formatMessage(userMessages[userDetails.role as string])
    }

    return userRole
  }

  getMenuHeader = (
    intl: IntlShape,
    language: string,
    userDetails: IUserDetails | null
  ): JSX.Element => {
    const userName = this.getUserName(language, userDetails)
    const userRole = this.getUserRole(intl, userDetails)

    return (
      <>
        <UserName>{userName}</UserName>
        <UserRole>{userRole}</UserRole>
      </>
    )
  }

  render() {
    const { intl, language, userDetails } = this.props

    return (
      <>
        <ToggleMenu
          id="ProfileMenu"
          toggleButton={
            <AvatarSmall
              name={this.getUserName(language, userDetails)}
              avatar={userDetails?.avatar}
            />
          }
          menuHeader={this.getMenuHeader(intl, language, userDetails)}
          menuItems={this.getMenuItems(intl)}
        />
      </>
    )
  }
}

const mapStateToProps = (store: IStoreState) => {
  return {
    language: getLanguage(store),
    userDetails: getUserDetails(store)
  }
}

export const ProfileMenu = connect(mapStateToProps, {
  redirectToAuthentication,
  goToSettings
})(injectIntl(ProfileMenuComponent))
