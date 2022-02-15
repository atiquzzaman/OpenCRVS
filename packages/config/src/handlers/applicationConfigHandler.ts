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
import * as Hapi from '@hapi/hapi'
import ApplicationConfig, {
  IApplicationConfigurationModel
} from '@config/models/config' //   IApplicationConfigurationModel
import { logger } from '@config/config/logger'

export default async function applicationHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  try {
    let appConfig: IApplicationConfigurationModel | null
    // tslint:disable-next-line
    appConfig = await ApplicationConfig.findOne({})
    return appConfig || 'no configuration'
  } catch (ex) {
    logger.error(ex)
    return {}
  }
}
