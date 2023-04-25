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
import { PRODUCTION } from '@documents/constants'

export const MINIO_HOST = process.env.MINIO_HOST || 'localhost'
export const MINIO_PORT = process.env.MINIO_PORT || 3535
export const MINIO_BUCKET = process.env.MINIO_BUCKET || 'ocrvs'
export const MINIO_BUCKET_REGION = process.env.MINIO_BUCKET_REGION || 'local'
export const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin'
export const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin'

export const MINIO_PRESIGNED_URL_EXPIRY_IN_SECOND = PRODUCTION ? 3600 : 259200
export const MINIO_URL = PRODUCTION ? MINIO_HOST : 'localhost:3535'
export const MINIO_PROTOCOL = PRODUCTION ? 'https:' : 'http:'
