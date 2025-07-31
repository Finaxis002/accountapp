import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Client } from "@/lib/types";
import { Eye, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);

export function ClientCard({ client, onEdit }: ClientCardProps) {
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="text-muted-foreground">Status</div>
        <div className="text-right">
          <Badge
            className={cn(
              "text-xs font-semibold border",
              client.status === "Active"
                ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30"
                : "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30"
            )}
          >
            {client.status}
          </Badge>
        </div>

        <div className="text-muted-foreground">Plan</div>
        <div className="text-right">
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold border",
              client.subscriptionPlan === "Premium" &&
                "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
              client.subscriptionPlan === "Standard" &&
                "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
              client.subscriptionPlan === "Basic" &&
                "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30"
            )}
          >
            {client.subscriptionPlan}
          </Badge>
        </div>

        <div className="text-muted-foreground">Revenue</div>
        <div className="text-right font-semibold text-primary text-[12px]">
          {formatCurrency(client.revenue)}
        </div>

        <div className="text-muted-foreground">Joined</div>
        <div className="text-right font-semibold text-[12px]">
          {formatDate(client.joinedDate)}
        </div>

        <div className="text-muted-foreground">Phone</div>
        <div className="text-right font-semibold text-[12px]">
          {client.phone}
        </div>
      </CardContent>
    </Card>
  );
}
