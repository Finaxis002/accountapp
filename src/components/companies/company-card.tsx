import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Company } from "@/lib/types";
import {
  Building,
  Edit,
  Trash2,
  User,
  Phone,
  Hash,
  FileText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface CompanyCardProps {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}

export function CompanyCard({ company, onEdit, onDelete }: CompanyCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>{company.companyName}</CardTitle>
            <CardDescription>{company.companyType}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Owner: {company.companyOwner}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{company.contactNumber}</span>
        </div>
        <div className="flex items-center gap-3">
          <Hash className="h-4 w-4 text-muted-foreground" />
          <span>Reg No: {company.registrationNumber}</span>
        </div>
        {company.gstin && (
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>GSTIN: {company.gstin}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-2">{company.address}</p>
      </CardContent>
      <CardFooter className="mt-auto border-t p-2 flex justify-end gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" /> Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
