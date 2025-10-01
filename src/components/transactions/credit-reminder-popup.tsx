
// // components/credit-reminder-popup.tsx - Updated version
// import React, { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Badge } from '@/components/ui/badge';
// import { Loader2, Mail, Calendar, Clock, IndianRupee, Edit } from 'lucide-react';
// import { useToast } from '@/components/ui/use-toast';
// import { EmailComposerDialog } from './email-composer-dialog';

// interface CreditReminderPopupProps {
//   isOpen: boolean;
//   onClose: () => void;
//   transaction: any;
//   party: any;
// }

// export function CreditReminderPopup({ isOpen, onClose, transaction, party }: CreditReminderPopupProps) {

//   console.log("party object from reminder component ", party)
//   const [showEmailComposer, setShowEmailComposer] = useState(false);
//   const { toast } = useToast();

//   if (!transaction || !party) return null;

//   // Calculate days since transaction
//   const transactionDate = new Date(transaction.date);
//   const currentDate = new Date();
//   const daysSinceTransaction = Math.floor((currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  
//   // Get pending balance
//   const pendingBalance = transaction.totalAmount || transaction.amount || 0;

//   // Get company info from transaction
//   const company = transaction.company || {};

//   const handleQuickSend = async () => {
//      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
//     // Quick send without editing - use default content
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch(`${baseURL}/api/sales/send-credit-reminder`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({
//           transactionId: transaction._id,
//           partyId: party._id,
//           daysOverdue: daysSinceTransaction,
//           pendingAmount: pendingBalance,
//           // Let backend generate default content
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Failed to send reminder');
//       }

//       toast({
//         title: 'Reminder Sent Successfully',
//         description: `Email sent to ${party.email}`,
//       });
//       onClose();
//     } catch (error) {
//       toast({
//         variant: 'destructive',
//         title: 'Failed to send reminder',
//         description: error instanceof Error ? error.message : 'Please try again later.',
//       });
//     }
//   };

//   return (
//     <>
//       <Dialog open={isOpen} onOpenChange={onClose}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <Clock className="h-5 w-5 text-orange-500" />
//               Credit Payment Reminder
//             </DialogTitle>
//           </DialogHeader>

//           <div className="space-y-4">
//             {/* Party Information */}
//             <Card>
//               <CardContent className="p-4">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h4 className="font-semibold">{party.name || party.vendorName}</h4>
//                     <p className="text-sm text-muted-foreground">
//                       {party.email || 'No email'}
//                     </p>
//                     <p className="text-xs text-muted-foreground">
//                       {party.contactNumber || 'No contact'}
//                     </p>
//                   </div>
//                   <Badge variant="outline" className="bg-orange-500/20 text-orange-700">
//                     Credit
//                   </Badge>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Transaction Details */}
//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm flex items-center gap-2">
//                   <Calendar className="h-4 w-4" />
//                   Transaction Details
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-2 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Invoice Date:</span>
//                   <span>{new Date(transaction.date).toLocaleDateString()}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Invoice No:</span>
//                   <span>{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-muted-foreground">Days Since:</span>
//                   <Badge variant={daysSinceTransaction > 30 ? "destructive" : "secondary"}>
//                     {daysSinceTransaction} days
//                   </Badge>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Payment Status */}
//             <Card>
//               <CardHeader className="pb-3">
//                 <CardTitle className="text-sm flex items-center gap-2">
//                   <IndianRupee className="h-4 w-4" />
//                   Payment Status
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="flex justify-between items-center">
//                   <span className="text-muted-foreground">Pending Amount:</span>
//                   <div className="text-right">
//                     <div className="font-bold text-lg">
//                       ₹{new Intl.NumberFormat('en-IN').format(pendingBalance)}
//                     </div>
//                     {daysSinceTransaction > 30 && (
//                       <div className="text-xs text-red-500 mt-1">
//                         Overdue by {daysSinceTransaction - 30} days
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Action Buttons */}
//             <div className="flex gap-2 pt-2">
//               <Button variant="outline" onClick={onClose} className="flex-1">
//                 Close
//               </Button>
//               <Button
//                 variant="outline"
//                 onClick={() => { onClose(); setShowEmailComposer(true); }}
//                 className="flex-1 gap-2"
//               >
//                 <Edit className="h-4 w-4" />
//                 Compose Email
//               </Button>
//               <Button 
//                 onClick={handleQuickSend}
//                 className="flex-1 gap-2"
//               >
//                 <Mail className="h-4 w-4" />
//                 Quick Send
//               </Button>
//             </div>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Email Composer Dialog */}
//       <EmailComposerDialog
//         isOpen={showEmailComposer}
//         onClose={() => setShowEmailComposer(false)}
//         transaction={transaction}
//         party={party}
//         company={company}
//         daysOverdue={daysSinceTransaction}
//         pendingAmount={pendingBalance}
//       />
//     </>
//   );
// }























import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Calendar, Clock, IndianRupee, Edit, Phone, User, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { EmailComposerDialog } from './email-composer-dialog';

interface CreditReminderPopupProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  party: any;
}

interface PartyDetails {
  _id: string;
  name: string;
  email?: string;
  contactNumber?: string;
  balance?: number;
}

export function CreditReminderPopup({ isOpen, onClose, transaction, party }: CreditReminderPopupProps) {
  console.log("party object from reminder component ", party);
  
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [partyDetails, setPartyDetails] = useState<PartyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch complete party details when popup opens
  useEffect(() => {
    const fetchPartyDetails = async () => {
      if (!isOpen || !party?._id) return;
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
        
        const response = await fetch(`${baseURL}/api/parties/${party._id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPartyDetails(data);
          console.log("Fetched party details:", data);
        } else {
          console.error('Failed to fetch party details');
          // Fallback to basic party info
          setPartyDetails(party);
        }
      } catch (error) {
        console.error('Error fetching party details:', error);
        // Fallback to basic party info
        setPartyDetails(party);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartyDetails();
  }, [isOpen, party]);

  if (!transaction || !party) return null;

  // Calculate days since transaction
  const transactionDate = new Date(transaction.date);
  const currentDate = new Date();
  const daysSinceTransaction = Math.floor((currentDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get pending balance for this specific transaction
  const pendingBalance = transaction.totalAmount || transaction.amount || 0;
  
  // Use detailed party info if available, otherwise fallback to basic
  const displayParty = partyDetails || party;
  const totalCustomerBalance = displayParty.balance || 0;

  // Get company info from transaction
  const company = transaction.company || {};

  // const handleQuickSend = async () => {
  //   if (!displayParty.email) {
  //     toast({
  //       variant: 'destructive',
  //       title: 'Cannot Send Email',
  //       description: 'No email address found for this customer.',
  //     });
  //     return;
  //   }

  //   const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
    
  //   try {
  //     const token = localStorage.getItem('token');
  //     const response = await fetch(`${baseURL}/api/sales/send-credit-reminder`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         transactionId: transaction._id,
  //         partyId: party._id,
  //         daysOverdue: daysSinceTransaction,
  //         pendingAmount: pendingBalance,
  //       }),
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       throw new Error(data.message || 'Failed to send reminder');
  //     }

  //     toast({
  //       title: 'Reminder Sent Successfully',
  //       description: `Email sent to ${displayParty.email}`,
  //     });
  //     onClose();
  //   } catch (error) {
  //     toast({
  //       variant: 'destructive',
  //       title: 'Failed to send reminder',
  //       description: error instanceof Error ? error.message : 'Please try again later.',
  //     });
  //   }
  // };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Credit Payment Reminder
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer Information */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-semibold text-base">{displayParty.name}</h4>
                        {isLoading && (
                          <div className="text-xs text-blue-500 mt-1">
                            Loading details...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading customer details...
                      </div>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className={displayParty.email ? "text-foreground font-medium" : "text-muted-foreground"}>
                            {displayParty.email || 'No email address available'}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className={displayParty.contactNumber ? "text-foreground font-medium" : "text-muted-foreground"}>
                            {displayParty.contactNumber || 'No contact number available'}
                          </span>
                        </div>

                        {/* Total Customer Balance */}
                        {/* <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-200">
                          <Wallet className="h-4 w-4 text-blue-500" />
                          <div>
                            <span className="font-semibold text-blue-600">
                              Total Customer Balance: 
                            </span>
                            <span className="font-bold text-blue-700 ml-2">
                              ₹{new Intl.NumberFormat('en-IN').format(totalCustomerBalance)}
                            </span>
                          </div>
                        </div> */}
                      </div>
                    )}
                  </div>
                  
                  <Badge variant="outline" className="bg-orange-500/20 text-orange-700 whitespace-nowrap">
                    Credit
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span>{new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice No:</span>
                  <span>{transaction.invoiceNumber || transaction.referenceNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days Since:</span>
                  <Badge variant={daysSinceTransaction > 30 ? "destructive" : "secondary"}>
                    {daysSinceTransaction} days
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status for This Invoice */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  This Invoice Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pending Amount:</span>
                  <div className="text-right">
                    <div className="font-bold text-lg text-red-600">
                      ₹{new Intl.NumberFormat('en-IN').format(totalCustomerBalance)}
                    </div>
                    {daysSinceTransaction > 30 && (
                      <div className="text-xs text-red-500 mt-1">
                        Overdue by {daysSinceTransaction - 30} days
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Close
              </Button>
              
              <Button
                variant="outline"
                onClick={() => { onClose(); setShowEmailComposer(true); }}
                className="flex-1 gap-2"
                disabled={!displayParty.email || isLoading}
              >
                <Edit className="h-4 w-4" />
                Compose Email
              </Button>
              
              {/* <Button 
                onClick={handleQuickSend}
                className="flex-1 gap-2"
                disabled={!displayParty.email || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Quick Send
              </Button> */}
            </div>

            {!displayParty.email && !isLoading && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                <p>⚠️ This customer doesn't have an email address. Please add an email to send payment reminders.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Composer Dialog */}
      {displayParty.email && (
        <EmailComposerDialog
          isOpen={showEmailComposer}
          onClose={() => setShowEmailComposer(false)}
          transaction={transaction}
          party={displayParty}
          company={company}
          daysOverdue={daysSinceTransaction}
          pendingAmount={pendingBalance}
          totalCustomerBalance={totalCustomerBalance}
        />
      )}
    </>
  );
}