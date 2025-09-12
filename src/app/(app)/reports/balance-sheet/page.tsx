import { balanceSheetData } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Clock, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR' }).format(amount);

export default function BalanceSheetPage() {
  const totalLiabilitiesAndEquity = balanceSheetData.liabilities.total + balanceSheetData.equity.total;

  // Coming Soon Banner Component
function ComingSoonBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 p-6 border border-border shadow-sm mb-6">
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-4 p-3 bg-primary/10 rounded-full">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Advanced Analytics Coming Soon
        </h3>
        
        {/* Description */}
        <p className="text-muted-foreground max-w-md mb-4">
          We're enhancing your balance sheet with interactive charts, 
          historical comparisons, and detailed financial insights.
        </p>
        
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          <Clock className="h-3.5 w-3.5" />
           Coming Soon
        </div>
      </div>
    </div>
  );
}

  return (
    <>
 <div className="flex align-middle justify-center items-center h-full">
     <ComingSoonBanner />
 </div>
    {/* <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Balance Sheet</h2>
          <p className="text-muted-foreground">
            As of July 31, 2024
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader>
            <CardTitle>Statement of Financial Position</CardTitle>
            <CardDescription>A snapshot of the company's financial health.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Assets</h3>
                    <Table>
                        <TableBody>
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Current Assets</TableCell></TableRow>
                            {balanceSheetData.assets.current.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                             <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Non-Current Assets</TableCell></TableRow>
                            {balanceSheetData.assets.nonCurrent.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Liabilities &amp; Equity</h3>
                    <Table>
                        <TableBody>
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Current Liabilities</TableCell></TableRow>
                            {balanceSheetData.liabilities.current.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Non-Current Liabilities</TableCell></TableRow>
                            {balanceSheetData.liabilities.nonCurrent.map(item => (
                                <TableRow key={item.name}><TableCell className="pl-8">{item.name}</TableCell><TableCell className="text-right">{formatCurrency(item.amount)}</TableCell></TableRow>
                            ))}
                            <TableRow className="font-medium bg-secondary/50"><TableCell colSpan={2}>Equity</TableCell></TableRow>
                            <TableRow><TableCell className="pl-8">Retained Earnings</TableCell><TableCell className="text-right">{formatCurrency(balanceSheetData.equity.retainedEarnings)}</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CardContent>
        <CardFooter className="p-6 mt-4">
             <div className="w-full space-y-2">
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total Assets</span>
                    <span>{formatCurrency(balanceSheetData.assets.total)}</span>
                </div>
                 <div className="flex justify-between font-bold text-lg">
                    <span>Total Liabilities &amp; Equity</span>
                    <span>{formatCurrency(totalLiabilitiesAndEquity)}</span>
                </div>
                <Separator />
            </div>
        </CardFooter>
      </Card>
    </div> */}
        </>
  );
}
