import { Command } from 'commander';
import { Logger } from '../lib/logger.js';
import { createReadStream, createWriteStream } from 'fs';
import { Readable, Writable } from 'stream';

export function createProxyCommand(): Command {
  return new Command('proxy')
    .description('Start a local STDIO MCP proxy to a remote server')
    .argument('<url>', 'Remote MCP server URL')
    .option('--quiet', 'Suppress startup messages')
    .action(async (url: string, options) => {
      if (!options.quiet) {
        // Log to stderr so it doesn't interfere with STDIO MCP protocol
        console.error('🔗 Proxying via mcphosting.com');
        console.error(`📡 Remote server: ${url}`);
      }

      try {
        await startProxy(url, options.quiet);
      } catch (error) {
        if (!options.quiet) {
          console.error(`❌ Proxy error: ${error}`);
        }
        process.exit(1);
      }
    });
}

async function startProxy(url: string, quiet: boolean = false): Promise<void> {
  // For MVP, implement a simple HTTP proxy that translates STDIO JSON-RPC to HTTP
  // In production, this should use WebSocket or SSE for real-time communication
  
  let buffer = '';
  
  // Set up JSON-RPC message parsing from stdin
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    
    // Process complete JSON-RPC messages (newline delimited)
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          await forwardMessage(url, line, quiet);
        } catch (error) {
          if (!quiet) {
            console.error(`Proxy error: ${error}`);
          }
          // Send error response back to client
          const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32603,
              message: 'Proxy error',
              data: error.toString()
            }
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      }
    }
  });

  process.stdin.on('end', () => {
    if (!quiet) {
      console.error('📴 Proxy connection closed');
    }
    process.exit(0);
  });

  process.stdin.on('error', (error) => {
    if (!quiet) {
      console.error(`Stdin error: ${error}`);
    }
    process.exit(1);
  });

  // Keep the process alive
  await new Promise(() => {});
}

async function forwardMessage(url: string, message: string, quiet: boolean): Promise<void> {
  try {
    const jsonrpcMessage = JSON.parse(message);
    
    // Forward the JSON-RPC message to the remote server via HTTP POST
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': '@mcphosting/cli-proxy'
      },
      body: message
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.text();
    
    // Forward the response back to stdout
    process.stdout.write(responseData);
    
    // Ensure newline for JSON-RPC protocol
    if (!responseData.endsWith('\n')) {
      process.stdout.write('\n');
    }
    
  } catch (error) {
    // If we can't parse the original message, send a generic error
    if (error instanceof SyntaxError) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: 'Invalid JSON-RPC message'
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    } else {
      throw error;
    }
  }
}

// Alternative WebSocket-based proxy for real-time communication
async function startWebSocketProxy(url: string, quiet: boolean = false): Promise<void> {
  // This would use WebSocket for bidirectional communication
  // Implementation would depend on the remote server supporting WebSocket
  
  if (!quiet) {
    console.error('WebSocket proxy not yet implemented, using HTTP proxy');
  }
  
  return startProxy(url, quiet);
}