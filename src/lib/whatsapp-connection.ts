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
}

class WhatsAppConnectionService {
  private readonly STORAGE_KEY = 'whatsapp-connection';

  // Check if WhatsApp is already connected
  isWhatsAppConnected(): boolean {
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return false;
    
    const connection: WhatsAppConnection = JSON.parse(stored);
    
    // Check if connection is still valid (within 24 hours)
    if (connection.lastConnected) {
      const connectionTime = new Date(connection.lastConnected).getTime();
      const currentTime = new Date().getTime();
      const hoursDiff = (currentTime - connectionTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        // Connection expired
        this.clearConnection();
        return false;
      }
    }
    
    return connection.isConnected === true;
  }

  // Save connection status
  setConnectionStatus(connected: boolean, phoneNumber?: string): void {
    const connection: WhatsAppConnection = {
      isConnected: connected,
      lastConnected: connected ? new Date() : undefined,
      phoneNumber: connected ? phoneNumber : undefined
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(connection));
  }

  // Get connection info
  getConnectionInfo(): WhatsAppConnection {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : { isConnected: false };
  }

  // Clear connection
  clearConnection(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const whatsappConnectionService = new WhatsAppConnectionService();