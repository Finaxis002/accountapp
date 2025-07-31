import { plStatement } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function ProfitLossPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profit & Loss Statement</h2>
          <p className="text-muted-foreground">
            For the period ending July 31, 2024
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
      
      <Card className="w-full">
        <CardHeader>
            <CardTitle>Income Statement</CardTitle>
            <CardDescription>Summary of financial performance.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[70%]">Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow className="font-semibold bg-secondary/50">
                        <TableCell>Revenue</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                    {plStatement.revenue.map(item => (
                        <TableRow key={item.name}>
                            <TableCell className="pl-8">{item.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="font-medium">
                        <TableCell className="pl-8">Total Revenue</TableCell>
                        <TableCell className="text-right">{formatCurrency(plStatement.totalRevenue)}</TableCell>
                    </TableRow>

                    <TableRow className="font-semibold bg-secondary/50">
                        <TableCell>Expenses</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                    {plStatement.expenses.map(item => (
                        <TableRow key={item.name}>
                            <TableCell className="pl-8">{item.name}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                    ))}
                    <TableRow className="font-medium">
                        <TableCell className="pl-8">Total Expenses</TableCell>
                        <TableCell className="text-right">{formatCurrency(plStatement.totalExpenses)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="flex justify-end p-6">
            <div className="w-full max-w-sm space-y-2">
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                    <span>Net Income</span>
                    <span>{formatCurrency(plStatement.netIncome)}</span>
                </div>
                <Separator />
            </div>
        </CardFooter>
      </Card>
    </div>
  );
}
