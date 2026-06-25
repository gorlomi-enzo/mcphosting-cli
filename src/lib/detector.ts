import { readFile, readdir } from 'fs/promises'
import { join, basename } from 'path'
import { DetectedMCP } from '../types.js'

/**
 * Auto-detect if a directory contains an MCP server.
 * Checks for @modelcontextprotocol/sdk dependency, mcp config files, and Python MCP packages.
 */
export async function detectMCP(dir: string): Promise<DetectedMCP | null> {
  try {
    const files = await readdir(dir)

    // Look for MCP config files
    const configFiles = files.filter(f =>
      ['mcp.json', 'mcp.config.json', 'mcp.yaml', '.mcprc', 'mcp.config.ts', 'mcp.config.js'].includes(f)
    )

    let packageJson: any = null
    let hasMcpSdk = false
    let runtime: 'node' | 'python' | 'unknown' = 'unknown'
    let entryPoint: string | undefined

    // Check Node.js project
    if (files.includes('package.json')) {
      try {
        const content = await readFile(join(dir, 'package.json'), 'utf-8')
        packageJson = JSON.parse(content)

        hasMcpSdk = !!(
          packageJson?.dependencies?.['@modelcontextprotocol/sdk'] ||
          packageJson?.devDependencies?.['@modelcontextprotocol/sdk']
        )

        if (hasMcpSdk || packageJson?.dependencies?.['@modelcontextprotocol/sdk']) {
          runtime = 'node'
        }

        // Try to find entry point
        if (packageJson?.main) {
          entryPoint = packageJson.main
        } else if (packageJson?.bin) {
          const bins = typeof packageJson.bin === 'string' ? packageJson.bin : Object.values(packageJson.bin)[0]
          entryPoint = bins as string
        }
      } catch {
        // Invalid package.json
      }
    }

    // Check Python project
    if (files.includes('pyproject.toml') || files.includes('requirements.txt') || files.includes('setup.py')) {
      try {
        let pythonDeps = ''
        if (files.includes('requirements.txt')) {
          pythonDeps = await readFile(join(dir, 'requirements.txt'), 'utf-8')
        } else if (files.includes('pyproject.toml')) {
          pythonDeps = await readFile(join(dir, 'pyproject.toml'), 'utf-8')
        }

        if (pythonDeps.includes('mcp') || pythonDeps.includes('modelcontextprotocol')) {
          hasMcpSdk = true
          runtime = 'python'
        }
      } catch {
        // Can't read python files
      }

      // Common Python MCP entry points
      if (files.includes('server.py')) entryPoint = 'server.py'
      else if (files.includes('main.py')) entryPoint = 'main.py'
      else if (files.includes('app.py')) entryPoint = 'app.py'
    }

    // Check for common MCP server patterns in index/main files
    if (!hasMcpSdk && configFiles.length === 0) {
      // Check if any source file imports MCP SDK
      const sourceFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js'))
      for (const sf of sourceFiles.slice(0, 5)) {
        try {
          const content = await readFile(join(dir, sf), 'utf-8')
          if (content.includes('@modelcontextprotocol/sdk') || content.includes('McpServer') || content.includes('mcp.server')) {
            hasMcpSdk = true
            runtime = sf.endsWith('.py') ? 'python' : 'node'
            if (!entryPoint) entryPoint = sf
            break
          }
        } catch {
          // Skip unreadable files
        }
      }
    }

    if (!hasMcpSdk && configFiles.length === 0) {
      return null // Not an MCP server
    }

    // Read MCP config if present
    let mcpConfig: any = null
    if (configFiles.length > 0) {
      try {
        const configContent = await readFile(join(dir, configFiles[0]), 'utf-8')
        mcpConfig = JSON.parse(configContent)
      } catch {
        // Config might be YAML or invalid
      }
    }

    const name = packageJson?.name || basename(dir)

    return {
      name,
      hasMcpSdk,
      configFiles,
      packageJson,
      mcpConfig,
      runtime,
      entryPoint,
    }
  } catch {
    return null
  }
}
