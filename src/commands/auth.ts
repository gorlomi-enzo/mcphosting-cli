import { Command } from 'commander';
import { createServer } from 'http';
import open from 'open';
import { Config } from '../lib/config.js';
import { MCPHostingAPI } from '../lib/api.js';
import { Logger } from '../lib/logger.js';

export function createAuthCommands(): Command {
  const auth = new Command('auth');

  auth
    .command('login')
    .description('Authenticate with MCPHosting')
    .option('--token <token>', 'Provide API token directly')
    .action(async (options) => {
      const config = new Config();
      
      if (options.token) {
        // Manual token auth
        config.token = options.token;
        
        const api = new MCPHostingAPI(options.token);
        const user = await api.whoami();
        
        if (user) {
          config.user = user;
          Logger.success(`Logged in as ${user.email}${user.org ? ` (${user.org})` : ''}`);
        } else {
          Logger.warning('Token saved, but could not verify user info');
        }
        return;
      }

      // Browser OAuth flow
      const spinner = Logger.spinner('Starting login flow...');
      
      let server: any;
      let resolved = false;

      try {
        const authPromise = new Promise<string>((resolve, reject) => {
          server = createServer((req, res) => {
            if (req.url?.startsWith('/callback')) {
              const url = new URL(req.url, 'http://localhost');
              const token = url.searchParams.get('token');
              
              if (token) {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                  <html>
                    <body style="font-family: system-ui; text-align: center; padding: 50px;">
                      <h2>✅ Login Successful!</h2>
                      <p>You can now close this window and return to your terminal.</p>
                    </body>
                  </html>
                `);
                resolve(token);
              } else {
                res.writeHead(400, { 'Content-Type': 'text/html' });
                res.end(`
                  <html>
                    <body style="font-family: system-ui; text-align: center; padding: 50px;">
                      <h2>❌ Login Failed</h2>
                      <p>No token received. Please try again.</p>
                    </body>
                  </html>
                `);
                reject(new Error('No token received'));
              }
            } else {
              res.writeHead(404);
              res.end('Not found');
            }
          });

          server.listen(0, () => {
            const port = (server.address() as any).port;
            const callbackUrl = `http://localhost:${port}/callback`;
            const authUrl = `https://mcphosting.com/cli/auth?callback=${encodeURIComponent(callbackUrl)}`;
            
            setTimeout(() => {
              if (!resolved) {
                reject(new Error('Login timeout - please try again'));
              }
            }, 120000); // 2 minute timeout
            
            open(authUrl).catch(() => {
              Logger.warning(`Could not open browser automatically. Please visit: ${authUrl}`);
            });
          });
        });

        const token = await authPromise;
        resolved = true;
        
        spinner.succeed('Login successful!');
        
        config.token = token;
        
        const api = new MCPHostingAPI(token);
        const user = await api.whoami();
        
        if (user) {
          config.user = user;
          Logger.success(`Logged in as ${user.email}${user.org ? ` (${user.org})` : ''}`);
        }

      } catch (error) {
        spinner.fail('Login failed');
        Logger.error(`Login error: ${error}`);
        process.exit(1);
      } finally {
        if (server) {
          server.close();
        }
      }
    });

  auth
    .command('logout')
    .description('Remove stored authentication')
    .action(() => {
      const config = new Config();
      config.token = undefined;
      config.user = undefined;
      Logger.success('Logged out successfully');
    });

  auth
    .command('whoami')
    .description('Show current user information')
    .action(async () => {
      const config = new Config();
      const token = config.token;
      
      if (!token) {
        Logger.warning('Not logged in. Use `mcphost auth login` to authenticate.');
        return;
      }

      const user = config.user;
      if (user) {
        Logger.info(`Logged in as: ${user.email}${user.org ? ` (${user.org})` : ''}`);
      } else {
        Logger.warning('User info not available. Try logging in again.');
      }
    });

  return auth;
}

// Legacy commands (backwards compatibility)
export function createLegacyAuthCommands(): Command[] {
  const config = new Config();
  
  const login = new Command('login')
    .description('Authenticate with MCPHosting')
    .option('--token <token>', 'Provide API token directly')
    .action(async (options) => {
      const authCmd = createAuthCommands();
      const loginCmd = authCmd.commands.find(cmd => cmd.name() === 'login');
      if (loginCmd) {
        await loginCmd.action(options);
      }
    });

  const logout = new Command('logout')
    .description('Remove stored authentication')
    .action(() => {
      config.token = undefined;
      config.user = undefined;
      Logger.success('Logged out successfully');
    });

  const whoami = new Command('whoami')
    .description('Show current user information')
    .action(async () => {
      const authCmd = createAuthCommands();
      const whoamiCmd = authCmd.commands.find(cmd => cmd.name() === 'whoami');
      if (whoamiCmd) {
        await whoamiCmd.action();
      }
    });

  return [login, logout, whoami];
}