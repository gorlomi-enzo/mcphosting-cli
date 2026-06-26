import { Command } from 'commander'
import { Config } from '../lib/config.js'
import { getAuthenticatedAPI, isAuthenticated } from '../lib/auth.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

/**
 * `mcphosting account` — Show current MCPHosting account status including plan and servers.
 */
export function createAccountCommand(): Command {
  return new Command('account')
    .description('Show MCPHosting account status, plan, and servers')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const config = new Config()

      if (!isAuthenticated()) {
        if (options.json || Logger.isJsonMode) {
          console.log(JSON.stringify({
            success: false,
            logged_in: false,
            error: 'Not logged in',
          }))
        } else {
          Logger.error('Not logged in.')
          Logger.info(`Run ${chalk.cyan('mcphosting login')} to authenticate.`)
        }
        return
      }

      const { api } = getAuthenticatedAPI()

      try {
        // Fetch user info and servers in parallel
        const [user, servers] = await Promise.all([
          api.whoami(),
          api.listServers().catch(() => []),
        ])

        const result = {
          success: true,
          logged_in: true,
          email: user?.email || config.user?.email || 'unknown',
          org: user?.org || config.user?.org || undefined,
          plan: (user as any)?.plan || 'free',
          token_source: config.isEnvToken ? 'environment' : 'config',
          servers: servers.map((s: any) => ({
            name: s.name || s.slug,
            slug: s.slug,
            url: s.url || '',
            status: s.status || 'unknown',
          })),
        }

        if (options.json || Logger.isJsonMode) {
          console.log(JSON.stringify(result))
          return
        }

        console.log('')
        Logger.bold('📊 MCPHosting Account')
        console.log('')
        Logger.info(`  ${chalk.dim('Email:')}   ${chalk.bold(result.email)}`)
        if (result.org) {
          Logger.info(`  ${chalk.dim('Org:')}     ${result.org}`)
        }
        Logger.info(`  ${chalk.dim('Plan:')}    ${chalk.cyan(result.plan)}`)
        Logger.info(`  ${chalk.dim('Servers:')} ${result.servers.length}`)
        console.log('')

        if (result.servers.length > 0) {
          Logger.bold('🖥️  Your MCP Servers')
          console.log('')
          const tableData = result.servers.map((s: any) => ({
            Name: s.name,
            Status: s.status === 'active' ? chalk.green('● active') :
                    s.status === 'deploying' ? chalk.yellow('◐ deploying') :
                    s.status === 'stopped' ? chalk.dim('○ stopped') :
                    chalk.red('✗ ' + s.status),
            URL: s.url.length > 40 ? s.url.slice(0, 37) + '...' : s.url,
          }))
          Logger.table(tableData)
        } else {
          Logger.dim('  No servers deployed yet.')
          Logger.dim(`  Run ${chalk.cyan('mcphosting deploy --template weather')} to get started.`)
        }
        console.log('')
      } catch (error: any) {
        if (options.json || Logger.isJsonMode) {
          console.log(JSON.stringify({ success: false, error: error.message }))
        } else {
          Logger.error(error.message)
        }
      }
    })
}
