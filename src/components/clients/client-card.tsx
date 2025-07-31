
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Client } from "@/lib/types"
import { Eye, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientCardProps {
  client: Client
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
const formatDate = (date: Date) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date);

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-4">
        <div>
          <h3 className="font-bold text-lg">{client.companyName}</h3>
          <p className="text-sm text-muted-foreground">{client.email}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="text-muted-foreground">Status</div>
        <div className="text-right">
            <Badge 
                className={cn("text-xs",
                    client.status === 'Active' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                )}
            >
                {client.status}
            </Badge>
        </div>
        
        <div className="text-muted-foreground">Plan</div>
        <div className="text-right">
             <Badge 
                className={cn("text-xs font-semibold border",
                    client.subscriptionPlan === 'Premium' && 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    client.subscriptionPlan === 'Standard' && 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    client.subscriptionPlan === 'Basic' && 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                )}
            >
                {client.subscriptionPlan}
            </Badge>
        </div>

        <div className="text-muted-foreground">Revenue</div>
        <div className="text-right font-semibold text-primary">{formatCurrency(client.revenue)}</div>

        <div className="text-muted-foreground">Joined</div>
        <div className="text-right font-semibold">{formatDate(client.joinedDate)}</div>
        
        <div className="text-muted-foreground">Phone</div>
        <div className="text-right font-semibold">{client.phone}</div>
      </CardContent>
    </Card>
  )
}
