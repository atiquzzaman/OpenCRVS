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

interface IPropsUsers {
  stroke?: string
  width?: number
  height?: number
}

export const Users = (
  props: React.HTMLAttributes<SVGElement> & IPropsUsers
) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.75001 6.5C8.50737 6.5 7.50001 7.50736 7.50001 8.75C7.50001 9.99264 8.50737 11 9.75001 11C10.9927 11 12 9.99264 12 8.75C12 7.50736 10.9927 6.5 9.75001 6.5ZM6.00001 8.75C6.00001 6.67893 7.67895 5 9.75001 5C11.8211 5 13.5 6.67893 13.5 8.75C13.5 10.8211 11.8211 12.5 9.75001 12.5C7.67895 12.5 6.00001 10.8211 6.00001 8.75ZM14.2734 5.6615C14.3762 5.26023 14.7847 5.01822 15.186 5.12096C15.9927 5.32749 16.7076 5.79662 17.2182 6.45438C17.7287 7.11214 18.0059 7.92112 18.0059 8.75378C18.0059 9.58644 17.7287 10.3954 17.2182 11.0532C16.7076 11.7109 15.9927 12.1801 15.186 12.3866C14.7847 12.4893 14.3762 12.2473 14.2734 11.8461C14.1707 11.4448 14.4127 11.0362 14.814 10.9335C15.2979 10.8095 15.7269 10.5281 16.0333 10.1334C16.3396 9.73876 16.5059 9.25337 16.5059 8.75378C16.5059 8.25418 16.3396 7.76879 16.0333 7.37414C15.7269 6.97948 15.2979 6.69801 14.814 6.57409C14.4127 6.47135 14.1707 6.06276 14.2734 5.6615ZM4.09834 15.0984C4.8016 14.3951 5.75543 14 6.74999 14H12.75C13.7446 14 14.6984 14.3951 15.4016 15.0984C16.1049 15.8016 16.5 16.7554 16.5 17.75V19.25C16.5 19.6642 16.1642 20 15.75 20C15.3358 20 15 19.6642 15 19.25V17.75C15 17.1533 14.7629 16.581 14.341 16.159C13.919 15.7371 13.3467 15.5 12.75 15.5H6.74999C6.15325 15.5 5.58096 15.7371 5.159 16.159C4.73704 16.581 4.49999 17.1533 4.49999 17.75V19.25C4.49999 19.6642 4.1642 20 3.74999 20C3.33577 20 2.99999 19.6642 2.99999 19.25V17.75C2.99999 16.7554 3.39508 15.8016 4.09834 15.0984ZM17.2738 14.66C17.3774 14.259 17.7865 14.0178 18.1875 14.1213C18.992 14.3291 19.7047 14.7981 20.2138 15.4548C20.7228 16.1114 20.9994 16.9186 21 17.7495V19.25C21 19.6642 20.6642 20 20.25 20C19.8358 20 19.5 19.6642 19.5 19.25V17.7506C19.4996 17.2521 19.3337 16.7678 19.0283 16.3738C18.7228 15.9798 18.2952 15.6983 17.8125 15.5737C17.4115 15.4702 17.1703 15.0611 17.2738 14.66Z"
      fill="#5B5B5B"
    />
  </svg>
)
