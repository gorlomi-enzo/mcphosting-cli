import { Command } from 'commander'
import { getAuthenticatedAPI } from '../lib/auth.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

export function createKeysCommand(): Command {
  const keys = new Command('keys')
    .description('Manage API keys')

  keys
    .command('list')
    .description('List your API keys')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const { api } = getAuthenticatedAPI()
      const spinner = Logger.spinner('Fetching API keys...')

      try {
        const apiKeys = await api.getAPIKeys()
        spinner.stop()

        if (apiKeys.length === 0) {
          Logger.info('No API keys found.')
          Logger.dim(`Create one: ${chalk.cyan('mcphosting keys create "My Key"')}`)
          return
        }

        if (options.json) {
          Logger.json(apiKeys)
          return
        }

        console.log('')
        Logger.bold(`🔑 API Keys (${apiKeys.length})`)
        console.log('')

        const tableData = apiKeys.map(key => ({
          Name: key.name,
          Prefix: key.prefix + '...',
          Created: new Date(key.createdAt).toLocaleDateString(),
          'Last Used': key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never',
        }))

        Logger.table(tableData)
        console.log('')
      } catch (error: any) {
        spinner.fail('Failed to fetch API keys')
        Logger.error(error.message)
        process.exit(1)
      }
    })

  keys
    .command('create')
    .description('Create a new API key')
    .argument('<name>', 'Name for the API key')
    .action(async (name: string) => {
      const { api } = getAuthenticatedAPI()
      const spinner = Logger.spinner('Creating API key...')

      try {
        const key = await api.createAPIKey(name)
        spinner.succeed('API key created!')

        console.log('')
        Logger.bold('🔑 New API Key')
        console.log('')
        Logger.info(`  Name:   ${chalk.bold(key.name)}`)
        Logger.info(`  Key:    ${chalk.green(key.key || key.prefix + '...')}`)
        Logger.info(`  ID:     ${chalk.dim(key.id)}`)
        console.log('')
        Logger.warning('Save this key now — it won\'t be shown again!')
        console.log('')
      } catch (error: any) {
        spinner.fail('Failed to create API key')
        Logger.error(error.message)
        process.exit(1)
      }
    })

  keys
    .command('delete')
    .description('Delete an API key')
    .argument('<id>', 'API key ID')
    .action(async (id: string) => {
      const { api } = getAuthenticatedAPI()
      const spinner = Logger.spinner('Deleting API key...')

      try {
        await api.deleteAPIKey(id)
        spinner.succeed(`API key ${chalk.dim(id)} deleted.`)
      } catch (error: any) {
        spinner.fail('Failed to delete API key')
        Logger.error(error.message)
        process.exit(1)
      }
    })

  return keys
}
