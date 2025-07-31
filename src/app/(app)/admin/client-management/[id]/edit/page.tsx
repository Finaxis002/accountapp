
'use client';

import { ClientForm } from '@/components/clients/client-form';
import { clients } from '@/lib/data';
import { notFound } from 'next/navigation';

export default function EditClientPage({ params }: { params: { id: string } }) {
  const client = clients.find(c => c.id === params.id);

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Client</h2>
        <p className="text-muted-foreground">
          Update the details for {client.companyName}.
        </p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}
