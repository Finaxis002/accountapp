
import type { Company, Party, Transaction } from '@/lib/types';

interface TemplateProps {
    transaction: Transaction;
    company: Company | null;
    party: Party | null;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
};

export const Template1 = ({ transaction, company, party }: TemplateProps) => {
    const subtotal = transaction.amount;
    const tax = subtotal * 0.10;
    const totalAmount = subtotal + tax;

    return (
        <div className="invoice-template">
            <div className="invoice">
                <div className="top_line"></div>
                <div className="header">
                    <div className="i_row">
                        <div className="i_logo">
                            <p>{company?.businessName?.charAt(0) || 'A'}</p>
                        </div>
                        <div className="i_title">
                            <h2>INVOICE</h2>
                            <p className="p_title text_right">
                                {new Intl.DateTimeFormat('en-GB').format(new Date(transaction.date))}
                            </p>
                        </div>
                    </div>
                    <div className="i_row">
                        <div className="i_address i_pr_left">
                            <p className="p_title">Our Address</p>
                            <p>{company?.address}</p>
                            <p>{company?.City}, {company?.addressState}</p>
                        </div>
                        <div className="i_address i_pr_right text_right">
                            <p className="p_title">Invoice To</p>
                            <p>{party?.name}</p>
                            <p>{party?.address}</p>
                        </div>
                    </div>
                </div>
                <div className="body">
                    <div className="i_table">
                        <div className="i_table_head">
                            <div className="i_row">
                                <div className="i_col w_55"><p>Description</p></div>
                                <div className="i_col w_15 text_right"><p>Price</p></div>
                                <div className="i_col w_15 text_right"><p>Qty</p></div>
                                <div className="i_col w_15 text_right"><p>Total</p></div>
                            </div>
                        </div>
                        <div className="i_table_body">
                             <div className="i_row">
                                <div className="i_col w_55">
                                    <p>{transaction.product?.name || 'Item'}</p>
                                    <span>{transaction.description}</span>
                                </div>
                                <div className="i_col w_15 text_right"><p>{formatCurrency(transaction.pricePerUnit || 0)}</p></div>
                                <div className="i_col w_15 text_right"><p>{transaction.quantity}</p></div>
                                <div className="i_col w_15 text_right"><p>{formatCurrency(transaction.amount)}</p></div>
                            </div>
                        </div>
                        <div className="i_table_foot">
                            <div className="i_row">
                                <div className="i_col w_50">
                                </div>
                                <div className="i_col w_50">
                                    <div className="grand_total_wrap">
                                        <div className="grand_total">
                                            <p><span>Sub Total:</span><span>{formatCurrency(subtotal)}</span></p>
                                            <p><span>Tax (10%):</span><span>{formatCurrency(tax)}</span></p>
                                            <p className="bold"><span>Grand Total:</span><span>{formatCurrency(totalAmount)}</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="footer">
                    <p>Thank you and Best Wishes</p>
                </div>
                <div className="bottom_line"></div>
            </div>
        </div>
    );
}
