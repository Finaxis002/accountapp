import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ClientStatusChart } from '@/components/dashboard/client-status-chart';
import { Users, Building, DollarSign, ArrowUpRight } from 'lucide-react';

const kpiData = [
  { 
    title: 'Total Clients', 
    value: '3', 
    change: '+2 this month', 
    icon: Users,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500'
  },
  { 
    title: 'Active Clients', 
    value: '2', 
    change: '+1 this week', 
    icon: Building,
    iconBg: 'bg-green-500/20',
    iconColor: 'text-green-500'
  },
  { 
    title: 'Total Revenue', 
    value: '$259,000', 
    change: '+15.3%', 
    icon: DollarSign,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-500'
  },
  { 
    title: 'Monthly Growth', 
    value: '12.5%', 
    change: '+2.1%', 
    icon: ArrowUpRight,
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-500'
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Master Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your accounting software platform
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className='space-y-2'>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-3xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">
                        <span className={kpi.change.startsWith('+') ? "text-green-500" : "text-red-500"}>{kpi.change}</span>
                    </p>
                </div>
                <div className={`p-2 rounded-md ${kpi.iconBg}`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Client Status</CardTitle>
            <CardDescription>Active vs inactive clients</CardDescription>
          </CardHeader>
          <CardContent>
            <ClientStatusChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
