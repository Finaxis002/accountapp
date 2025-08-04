
import { Card, CardContent, CardHeader, CardFooter, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { User } from "@/lib/types"
import { Edit, Trash2, Mail, Shield, Dot } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"

interface UserCardProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
}

const roleBadgeColors: { [key: string]: string } = {
  Manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Accountant: 'bg-green-500/20 text-green-400 border-green-500/30',
  Viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};


export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  const initials = (user.userName || "NN").substring(0,2).toUpperCase();

  return (
    <Card className="flex flex-col">
        <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
                 <Avatar className="h-20 w-20 mb-4">
                    <AvatarImage src={user.avatar} alt={user.userName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg">{user.userName}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                 <Badge variant="outline" className={cn("mt-2", roleBadgeColors[user.role!])}>{user.role}</Badge>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm">
                <div 
                    className={cn("h-2 w-2 rounded-full", user.status === 'Active' ? 'bg-green-500' : 'bg-red-500')} 
                />
                <span className="text-muted-foreground">{user.status}</span>
            </div>
        </CardContent>
        <CardFooter className="mt-auto border-t p-2 flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
      </CardFooter>
    </Card>
  )
}
