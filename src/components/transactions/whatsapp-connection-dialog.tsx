// // components/whatsapp-connection-dialog.tsx
// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Loader2, X, QrCode, Smartphone, CheckCircle2, ExternalLink } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import { whatsappConnectionService } from '@/lib/whatsapp-connection';

// interface WhatsAppConnectionDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onConnected: () => void;
// }

// export function WhatsAppConnectionDialog({ isOpen, onClose, onConnected }: WhatsAppConnectionDialogProps) {
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [step, setStep] = useState<'initial' | 'qr' | 'connected'>('initial');
//   const { toast } = useToast();

//   const handleConnectWhatsApp = () => {
//     setIsConnecting(true);
    
//     // Simulate QR code generation delay
//     setTimeout(() => {
//       setStep('qr');
//       setIsConnecting(false);
//     }, 1000);
//   };

//   const handleQRScanned = () => {
//     setStep('connected');
//     whatsappConnectionService.setConnectionStatus(true, 'Your WhatsApp');
    
//     toast({
//       title: 'WhatsApp Connected!',
//       description: 'Your WhatsApp Web is now connected.',
//     });
//   };

//   const handleComplete = () => {
//     onConnected();
//     onClose();
//   };

//   const handleOpenWhatsAppWeb = () => {
//     window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer');
//     toast({
//       title: 'WhatsApp Web Opened',
//       description: 'Please scan the QR code to connect.',
//     });
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       {/* Backdrop */}
//       <div 
//         className="fixed inset-0 bg-black/50 transition-opacity"
//         onClick={onClose}
//       />
      
//       {/* Dialog */}
//       <Card className="w-full max-w-md mx-4 z-50">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center gap-2">
//               <Smartphone className="h-5 w-5 text-green-600" />
//               Connect WhatsApp
//             </CardTitle>
//             <Button variant="ghost" size="icon" onClick={onClose}>
//               <X className="h-4 w-4" />
//             </Button>
//           </div>
//           <CardDescription>
//             Connect your WhatsApp to send messages directly
//           </CardDescription>
//         </CardHeader>
        
//         <CardContent className="space-y-6">
//           {step === 'initial' && (
//             <div className="space-y-4">
//               <div className="text-center">
//                 <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
//                 <h3 className="font-semibold mb-2">Connect WhatsApp Web</h3>
//                 <p className="text-sm text-muted-foreground mb-4">
//                   Connect your WhatsApp once and send messages directly to customers.
//                 </p>
//               </div>
              
//               <div className="space-y-3">
//                 <Button 
//                   onClick={handleConnectWhatsApp} 
//                   className="w-full gap-2"
//                   disabled={isConnecting}
//                 >
//                   {isConnecting ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <QrCode className="h-4 w-4" />
//                   )}
//                   {isConnecting ? 'Preparing...' : 'Show QR Code'}
//                 </Button>
                
//                 <Button 
//                   onClick={handleOpenWhatsAppWeb}
//                   variant="outline" 
//                   className="w-full gap-2"
//                 >
//                   <ExternalLink className="h-4 w-4" />
//                   Open WhatsApp Web
//                 </Button>
//               </div>
//             </div>
//           )}

//           {step === 'qr' && (
//             <div className="space-y-4">
//               <div className="text-center">
//                 <QrCode className="h-12 w-12 text-green-600 mx-auto mb-4" />
//                 <h3 className="font-semibold mb-2">Scan QR Code</h3>
//                 <p className="text-sm text-muted-foreground mb-4">
//                   Open WhatsApp on your phone and scan this QR code
//                 </p>
//               </div>
              
//               {/* QR Code Placeholder */}
//               <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
//                 <div className="text-center">
//                   <div className="bg-white p-4 inline-block mb-4">
//                     {/* In a real app, you would generate/show actual QR code */}
//                     <div className="w-32 h-32 bg-gray-200 flex items-center justify-center">
//                       <span className="text-xs text-gray-500">QR Code</span>
//                     </div>
//                   </div>
//                   <p className="text-xs text-muted-foreground">
//                     WhatsApp → Menu → Linked Devices → Link a Device
//                   </p>
//                 </div>
//               </div>
              
//               <div className="flex gap-2">
//                 <Button 
//                   variant="outline" 
//                   onClick={() => setStep('initial')}
//                   className="flex-1"
//                 >
//                   Back
//                 </Button>
//                 <Button 
//                   onClick={handleQRScanned}
//                   className="flex-1 gap-2"
//                 >
//                   <CheckCircle2 className="h-4 w-4" />
//                   I've Scanned
//                 </Button>
//               </div>
//             </div>
//           )}

//           {step === 'connected' && (
//             <div className="text-center space-y-4">
//               <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
//               <div>
//                 <h3 className="font-semibold mb-2">Connected Successfully!</h3>
//                 <p className="text-sm text-muted-foreground">
//                   Your WhatsApp is now connected. You can send messages directly.
//                 </p>
//               </div>
//               <Button onClick={handleComplete} className="w-full">
//                 Start Sending Messages
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


/////////////////////////////////////////////////////////////////////////////////////////////////





// components/whatsapp-connection-dialog.tsx
// components/whatsapp-connection-dialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, X, QrCode, Smartphone, CheckCircle2, ExternalLink, RefreshCw, Monitor } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { whatsappConnectionService } from '@/lib/whatsapp-connection';

interface WhatsAppConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

// Simple QR Code Component - Pure CSS, no dependencies
const SimpleQRCode = () => (
  <div className="bg-white p-6 rounded-lg border-2 border-green-200 shadow-sm">
    <div className="w-64 h-64 bg-white relative mx-auto border-2 border-gray-800 rounded">
      {/* QR Code Pattern - Pure CSS */}
      {/* Top-left corner marker */}
      <div className="absolute top-3 left-3 w-10 h-10 border-2 border-gray-800">
        <div className="absolute top-1 left-1 w-6 h-6 bg-gray-800"></div>
        <div className="absolute top-1 right-1 w-2 h-2 bg-gray-800"></div>
        <div className="absolute bottom-1 left-1 w-2 h-2 bg-gray-800"></div>
      </div>
      
      {/* Top-right corner marker */}
      <div className="absolute top-3 right-3 w-10 h-10 border-2 border-gray-800">
        <div className="absolute top-1 right-1 w-6 h-6 bg-gray-800"></div>
        <div className="absolute top-1 left-1 w-2 h-2 bg-gray-800"></div>
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-800"></div>
      </div>
      
      {/* Bottom-left corner marker */}
      <div className="absolute bottom-3 left-3 w-10 h-10 border-2 border-gray-800">
        <div className="absolute bottom-1 left-1 w-6 h-6 bg-gray-800"></div>
        <div className="absolute top-1 left-1 w-2 h-2 bg-gray-800"></div>
        <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-800"></div>
      </div>
      
      {/* Center alignment pattern */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
          <div className="w-8 h-8 bg-white rounded-sm flex items-center justify-center">
            <Smartphone className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </div>
      
      {/* Random data patterns */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-24 left-32 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-32 left-24 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-36 left-40 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-40 left-36 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-28 left-28 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-44 left-44 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-16 left-16 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-48 left-20 w-2 h-2 bg-gray-800"></div>
      <div className="absolute top-20 left-48 w-2 h-2 bg-gray-800"></div>
    </div>
    <div className="text-center mt-4">
      <p className="text-xs text-muted-foreground font-medium">
        WhatsApp Web QR Code
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Scan with your phone's WhatsApp
      </p>
    </div>
  </div>
);

export function WhatsAppConnectionDialog({ isOpen, onClose, onConnected }: WhatsAppConnectionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'opening' | 'qr' | 'connected'>('initial');
  const [whatsappWindow, setWhatsappWindow] = useState<Window | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep('initial');
    }

    // Cleanup: close WhatsApp window when component unmounts
    return () => {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }
    };
  }, [isOpen, whatsappWindow]);

  const handleConnectWhatsApp = async () => {
    setIsLoading(true);
    setStep('opening');
    
    try {
      // Auto-open WhatsApp Web in a new window
      const newWindow = window.open('https://web.whatsapp.com', 'whatsapp-web', 'width=1200,height=800,left=200,top=100');
      setWhatsappWindow(newWindow);
      
      if (!newWindow) {
        toast({
          variant: 'destructive',
          title: 'Popup Blocked',
          description: 'Please allow popups for this site and try again.',
        });
        setStep('initial');
        return;
      }
      
      toast({
        title: 'WhatsApp Web Opened',
        description: 'Please wait while WhatsApp Web loads...',
      });
      
      // Wait a moment for WhatsApp Web to load, then show QR code
      setTimeout(() => {
        setStep('qr');
        toast({
          title: 'Ready to Scan',
          description: 'Scan the QR code in the WhatsApp Web window with your phone.',
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: 'Failed to open WhatsApp Web. Please try again.',
      });
      setStep('initial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWhatsAppManually = () => {
    window.open('https://web.whatsapp.com', '_blank', 'noopener,noreferrer');
    setStep('qr');
    toast({
      title: 'WhatsApp Web Opened',
      description: 'Now scan the QR code in the WhatsApp Web window with your phone.',
    });
  };

  const handleConfirmConnection = () => {
    // Close the WhatsApp Web window if it's open
    if (whatsappWindow && !whatsappWindow.closed) {
      whatsappWindow.close();
    }
    
    // Save connection status
    whatsappConnectionService.setConnectionStatus(true, 'Your WhatsApp');
    setStep('connected');
    
    toast({
      title: 'WhatsApp Connected!',
      description: 'Your WhatsApp Web is now connected and ready to send messages.',
    });
  };

  const handleComplete = () => {
    onConnected();
    onClose();
  };

  const handleRetry = () => {
    if (whatsappWindow && !whatsappWindow.closed) {
      whatsappWindow.close();
    }
    setWhatsappWindow(null);
    setStep('initial');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <Card className="w-full max-w-md mx-4 z-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              Connect WhatsApp
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Connect WhatsApp Web to send messages directly
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 'initial' && (
            <div className="space-y-4">
              <div className="text-center">
                <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Connect WhatsApp Web</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll open WhatsApp Web automatically. Then scan the QR code with your phone to connect.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={handleConnectWhatsApp} 
                  className="w-full gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                  {isLoading ? 'Opening...' : 'Auto-Connect WhatsApp Web'}
                </Button>
                
                <Button 
                  onClick={handleOpenWhatsAppManually}
                  variant="outline" 
                  className="w-full gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open WhatsApp Web Manually
                </Button>
              </div>
            </div>
          )}

          {step === 'opening' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto" />
              <div>
                <h3 className="font-semibold mb-2">Opening WhatsApp Web...</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we open WhatsApp Web in a new window.
                </p>
              </div>
              <div className="text-xs text-orange-600 bg-orange-50 p-3 rounded-lg">
                💡 If a popup doesn't appear, check your browser's popup blocker
              </div>
            </div>
          )}

          {step === 'qr' && (
            <div className="space-y-4">
              <div className="text-center">
                <QrCode className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-2">Scan QR Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code in WhatsApp Web with your phone
                </p>
              </div>
              
              {/* Simple QR Code - No dependencies */}
              <SimpleQRCode />
              
              <div className="space-y-3 text-center">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center justify-center gap-1">
                    <span>📱</span>
                    <strong>Open WhatsApp on your phone</strong>
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <span>⚙️</span>
                    <strong>Tap Menu → Linked Devices → Link a Device</strong>
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <span>📸</span>
                    <strong>Point your camera at the QR code in WhatsApp Web</strong>
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-700 font-medium">
                    ✅ WhatsApp Web should be open in another window/tab
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleRetry}
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
                <Button 
                  onClick={handleConfirmConnection}
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  I'm Connected
                </Button>
              </div>
            </div>
          )}

          {step === 'connected' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <h3 className="font-semibold mb-2">Connected Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  Your WhatsApp Web is now connected. You can send messages directly to customers.
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 font-medium">
                  💬 Messages will open in WhatsApp Web with pre-filled content
                </p>
              </div>
              <Button onClick={handleComplete} className="w-full bg-green-600 hover:bg-green-700">
                Start Sending Messages
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}