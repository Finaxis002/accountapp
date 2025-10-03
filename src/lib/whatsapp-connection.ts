// // lib/whatsapp-connection.ts
// export interface WhatsAppConnection {
//   isConnected: boolean;
//   lastConnected?: Date;
//   phoneNumber?: string;
// }

// class WhatsAppConnectionService {
//   private readonly STORAGE_KEY = 'whatsapp-connection';

//   // Check if WhatsApp is already connected
//   isWhatsAppConnected(): boolean {
//     if (typeof window === 'undefined') return false;
    
//     const stored = localStorage.getItem(this.STORAGE_KEY);
//     if (!stored) return false;
    
//     const connection: WhatsAppConnection = JSON.parse(stored);
//     return connection.isConnected === true;
//   }

//   // Save connection status
//   setConnectionStatus(connected: boolean, phoneNumber?: string): void {
//     const connection: WhatsAppConnection = {
//       isConnected: connected,
//       lastConnected: connected ? new Date() : undefined,
//       phoneNumber: connected ? phoneNumber : undefined
//     };
    
//     localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connection));
//   }

//   // Get connection info
//   getConnectionInfo(): WhatsAppConnection {
//     const stored = localStorage.getItem(this.STORAGE_KEY);
//     return stored ? JSON.parse(stored) : { isConnected: false };
//   }

//   // Clear connection
//   clearConnection(): void {
//     localStorage.removeItem(this.STORAGE_KEY);
//   }
// }

// export const whatsappConnectionService = new WhatsAppConnectionService();
















// lib/whatsapp-connection.ts
// lib/whatsapp-connection.ts
export interface WhatsAppConnection {
  isConnected: boolean;
  lastConnected?: Date;
  phoneNumber?: string;
  connectionId?: string;
}

class WhatsAppConnectionService {
  private readonly STORAGE_KEY = 'whatsapp-connection';
  private readonly SESSION_KEY = 'whatsapp-session';

  // Check if WhatsApp is already connected
  isWhatsAppConnected(): boolean {
    if (typeof window === 'undefined') return false;
    
    // First check sessionStorage (survives page refresh but not tab close)
    const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
    if (sessionStored) {
      const sessionConnection: WhatsAppConnection = JSON.parse(sessionStored);
      if (sessionConnection.isConnected) {
        return true;
      }
    }
    
    // Then check localStorage (more persistent)
    const localStored = localStorage.getItem(this.STORAGE_KEY);
    if (!localStored) return false;
    
    const localConnection: WhatsAppConnection = JSON.parse(localStored);
    
    // Check if connection is still valid (within 7 days for persistent storage)
    if (localConnection.lastConnected) {
      const connectionTime = new Date(localConnection.lastConnected).getTime();
      const currentTime = new Date().getTime();
      const daysDiff = (currentTime - connectionTime) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 7) {
        // Connection expired (7 days)
        this.clearConnection();
        return false;
      }
    }
    
    return localConnection.isConnected === true;
  }

  // Save connection status with multiple storage strategies
  setConnectionStatus(connected: boolean, phoneNumber?: string, connectionId?: string): void {
    const connection: WhatsAppConnection = {
      isConnected: connected,
      lastConnected: connected ? new Date() : undefined,
      phoneNumber: connected ? phoneNumber : undefined,
      connectionId: connected ? connectionId : undefined
    };
    
    // Store in sessionStorage (survives page refresh, cleared when browser closes)
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(connection));
    
    // Also store in localStorage for longer persistence (survives browser restart)
    if (connected) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connection));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Get connection info
  getConnectionInfo(): WhatsAppConnection {
    if (typeof window === 'undefined') return { isConnected: false };
    
    // Prefer session storage first
    const sessionStored = sessionStorage.getItem(this.SESSION_KEY);
    if (sessionStored) {
      return JSON.parse(sessionStored);
    }
    
    // Fall back to local storage
    const localStored = localStorage.getItem(this.STORAGE_KEY);
    return localStored ? JSON.parse(localStored) : { isConnected: false };
  }

  // Clear connection (only clear localStorage, keep sessionStorage for current session)
  clearConnection(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    // Don't clear sessionStorage here - let it persist during the session
  }

  // Clear all storage (use this only on explicit WhatsApp logout)
  clearAllStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem(this.SESSION_KEY);
  }

  // Check if we should automatically reconnect
  shouldAutoReconnect(): boolean {
    const connection = this.getConnectionInfo();
    if (!connection.isConnected) return false;
    
    // Check if connection is recent (within last hour)
    if (connection.lastConnected) {
      const connectionTime = new Date(connection.lastConnected).getTime();
      const currentTime = new Date().getTime();
      const hoursDiff = (currentTime - connectionTime) / (1000 * 60 * 60);
      
      return hoursDiff <= 1; // Auto-reconnect within 1 hour
    }
    
    return false;
  }
}

export const whatsappConnectionService = new WhatsAppConnectionService();