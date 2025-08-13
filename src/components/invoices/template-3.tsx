
import type { Company, Party, Transaction } from '@/lib/types';

interface TemplateProps {
    transaction: Transaction;
    company: Company | null;
    party: Party | null;
}

export const Template3 = ({ transaction, company, party }: TemplateProps) => {
    const subtotal = transaction.amount;
    const tax = subtotal * 0.10;
    const discount = subtotal * 0.10;
    const total = subtotal + tax - discount;
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-sm my-6 text-gray-800">
            <div className="grid grid-cols-2 items-center">
                <div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="company-logo" style={{ height: 100, width: 100 }} />
                </div>
                <div className="text-right">
                    <p>{company?.businessName}</p>
                    <p className="text-gray-500 text-sm">{company?.emailId}</p>
                    <p className="text-gray-500 text-sm mt-1">{company?.mobileNumber}</p>
                    <p className="text-gray-500 text-sm mt-1">VAT: {company?.gstin || 'N/A'}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 items-center mt-8">
                <div>
                    <p className="font-bold text-gray-800">Bill to :</p>
                    <p className="text-gray-500">{party?.name}</p>
                    <p className="text-gray-500">{party?.address}, {party?.city}, {party?.state}</p>
                    <p className="text-gray-500">{party?.email}</p>
                </div>
                <div className="text-right">
                    <p>Invoice number: <span className="text-gray-500">INV-{transaction._id.slice(-6).toUpperCase()}</span></p>
                    <p>Invoice date: <span className="text-gray-500">{new Intl.DateTimeFormat('en-GB').format(new Date(transaction.date))}</span></p>
                    <p>Due date: <span className="text-gray-500">{new Intl.DateTimeFormat('en-GB').format(new Date(new Date(transaction.date).setDate(new Date(transaction.date).getDate() + 30)))}</span></p>
                </div>
            </div>

            <div className="-mx-4 mt-8 flow-root sm:mx-0">
                <table className="min-w-full">
                    <colgroup>
                        <col className="w-full sm:w-1/2" />
                        <col className="sm:w-1/6" />
                        <col className="sm:w-1/6" />
                        <col className="sm:w-1/6" />
                    </colgroup>
                    <thead className="border-b border-gray-300 text-gray-900">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">Items</th>
                            <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:table-cell">Quantity</th>
                            <th scope="col" className="hidden px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:table-cell">Price</th>
                            <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b border-gray-200">
                            <td className="max-w-0 py-5 pl-4 pr-3 text-sm sm:pl-0">
                                <div className="font-medium text-gray-900">{transaction.product?.name}</div>
                                <div className="mt-1 truncate text-gray-500">{transaction.description}</div>
                            </td>
                            <td className="hidden px-3 py-5 text-right text-sm text-gray-500 sm:table-cell">{transaction.quantity}</td>
                            <td className="hidden px-3 py-5 text-right text-sm text-gray-500 sm:table-cell">{formatCurrency(transaction.pricePerUnit || 0)}</td>
                            <td className="py-5 pl-3 pr-4 text-right text-sm text-gray-500 sm:pr-0">{formatCurrency(transaction.amount)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th scope="row" colSpan={3} className="hidden pl-4 pr-3 pt-6 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Subtotal</th>
                            <th scope="row" className="pl-6 pr-3 pt-6 text-left text-sm font-normal text-gray-500 sm:hidden">Subtotal</th>
                            <td className="pl-3 pr-6 pt-6 text-right text-sm text-gray-500 sm:pr-0">{formatCurrency(subtotal)}</td>
                        </tr>
                        <tr>
                            <th scope="row" colSpan={3} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Tax</th>
                            <th scope="row" className="pl-6 pr-3 pt-4 text-left text-sm font-normal text-gray-500 sm:hidden">Tax</th>
                            <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">{formatCurrency(tax)}</td>
                        </tr>
                        <tr>
                            <th scope="row" colSpan={3} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 sm:table-cell sm:pl-0">Discount</th>
                            <th scope="row" className="pl-6 pr-3 pt-4 text-left text-sm font-normal text-gray-500 sm:hidden">Discount</th>
                            <td className="pl-3 pr-6 pt-4 text-right text-sm text-gray-500 sm:pr-0">- {formatCurrency(discount)}</td>
                        </tr>
                        <tr>
                            <th scope="row" colSpan={3} className="hidden pl-4 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 sm:table-cell sm:pl-0">Total</th>
                            <th scope="row" className="pl-6 pr-3 pt-4 text-left text-sm font-semibold text-gray-900 sm:hidden">Total</th>
                            <td className="pl-3 pr-4 pt-4 text-right text-sm font-semibold text-gray-900 sm:pr-0">{formatCurrency(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="border-t-2 pt-4 text-xs text-gray-500 text-center mt-16">
                Please pay the invoice before the due date. You can pay the invoice by logging in to your account from our client portal.
            </div>
        </div>
    );
};
