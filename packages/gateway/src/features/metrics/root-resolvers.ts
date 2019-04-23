import { GQLResolver } from 'src/graphql/schema'
import { getMetrics } from '../fhir/utils'

export interface ITimeRange {
  timeStart: string | undefined
  timeEnd: string | undefined
}

export const resolvers: GQLResolver = {
  Query: {
    async fetchBirthRegistrationMetrics(_, { timeStart, timeEnd }, authHeader) {
      const timeRange: ITimeRange = {
        timeStart,
        timeEnd
      }
      const metricsData = await getMetrics(authHeader, timeRange)
      return {
        regByAge: (metricsData && metricsData.regByAge) || []
      }
    }
  }
}
