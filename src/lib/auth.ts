import { Config } from './config.js'
import { MCPHostingAPI } from './api.js'
import { Logger } from './logger.js'

/**
 * Get an authenticated API instance.
 * Throws with a helpful message if not logged in.
 */
export function getAuthenticatedAPI(): { api: MCPHostingAPI; config: Config } {
  const config = new Config()
  const token = config.token

  if (!token) {
    Logger.error('Not logged in.')
    Logger.info('Run `mcphosting login` to authenticate.')
    process.exit(1)
  }

  const api = new MCPHostingAPI(token)
  return { api, config }
}

/**
 * Check if user is authenticated (non-throwing).
 */
export function isAuthenticated(): boolean {
  const config = new Config()
  return !!config.token
}
