// // lib/api/whatsapp-api.ts
// const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp`;



// export interface WhatsAppConnection {
//   _id?: string;
//   client_id: string;
//   phone_number: string;
//   connected_by: {
//     _id: string;
//     name: string;
//     email: string;
//   };
//   connected_by_name: string;
//   connection_data: any;
//   is_active: boolean;
//   last_connected: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface APIResponse<T = any> {
//   success: boolean;
//   message?: string;
//   connection?: T;
//   connections?: T[];
//   hasActiveConnection?: boolean;
//   count?: number;
//   error?: string;
// }

// // Error type guard
// function isErrorWithMessage(error: unknown): error is { message: string } {
//   return (
//     typeof error === 'object' &&
//     error !== null &&
//     'message' in error &&
//     typeof (error as any).message === 'string'
//   );
// }

// // Get error message safely
// function getErrorMessage(error: unknown): string {
//   if (isErrorWithMessage(error)) {
//     return error.message;
//   }
//   return String(error);
// }

// class WhatsAppAPI {
//   private getAuthHeaders() {
//     const token = localStorage.getItem('token');
//     return {
//       'Authorization': `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     };
//   }

//   // Get active connection for client
//   async getConnection(): Promise<APIResponse<WhatsAppConnection>> {
//     try {
//       const response = await fetch(`${API_BASE}/connection`, {
//         headers: this.getAuthHeaders(),
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching WhatsApp connection:', error);
//       return {
//         success: false,
//         message: 'Failed to fetch WhatsApp connection',
//         error: getErrorMessage(error)
//       };
//     }
//   }

//   // Check connection status
//   async checkStatus(): Promise<APIResponse> {
//     try {
//       const response = await fetch(`${API_BASE}/connection/status`, {
//         headers: this.getAuthHeaders(),
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Error checking WhatsApp status:', error);
//       return {
//         success: false,
//         message: 'Failed to check WhatsApp status',
//         error: getErrorMessage(error)
//       };
//     }
//   }

//   // Create connection (customer only)
//   async createConnection(phoneNumber: string, connectionData?: any): Promise<APIResponse<WhatsAppConnection>> {
//     try {
//       const response = await fetch(`${API_BASE}/connection`, {
//         method: 'POST',
//         headers: this.getAuthHeaders(),
//         body: JSON.stringify({ phoneNumber, connectionData }),
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Error creating WhatsApp connection:', error);
//       return {
//         success: false,
//         message: 'Failed to create WhatsApp connection',
//         error: getErrorMessage(error)
//       };
//     }
//   }

//   // Delete connection (customer only)
//   async deleteConnection(): Promise<APIResponse> {
//     try {
//       const response = await fetch(`${API_BASE}/connection`, {
//         method: 'DELETE',
//         headers: this.getAuthHeaders(),
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Error deleting WhatsApp connection:', error);
//       return {
//         success: false,
//         message: 'Failed to delete WhatsApp connection',
//         error: getErrorMessage(error)
//       };
//     }
//   }

//   // Get connection history (customer only)
//   async getConnectionHistory(): Promise<APIResponse<WhatsAppConnection[]>> {
//     try {
//       const response = await fetch(`${API_BASE}/connection/history`, {
//         headers: this.getAuthHeaders(),
//       });
//       return await response.json();
//     } catch (error) {
//       console.error('Error fetching connection history:', error);
//       return {
//         success: false,
//         message: 'Failed to fetch connection history',
//         error: getErrorMessage(error)
//       };
//     }
//   }
// }

// export const whatsappAPI = new WhatsAppAPI();




























// lib/api/whatsapp-api.ts
const API_BASE = `${process.env.NEXT_PUBLIC_BASE_URL}/api/whatsapp`;

export interface WhatsAppConnection {
  _id?: string;
  client_id: string;
  phone_number: string;
  connected_by: {
    _id: string;
    name: string;
    email: string;
  };
  connected_by_name: string;
  connection_data: any;
  is_active: boolean;
  last_connected: string;
  createdAt: string;
  updatedAt: string;
  shared_with_users?: string[]; // Add this for sharing info
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  connection?: T;
  connections?: T[];
  hasActiveConnection?: boolean;
  hasAccess?: boolean; // Add this for access checking
  count?: number;
  error?: string;
}

// Extended interface for enhanced responses
export interface ExtendedAPIResponse<T = any> extends APIResponse<T> {
  hasAccess?: boolean;
  hasActiveConnection?: boolean;
}

// Error type guard
function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

// Get error message safely
function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

class WhatsAppAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Use the correct user ID - from user object or localStorage _id
    const userId = user?.id || user?._id || localStorage.getItem('_id');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-User-ID': userId || '', // Add user ID for backend access checking
      'X-User-Role': user?.role || '', // Add role for debugging
    };

    console.log('🔍 API Headers with User Info:', {
      userId,
      userRole: user?.role,
      tokenPresent: !!token
    });

    return headers;
  }

  // Get active connection for client
  async getConnection(): Promise<ExtendedAPIResponse<WhatsAppConnection>> {
    try {
      const response = await fetch(`${API_BASE}/connection`, {
        headers: this.getAuthHeaders(),
      });
      const result = await response.json();
      
      console.log('🔍 Get Connection API Response:', {
        url: `${API_BASE}/connection`,
        status: response.status,
        data: result
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching WhatsApp connection:', error);
      return {
        success: false,
        message: 'Failed to fetch WhatsApp connection',
        error: getErrorMessage(error)
      };
    }
  }

  // Check connection status
  async checkStatus(): Promise<ExtendedAPIResponse> {
    try {
      const response = await fetch(`${API_BASE}/connection/status`, {
        headers: this.getAuthHeaders(),
      });
      const result = await response.json();
      
      console.log('🔍 Check Status API Response:', {
        url: `${API_BASE}/connection/status`,
        status: response.status,
        data: result
      });
      
      return result;
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      return {
        success: false,
        message: 'Failed to check WhatsApp status',
        error: getErrorMessage(error)
      };
    }
  }

  // Create connection (customer only)
  async createConnection(phoneNumber: string, connectionData?: any): Promise<ExtendedAPIResponse<WhatsAppConnection>> {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const requestBody = {
        phoneNumber,
        connectionData: {
          ...connectionData,
          // Include user context for better debugging
          userContext: {
            userId: user?.id || user?._id,
            userRole: user?.role,
            timestamp: new Date().toISOString()
          }
        }
      };

      console.log('🔍 Create Connection Request:', {
        url: `${API_BASE}/connection`,
        body: requestBody
      });

      const response = await fetch(`${API_BASE}/connection`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });
      
      const result = await response.json();
      
      console.log('🔍 Create Connection API Response:', {
        status: response.status,
        data: result
      });
      
      return result;
    } catch (error) {
      console.error('Error creating WhatsApp connection:', error);
      return {
        success: false,
        message: 'Failed to create WhatsApp connection',
        error: getErrorMessage(error)
      };
    }
  }

  // Delete connection (customer only)
  async deleteConnection(): Promise<ExtendedAPIResponse> {
    try {
      const response = await fetch(`${API_BASE}/connection`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      const result = await response.json();
      
      console.log('🔍 Delete Connection API Response:', {
        status: response.status,
        data: result
      });
      
      return result;
    } catch (error) {
      console.error('Error deleting WhatsApp connection:', error);
      return {
        success: false,
        message: 'Failed to delete WhatsApp connection',
        error: getErrorMessage(error)
      };
    }
  }

  // Get connection history (customer only)
  async getConnectionHistory(): Promise<ExtendedAPIResponse<WhatsAppConnection[]>> {
    try {
      const response = await fetch(`${API_BASE}/connection/history`, {
        headers: this.getAuthHeaders(),
      });
      
      const result = await response.json();
      
      console.log('🔍 Connection History API Response:', {
        status: response.status,
        data: result
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching connection history:', error);
      return {
        success: false,
        message: 'Failed to fetch connection history',
        error: getErrorMessage(error)
      };
    }
  }
}

export const whatsappAPI = new WhatsAppAPI();