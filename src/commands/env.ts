import { Command } from 'commander'
import { getAuthenticatedAPI } from '../lib/auth.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createEnvCommand(): Command {
  const env = new Command('env')
    .description('Manage environment variables for a deployed MCP server')

  env
    .command('list')
    .description('List environment variables')
    .argument('<slug-or-id>', 'Server slug or ID')
    .option('--json', 'Output as JSON')
    .action(async (slugOrId: string, options) => {
      const { api } = getAuthenticatedAPI()
      const spinner = Logger.spinner('Fetching environment variables...')

      try {
        const envVars = await api.listEnvVars(slugOrId)
        spinner.stop()

        if (envVars.length === 0) {
          Logger.info('No environment variables set.')
          Logger.dim(`Add one: ${chalk.cyan(`mcphosting env set ${slugOrId} KEY=value`)}`)
          return
        }

        if (options.json) {
          Logger.json(envVars)
          return
        }

        console.log('')
        Logger.bold(`🔑 Environment Variables: ${slugOrId}`)
        console.log('')

        envVars.forEach(env => {
          console.log(`  ${chalk.cyan(env.key)} = ${env.masked ? chalk.dim('••••••••') : chalk.dim('(set)')}`)
        })

        console.log('')
      } catch (error: any) {
        spinner.fail('Failed to fetch environment variables')
        Logger.error(error.message)
        process.exit(1)
      }
    })

  env
    .command('set')
    .description('Set an environment variable (KEY=value)')
    .argument('<slug-or-id>', 'Server slug or ID')
    .argument('<key-value>', 'Environment variable in KEY=value format')
    .action(async (slugOrId: string, keyValue: string) => {
      const eqIndex = keyValue.indexOf('=')
      if (eqIndex === -1) {
        Logger.error('Invalid format. Use KEY=value')
        Logger.dim(`Example: ${chalk.cyan(`mcphosting env set ${slugOrId} API_KEY=sk-abc123`)}`)
        process.exit(1)
      }

      const key = keyValue.substring(0, eqIndex)
      const value = keyValue.substring(eqIndex + 1)

      if (!key) {
        Logger.error('Key cannot be empty.')
        process.exit(1)
      }

      const { api } = getAuthenticatedAPI()
      const spinner = Logger.spinner(`Setting ${chalk.cyan(key)}...`)

      try {
        await api.addEnvVar(slugOrId, key, value)
        spinner.succeed(`Set ${chalk.bold(key)} on ${chalk.cyan(slugOrId)}`)
      } catch (error: any) {
        spinner.fail(`Failed to set ${key}`)
        Logger.error(error.message)
        process.exit(1)
      }
    })

  env
    .command('remove')
    .description('Remove an environment variable')
    .argument('<slug-or-id>', 'Server slug or ID')
    .argument('<key>', 'Environment variable key to remove')
    .action(async (slugOrId: string, key: string) => {
      const { api } = getAuthenticatedAPI()
      const spinner = Logger.spinner(`Removing ${chalk.cyan(key)}...`)

      try {
        await api.removeEnvVar(slugOrId, key)
        spinner.succeed(`Removed ${chalk.bold(key)} from ${chalk.cyan(slugOrId)}`)
      } catch (error: any) {
        spinner.fail(`Failed to remove ${key}`)
        Logger.error(error.message)
        process.exit(1)
      }
    })

  return env
}
