
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Combobox } from '@/components/ui/combobox';
import type { Company } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useCompany } from '@/contexts/company-context';

export function CompanySwitcher() {
    const [companies, setCompanies] = React.useState<Company[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();
    const { selectedCompanyId, setSelectedCompanyId } = useCompany();

    React.useEffect(() => {
        const fetchCompanies = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Authentication token not found.');

                const res = await fetch('http://localhost:5000/api/companies/my', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to fetch companies.');
                }
                const data = await res.json();
                setCompanies(data);
                if (data.length > 0 && !selectedCompanyId) {
                    setSelectedCompanyId(data[0]._id);
                }
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load companies',
                    description: error instanceof Error ? error.message : 'Something went wrong.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast]);

    const handleCompanyChange = (companyId: string) => {
        setSelectedCompanyId(companyId);
    };

    const companyOptions = companies.map(c => ({
        value: c._id,
        label: c.companyName,
    }));

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-muted-foreground w-full max-w-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading companies...</span>
            </div>
        );
    }
    
    if (companies.length === 0) {
        return null; // Don't show the switcher if there are no companies
    }

    return (
        <div className="w-full max-w-xs">
            <Combobox
                options={companyOptions}
                value={selectedCompanyId || ''}
                onChange={handleCompanyChange}
                placeholder="Select a company..."
                searchPlaceholder="Search companies..."
                noResultsText="No companies found."
            />
        </div>
    );
}
