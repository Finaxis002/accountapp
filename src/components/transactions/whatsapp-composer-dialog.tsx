// // components/whatsapp-composer-dialog.tsx
// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Loader2, MessageCircle, X, Smartphone, CheckCircle2, LogOut, Users, Crown } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import { WhatsAppConnectionDialog } from './whatsapp-connection-dialog';
// import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
// import { whatsappConnectionService } from '@/lib/whatsapp-connection';
// import { whatsappAPI } from '@/lib/whatsapp-api';

// interface WhatsAppComposerDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   transaction: any;
//   party: any;
//   company: any;
// }

// export function WhatsAppComposerDialog({
//   isOpen,
//   onClose,
//   transaction,
//   party,
//   company
// }: WhatsAppComposerDialogProps) {
//   const [messageContent, setMessageContent] = useState('');
//   const [mobileNumber, setMobileNumber] = useState('');
//   const [showConnectionDialog, setShowConnectionDialog] = useState(false);
//   const { toast } = useToast();

//   const {
//     isConnected,
//     connectionInfo,
//     isLoading,
//     canManage,
//     connectWhatsApp,
//     disconnectWhatsApp,
//     refreshConnection
//   } = useWhatsAppConnection();

//   // Initialize when dialog opens
//   useEffect(() => {
//     if (isOpen) {
//       const partyMobile = party?.contactNumber || party?.phone || '';
//       setMobileNumber(partyMobile);
//       setMessageContent(generateDefaultMessageContent());
//     }
//   }, [isOpen, transaction, party, company]);

//   // Debug connection status for staff users
//   useEffect(() => {
//     const debugConnection = async () => {
//       if (isOpen) {
//         console.log('🔍 ===== WHATSAPP CONNECTION DEBUG =====');

//         // Check localStorage
//         const userData = localStorage.getItem('user');
//         const user = userData ? JSON.parse(userData) : {};

//         console.log('🔍 User Data:', {
//           userId: user?.id || user?._id,
//           userRole: user?.role,
//           localStorage_id: localStorage.getItem('_id'),
//           localStorageRole: localStorage.getItem('role')
//         });

//         // Check service state
//         console.log('🔍 Service State:', {
//           isConnected, // from hook
//           connectionInfo, // from hook
//           isLoading,
//           canManage
//         });

//         // Direct service checks
//         try {
//           const serviceConnected = await whatsappConnectionService.checkWhatsAppWebConnection(true);
//           const serviceInfo = await whatsappConnectionService.getConnectionInfo();

//           console.log('🔍 Direct Service Checks:', {
//             serviceConnected,
//             serviceInfo
//           });
//         } catch (error) {
//           console.error('🔍 Service Check Error:', error);
//         }

//         // Direct API checks
//         try {
//           const statusResponse = await whatsappAPI.checkStatus();
//           const connectionResponse = await whatsappAPI.getConnection();

//           console.log('🔍 Direct API Responses:', {
//             statusResponse,
//             connectionResponse
//           });

//           // Check if staff user should have access
//           if (statusResponse.hasActiveConnection && !statusResponse.hasAccess) {
//             console.warn('⚠️ STAFF ACCESS ISSUE: Connection exists but staff has no access');
//             console.log('🔍 Possible reasons:', {
//               staffUserId: user?.id || user?._id,
//               connectionSharedWith: connectionResponse.connection?.shared_with_users,
//               staffInSharedList: connectionResponse.connection?.shared_with_users?.includes(user?.id || user?._id)
//             });
//           }

//         } catch (error) {
//           console.error('🔍 API Check Error:', error);
//         }

//         console.log('🔍 ===== END DEBUG =====');
//       }
//     };

//     if (isOpen) {
//       debugConnection();
//     }
//   }, [isOpen, isConnected, connectionInfo, isLoading, canManage]);

//   const generateDefaultMessageContent = () => {
//     const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
//     const invoiceDate = new Date(transaction.date).toLocaleDateString('en-GB', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     });
//     const amount = transaction.totalAmount || transaction.amount || 0;
//     const formattedAmount = new Intl.NumberFormat('en-IN', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(amount);

//     return `Dear ${party?.name || 'Valued Customer'},

// Please view the details of the transaction below.

// Invoice No: ${invoiceNumber}
// Invoice Date: ${invoiceDate}
// Amount: ₹${formattedAmount}

// Thank you for your business!

// Best regards,
// ${company?.businessName || 'Your Company'}`;
//   };

//   const handleSendOnWhatsApp = () => {
//     if (!mobileNumber.trim()) {
//       toast({
//         variant: 'destructive',
//         title: 'Mobile number required',
//         description: 'Please enter a valid mobile number.',
//       });
//       return;
//     }

//     if (!messageContent.trim()) {
//       toast({
//         variant: 'destructive',
//         title: 'Message required',
//         description: 'Please enter a message to share.',
//       });
//       return;
//     }

//     // Format mobile number
//     const formattedNumber = mobileNumber.replace(/\D/g, '');
//     let finalNumber = formattedNumber;
//     if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
//       finalNumber = `91${formattedNumber}`;
//     }

//     if (finalNumber.length < 10) {
//       toast({
//         variant: 'destructive',
//         title: 'Invalid Contact Number',
//         description: 'Please check the mobile number format.',
//       });
//       return;
//     }

//     const whatsappUrl = `https://web.whatsapp.com/send?phone=${finalNumber}&text=${encodeURIComponent(messageContent)}`;
//     window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

//     toast({
//       title: 'WhatsApp Web Opening',
//       description: `Opening chat with ${party?.name || 'customer'} in WhatsApp Web.`,
//     });
//   };

//   const handleConnectWhatsApp = () => {
//     setShowConnectionDialog(true);
//   };

//   const handleConnected = () => {
//     return async (phoneNumber: string) => {
//       try {
//         const success = await connectWhatsApp(phoneNumber);
//         if (success) {
//           setShowConnectionDialog(false);
//           toast({
//             title: 'WhatsApp Connected!',
//             description: 'WhatsApp has been successfully connected for your team.',
//           });
//         } else {
//           toast({
//             variant: 'destructive',
//             title: 'Connection Failed',
//             description: 'Failed to connect WhatsApp. Please try again.',
//           });
//         }
//       } catch (error) {
//         console.error('Error connecting WhatsApp:', error);
//         toast({
//           variant: 'destructive',
//           title: 'Connection Error',
//           description: 'An error occurred while connecting WhatsApp.',
//         });
//       }
//     };
//   };

//   const handleDisconnectWhatsApp = async () => {
//     await disconnectWhatsApp();
//   };

//   if (!isOpen) return null;

//   const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
//   const invoiceDate = new Date(transaction.date).toLocaleDateString();
//   const amount = transaction.totalAmount || transaction.amount || 0;
//   const formattedAmount = new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//   }).format(amount);

//   return (
//     <>
//       <div className="fixed inset-0 z-50 flex">
//         <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

//         <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
//           <div className="flex flex-col h-full">
//             {/* Header */}
//             <div className="flex items-center justify-between p-6 border-b">
//               <div className="flex items-center gap-3">
//                 <MessageCircle className="h-6 w-6 text-green-600" />
//                 <div>
//                   <h2 className="text-xl font-semibold">Share on WhatsApp</h2>
//                   <p className="text-sm text-muted-foreground">
//                     Send transaction details via WhatsApp Web
//                   </p>
//                 </div>
//               </div>
//               <Button variant="ghost" size="icon" onClick={onClose}>
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>

//             {/* Content */}
//             <div className="flex-1 overflow-y-auto p-6 space-y-6">
//               {/* Connection Status */}
//               {isLoading && (
//                 <Card className="border-blue-200 bg-blue-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center gap-3">
//                       <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
//                       <div className="flex-1">
//                         <p className="font-medium text-blue-800">Checking WhatsApp Connection...</p>
//                         <p className="text-sm text-blue-700">
//                           Verifying WhatsApp Web connection status
//                         </p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {!isLoading && isConnected === false && (
//                 <Card className="border-yellow-200 bg-yellow-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center gap-3">
//                       <Smartphone className="h-5 w-5 text-yellow-600" />
//                       <div className="flex-1">
//                         <p className="font-medium text-yellow-800">WhatsApp Not Connected</p>
//                         <p className="text-sm text-yellow-700">
//                           {canManage
//                             ? 'Connect WhatsApp for your entire team'
//                             : 'Ask your customer to connect WhatsApp for the team'
//                           }
//                         </p>
//                       </div>
//                       {canManage && (
//                         <Button onClick={handleConnectWhatsApp} size="sm">
//                           <Smartphone className="h-4 w-4 mr-2" />
//                           Connect
//                         </Button>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {!isLoading && isConnected === true && (
//                 <Card className="border-green-200 bg-green-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         {connectionInfo?.connectionType === 'client' ? (
//                           <Users className="h-5 w-5 text-green-600" />
//                         ) : (
//                           <CheckCircle2 className="h-5 w-5 text-green-600" />
//                         )}
//                         <div>
//                           <p className="font-medium text-green-800 flex items-center gap-2">
//                             WhatsApp Connected
//                             {connectionInfo?.connectionType === 'client' && (
//                               <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
//                                 <Users className="h-3 w-3" />
//                                 Team
//                               </span>
//                             )}
//                             {canManage && (
//                               <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
//                                 <Crown className="h-3 w-3" />
//                                 Admin
//                               </span>
//                             )}
//                           </p>
//                           <p className="text-sm text-green-700">
//                             {connectionInfo?.phoneNumber
//                               ? `Connected to ${connectionInfo.phoneNumber}`
//                               : 'WhatsApp Web is connected and ready'
//                             }
//                             {connectionInfo?.connectionType === 'client' && ' • Shared with team'}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex gap-2">
//                         <Button
//                           onClick={refreshConnection}
//                           variant="outline"
//                           size="sm"
//                           disabled={isLoading}
//                         >
//                           <Loader2 className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
//                           Refresh
//                         </Button>
//                         {canManage && (
//                           <Button
//                             onClick={handleDisconnectWhatsApp}
//                             variant="outline"
//                             size="sm"
//                             className="text-red-600 border-red-200 hover:bg-red-50"
//                           >
//                             <LogOut className="h-4 w-4 mr-1" />
//                             Disconnect
//                           </Button>
//                         )}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {/* Rest of your existing UI remains the same */}
//               <Card>
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-sm">Transaction Summary</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Customer:</span>
//                     <span className="font-medium">{party?.name || 'N/A'}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Mobile:</span>
//                     <span className="font-medium">{party?.contactNumber || party?.phone || 'N/A'}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Invoice:</span>
//                     <span>{invoiceNumber}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Date:</span>
//                     <span>{invoiceDate}</span>
//                   </div>
//                   <div className="flex justify-between items-center pt-2 border-t">
//                     <span className="text-muted-foreground">Amount:</span>
//                     <div className="text-right">
//                       <div className="font-bold text-lg">
//                         {formattedAmount}
//                       </div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* WhatsApp Form */}
//               <div className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="mobile">Mobile Number</Label>
//                   <div className="flex gap-2">
//                     <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">
//                       +91
//                     </div>
//                     <Input
//                       id="mobile"
//                       value={mobileNumber}
//                       onChange={(e) => setMobileNumber(e.target.value)}
//                       placeholder="Enter mobile number"
//                       className="flex-1 rounded-l-none"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="message">Message</Label>
//                   <Textarea
//                     id="message"
//                     value={messageContent}
//                     onChange={(e) => setMessageContent(e.target.value)}
//                     placeholder="Compose your WhatsApp message..."
//                     className="min-h-[300px] resize-vertical font-mono text-sm"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between text-sm text-muted-foreground">
//                   <span>You can edit the message above as needed</span>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => setMessageContent(generateDefaultMessageContent())}
//                   >
//                     Reset to default
//                   </Button>
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="border-t p-6 bg-muted/20">
//               <div className="flex gap-3">
//                 <Button variant="outline" onClick={onClose} className="flex-1">
//                   Cancel
//                 </Button>

//                 {isConnected ? (
//                   <Button
//                     onClick={handleSendOnWhatsApp}
//                     className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
//                   >
//                     <MessageCircle className="h-4 w-4" />
//                     Send via WhatsApp Web
//                   </Button>
//                 ) : (
//                   <Button
//                     onClick={handleConnectWhatsApp}
//                     className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
//                     disabled={!canManage}
//                   >
//                     <Smartphone className="h-4 w-4" />
//                     {canManage ? 'Connect for Team' : 'Ask Customer to Connect'}
//                   </Button>
//                 )}
//               </div>

//               {isConnected && connectionInfo?.connectionType === 'client' && (
//                 <div className="mt-3 text-center">
//                   <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
//                     <Users className="h-3 w-3" />
//                     Team WhatsApp connection • All team members can use this connection
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <WhatsAppConnectionDialog
//         isOpen={showConnectionDialog}
//         onClose={() => setShowConnectionDialog(false)}
//         onConnected={handleConnected}
//       />
//     </>
//   );
// }






// 
// components/whatsapp-composer-dialog.tsx
// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Label } from "@/components/ui/label";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Loader2,
//   MessageCircle,
//   X,
//   Smartphone,
//   CheckCircle2,
//   LogOut,
//   Users,
//   Crown,
// } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
// import { WhatsAppConnectionDialog } from "./whatsapp-connection-dialog";
// import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";

// interface WhatsAppComposerDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   transaction: any;
//   party: any;
//   company: any;
// }

// export function WhatsAppComposerDialog({
//   isOpen,
//   onClose,
//   transaction,
//   party,
//   company,
// }: WhatsAppComposerDialogProps) {
//   const [messageContent, setMessageContent] = useState("");
//   const [mobileNumber, setMobileNumber] = useState("");
//   const [showConnectionDialog, setShowConnectionDialog] = useState(false);
//   const [isSending, setIsSending] = useState(false);
//   const { toast } = useToast();

//   const {
//     isConnected,
//     connectionInfo,
//     isLoading,
//     canManage,
//     connectWhatsApp,
//     disconnectWhatsApp,
//     refreshConnection
   
//   } = useWhatsAppConnection();

//   // Initialize when dialog opens
//   useEffect(() => {
//     if (isOpen) {
//       const partyMobile = party?.contactNumber || party?.phone || "";
//       setMobileNumber(partyMobile);
//       setMessageContent(generateDefaultMessageContent());
//     }
//   }, [isOpen, transaction, party, company]);

//   const generateDefaultMessageContent = () => {
//     const invoiceNumber =
//       transaction.invoiceNumber || transaction.referenceNumber || "N/A";
//     const invoiceDate = new Date(transaction.date).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//     const amount = transaction.totalAmount || transaction.amount || 0;
//     const formattedAmount = new Intl.NumberFormat("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(amount);

//     return `Dear ${party?.name || "Valued Customer"},

// Please view the details of the transaction below.

// Invoice No: ${invoiceNumber}
// Invoice Date: ${invoiceDate}
// Amount: ₹${formattedAmount}

// Thank you for your business!

// Best regards,
// ${company?.businessName || "Your Company"}`;
//   };

//   // ✅ UPDATED: Use backend API to send message
//   const handleSendOnWhatsApp = async () => {
//     if (!mobileNumber.trim()) {
//       toast({
//         variant: "destructive",
//         title: "Mobile number required",
//         description: "Please enter a valid mobile number.",
//       });
//       return;
//     }

//     if (!messageContent.trim()) {
//       toast({
//         variant: "destructive",
//         title: "Message required",
//         description: "Please enter a message to share.",
//       });
//       return;
//     }

//     if (!party?._id) {
//       toast({
//         variant: "destructive",
//         title: "Vendor ID required",
//         description: "Cannot send message without vendor information.",
//       });
//       return;
//     }

//     setIsSending(true);
//     try {
//       const result = await sendVendorMessage({
//         message: messageContent,
//         phoneNumber: mobileNumber, // The party's mobile number
//         partyName: party?.name, // The party's name
//         invoiceData: {
//           partyName: party?.name,
//           invoiceNumber:
//             transaction.invoiceNumber || transaction.referenceNumber,
//           amount: transaction.totalAmount || transaction.amount,
//           dueDate: transaction.dueDate,
//           gstAmount: transaction.taxAmount,
//           totalAmount: transaction.totalAmount,
//         },
//         manualSend: false, // Use automated sending
//       });

//       if (result.success) {
//         // Success toast is handled in the hook
//         // Optionally close the dialog after successful send
//         // onClose();
//       }
//     } catch (error) {
//       console.error("Error sending WhatsApp message:", error);
//       // Error toast is handled in the hook
//     } finally {
//       setIsSending(false);
//     }
//   };



//   const handleConnectWhatsApp = () => {
//     setShowConnectionDialog(true);
//   };

//   const handleConnected = async () => {
//     try {
//       await refreshConnection();
//       setShowConnectionDialog(false);
//       toast({
//         title: "WhatsApp Connected!",
//         description: "WhatsApp has been successfully connected.",
//       });
//     } catch (error) {
//       console.error("Error after connection:", error);
//     }
//   };

//   const handleDisconnectWhatsApp = async () => {
//     await disconnectWhatsApp();
//   };

//   if (!isOpen) return null;

//   const invoiceNumber =
//     transaction.invoiceNumber || transaction.referenceNumber || "N/A";
//   const invoiceDate = new Date(transaction.date).toLocaleDateString();
//   const amount = transaction.totalAmount || transaction.amount || 0;
//   const formattedAmount = new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//   }).format(amount);

//   return (
//     <>
//       <div className="fixed inset-0 z-50 flex">
//         <div
//           className="fixed inset-0 bg-black/50 transition-opacity"
//           onClick={onClose}
//         />

//         <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
//           <div className="flex flex-col h-full">
//             {/* Header */}
//             <div className="flex items-center justify-between p-6 border-b">
//               <div className="flex items-center gap-3">
//                 <MessageCircle className="h-6 w-6 text-green-600" />
//                 <div>
//                   <h2 className="text-xl font-semibold">Share on WhatsApp</h2>
//                   <p className="text-sm text-muted-foreground">
//                     {isConnected
//                       ? "Send messages automatically"
//                       : "Connect WhatsApp to send messages"}
//                   </p>
//                 </div>
//               </div>
//               <Button variant="ghost" size="icon" onClick={onClose}>
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>

//             {/* Content */}
//             <div className="flex-1 overflow-y-auto p-6 space-y-6">
//               {/* Connection Status */}
//               {isLoading && (
//                 <Card className="border-blue-200 bg-blue-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center gap-3">
//                       <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
//                       <div className="flex-1">
//                         <p className="font-medium text-blue-800">
//                           Checking WhatsApp Connection...
//                         </p>
//                         <p className="text-sm text-blue-700">
//                           Verifying WhatsApp connection status
//                         </p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {!isLoading && isConnected === false && (
//                 <Card className="border-yellow-200 bg-yellow-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center gap-3">
//                       <Smartphone className="h-5 w-5 text-yellow-600" />
//                       <div className="flex-1">
//                         <p className="font-medium text-yellow-800">
//                           WhatsApp Not Connected
//                         </p>
//                         <p className="text-sm text-yellow-700">
//                           {canManage
//                             ? "Connect WhatsApp to send automated messages"
//                             : "WhatsApp needs to be connected to send messages"}
//                         </p>
//                       </div>
//                       {canManage && (
//                         <Button onClick={handleConnectWhatsApp} size="sm">
//                           <Smartphone className="h-4 w-4 mr-2" />
//                           Connect
//                         </Button>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {!isLoading && isConnected === true && (
//                 <Card className="border-green-200 bg-green-50">
//                   <CardContent className="p-4">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-3">
//                         <CheckCircle2 className="h-5 w-5 text-green-600" />
//                         <div>
//                           <p className="font-medium text-green-800 flex items-center gap-2">
//                             WhatsApp Connected
//                             {canManage && (
//                               <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
//                                 <Crown className="h-3 w-3" />
//                                 Admin
//                               </span>
//                             )}
//                           </p>
//                           <p className="text-sm text-green-700">
//                             {connectionInfo?.phoneNumber
//                               ? `Connected to ${connectionInfo.phoneNumber}`
//                               : "WhatsApp is connected and ready"}
//                             {connectionInfo?.profileName &&
//                               ` (${connectionInfo.profileName})`}
//                           </p>
//                         </div>
//                       </div>
//                       <div className="flex gap-2">
//                         <Button
//                           onClick={refreshConnection}
//                           variant="outline"
//                           size="sm"
//                           disabled={isLoading}
//                         >
//                           <Loader2
//                             className={`h-4 w-4 mr-1 ${
//                               isLoading ? "animate-spin" : ""
//                             }`}
//                           />
//                           Refresh
//                         </Button>
//                         {canManage && (
//                           <Button
//                             onClick={handleDisconnectWhatsApp}
//                             variant="outline"
//                             size="sm"
//                             className="text-red-600 border-red-200 hover:bg-red-50"
//                           >
//                             <LogOut className="h-4 w-4 mr-1" />
//                             Disconnect
//                           </Button>
//                         )}
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {/* Transaction Summary */}
//               <Card>
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-sm">Transaction Summary</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-3 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Customer:</span>
//                     <span className="font-medium">{party?.name || "N/A"}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Mobile:</span>
//                     <span className="font-medium">
//                       {party?.contactNumber || party?.phone || "N/A"}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Invoice:</span>
//                     <span>{invoiceNumber}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Date:</span>
//                     <span>{invoiceDate}</span>
//                   </div>
//                   <div className="flex justify-between items-center pt-2 border-t">
//                     <span className="text-muted-foreground">Amount:</span>
//                     <div className="text-right">
//                       <div className="font-bold text-lg">{formattedAmount}</div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* WhatsApp Form */}
//               <div className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="mobile">Mobile Number</Label>
//                   <div className="flex gap-2">
//                     <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">
//                       +91
//                     </div>
//                     <Input
//                       id="mobile"
//                       value={mobileNumber}
//                       onChange={(e) => setMobileNumber(e.target.value)}
//                       placeholder="Enter mobile number"
//                       className="flex-1 rounded-l-none"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="message">Message</Label>
//                   <Textarea
//                     id="message"
//                     value={messageContent}
//                     onChange={(e) => setMessageContent(e.target.value)}
//                     placeholder="Compose your WhatsApp message..."
//                     className="min-h-[300px] resize-vertical font-mono text-sm"
//                   />
//                 </div>

//                 <div className="flex items-center justify-between text-sm text-muted-foreground">
//                   <span>You can edit the message above as needed</span>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() =>
//                       setMessageContent(generateDefaultMessageContent())
//                     }
//                   >
//                     Reset to default
//                   </Button>
//                 </div>
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="border-t p-6 bg-muted/20">
//               <div className="flex gap-3">
//                 <Button variant="outline" onClick={onClose} className="flex-1">
//                   Cancel
//                 </Button>

//                 {isConnected ? (
//                   <Button
//                     onClick={handleSendOnWhatsApp}
//                     className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
//                     disabled={isSending}
//                   >
//                     {isSending ? (
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                     ) : (
//                       <MessageCircle className="h-4 w-4" />
//                     )}
//                     {isSending ? "Sending..." : "Send via WhatsApp"}
//                   </Button>
//                 ) : (
//                   <Button
//                     onClick={handleConnectWhatsApp}
//                     className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
//                     disabled={!canManage}
//                   >
//                     <Smartphone className="h-4 w-4" />
//                     {canManage ? "Connect WhatsApp" : "WhatsApp Not Connected"}
//                   </Button>
//                 )}
//               </div>

//               {isConnected && (
//                 <div className="mt-3 text-center">
//                   <p className="text-xs text-muted-foreground">
//                     💬 Messages will be sent automatically via WhatsApp
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <WhatsAppConnectionDialog
//         isOpen={showConnectionDialog}
//         onClose={() => setShowConnectionDialog(false)}
//         onConnected={handleConnected}
//       />
//     </>
//   );
// }



















import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  MessageCircle,
  X,
  Smartphone,
  CheckCircle2,
  LogOut,
  Users,
  Crown,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { WhatsAppConnectionDialog } from "./whatsapp-connection-dialog";
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";

interface WhatsAppComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  party: any;
  company: any;
}

export function WhatsAppComposerDialog({
  isOpen,
  onClose,
  transaction,
  party,
  company,
}: WhatsAppComposerDialogProps) {
  const [messageContent, setMessageContent] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const {
    isConnected,
    connectionInfo,
    isLoading,
    canManage,
    connectWhatsApp,
    disconnectWhatsApp,
    refreshConnection,
    sendMessage // ✅ ADDED: This is the function we need
  } = useWhatsAppConnection();

  // Initialize when dialog opens
  useEffect(() => {
    if (isOpen) {
      const partyMobile = party?.contactNumber || party?.phone || "";
      setMobileNumber(partyMobile);
      setMessageContent(generateDefaultMessageContent());
    }
  }, [isOpen, transaction, party, company]);

  const generateDefaultMessageContent = () => {
    const invoiceNumber =
      transaction.invoiceNumber || transaction.referenceNumber || "N/A";
    const invoiceDate = new Date(transaction.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const amount = transaction.totalAmount || transaction.amount || 0;
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `Dear ${party?.name || "Valued Customer"},

Please view the details of the transaction below.

Invoice No: ${invoiceNumber}
Invoice Date: ${invoiceDate}
Amount: ₹${formattedAmount}

Thank you for your business!

Best regards,
${company?.businessName || "Your Company"}`;
  };

  // ✅ FIXED: Use the correct sendMessage function
  const handleSendOnWhatsApp = async () => {
    if (!mobileNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Mobile number required",
        description: "Please enter a valid mobile number.",
      });
      return;
    }

    if (!messageContent.trim()) {
      toast({
        variant: "destructive",
        title: "Message required",
        description: "Please enter a message to share.",
      });
      return;
    }

    // ✅ REMOVED: Vendor ID check since we're using phone numbers directly
    // if (!party?._id) {
    //   toast({
    //     variant: "destructive",
    //     title: "Vendor ID required",
    //     description: "Cannot send message without vendor information.",
    //   });
    //   return;
    // }

    setIsSending(true);
    try {
      const result = await sendMessage({
        message: messageContent,
        phoneNumber: mobileNumber,
        partyName: party?.name,
        invoiceData: {
          partyName: party?.name,
          invoiceNumber: transaction.invoiceNumber || transaction.referenceNumber,
          amount: transaction.totalAmount || transaction.amount,
          dueDate: transaction.dueDate,
          gstAmount: transaction.taxAmount,
          totalAmount: transaction.totalAmount,
        },
        manualSend: false,
      });

      if (result.success) {
        // Success toast is handled in the hook
        // Optionally close the dialog after successful send
        // onClose();
      }
    } catch (error: any) {
      console.error("Error sending WhatsApp message:", error);
      // Show additional error toast if needed
      if (!error.message?.includes("WhatsApp is not connected")) {
        toast({
          variant: "destructive",
          title: "Send Failed",
          description: error.message || "Failed to send WhatsApp message",
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleConnectWhatsApp = () => {
    setShowConnectionDialog(true);
  };

  const handleConnected = async () => {
    try {
      await refreshConnection();
      setShowConnectionDialog(false);
      toast({
        title: "WhatsApp Connected!",
        description: "WhatsApp has been successfully connected.",
      });
    } catch (error) {
      console.error("Error after connection:", error);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    await disconnectWhatsApp();
  };

  if (!isOpen) return null;

  const invoiceNumber =
    transaction.invoiceNumber || transaction.referenceNumber || "N/A";
  const invoiceDate = new Date(transaction.date).toLocaleDateString();
  const amount = transaction.totalAmount || transaction.amount || 0;
  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold">Share on WhatsApp</h2>
                  <p className="text-sm text-muted-foreground">
                    {isConnected
                      ? "Send messages automatically"
                      : "Connect WhatsApp to send messages"}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Connection Status */}
              {isLoading && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-800">
                          Checking WhatsApp Connection...
                        </p>
                        <p className="text-sm text-blue-700">
                          Verifying WhatsApp connection status
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isLoading && isConnected === false && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-yellow-600" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-800">
                          WhatsApp Not Connected
                        </p>
                        <p className="text-sm text-yellow-700">
                          {canManage
                            ? "Connect WhatsApp to send automated messages"
                            : "WhatsApp needs to be connected to send messages"}
                        </p>
                      </div>
                      {canManage && (
                        <Button onClick={handleConnectWhatsApp} size="sm">
                          <Smartphone className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isLoading && isConnected === true && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 flex items-center gap-2">
                            WhatsApp Connected
                            {canManage && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                <Crown className="h-3 w-3" />
                                Admin
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-green-700">
                            {connectionInfo?.phoneNumber
                              ? `Connected to ${connectionInfo.phoneNumber}`
                              : "WhatsApp is connected and ready"}
                            {connectionInfo?.profileName &&
                              ` (${connectionInfo.profileName})`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={refreshConnection}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          <Loader2
                            className={`h-4 w-4 mr-1 ${
                              isLoading ? "animate-spin" : ""
                            }`}
                          />
                          Refresh
                        </Button>
                        {canManage && (
                          <Button
                            onClick={handleDisconnectWhatsApp}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4 mr-1" />
                            Disconnect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transaction Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Transaction Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{party?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mobile:</span>
                    <span className="font-medium">
                      {party?.contactNumber || party?.phone || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice:</span>
                    <span>{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{invoiceDate}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Amount:</span>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formattedAmount}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-sm">
                      +91
                    </div>
                    <Input
                      id="mobile"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="Enter mobile number"
                      className="flex-1 rounded-l-none"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Make sure this is a valid WhatsApp number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Compose your WhatsApp message..."
                    className="min-h-[300px] resize-vertical font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>You can edit the message above as needed</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setMessageContent(generateDefaultMessageContent())
                    }
                  >
                    Reset to default
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-6 bg-muted/20">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>

                {isConnected ? (
                  <Button
                    onClick={handleSendOnWhatsApp}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    disabled={isSending || !mobileNumber.trim()}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="h-4 w-4" />
                    )}
                    {isSending ? "Sending..." : "Send via WhatsApp"}
                  </Button>
                ) : (
                  <Button
                    onClick={handleConnectWhatsApp}
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                    disabled={!canManage}
                  >
                    <Smartphone className="h-4 w-4" />
                    {canManage ? "Connect WhatsApp" : "WhatsApp Not Connected"}
                  </Button>
                )}
              </div>

              {isConnected && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    💬 Messages will be sent automatically via WhatsApp
                  </p>
                </div>
              )}

              {!isConnected && canManage && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    🔗 Connect WhatsApp to enable automated messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <WhatsAppConnectionDialog
        isOpen={showConnectionDialog}
        onClose={() => setShowConnectionDialog(false)}
        onConnected={handleConnected}
      />
    </>
  );
}