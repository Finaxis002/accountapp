import { kpiData, transactions } from '@/lib/data';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ExpenseChart } from '@/components/dashboard/expense-chart';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <KpiCard key={kpi.title} kpi={kpi} />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>A look at your spending by category this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseChart />
          </CardContent>
        </Card>
      </div>
      <RecentTransactions transactions={transactions.slice(0, 5)} />
    </div>
  );
}
