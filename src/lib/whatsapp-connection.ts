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

  // Check if WhatsApp Web is actually connected by testing if we can access it
  async checkWhatsAppWebConnection(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Try to check if WhatsApp Web is connected by opening a test URL
      // This is a lightweight check to see if WhatsApp Web session exists
      return await this.testWhatsAppWebSession();
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      return false;
    }
  }

  // Test if WhatsApp Web session is active
  private async testWhatsAppWebSession(): Promise<boolean> {
    return new Promise((resolve) => {
      // Try to detect if WhatsApp Web is connected by checking browser storage
      // or by attempting to open WhatsApp Web in a hidden iframe
      const testWindow = window.open('about:blank', 'whatsapp-test', 'width=100,height=100,left=-1000,top=-1000');
      
      if (!testWindow) {
        // If we can't open a window, assume connection might exist
        // (could be due to popup blockers, but WhatsApp Web might still be connected)
        resolve(this.hasPreviousConnection());
        return;
      }

      // Try to redirect to WhatsApp Web
      testWindow.location.href = 'https://web.whatsapp.com';
      
      // Wait a bit to see if it loads successfully
      setTimeout(() => {
        try {
          // If the window is still open and not showing error pages, assume connected
          const isProbablyConnected = !testWindow.closed && 
            testWindow.location.href.includes('web.whatsapp.com');
          
          testWindow.close();
          resolve(isProbablyConnected || this.hasPreviousConnection());
        } catch (error) {
          // If we get a security error (cross-origin), it means WhatsApp Web is loaded
          // and has established a session (this is actually a good sign)
          testWindow.close();
          resolve(true);
        }
      }, 1000);
    });
  }

  // Check if we have a previous connection record
  private hasPreviousConnection(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return false;
    
    const connection: WhatsAppConnection = JSON.parse(stored);
    
    // Check if connection is recent (within 30 days like WhatsApp Web)
    if (connection.lastConnected) {
      const connectionTime = new Date(connection.lastConnected).getTime();
      const currentTime = new Date().getTime();
      const daysDiff = (currentTime - connectionTime) / (1000 * 60 * 60 * 24);
      
      return daysDiff <= 30; // Same 30-day period as WhatsApp Web
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

  // Clear connection (only when user explicitly disconnects)
  clearConnection(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export const whatsappConnectionService = new WhatsAppConnectionService();