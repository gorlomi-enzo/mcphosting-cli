import { Command } from 'commander'
import { readFile, writeFile, access } from 'fs/promises'
import { join } from 'path'
import { getAuthenticatedAPI } from '../lib/auth.js'
import { detectMCP } from '../lib/detector.js'
import { ClientManager } from '../lib/clients.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

const TEMPLATES = ['weather', 'crypto', 'notion', 'postgres', 'blank']

export function createDeployCommand(): Command {
  return new Command('deploy')
    .description('Deploy an MCP server to MCPHosting (one command)')
    .option('--github <url>', 'Deploy from a GitHub repository URL')
    .option('--name <name>', 'Server name (auto-detected if not provided)')
    .option('--template <name>', 'Deploy from a template (weather, crypto, notion, postgres, blank)')
    .option('--api-url <url>', 'Your MCP server\'s API URL (for external servers)')
    .option('--auth <type>', 'Auth type: none, api_key, or oauth', 'none')
    .option('--auto-key', 'Automatically create an API key', true)
    .option('--no-auto-key', 'Skip automatic API key creation')
    .option('--configure', 'Automatically configure detected AI clients', false)
    .option('--json', 'Output result as JSON')
    .action(async (options) => {
      const { api, config } = getAuthenticatedAPI()

      if (!options.json) {
        console.log('')
        console.log(chalk.bold('🚀 MCPHosting Deploy'))
        console.log(chalk.dim('   One command. Your MCP server goes live.'))
        console.log('')
      }

      // --- Template Deploy ---
      if (options.template) {
        const template = options.template.toLowerCase()
        if (!TEMPLATES.includes(template)) {
          Logger.error(`Unknown template: ${template}`)
          console.log('')
          Logger.info('Available templates:')
          for (const t of TEMPLATES) {
            console.log(`  ${chalk.cyan(t)}`)
          }
          process.exit(1)
        }

        const name = options.name || `mcp-${template}`
        const spinner = Logger.spinner(`Deploying template ${chalk.cyan(template)}...`)

        try {
          const result = await api.oneClickDeploy({
            name,
            template,
            authType: options.auth,
            autoKey: options.autoKey,
          })

          spinner.succeed(`Template ${chalk.cyan(template)} deployed!`)

          if (options.json) {
            Logger.json(result)
          } else {
            printOneClickResult(result, options.configure)
          }

          if (options.configure && result.connectionUrl) {
            await autoConfigureClients(result.slug, result.connectionUrl)
          }
        } catch (error: any) {
          spinner.fail('Deploy failed')
          Logger.error(error.message)
          process.exit(1)
        }
        return
      }

      // --- GitHub Deploy ---
      if (options.github) {
        const githubUrl = options.github
        const name = options.name || extractRepoName(githubUrl)
        const spinner = Logger.spinner(`Deploying from ${chalk.cyan(githubUrl)}...`)

        try {
          const result = await api.oneClickDeploy({
            name,
            githubUrl,
            authType: options.auth,
            autoKey: options.autoKey,
          })

          spinner.succeed('Deployed from GitHub!')

          if (options.json) {
            Logger.json(result)
          } else {
            printOneClickResult(result, options.configure)
          }

          if (options.configure && result.connectionUrl) {
            await autoConfigureClients(result.slug, result.connectionUrl)
          }
        } catch (error: any) {
          spinner.fail('Deploy failed')
          Logger.error(error.message)
          process.exit(1)
        }
        return
      }

      // --- API URL Deploy (external server registration) ---
      if (options.apiUrl) {
        const name = options.name || new URL(options.apiUrl).hostname
        const spinner = Logger.spinner(`Registering ${chalk.cyan(name)}...`)

        try {
          const result = await api.oneClickDeploy({
            name,
            baseApiUrl: options.apiUrl,
            authType: options.auth,
            autoKey: options.autoKey,
          })

          spinner.succeed('Registered successfully!')

          if (options.json) {
            Logger.json(result)
          } else {
            printOneClickResult(result, options.configure)
          }

          if (options.configure && result.connectionUrl) {
            await autoConfigureClients(result.slug, result.connectionUrl)
          }
        } catch (error: any) {
          spinner.fail('Registration failed')
          Logger.error(error.message)
          process.exit(1)
        }
        return
      }

      // --- Auto-detect from current directory ---
      const dir = process.cwd()

      // Check for mcphosting.json first
      let mcphostingConfig: any = null
      try {
        const configContent = await readFile(join(dir, 'mcphosting.json'), 'utf-8')
        mcphostingConfig = JSON.parse(configContent)
      } catch {
        // No config file
      }

      const spinner = Logger.spinner('Detecting MCP server...')

      const detected = await detectMCP(dir)

      if (!detected && !mcphostingConfig) {
        spinner.fail('No MCP server detected')
        console.log('')
        Logger.info('This directory doesn\'t look like an MCP server project.')
        console.log('')
        Logger.info(chalk.bold('Quick options:'))
        console.log(`  ${chalk.cyan('mcphosting deploy --template weather')}   Deploy a template`)
        console.log(`  ${chalk.cyan('mcphosting deploy --github <url>')}       Deploy from GitHub`)
        console.log(`  ${chalk.cyan('mcphosting deploy --api-url <url>')}      Register external server`)
        console.log(`  ${chalk.cyan('mcphosting init')}                        Create mcphosting.json`)
        console.log('')
        process.exit(1)
      }

      const name = options.name || mcphostingConfig?.name || detected?.name || 'my-mcp-server'
      spinner.succeed(`Detected: ${chalk.bold(name)}`)

      if (detected) {
        Logger.info(`  SDK: ${detected.hasMcpSdk ? chalk.green('✓') : chalk.yellow('○')} @modelcontextprotocol/sdk`)
        if (detected.runtime !== 'unknown') {
          Logger.info(`  Runtime: ${detected.runtime}`)
        }
      }

      // Detect GitHub remote
      let githubUrl: string | null = mcphostingConfig?.github || null
      if (!githubUrl) {
        try {
          const { execSync } = await import('child_process')
          const remoteUrl = execSync('git remote get-url origin', { cwd: dir, encoding: 'utf-8' }).trim()
          if (remoteUrl.includes('github.com')) {
            githubUrl = remoteUrl
              .replace(/^git@github\.com:/, 'https://github.com/')
              .replace(/\.git$/, '')
          }
        } catch {
          // Not a git repo
        }
      }

      if (githubUrl) {
        Logger.info(`  GitHub: ${chalk.dim(githubUrl)}`)
      }

      console.log('')

      const deploySpinner = Logger.spinner(`Deploying ${chalk.bold(name)}...`)

      try {
        const result = await api.oneClickDeploy({
          name,
          slug: mcphostingConfig?.slug,
          githubUrl: githubUrl || undefined,
          authType: options.auth,
          autoKey: options.autoKey,
          vercelProjectUrl: mcphostingConfig?.vercelUrl,
        })

        deploySpinner.succeed('Deployed successfully!')

        // Update mcphosting.json with deploy info
        if (mcphostingConfig) {
          try {
            mcphostingConfig.connectionUrl = result.connectionUrl
            mcphostingConfig.projectId = result.projectId
            mcphostingConfig.slug = result.slug
            await writeFile(join(dir, 'mcphosting.json'), JSON.stringify(mcphostingConfig, null, 2) + '\n')
          } catch {
            // Non-fatal
          }
        }

        if (options.json) {
          Logger.json(result)
        } else {
          printOneClickResult(result, options.configure)
        }

        if (options.configure && result.connectionUrl) {
          await autoConfigureClients(result.slug, result.connectionUrl)
        }
      } catch (error: any) {
        deploySpinner.fail('Deploy failed')
        Logger.error(error.message)

        if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
          Logger.info(`Run ${chalk.cyan('mcphosting login')} first.`)
        }
        process.exit(1)
      }
    })
}

function extractRepoName(url: string): string {
  const parts = url.replace(/\.git$/, '').split('/')
  return parts[parts.length - 1] || 'mcp-server'
}

function printOneClickResult(result: any, showConfigureHint: boolean = false) {
  console.log('')
  console.log(chalk.green.bold('  ✅ Your MCP server is live!'))
  console.log('')

  // Connection URL
  Logger.info(`  ${chalk.dim('Endpoint:')}  ${chalk.blue(result.connectionUrl)}`)
  if (result.slug) {
    Logger.info(`  ${chalk.dim('Slug:')}      ${chalk.cyan(result.slug)}`)
  }
  if (result.status) {
    const statusColor = result.status === 'deployed' ? chalk.green : chalk.yellow
    Logger.info(`  ${chalk.dim('Status:')}    ${statusColor(result.status)}`)
  }

  // API Key
  if (result.apiKey?.key) {
    console.log('')
    console.log(chalk.bold('  🔑 API Key (save this — shown only once):'))
    console.log(`     ${chalk.green(result.apiKey.key)}`)
  }

  // Vercel deploy button
  if (result.vercelDeployUrl) {
    console.log('')
    console.log(chalk.bold('  ▲ Deploy to Vercel:'))
    console.log(`     ${chalk.blue(result.vercelDeployUrl)}`)
    console.log(chalk.dim('     Click the link above → Deploy → Your MCP server is live!'))
  }

  // Client configs
  if (result.clientConfig) {
    console.log('')
    console.log(chalk.bold('  📋 Add to your AI client:'))
    console.log('')

    // Claude Desktop
    console.log(chalk.dim('  Claude Desktop (claude_desktop_config.json):'))
    console.log(chalk.dim('  ─────────────────────────────────────────────'))
    console.log(chalk.white(`  ${JSON.stringify(result.clientConfig.claude, null, 2).split('\n').join('\n  ')}`))
    console.log('')

    // Cursor
    console.log(chalk.dim('  Cursor / VS Code (.cursor/mcp.json):'))
    console.log(chalk.dim('  ─────────────────────────────────────────────'))
    console.log(chalk.white(`  ${JSON.stringify(result.clientConfig.cursor, null, 2).split('\n').join('\n  ')}`))
  }

  // Quick connect
  console.log('')
  console.log(chalk.dim('  Quick connect:'))
  console.log(chalk.cyan(`  mcphosting connect ${result.slug}`))

  if (showConfigureHint) {
    console.log('')
    console.log(chalk.dim('  Auto-configure AI clients:'))
    console.log(chalk.cyan(`  mcphosting deploy --configure`))
  }

  console.log('')
  Logger.info(`Manage at ${chalk.blue(`https://mcphosting.com/dashboard/servers/${result.projectId || result.slug}`)}`)
  console.log('')
}

async function autoConfigureClients(slug: string, url: string) {
  const clients = await ClientManager.detectInstalledClients()
  const installed = clients.filter(c => c.exists)

  if (installed.length === 0) {
    Logger.info('No AI clients detected. Add the config manually (shown above).')
    return
  }

  for (const client of installed) {
    try {
      const success = await ClientManager.addToClient(client.name as any, slug, url)
      if (success) {
        Logger.success(`Configured ${chalk.bold(client.name)}`)
      }
    } catch (error: any) {
      Logger.warning(`Failed to configure ${client.name}: ${error.message}`)
    }
  }
}
