import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Client } from "@/lib/types";
import {
  Eye,
  Edit,
  User,
  Phone,
  Calendar,
  MoreVertical,
  Globe,
  Copy,
  Delete,
  Trash2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string) => void;
  onManagePermissions: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
};

const getAppOrigin = () =>
  process.env.NEXT_PUBLIC_APP_ORIGIN ||
  (typeof window !== "undefined" ? window.location.origin : "");

const getAppLoginUrl = (slug?: string) =>
  slug ? `${getAppOrigin()}/client-login/${slug}` : "";

export function ClientCard({
  client,
  onEdit,
  onDelete,
  onResetPassword,
  onManagePermissions,
}: ClientCardProps) {
  const { toast } = useToast();
  const appUrl = getAppLoginUrl(client.slug);
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
              <span className="font-medium">
                {formatDate(client.createdAt)}
              </span>
            </div>
          </div>

           {/* URL / Slug row */}
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/50">
              <Globe className="h-4 w-4 text-orange-500 dark:text-orange-400" />
            </div>

            <div className="flex items-center justify-between flex-1">
              <span className="text-muted-foreground">URL</span>

              {client.slug ? (
                <div className="flex items-center gap-2">
                  <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigator.clipboard.writeText(appUrl).then(() =>
                toast({
                  title: "Copied",
                  description: "Login URL copied to clipboard.",
                })
              )
            }
          >
            <Copy className="h-4 w-4" />
          </Button>
                </div>
              ) : (
                <span className="font-medium text-muted-foreground/70">Not set</span>
              )}
            </div>
          </div>
         
        </div>
      </CardContent>
      <CardFooter className="mt-auto border-t p-4 flex justify-end gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/analytics?clientId=${client._id}`}>
            <Eye className="mr-2 h-4 w-4" /> View
          </Link>
        </Button>

        <Button variant="secondary" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>

         <Button  variant="secondary" size="sm"  onClick={() => onDelete(client._id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>

        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onResetPassword(client._id)}>
              Reset Password
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onManagePermissions}>
              Manage Permissions
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(client._id)}
              className="text-red-600 focus:text-red-600"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </CardFooter>
    </Card>
  );
}
