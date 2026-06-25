import { Command } from 'commander'
import { readFile, writeFile, access } from 'fs/promises'
import { join, basename } from 'path'
import { detectMCP } from '../lib/detector.js'
import { Logger } from '../lib/logger.js'
import chalk from 'chalk'

const TEMPLATES = [
  { name: 'weather', description: 'Weather data MCP server', repo: 'gorlomi-enzo/mcp-template-weather' },
  { name: 'crypto', description: 'Crypto prices & portfolio MCP', repo: 'gorlomi-enzo/mcp-template-crypto' },
  { name: 'notion', description: 'Notion integration MCP', repo: 'gorlomi-enzo/mcp-template-notion' },
  { name: 'postgres', description: 'PostgreSQL query MCP', repo: 'gorlomi-enzo/mcp-template-postgres' },
  { name: 'blank', description: 'Minimal MCP server scaffold', repo: 'gorlomi-enzo/mcp-template-blank' },
]

export function createInitCommand(): Command {
  return new Command('init')
    .description('Initialize mcphosting.json in the current directory')
    .option('--name <name>', 'Project name')
    .option('--template <template>', 'Initialize from a template')
    .option('--list-templates', 'List available templates')
    .action(async (options) => {
      console.log('')
      console.log(chalk.bold('📦 MCPHosting Init'))
      console.log('')

      // List templates
      if (options.listTemplates) {
        console.log(chalk.bold('Available templates:'))
        console.log('')
        for (const t of TEMPLATES) {
          console.log(`  ${chalk.cyan(t.name.padEnd(12))} ${chalk.dim(t.description)}`)
          console.log(`  ${chalk.dim(`             github.com/${t.repo}`)}`)
          console.log('')
        }
        console.log(chalk.dim(`Usage: mcphosting init --template <name>`))
        return
      }

      const dir = process.cwd()
      const configPath = join(dir, 'mcphosting.json')

      // Check if config already exists
      try {
        await access(configPath)
        Logger.warning('mcphosting.json already exists in this directory.')
        Logger.info(`Edit it manually or delete it and run ${chalk.cyan('mcphosting init')} again.`)
        return
      } catch {
        // File doesn't exist, good
      }

      // Detect project info
      const detected = await detectMCP(dir)
      const projectName = options.name || detected?.name || basename(dir)
      const slug = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)

      // Try to detect GitHub remote
      let githubUrl: string | null = null
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

      const config: Record<string, any> = {
        $schema: 'https://mcphosting.com/schema/mcphosting.json',
        name: projectName,
        slug,
        version: '1.0.0',
        server: {
          transport: 'streamable-http',
          port: 3000,
          path: '/mcp',
        },
      }

      if (githubUrl) {
        config.github = githubUrl
      }

      if (options.template) {
        config.template = options.template
      }

      await writeFile(configPath, JSON.stringify(config, null, 2) + '\n')

      Logger.success(`Created ${chalk.bold('mcphosting.json')}`)
      console.log('')
      console.log(chalk.dim(JSON.stringify(config, null, 2)))
      console.log('')

      if (detected?.hasMcpSdk) {
        Logger.info(`Detected MCP SDK (${detected.runtime})`)
      }

      if (githubUrl) {
        Logger.info(`GitHub: ${chalk.blue(githubUrl)}`)
      }

      console.log('')
      Logger.info(`Next: ${chalk.cyan('mcphosting deploy')} to deploy your MCP server`)
      console.log('')
    })
}
