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
import { logger } from '@gateway/logger'
import { getUserMobile, convertToLocal } from '@gateway/features/user/utils/'
import * as fetchAny from 'jest-fetch-mock'
const fetch = fetchAny as any

describe('Verify utility functions', () => {
  it('gets mobile number exists', async () => {
    expect(getUserMobile('1', { Authorization: 'bearer acd ' })).toBeDefined()
  })
  it('gets mobile number logs an error in case of invalid data', async () => {
    const logSpy = jest.spyOn(logger, 'error')
    fetch.mockImplementationOnce(() => {
      throw new Error('Mock Error')
    })
    getUserMobile('1', { Authorization: 'bearer acd ' })
    expect(logSpy).toHaveBeenLastCalledWith(
      'Unable to retrieve mobile for error : Error: Mock Error'
    )
  })
  it('replaces country code', async () => {
    expect(convertToLocal('+8801711111111', 'ZM')).toBe('01711111111')
  })
})
