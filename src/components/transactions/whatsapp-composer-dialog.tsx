// components/whatsapp-composer-dialog.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, X, Calendar, IndianRupee, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  company 
}: WhatsAppComposerDialogProps) {
  const [isSending, setIsSending] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const { toast } = useToast();

  // Initialize message content when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      // Set mobile number from party data
      const partyMobile = party?.contactNumber || party?.phone || '';
      setMobileNumber(partyMobile);
      
      // Generate default message content
      const defaultContent = generateDefaultMessageContent();
      setMessageContent(defaultContent);
    }
  }, [isOpen, transaction, party, company]);

  const generateDefaultMessageContent = () => {
    const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
    const invoiceDate = new Date(transaction.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const amount = transaction.totalAmount || transaction.amount || 0;
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    
    return `Dear ${party?.name || 'Valued Customer'},

Please view the details of the transaction below.

Invoice No: ${invoiceNumber}
Invoice Date: ${invoiceDate}
Amount: ${formattedAmount}

Thank you for your business!

Best regards,
${company?.businessName || 'Your Company'}`;
  };

  const handleShareOnWhatsApp = () => {
    if (!mobileNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Mobile number required',
        description: 'Please enter a valid mobile number.',
      });
      return;
    }

    if (!messageContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Message required',
        description: 'Please enter a message to share.',
      });
      return;
    }

    // Format mobile number (remove any non-digit characters)
    const formattedNumber = mobileNumber.replace(/\D/g, '');
    
    // Ensure the number has country code
    let finalNumber = formattedNumber;
    if (!formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      finalNumber = `91${formattedNumber}`;
    }

    // Validate phone number
    if (finalNumber.length < 10) {
      toast({
        variant: 'destructive',
        title: 'Invalid Contact Number',
        description: 'Please check the mobile number format.',
      });
      return;
    }

    // Create WhatsApp Web URL
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${finalNumber}&text=${encodeURIComponent(messageContent)}`;
    
    // Open WhatsApp Web in a new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    
    toast({
      title: 'WhatsApp Opened',
      description: 'WhatsApp Web has been opened in a new tab.',
    });
  };

  const handleSendMessage = async () => {
    if (!mobileNumber.trim() || !messageContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide both mobile number and message content.',
      });
      return;
    }

    setIsSending(true);
    try {
      const baseURL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8745';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${baseURL}/api/sales/send-whatsapp-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId: transaction._id,
          partyId: party._id,
          mobileNumber: mobileNumber,
          messageContent: messageContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send WhatsApp message');
      }

      toast({
        title: 'Message Sent Successfully',
        description: `WhatsApp message sent to ${mobileNumber}`,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const invoiceNumber = transaction.invoiceNumber || transaction.referenceNumber || 'N/A';
  const invoiceDate = new Date(transaction.date).toLocaleDateString();
  const amount = transaction.totalAmount || transaction.amount || 0;
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-xl transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <div>
                <h2 className="text-xl font-semibold">Share on WhatsApp</h2>
                <p className="text-sm text-muted-foreground">
                  Send transaction details via WhatsApp
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Transaction Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-medium">{party?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile:</span>
                  <span className="font-medium">{party?.contactNumber || party?.phone || 'N/A'}</span>
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
                    <div className="font-bold text-lg">
                      {formattedAmount}
                    </div>
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
                  Make sure this number is registered on WhatsApp
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
                  onClick={() => setMessageContent(generateDefaultMessageContent())}
                >
                  Reset to default
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-muted/20">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareOnWhatsApp}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                disabled={isSending}
              >
                <ExternalLink className="h-4 w-4" />
                Open WhatsApp Web
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isSending}
                className="flex-1 gap-2"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Send via API
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}