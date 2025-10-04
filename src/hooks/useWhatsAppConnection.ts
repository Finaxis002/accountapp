// hooks/useWhatsAppConnection.ts
import { useState, useEffect, useCallback } from 'react';
import { whatsappConnectionService } from '@/lib/whatsapp-connection';
import { useToast } from '@/components/ui/use-toast';

export interface UseWhatsAppConnectionReturn {
  isConnected: boolean | null;
  connectionInfo: any;
  isLoading: boolean;
  canManage: boolean;
  checkConnection: (force?: boolean) => Promise<void>;
  connectWhatsApp: (phoneNumber: string) => Promise<boolean>;
  disconnectWhatsApp: () => Promise<boolean>;
  refreshConnection: () => void;
}

export function useWhatsAppConnection(): UseWhatsAppConnectionReturn {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canManage = whatsappConnectionService.canManageConnections();

  const checkConnection = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const connected = await whatsappConnectionService.checkWhatsAppWebConnection(force);
      const info = await whatsappConnectionService.getConnectionInfo();
      
      setIsConnected(connected);
      setConnectionInfo(info);
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connectWhatsApp = async (phoneNumber: string): Promise<boolean> => {
    if (!canManage) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Only customer users can manage WhatsApp connections.',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const success = await whatsappConnectionService.setClientConnection(phoneNumber);
      
      if (success) {
        toast({
          title: 'WhatsApp Connected!',
          description: 'WhatsApp connection has been saved for your team.',
        });
        await checkConnection(true);
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: 'Failed to save WhatsApp connection.',
        });
        return false;
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'An error occurred while connecting WhatsApp.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWhatsApp = async (): Promise<boolean> => {
    if (!canManage) {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'Only customer users can disconnect WhatsApp.',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const success = await whatsappConnectionService.clearClientConnection();
      
      if (success) {
        toast({
          title: 'WhatsApp Disconnected',
          description: 'WhatsApp connection has been removed.',
        });
        await checkConnection(true);
        return true;
      } else {
        toast({
          variant: 'destructive',
          title: 'Disconnect Failed',
          description: 'Failed to disconnect WhatsApp.',
        });
        return false;
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast({
        variant: 'destructive',
        title: 'Disconnect Error',
        description: 'An error occurred while disconnecting WhatsApp.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConnection = () => {
    checkConnection(true);
  };

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    connectionInfo,
    isLoading,
    canManage,
    checkConnection,
    connectWhatsApp,
    disconnectWhatsApp,
    refreshConnection,
  };
}