import { Command } from 'commander'
import { Config } from '../lib/config.js'
import { Logger } from '../lib/logger.js'

export function createLogoutCommand(): Command {
  return new Command('logout')
    .description('Log out and remove stored credentials')
    .action(() => {
      const config = new Config()

      if (!config.token) {
        Logger.info('Already logged out.')
        return
      }

      const email = config.user?.email
      config.token = undefined
      config.user = undefined

      if (email) {
        Logger.success(`Logged out from ${email}`)
      } else {
        Logger.success('Logged out successfully.')
      }
    })
}
