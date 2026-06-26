import { Command } from 'commander'
import { Config } from '../lib/config.js'
import { Logger } from '../lib/logger.js'

export function createLogoutCommand(): Command {
  return new Command('logout')
    .description('Log out and remove stored credentials')
    .option('--json', 'Output as JSON')
    .action((options) => {
      const config = new Config()
      const isJson = options.json || Logger.isJsonMode

      if (!config.token) {
        if (isJson) {
          console.log(JSON.stringify({ success: true, message: 'Already logged out' }))
        } else {
          Logger.info('Already logged out.')
        }
        return
      }

      const email = config.user?.email
      config.token = undefined
      config.user = undefined

      if (isJson) {
        console.log(JSON.stringify({ success: true, email: email || undefined }))
      } else if (email) {
        Logger.success(`Logged out from ${email}`)
      } else {
        Logger.success('Logged out successfully.')
      }
    })
}
