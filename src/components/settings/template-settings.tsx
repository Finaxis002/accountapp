// // @/components/settings/template-settings.tsx
// "use client";

// import * as React from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Save, Loader2, Eye, Check } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { Badge } from "@/components/ui/badge";

// const templateOptions = [
//   { value: "template1", label: "Professional", color: "bg-blue-500" },
//   { value: "template2", label: "Creative", color: "bg-purple-500" },
//   { value: "template3", label: "Modern", color: "bg-gray-800" },
//   { value: "template4", label: "Minimal", color: "bg-green-500" },
//   { value: "template5", label: "Refined", color: "bg-amber-600" },
//   { value: "template6", label: "Standard", color: "bg-indigo-600" },
//   // { value: "template7", label: "Prestige" },
// ];

// export function TemplateSettings() {
//   const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
//   const [selectedTemplate, setSelectedTemplate] = React.useState("");
//   const [isLoading, setIsLoading] = React.useState(false);
//   const [isSaving, setIsSaving] = React.useState(false);
//   const { toast } = useToast();

//   // Load current template setting
//   React.useEffect(() => {
//     const loadTemplateSetting = async () => {
//       setIsLoading(true);
//       try {
//         const response = await fetch(`${baseURL}/api/settings/default-template`);
//         if (response.ok) {
//           const data = await response.json();
//           setSelectedTemplate(data.defaultTemplate || "template1");
//         }
//       } catch (error) {
//         console.error("Failed to load template setting:", error);
//         toast({
//           title: "Error",
//           description: "Failed to load template settings",
//           variant: "destructive",
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadTemplateSetting();
//   }, [toast]);

//   const handleSave = async () => {
//     setIsSaving(true);
//     try {
//       const token = localStorage.getItem("token");
//       const response = await fetch(`${baseURL}/api/settings/default-template`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ defaultTemplate: selectedTemplate }),
//       });

//       if (response.ok) {
//         toast({
//           title: "Success",
//           description: "Default template updated successfully",
//         });
//       } else {
//         throw new Error("Failed to save template");
//       }
//     } catch (error) {
//       console.error("Failed to save template:", error);
//       toast({
//         title: "Error",
//         description: "Failed to save template setting",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const getCurrentTemplate = () => {
//     return templateOptions.find(template => template.value === selectedTemplate) || templateOptions[0];
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-32">
//         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
//       </div>
//     );
//   }

//   const currentTemplate = getCurrentTemplate();

//   return (
//     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Default Template</CardTitle>
//           <CardDescription>
//             Choose your preferred invoice template
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="space-y-2">
//             <Label htmlFor="template">Default Invoice Template</Label>
//             <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
//               <SelectTrigger id="template" className="w-full">
//                 <SelectValue placeholder="Select a template" />
//               </SelectTrigger>
//               <SelectContent>
//                 {templateOptions.map((template) => (
//                   <SelectItem key={template.value} value={template.value}>
//                     {template.label}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <Button onClick={handleSave} disabled={isSaving} className="w-full">
//             {isSaving ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <Save className="mr-2 h-4 w-4" />
//                 Save Template
//               </>
//             )}
//           </Button>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Eye className="h-5 w-5" />
//             Current Template Preview
//           </CardTitle>
//           <CardDescription>
//             This is how your invoices will appear to clients
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className={`w-10 h-10 rounded-md ${currentTemplate.color} flex items-center justify-center`}>
//                 <span className="text-white font-bold text-xs">INV</span>
//               </div>
//               <div>
//                 <h3 className="font-semibold">{currentTemplate.label}</h3>
//                 <p className="text-sm text-muted-foreground">
//                   Selected as default
//                 </p>
//               </div>
//             </div>
//             <Badge variant="outline" className="flex items-center gap-1">
//               <Check className="h-3 w-3" />
//               Active
//             </Badge>
//           </div>

//           <div className="border rounded-lg p-4 mt-4 bg-muted/30">
//             <div className="flex justify-between items-start mb-4">
//               <div>
//                 <div className="h-4 bg-muted rounded w-24 mb-2"></div>
//                 <div className="h-3 bg-muted rounded w-32"></div>
//               </div>
//               <div className="text-right">
//                 <div className="h-6 bg-muted rounded w-16 mb-1 mx-auto"></div>
//                 <div className="h-3 bg-muted rounded w-20"></div>
//               </div>
//             </div>
            
//             <div className="grid grid-cols-4 gap-2 mb-4">
//               <div className="h-3 bg-muted rounded"></div>
//               <div className="h-3 bg-muted rounded col-span-2"></div>
//               <div className="h-3 bg-muted rounded"></div>
//             </div>
            
//             <div className="space-y-2">
//               <div className="grid grid-cols-4 gap-2">
//                 <div className="h-3 bg-muted rounded"></div>
//                 <div className="h-3 bg-muted rounded col-span-2"></div>
//                 <div className="h-3 bg-muted rounded"></div>
//               </div>
//               <div className="grid grid-cols-4 gap-2">
//                 <div className="h-3 bg-muted rounded"></div>
//                 <div className="h-3 bg-muted rounded col-span-2"></div>
//                 <div className="h-3 bg-muted rounded"></div>
//               </div>
//             </div>
            
//             <div className="border-t mt-4 pt-4 flex justify-between">
//               <div className="h-4 bg-muted rounded w-16"></div>
//               <div className="h-4 bg-muted rounded w-20"></div>
//             </div>
//           </div>

//           <div className="text-sm text-muted-foreground">
//             <p>This is a simplified preview. The actual template includes your company details, client information, and invoice items.</p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }









// @/components/settings/template-settings.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Eye, Check, Building, User, FileText, Calendar, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generatePdfForTemplate1, generatePdfForTemplate2, generatePdfForTemplate3, generatePdfForTemplate4, generatePdfForTemplate5, generatePdfForTemplate6 } from "@/lib/pdf-templates";

const templateOptions = [
  { value: "template1", label: "Professional", color: "bg-blue-500", generate: generatePdfForTemplate1 },
  { value: "template2", label: "Creative", color: "bg-purple-500", generate: generatePdfForTemplate2 },
  { value: "template3", label: "Modern", color: "bg-gray-800", generate: generatePdfForTemplate3 },
  { value: "template4", label: "Minimal", color: "bg-green-500", generate: generatePdfForTemplate4 },
  { value: "template5", label: "Refined", color: "bg-amber-600", generate: generatePdfForTemplate5 },
  { value: "template6", label: "Standard", color: "bg-indigo-600", generate: generatePdfForTemplate6 },
];

// Dummy data for preview
const dummyCompany = {
  businessName: "Your Company Inc.",
  gstin: "GSTIN123456789",
};

const dummyParty = {
  name: "Client Name",
  address: "123 Client Street",
  city: "Client City",
  state: "Client State",
};

const dummyTransaction = {
  date: new Date().toISOString(),
  invoiceNumber: "INV-2023-001",
  items: [
    { id: "1", name: "Web Development", quantity: 1, price: 1200, taxRate: 18 },
    { id: "2", name: "UI/UX Design", quantity: 1, price: 800, taxRate: 18 },
    { id: "3", name: "Consultation", quantity: 2, price: 100, taxRate: 18 },
  ]
};

const dummyServiceNames = new Map([
  ["1", "Web Development"],
  ["2", "UI/UX Design"],
  ["3", "Consultation"],
]);

export function TemplateSettings() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  // Load current template setting
  React.useEffect(() => {
    const loadTemplateSetting = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${baseURL}/api/settings/default-template`);
        if (response.ok) {
          const data = await response.json();
          setSelectedTemplate(data.defaultTemplate || "template1");
        }
      } catch (error) {
        console.error("Failed to load template setting:", error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateSetting();
  }, [toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${baseURL}/api/settings/default-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ defaultTemplate: selectedTemplate }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Default template updated successfully",
        });
      } else {
        throw new Error("Failed to save template");
      }
    } catch (error) {
      console.error("Failed to save template:", error);
      toast({
        title: "Error",
        description: "Failed to save template setting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentTemplate = () => {
    return templateOptions.find(template => template.value === selectedTemplate) || templateOptions[0];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentTemplate = getCurrentTemplate();

  // Render different preview based on selected template
  const renderTemplatePreview = () => {
    switch(currentTemplate.value) {
      case "template1":
        return <Template1Preview />;
      case "template2":
        return <Template2Preview />;
      case "template3":
        return <Template3Preview />;
      case "template4":
        return <Template4Preview />;
      case "template5":
        return <Template5Preview />;
      case "template6":
        return <Template6Preview />;
      default:
        return <Template1Preview />;
    }
  };

  // Template-specific preview components
  const Template1Preview = () => (
    <div className="border rounded-lg p-6 mt-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded ${currentTemplate.color} mt-1`}>
            <Building className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{dummyCompany.businessName}</h2>
            <p className="text-sm text-muted-foreground">GSTIN: {dummyCompany.gstin}</p>
          </div>
        </div>
        
        <div className="text-right">
          <h1 className="font-bold text-xl mb-1 text-blue-600">INVOICE</h1>
          <div className="flex items-center gap-2 justify-end text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(dummyTransaction.date).toLocaleDateString()}
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4" />
            <span className="font-medium">Invoice No:</span>
            <span>{dummyTransaction.invoiceNumber}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2 justify-end">
            <User className="h-4 w-4" />
            <span className="font-medium">Bill To:</span>
          </div>
          <p className="font-medium">{dummyParty.name}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.address}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.city}, {dummyParty.state}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-7 gap-2 py-2 px-3 bg-blue-50 rounded-t-md">
          <div className="font-medium text-sm">S.No.</div>
          <div className="font-medium text-sm col-span-2">DESCRIPTION</div>
          <div className="font-medium text-sm">QTY</div>
          <div className="font-medium text-sm">PRICE</div>
          <div className="font-medium text-sm">GST %</div>
          <div className="font-medium text-sm text-right">TOTAL</div>
        </div>
        
        {dummyTransaction.items.map((item, index) => (
          <div key={item.id} className="grid grid-cols-7 gap-2 py-2 px-3 border-b">
            <div className="text-sm">{index + 1}.</div>
            <div className="text-sm col-span-2">{item.name}</div>
            <div className="text-sm">{item.quantity}</div>
            <div className="text-sm">${item.price}</div>
            <div className="text-sm">{item.taxRate}%</div>
            <div className="text-sm text-right">${(item.price * item.quantity * (1 + item.taxRate/100)).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span className="text-sm">Sub Total:</span>
            <span className="text-sm">$2100.00</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-sm">GST Total:</span>
            <span className="text-sm">$396.00</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between py-1 font-bold">
            <span>GRAND TOTAL:</span>
            <span>$2496.00</span>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
        <div>
          <div className="font-medium mb-1">Payment Method</div>
          <p>Please make payments to the provided account.</p>
        </div>
        <div className="text-right">
          <div className="font-medium mb-1">Terms and Conditions</div>
          <p>Payment is due within 30 days.</p>
        </div>
      </div>
    </div>
  );

  const Template2Preview = () => (
    <div className="border rounded-lg p-6 mt-4 bg-white shadow-sm">
      <div className="text-center mb-6">
        <h1 className="font-bold text-2xl text-purple-600 mb-2">INVOICE</h1>
        <div className="flex justify-center items-center gap-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            <span>{dummyTransaction.invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(dummyTransaction.date).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2 text-purple-700">FROM</h3>
          <p className="font-medium">{dummyCompany.businessName}</p>
          <p className="text-sm text-muted-foreground">GSTIN: {dummyCompany.gstin}</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2 text-purple-700">TO</h3>
          <p className="font-medium">{dummyParty.name}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.address}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.city}, {dummyParty.state}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-5 gap-2 py-2 px-3 bg-purple-50 rounded-t-md">
          <div className="font-medium text-sm">ITEM</div>
          <div className="font-medium text-sm">QTY</div>
          <div className="font-medium text-sm">PRICE</div>
          <div className="font-medium text-sm">TAX</div>
          <div className="font-medium text-sm text-right">TOTAL</div>
        </div>
        
        {dummyTransaction.items.map((item) => (
          <div key={item.id} className="grid grid-cols-5 gap-2 py-2 px-3 border-b">
            <div className="text-sm">{item.name}</div>
            <div className="text-sm">{item.quantity}</div>
            <div className="text-sm">${item.price}</div>
            <div className="text-sm">{item.taxRate}%</div>
            <div className="text-sm text-right">${(item.price * item.quantity * (1 + item.taxRate/100)).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span className="text-sm">Subtotal:</span>
            <span className="text-sm">$2100.00</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-sm">Tax:</span>
            <span className="text-sm">$396.00</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between py-1 font-bold text-lg text-purple-700">
            <span>Total:</span>
            <span>$2496.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Template3Preview = () => (
    <div className="border rounded-lg p-6 mt-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="font-bold text-xl">{dummyCompany.businessName}</h2>
          <p className="text-sm text-muted-foreground">GSTIN: {dummyCompany.gstin}</p>
        </div>
        
        <div className="text-right">
          <h1 className="font-bold text-2xl mb-1">INVOICE</h1>
          <p className="text-sm text-muted-foreground">{dummyTransaction.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground">{new Date(dummyTransaction.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-2 text-gray-700 uppercase text-xs">BILL TO</h3>
          <p className="font-medium">{dummyParty.name}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.address}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.city}, {dummyParty.state}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 py-3 px-4 bg-gray-100 rounded-t-md">
          <div className="font-medium text-sm">DESCRIPTION</div>
          <div className="font-medium text-sm text-right">QTY</div>
          <div className="font-medium text-sm text-right">PRICE</div>
          <div className="font-medium text-sm text-right">AMOUNT</div>
        </div>
        
        {dummyTransaction.items.map((item) => (
          <div key={item.id} className="grid grid-cols-4 gap-2 py-3 px-4 border-b">
            <div className="text-sm">{item.name}</div>
            <div className="text-sm text-right">{item.quantity}</div>
            <div className="text-sm text-right">${item.price.toFixed(2)}</div>
            <div className="text-sm text-right">${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span className="text-sm">Subtotal:</span>
            <span className="text-sm">$2100.00</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm">Tax ({dummyTransaction.items[0].taxRate}%):</span>
            <span className="text-sm">$396.00</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>Total:</span>
            <span>$2496.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Template4Preview = () => (
    <div className="border rounded-lg p-6 mt-4 bg-white shadow-sm">
      <div className="text-center mb-8">
        <h1 className="font-bold text-xl mb-2">INVOICE</h1>
        <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
          <span>{dummyTransaction.invoiceNumber}</span>
          <span>•</span>
          <span>{new Date(dummyTransaction.date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold mb-2 text-green-700">FROM</h3>
          <p>{dummyCompany.businessName}</p>
          <p className="text-sm text-muted-foreground">GSTIN: {dummyCompany.gstin}</p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2 text-green-700">TO</h3>
          <p>{dummyParty.name}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.address}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.city}, {dummyParty.state}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="py-2 px-3 border-b font-medium">
          <div className="grid grid-cols-3 gap-2">
            <div>DESCRIPTION</div>
            <div className="text-right">QTY × PRICE</div>
            <div className="text-right">TOTAL</div>
          </div>
        </div>
        
        {dummyTransaction.items.map((item) => (
          <div key={item.id} className="py-3 px-3 border-b">
            <div className="grid grid-cols-3 gap-2">
              <div>{item.name}</div>
              <div className="text-right">{item.quantity} × ${item.price.toFixed(2)}</div>
              <div className="text-right">${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div className="text-right text-sm text-muted-foreground mt-1">
              Includes {item.taxRate}% tax: ${(item.price * item.quantity * item.taxRate/100).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Total:</span>
            <span className="font-bold text-green-700">$2496.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Template5Preview = () => (
    <div className="border rounded-lg p-6 mt-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="font-bold text-xl">{dummyCompany.businessName}</h2>
          <p className="text-sm text-muted-foreground">GSTIN: {dummyCompany.gstin}</p>
        </div>
        
        <div className="text-right">
          <h1 className="font-bold text-xl mb-1 text-amber-600">INVOICE</h1>
          <p className="text-sm">{dummyTransaction.invoiceNumber}</p>
          <p className="text-sm">{new Date(dummyTransaction.date).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-4">
          <h3 className="font-semibold mb-2 text-amber-700">BILL TO</h3>
          <p>{dummyParty.name}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.address}</p>
          <p className="text-sm text-muted-foreground">{dummyParty.city}, {dummyParty.state}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 py-3 px-4 bg-amber-50 rounded-md">
          <div className="font-medium text-sm">ITEM</div>
          <div className="font-medium text-sm text-right">QUANTITY</div>
          <div className="font-medium text-sm text-right">UNIT PRICE</div>
          <div className="font-medium text-sm text-right">TOTAL</div>
        </div>
        
        {dummyTransaction.items.map((item) => (
          <div key={item.id} className="grid grid-cols-4 gap-2 py-3 px-4 border-b">
            <div className="text-sm">{item.name}</div>
            <div className="text-sm text-right">{item.quantity}</div>
            <div className="text-sm text-right">${item.price.toFixed(2)}</div>
            <div className="text-sm text-right">${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>$2100.00</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Tax:</span>
            <span>$396.00</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between py-2 font-bold text-lg">
            <span>Total Due:</span>
            <span className="text-amber-700">$2496.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  const Template6Preview = () => (
    <div className="border rounded-lg p-6 mt-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="font-bold text-lg">{dummyCompany.businessName}</h2>
          <p className="text-xs text-muted-foreground">GSTIN: {dummyCompany.gstin}</p>
        </div>
        
        <div className="text-right">
          <h1 className="font-bold text-lg mb-1 text-indigo-600">INVOICE</h1>
          <p className="text-xs">{dummyTransaction.invoiceNumber}</p>
          <p className="text-xs">{new Date(dummyTransaction.date).toLocaleDateString()}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="font-semibold mb-1 text-indigo-700 text-sm">BILL TO</h3>
          <p className="text-sm">{dummyParty.name}</p>
          <p className="text-xs text-muted-foreground">{dummyParty.address}</p>
          <p className="text-xs text-muted-foreground">{dummyParty.city}, {dummyParty.state}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-indigo-50 rounded-t-md text-xs">
          <div className="font-medium">DESCRIPTION</div>
          <div className="font-medium text-right">QTY</div>
          <div className="font-medium text-right">PRICE</div>
          <div className="font-medium text-right">AMOUNT</div>
        </div>
        
        {dummyTransaction.items.map((item) => (
          <div key={item.id} className="grid grid-cols-4 gap-2 py-2 px-3 border-b text-xs">
            <div>{item.name}</div>
            <div className="text-right">{item.quantity}</div>
            <div className="text-right">${item.price.toFixed(2)}</div>
            <div className="text-right">${(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <div className="w-56">
          <div className="flex justify-between py-1 text-xs">
            <span>Subtotal:</span>
            <span>$2100.00</span>
          </div>
          <div className="flex justify-between py-1 text-xs">
            <span>Tax:</span>
            <span>$396.00</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between py-1 font-bold">
            <span>Total:</span>
            <span className="text-indigo-600">$2496.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Template</CardTitle>
          <CardDescription>
            Choose your preferred invoice template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template">Default Invoice Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger id="template" className="w-full">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map((template) => (
                  <SelectItem key={template.value} value={template.value}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Current Template Preview
          </CardTitle>
          <CardDescription>
            This is how your invoices will appear to clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md ${currentTemplate.color} flex items-center justify-center`}>
                <span className="text-white font-bold text-xs">INV</span>
              </div>
              <div>
                <h3 className="font-semibold">{currentTemplate.label}</h3>
                <p className="text-sm text-muted-foreground">
                  Selected as default
                </p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Active
            </Badge>
          </div>

          {renderTemplatePreview()}

          <div className="text-sm text-muted-foreground">
            <p>This preview shows how your invoices will look with the <strong>{currentTemplate.label}</strong> template.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}












