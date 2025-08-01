
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Client } from "@/lib/types"
import { Eye, Edit, User, Phone, Calendar } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
}

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateString));
}

export function ClientCard({ client, onEdit }: ClientCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-grow">
        <div className="flex items-start justify-between">
            <div>
                <h3 className="font-bold text-lg">{client.contactName}</h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <Separator />
        <div className="space-y-3 pt-4">
            <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="flex justify-between flex-1">
                    <span className="text-muted-foreground">Username</span>
                    <span className="font-medium">{client.clientUsername}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <Phone className="h-4 w-4 text-green-500 dark:text-green-400" />
                </div>
                <div className="flex justify-between flex-1">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{client.phone}</span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                    <Calendar className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                </div>
                 <div className="flex justify-between flex-1">
                    <span className="text-muted-foreground">Joined</span>
                    <span className="font-medium">{formatDate(client.createdAt)}</span>
                </div>
            </div>
        </div>
      </CardContent>
       <CardFooter className="mt-auto border-t p-4 flex justify-end gap-2">
           <Button asChild variant="outline" size="sm">
                <Link href={`/admin/client-management/${client._id}`}>
                    <Eye className="mr-2 h-4 w-4" /> View
                </Link>
            </Button>
            <Button variant="secondary" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
      </CardFooter>
    </Card>
  )
}
