import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, ArrowUpRight, TrendingUp, Download, Calendar } from 'lucide-react';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const kpiData = [
  { 
    title: 'Total Revenue', 
    value: '$259,000', 
    change: '+15.3% from last period', 
    icon: DollarSign,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500'
  },
  { 
    title: 'Active Clients', 
    value: '2', 
    change: '+8.7% from last period', 
    icon: Users,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500'
  },
  { 
    title: 'Growth Rate', 
    value: '12.5%', 
    change: '+2.1% from last period', 
    icon: TrendingUp,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500'
  },
  { 
    title: 'Avg. Revenue', 
    value: '$86,333', 
    change: '+5.2% from last period', 
    icon: Calendar,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500'
  },
];

export default function AnalyticsDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className='flex items-center gap-2'>
            <Select defaultValue='7'>
                <SelectTrigger className='w-[120px]'>
                    <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline">
                <Download className='mr-2' />
                Export
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title} className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className='space-y-2'>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-3xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">
                        <span className={kpi.change.startsWith('+') ? "text-green-400" : "text-red-400"}>{kpi.change}</span>
                    </p>
                </div>
                <div className={`p-3 rounded-full ${kpi.iconBg}`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-1">Revenue Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">Monthly revenue and growth patterns</p>
            <div className='h-[350px] w-full'>
                <RevenueChart />
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
