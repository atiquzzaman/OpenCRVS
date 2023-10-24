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

import { ILanguageState } from '@client/i18n/reducer'
import { ILocation, IOfflineData } from '@client/offline/reducer'
import { Event } from '@client/utils/gateway'
import { createIntl, MessageDescriptor, IntlShape, IntlCache } from 'react-intl'

export function formatMessage(
  intls: IntlShape[],
  descriptor: MessageDescriptor,
  options?: Record<string, string>
) {
  return intls
    .map((intl) => intl.formatMessage(descriptor, options))
    .join(' / ')
}

export function createSeparateIntls(
  languages: ILanguageState,
  cache: IntlCache
) {
  return (window.config.LANGUAGES.split(',') || [])
    .slice(0, 2) // Support upto 2 languages
    .reverse()
    .map((locale) =>
      createIntl({ locale, messages: languages[locale].messages }, cache)
    )
}

export function getLocationHierarchy(
  locationKey: string,
  offlineCountryConfig: IOfflineData
): ILocation[] {
  const result: ILocation[] = []
  const { locations } = offlineCountryConfig
  let location = locations[locationKey]
  if (!location) {
    return result
  } else {
    do {
      result.push(location)
      const parent = location.partOf.split('/')[1]
      location = locations[parent]
    } while (location)
    return result.reverse()
  }
}

export function getEventwiseSubjectColor(event: Event) {
  if (event === Event.Death) {
    return 'subheaderCopyDeath'
  } else if (event === Event.Marriage) {
    return 'subheaderCopyMarriage'
  } else {
    return 'subheaderCopyBirth'
  }
}
