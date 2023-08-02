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
import { COUNTRY_CONFIG_URL, GATEWAY_GQL_HOST } from './constants'
import { raise, parseGQLResponse } from './utils'
import fetch from 'node-fetch'
import { z } from 'zod'
import { print } from 'graphql'
import gql from 'graphql-tag'

const LabelSchema = z.array(
  z.object({
    labels: z.array(z.object({ lang: z.string(), label: z.string() }))
  })
)

const CountryRoleSchema = z
  .object({
    FIELD_AGENT: LabelSchema,
    LOCAL_REGISTRAR: LabelSchema,
    LOCAL_SYSTEM_ADMIN: LabelSchema,
    NATIONAL_REGISTRAR: LabelSchema,
    NATIONAL_SYSTEM_ADMIN: LabelSchema,
    PERFORMANCE_MANAGEMENT: LabelSchema,
    REGISTRATION_AGENT: LabelSchema
  })
  .partial()

const SYSTEM_ROLES = [
  'FIELD_AGENT',
  'LOCAL_REGISTRAR',
  'LOCAL_SYSTEM_ADMIN',
  'NATIONAL_REGISTRAR',
  'NATIONAL_SYSTEM_ADMIN',
  'PERFORMANCE_MANAGEMENT',
  'REGISTRATION_AGENT'
] as const

export interface Label {
  lang: string
  label: string
}

export interface Role {
  _id?: string
  labels: Array<Label>
}

interface GQLSystemRoleInput {
  id: string
  value?: string
  active?: boolean
  roles?: Array<Role>
}

type SystemRole = {
  id: string
  value: typeof SYSTEM_ROLES[number]
  roles: Array<Role>
  active: boolean
}

const updateRoleMutation = print(gql`
  mutation updateRole($systemRole: SystemRoleInput) {
    updateRole(systemRole: $systemRole) {
      roleIdMap
    }
  }
`)

const getSystemRolesQuery = print(gql`
  query getSystemRoles {
    getSystemRoles(active: true) {
      id
      value
      roles {
        _id
        labels {
          label
        }
      }
    }
  }
`)

async function fetchSystemRoles(token: string): Promise<SystemRole[]> {
  const res = await fetch(GATEWAY_GQL_HOST, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query: getSystemRolesQuery,
      variables: {
        active: true
      }
    })
  })
  if (!res.ok) {
    raise(`Failed to fetch roles from gateway`)
  }
  return res.json().then((res) => res.data.getSystemRoles)
}

async function updateRoles(
  token: string,
  systemRoles: GQLSystemRoleInput[]
): Promise<RoleIdMap> {
  let roleIdMap: RoleIdMap = {}
  await Promise.all(
    systemRoles.map((systemRole) =>
      fetch(GATEWAY_GQL_HOST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: updateRoleMutation,
          variables: {
            systemRole
          }
        })
      }).then(async (res) => {
        const parsedResponse = parseGQLResponse<{
          updateRole: { roleIdMap: RoleIdMap }
        }>(await res.json())
        roleIdMap = {
          ...roleIdMap,
          ...parsedResponse.updateRole.roleIdMap
        }
      })
    )
  )
  return roleIdMap
}

async function fetchCountryRoles() {
  const url = new URL('roles', COUNTRY_CONFIG_URL).toString()
  const res = await fetch(url)
  if (!res.ok) {
    raise(`Expected to get the roles from ${url}`)
  }
  const parsedRoles = CountryRoleSchema.safeParse(await res.json())
  if (!parsedRoles.success) {
    raise(
      `Error when getting roles from country-config: ${JSON.stringify(
        parsedRoles.error.issues
      )}`
    )
  }
  return parsedRoles.data
}

type RoleIdMap = Record<string, string | undefined>

export async function seedRoles(token: string) {
  const systemRoles = await fetchSystemRoles(token)
  const roleIdMap = systemRoles.reduce<RoleIdMap>(
    (systemRoleMap, systemRole) => ({
      ...systemRoleMap,
      ...systemRole.roles.reduce(
        (roleMap, role) => ({
          ...roleMap,
          ...role.labels.reduce(
            (labelMap, label) => ({
              ...labelMap,
              [label.label]: role._id
            }),
            {}
          )
        }),
        {}
      )
    }),
    {}
  )
  const countryRoles = await fetchCountryRoles()
  const usedSystemRoles = Object.keys(
    countryRoles
  ) as typeof SYSTEM_ROLES[number][]
  const updatedRoleIdMap = await updateRoles(
    token,
    systemRoles
      .filter(({ value }) => usedSystemRoles.includes(value))
      .filter((systemRole) => {
        if (Boolean(systemRole.roles?.length)) {
          console.log(
            `Roles for the systemRole "${systemRole.value}" already exists. Skipping`
          )
        }
        return !Boolean(systemRole.roles?.length)
      })
      .map((systemRole) => ({
        ...systemRole,
        roles: countryRoles[systemRole.value]!
      }))
  )
  return {
    ...roleIdMap,
    ...updatedRoleIdMap
  }
}
