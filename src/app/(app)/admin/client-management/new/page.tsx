
import { ClientForm } from '@/components/clients/client-form';

export default function NewClientPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add New Client</h2>
        <p className="text-muted-foreground">
          Fill in the form below to add a new client to your system.
        </p>
      </div>
      <ClientForm />
    </div>
  );
}
