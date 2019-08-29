import * as Hapi from 'hapi'
import { getForms } from '@resources/zmb/features/forms/service'
import { getLanguages } from '@resources/zmb/features/languages/service/service'

export async function definitionsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
): Promise<any> {
  // TODO typing
  const application = request.params.application
  return {
    forms: getForms(),
    languages: getLanguages(application).data,
    timestamp: ''
  }
}