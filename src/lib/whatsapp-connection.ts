

// // lib/whatsapp-connection.ts
// export interface WhatsAppConnection {
//   isConnected: boolean;
//   lastConnected?: Date;
//   phoneNumber?: string;
//   connectionId?: string;
// }

// class WhatsAppConnectionService {
//   private readonly STORAGE_KEY = 'whatsapp-connection';
//   private readonly SESSION_KEY = 'whatsapp-session';

//   // Check if WhatsApp is already connected
//   isWhatsAppConnected(): boolean {
//     if (typeof window === 'undefined') return false;
    
//     // First check sessionStorage (survives page refresh but not tab close)
//     const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
//     if (sessionStored) {
//       const sessionConnection: WhatsAppConnection = JSON.parse(sessionStored);
//       if (sessionConnection.isConnected) {
//         return true;
//       }
//     }
    
//     // Then check localStorage (more persistent)
//     const localStored = localStorage.getItem(this.STORAGE_KEY);
//     if (!localStored) return false;
    
//     const localConnection: WhatsAppConnection = JSON.parse(localStored);
    
//     // Check if connection is still valid (within 7 days for persistent storage)
//     if (localConnection.lastConnected) {
//       const connectionTime = new Date(localConnection.lastConnected).getTime();
//       const currentTime = new Date().getTime();
//       const daysDiff = (currentTime - connectionTime) / (1000 * 60 * 60 * 24);
      
//       if (daysDiff > 7) {
//         // Connection expired (7 days)
//         this.clearConnection();
//         return false;
//       }
//     }
    
//     return localConnection.isConnected === true;
//   }

//   // Save connection status with multiple storage strategies
//   setConnectionStatus(connected: boolean, phoneNumber?: string, connectionId?: string): void {
//     const connection: WhatsAppConnection = {
//       isConnected: connected,
//       lastConnected: connected ? new Date() : undefined,
//       phoneNumber: connected ? phoneNumber : undefined,
//       connectionId: connected ? connectionId : undefined
//     };
    
//     // Store in sessionStorage (survives page refresh, cleared when browser closes)
//     sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(connection));
    
//     // Also store in localStorage for longer persistence (survives browser restart)
//     if (connected) {
//       localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connection));
//     } else {
//       localStorage.removeItem(this.STORAGE_KEY);
//     }
//   }

//   // Get connection info
//   getConnectionInfo(): WhatsAppConnection {
//     if (typeof window === 'undefined') return { isConnected: false };
    
//     // Prefer session storage first
//     const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
//     if (sessionStored) {
//       return JSON.parse(sessionStored);
//     }
    
//     // Fall back to local storage
//     const localStored = localStorage.getItem(this.STORAGE_KEY);
//     return localStored ? JSON.parse(localStored) : { isConnected: false };
//   }

//   // Clear connection (only clear localStorage, keep sessionStorage for current session)
//   clearConnection(): void {
//     localStorage.removeItem(this.STORAGE_KEY);
//     // Don't clear sessionStorage here - let it persist during the session
//   }

//   // Clear all storage (use this only on explicit WhatsApp logout)
//   clearAllStorage(): void {
//     localStorage.removeItem(this.STORAGE_KEY);
//     sessionStorage.removeItem(this.SESSION_KEY);
//   }

//   // Check if we should automatically reconnect
//   shouldAutoReconnect(): boolean {
//     const connection = this.getConnectionInfo();
//     if (!connection.isConnected) return false;
    
//     // Check if connection is recent (within last hour)
//     if (connection.lastConnected) {
//       const connectionTime = new Date(connection.lastConnected).getTime();
//       const currentTime = new Date().getTime();
//       const hoursDiff = (currentTime - connectionTime) / (1000 * 60 * 60);
      
//       return hoursDiff <= 1; // Auto-reconnect within 1 hour
//     }
    
//     return false;
//   }
// }

// export const whatsappConnectionService = new WhatsAppConnectionService();














///////////////////////////////////////////////////////////////////////








// lib/whatsapp-connection.ts
import { whatsappAPI, type WhatsAppConnection as APIWhatsAppConnection } from './whatsapp-api';

export interface WhatsAppConnection {
  isConnected: boolean;
  lastConnected?: Date;
  phoneNumber?: string;
  connectedBy?: string;
  connectedByName?: string;
  clientId?: string;
  isClientConnection?: boolean;
  connectionId?: string;
}

class WhatsAppConnectionService {
  private readonly STORAGE_KEY = 'whatsapp-connection';
  private connectionCache: WhatsAppConnection | null = null;
  private lastChecked: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  // Get current user info
  private getCurrentUser() {
    if (typeof window === 'undefined') return null;
    
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Check if user is customer (boss/admin)
  isCustomerUser(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'customer';
  }

  // Get client ID
  private getClientId(): string | null {
    const user = this.getCurrentUser();
    return user?.client_id || null;
  }

  // ✅ ADD BACK: Synchronous method for backward compatibility
  isWhatsAppConnected(): boolean {
    // Return cached value if available
    if (this.connectionCache) {
      return this.connectionCache.isConnected;
    }
    
    // Fallback to personal connection check
    return this.hasPersonalConnection();
  }

  // Check WhatsApp connection with caching
  async checkWhatsAppWebConnection(forceRefresh = false): Promise<boolean> {
    // Use cache if available and not expired
    if (!forceRefresh && this.connectionCache && 
        Date.now() - this.lastChecked < this.CACHE_DURATION) {
      return this.connectionCache.isConnected;
    }

    try {
      // Check backend connection first
      const backendConnected = await this.hasClientConnection();
      
      // Also check personal connection
      const personalConnected = this.hasPersonalConnection();
      
      const isConnected = backendConnected || personalConnected;
      
      // Update cache
      this.connectionCache = { isConnected };
      this.lastChecked = Date.now();
      
      return isConnected;
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      return false;
    }
  }

  // Check personal connection
  private hasPersonalConnection(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return false;
    
    const connection: WhatsAppConnection = JSON.parse(stored);
    return connection.isConnected === true;
  }

  // Check client connection from backend
  private async hasClientConnection(): Promise<boolean> {
    try {
      const response = await whatsappAPI.checkStatus();
      return response.hasActiveConnection === true;
    } catch (error) {
      console.error('Error checking client connection:', error);
      return false;
    }
  }

  // Get comprehensive connection info
  async getConnectionInfo(): Promise<WhatsAppConnection & { connectionType: 'personal' | 'client' | 'none' }> {
    try {
      // Check backend connection first
      const backendResponse = await whatsappAPI.getConnection();
      if (backendResponse.success && backendResponse.connection) {
        const apiConnection = backendResponse.connection;
        return {
          isConnected: true,
          phoneNumber: apiConnection.phone_number,
          connectedBy: apiConnection.connected_by?._id,
          connectedByName: apiConnection.connected_by?.name || apiConnection.connected_by_name,
          clientId: apiConnection.client_id,
          connectionId: apiConnection._id,
          lastConnected: new Date(apiConnection.last_connected),
          isClientConnection: true,
          connectionType: 'client'
        };
      }

      // Fall back to personal connection
      const personalConnection = this.getPersonalConnection();
      if (personalConnection.isConnected) {
        return { ...personalConnection, connectionType: 'personal' };
      }

      return { isConnected: false, connectionType: 'none' };
    } catch (error) {
      console.error('Error getting connection info:', error);
      return { isConnected: false, connectionType: 'none' };
    }
  }

  // Get personal connection
  private getPersonalConnection(): WhatsAppConnection {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : { isConnected: false };
  }

  // Save personal connection
  setPersonalConnection(connected: boolean, phoneNumber?: string): void {
    const connection: WhatsAppConnection = {
      isConnected: connected,
      lastConnected: connected ? new Date() : undefined,
      phoneNumber: connected ? phoneNumber : undefined,
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connection));
    this.connectionCache = connection;
    this.lastChecked = Date.now();
  }

  // Save client connection (customer only)
  async setClientConnection(phoneNumber: string, connectionData?: any): Promise<boolean> {
    try {
      const response = await whatsappAPI.createConnection(phoneNumber, connectionData);
      
      if (response.success) {
        // Also save personal connection for quick access
        this.setPersonalConnection(true, phoneNumber);
        // Clear cache to force refresh
        this.connectionCache = null;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error setting client connection:', error);
      return false;
    }
  }

  // Clear personal connection
  clearPersonalConnection(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.connectionCache = null;
  }

  // Clear client connection (customer only)
  async clearClientConnection(): Promise<boolean> {
    try {
      const response = await whatsappAPI.deleteConnection();
      
      if (response.success) {
        this.clearPersonalConnection();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error clearing client connection:', error);
      return false;
    }
  }

  // Check if user can manage connections
  canManageConnections(): boolean {
    return this.isCustomerUser();
  }

  // Get connection history (customer only)
  async getConnectionHistory() {
    if (!this.canManageConnections()) {
      throw new Error('Insufficient permissions');
    }
    
    return await whatsappAPI.getConnectionHistory();
  }

  // Refresh connection cache
  refreshConnection(): void {
    this.connectionCache = null;
    this.lastChecked = 0;
  }
}

export const whatsappConnectionService = new WhatsAppConnectionService();