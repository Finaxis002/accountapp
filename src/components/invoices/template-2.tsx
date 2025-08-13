
import type { Company, Party, Transaction } from '@/lib/types';
import { Leaf } from 'lucide-react';

interface TemplateProps {
    transaction: Transaction;
    company: Company | null;
    party: Party | null;
}

export const Template2 = ({ transaction, company, party }: TemplateProps) => {
    const subtotal = transaction.amount;
    const tax = subtotal * 0.13; // 13% tax for this template
    const totalAmount = subtotal + tax;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="invoice-template-2">
            <div id="invoice">
                <div id="invoice-top">
                    <div className="logo" style={{ backgroundImage: 'url(https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg)' }}></div>
                    <div className="info">
                        <h2>{company?.businessName}</h2>
                        <p>{company?.emailId} <br /> {company?.mobileNumber}</p>
                    </div>
                    <div className="title">
                        <h1>Invoice #{transaction._id.slice(-6).toUpperCase()}</h1>
                        <p>Issued: {new Intl.DateTimeFormat('en-US').format(new Date(transaction.date))}<br />
                           Payment Due: {new Intl.DateTimeFormat('en-US').format(new Date(new Date(transaction.date).setDate(new Date(transaction.date).getDate() + 30)))}
                        </p>
                    </div>
                </div>

                <div id="invoice-mid">
                    <div className="clientlogo"></div>
                    <div className="info">
                        <h2>{party?.name}</h2>
                        <p>{party?.email}<br />{party?.contactNumber}</p>
                    </div>

                    <div id="project">
                        <h2>Project Description</h2>
                        <p>{transaction.description}</p>
                    </div>
                </div>

                <div id="invoice-bot">
                    <div id="table">
                        <table>
                            <tbody>
                                <tr className="tabletitle">
                                    <td className="item"><h2>Item Description</h2></td>
                                    <td className="Hours"><h2>Hours/Qty</h2></td>
                                    <td className="Rate"><h2>Rate</h2></td>
                                    <td className="subtotal"><h2>Sub-total</h2></td>
                                </tr>

                                <tr className="service">
                                    <td className="tableitem"><p className="itemtext">{transaction.product?.name}</p></td>
                                    <td className="tableitem"><p className="itemtext">{transaction.quantity}</p></td>
                                    <td className="tableitem"><p className="itemtext">{formatCurrency(transaction.pricePerUnit || 0)}</p></td>
                                    <td className="tableitem"><p className="itemtext">{formatCurrency(transaction.amount)}</p></td>
                                </tr>
                                
                                <tr className="service">
                                    <td className="tableitem"><p className="itemtext"></p></td>
                                    <td className="tableitem"><p className="itemtext">HST</p></td>
                                    <td className="tableitem"><p className="itemtext">13%</p></td>
                                    <td className="tableitem"><p className="itemtext">{formatCurrency(tax)}</p></td>
                                </tr>
                                
                                <tr className="tabletitle">
                                    <td></td>
                                    <td></td>
                                    <td className="Rate"><h2>Total</h2></td>
                                    <td className="payment"><h2>{formatCurrency(totalAmount)}</h2></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="legalcopy">
                        <p className="legal">
                            <strong>Thank you for your business!</strong> Payment is expected within 31 days; please process this invoice within that time. There will be a 5% interest charge per month on late invoices.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
