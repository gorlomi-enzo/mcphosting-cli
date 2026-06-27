import { Config } from './config.js'
import { MCPHostingAPI } from './api.js'
import { Logger } from './logger.js'

/**
 * Decode a JWT payload without any library.
 * Returns the parsed payload object, or null on failure.
 */
function decodeJwtPayload(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Base64url → Base64 → Buffer → JSON
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = Buffer.from(base64, 'base64').toString('utf-8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Check if a JWT token is expiring within the given threshold (seconds).
 */
function isTokenExpiringSoon(token: string, thresholdSeconds: number = 300): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || !payload.exp) return false
  const nowSeconds = Math.floor(Date.now() / 1000)
  return payload.exp - nowSeconds < thresholdSeconds
}

/**
 * Get an authenticated API instance.
 * Automatically refreshes the token if it's expiring within 5 minutes.
 * Throws with a helpful message if not logged in.
 */
export function getAuthenticatedAPI(): { api: MCPHostingAPI; config: Config } {
  const config = new Config()
  let token = config.token

  if (!token) {
    Logger.error('Not logged in.')
    Logger.info('Run `mcphosting login` to authenticate.')
    process.exit(1)
  }

  // Warn if token is expiring soon (use getAuthenticatedAPIAsync for auto-refresh)
  if (isTokenExpiringSoon(token) && !config.isEnvToken) {
    if (config.refreshToken) {
      Logger.warning('Token expiring soon. Use async auth for auto-refresh, or run `mcphosting login`.')
    } else {
      Logger.warning('Token is expiring soon. Run `mcphosting login` to re-authenticate.')
    }
  }

  const api = new MCPHostingAPI(token)
  return { api, config }
}

/**
 * Get an authenticated API instance with automatic token refresh.
 * This is the async version that actually performs the refresh.
 */
export async function getAuthenticatedAPIAsync(): Promise<{ api: MCPHostingAPI; config: Config }> {
  const config = new Config()
  let token = config.token

  if (!token) {
    Logger.error('Not logged in.')
    Logger.info('Run `mcphosting login` to authenticate.')
    process.exit(1)
  }

  // Check if token is expiring soon and try to refresh
  if (isTokenExpiringSoon(token) && config.refreshToken && !config.isEnvToken) {
    try {
      const tempApi = new MCPHostingAPI()
      const result = await tempApi.refreshToken(config.refreshToken)
      config.token = result.token
      config.refreshToken = result.refresh_token
      token = result.token
      Logger.dim('Token refreshed automatically.')
    } catch (error: any) {
      Logger.warning('Token refresh failed. Run `mcphosting login` to re-authenticate.')
      // Continue with existing token — it may still be valid for a few more minutes
    }
  } else if (isTokenExpiringSoon(token) && !config.refreshToken && !config.isEnvToken) {
    Logger.warning('Token is expiring soon. Run `mcphosting login` to re-authenticate.')
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
