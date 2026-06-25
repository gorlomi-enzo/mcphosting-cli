import Conf from 'conf'
import { MCPConfig, MCPConnection } from '../types.js'

export class Config {
  private conf: Conf<MCPConfig>
  private connectionsConf: Conf<{ connections: MCPConnection[] }>

  constructor() {
    this.conf = new Conf<MCPConfig>({
      projectName: 'mcphosting',
      defaults: {}
    })

    this.connectionsConf = new Conf<{ connections: MCPConnection[] }>({
      projectName: 'mcphosting',
      configName: 'connections',
      defaults: { connections: [] }
    })
  }

  get token(): string | undefined {
    return this.conf.get('token')
  }

  set token(value: string | undefined) {
    if (value) {
      this.conf.set('token', value)
    } else {
      this.conf.delete('token')
    }
  }

  get user() {
    return this.conf.get('user')
  }

  set user(value: { email: string; org?: string } | undefined) {
    if (value) {
      this.conf.set('user', value)
    } else {
      this.conf.delete('user')
    }
  }

  get connections(): MCPConnection[] {
    return this.connectionsConf.get('connections', [])
  }

  addConnection(connection: Omit<MCPConnection, 'id' | 'addedAt'>): MCPConnection {
    const connections = this.connections
    const newConnection: MCPConnection = {
      ...connection,
      id: Math.random().toString(36).substr(2, 9),
      addedAt: Date.now()
    }

    connections.push(newConnection)
    this.connectionsConf.set('connections', connections)
    return newConnection
  }

  removeConnection(id: string): boolean {
    const connections = this.connections
    const index = connections.findIndex(c => c.id === id || c.slug === id)
    if (index === -1) return false

    connections.splice(index, 1)
    this.connectionsConf.set('connections', connections)
    return true
  }

  findConnection(slugOrId: string): MCPConnection | undefined {
    return this.connections.find(c => c.id === slugOrId || c.slug === slugOrId)
  }

  updateConnection(id: string, updates: Partial<MCPConnection>): boolean {
    const connections = this.connections
    const index = connections.findIndex(c => c.id === id)
    if (index === -1) return false

    connections[index] = { ...connections[index], ...updates }
    this.connectionsConf.set('connections', connections)
    return true
  }

  clear(): void {
    this.conf.clear()
    this.connectionsConf.clear()
  }
}
