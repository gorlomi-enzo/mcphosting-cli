import { Command } from 'commander'
import { Config } from '../lib/config.js'
import { MCPHostingAPI } from '../lib/api.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createWhoamiCommand(): Command {
  return new Command('whoami')
    .description('Show current logged-in user')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const config = new Config()
      const token = config.token

      if (!token) {
        if (options.json || Logger.isJsonMode) {
          console.log(JSON.stringify({ success: false, logged_in: false, error: 'Not logged in' }))
        } else {
          Logger.info('Not logged in.')
          Logger.dim(`Run ${chalk.cyan('mcphosting login')} to authenticate.`)
        }
        return
      }

      // Try to get fresh user info from API
      const api = new MCPHostingAPI(token)
      const user = await api.whoami()

      if (!user && token) {
        // Token exists but API call failed — token is likely expired
        if (options.json || Logger.isJsonMode) {
          console.log(JSON.stringify({
            success: false,
            logged_in: false,
            error: 'Token expired',
            cached_email: config.user?.email,
          }))
        } else {
          Logger.warning('Token expired. Run `mcphosting login` to re-authenticate.')
          if (config.user?.email) {
            Logger.dim(`  Cached email: ${config.user.email}`)
          }
        }
        return
      }

      const result = {
        success: true,
        logged_in: true,
        email: user?.email || config.user?.email || 'unknown',
        org: user?.org || config.user?.org || undefined,
        token_source: config.isEnvToken ? 'environment' : 'config',
      }

      if (options.json || Logger.isJsonMode) {
        console.log(JSON.stringify(result))
      } else {
        console.log('')
        Logger.success(`Logged in as ${chalk.bold(result.email)}${result.org ? ` (${result.org})` : ''}`)
        if (config.isEnvToken) {
          Logger.dim('  Token source: MCPHOSTING_TOKEN environment variable')
        }
        console.log('')
      }
    })
}
