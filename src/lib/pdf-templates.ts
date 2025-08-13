
import type { Transaction, Company, Party } from "@/lib/types";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatCurrency = (amount: number) => {
    // Manually format currency to avoid weird characters that break jspdf
    const formatted = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    return `Rs. ${formatted}`;
};

const getItemsBody = (transaction: Transaction) => {
    if (!transaction.items || transaction.items.length === 0) {
        const amount = transaction.amount || 0;
        const quantity = transaction.quantity || 1;
        const price = transaction.pricePerUnit || amount;
        return [[
            '1',
            quantity,
            transaction.description || 'Item',
            formatCurrency(price),
            formatCurrency(amount)
        ]];
    }
    return transaction.items.map((item, index) => {
        const quantity = item.quantity || 0;
        const pricePerUnit = item.pricePerUnit || 0;
        const amount = quantity * pricePerUnit;
        return [
            (index + 1).toString(),
            quantity,
            `${item.product?.name || 'Item'}\n${transaction.description || ''}`,
            formatCurrency(pricePerUnit),
            formatCurrency(amount)
        ]
    });
};

export const generatePdfForTemplate1 = (transaction: Transaction, company: Company | null | undefined, party: Party | null | undefined): jsPDF => {
    const doc = new jsPDF();
    const subtotal = transaction.items?.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0) || transaction.amount || 0;
    const tax = subtotal * 0.10; // 10% tax
    const totalAmount = subtotal + tax;
    const invoiceNumber = `#${transaction._id.slice(-6).toUpperCase()}`;
    const invoiceDate = new Intl.DateTimeFormat('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(transaction.date));

    // Decorative Lines
    doc.setFillColor(82, 101, 167);
    doc.rect(0, 0, 8, 40, 'F');
    doc.rect(doc.internal.pageSize.getWidth() - 8, doc.internal.pageSize.getHeight() - 40, 8, 40, 'F');

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.businessName || 'Your Company', 15, 20);
    
    doc.setFontSize(18);
    doc.text('INVOICE', doc.internal.pageSize.getWidth() - 15, 20, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(invoiceDate, doc.internal.pageSize.getWidth() - 15, 26, { align: 'right' });

    // Invoice Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`INVOICE NO: ${invoiceNumber}`, 15, 40);
    
    doc.setFontSize(10);
    doc.text('TO:', doc.internal.pageSize.getWidth() - 15, 40, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(party?.name || 'N/A', doc.internal.pageSize.getWidth() - 15, 45, { align: 'right' });
    doc.text(party?.address || 'Address not available', doc.internal.pageSize.getWidth() - 15, 50, { align: 'right' });
    doc.text(party?.city || '', doc.internal.pageSize.getWidth() - 15, 55, { align: 'right' });
    
    // Table
    autoTable(doc, {
        startY: 65,
        head: [['S.No.', 'QTY', 'DESCRIPTION', 'PRICE', 'TOTAL']],
        body: getItemsBody(transaction),
        theme: 'striped',
        headStyles: { fillColor: [241, 245, 249], textColor: [0,0,0] },
        bodyStyles: { fillColor: [255, 255, 255] } // This forces the striped theme to apply correctly
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Totals
    let currentY = finalY + 10;
    doc.setFontSize(10);
    doc.text('Sub Total', 140, currentY, { align: 'right' });
    doc.text(formatCurrency(subtotal), 200, currentY, { align: 'right' });
    currentY += 7;
    doc.text('Tax 10%', 140, currentY, { align: 'right' });
    doc.text(formatCurrency(tax), 200, currentY, { align: 'right' });
    currentY += 5;
    doc.setDrawColor(0);
    doc.line(120, currentY, 200, currentY);
    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('GRAND TOTAL', 150, currentY, { align: 'right' });
    doc.text(formatCurrency(totalAmount), 200, currentY, { align: 'right' });

    // Footer
    currentY = doc.internal.pageSize.getHeight() - 40;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method', 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text('Please make payments to the provided account.', 15, currentY + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Terms and Conditions', doc.internal.pageSize.getWidth() - 15, currentY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('Payment is due within 30 days.', doc.internal.pageSize.getWidth() - 15, currentY + 5, { align: 'right' });

    return doc;
}

const getItemsBodyTemplate2 = (transaction: Transaction) => {
    if (!transaction.items || transaction.items.length === 0) {
        const amount = transaction.amount || 0;
        const quantity = transaction.quantity || 1;
        const price = transaction.pricePerUnit || amount;
        return [[
            '1',
            transaction.description || 'Item',
            quantity,
            formatCurrency(price),
            formatCurrency(amount)
        ]];
    }
    return transaction.items.map((item, index) => {
        const quantity = item.quantity || 0;
        const pricePerUnit = item.pricePerUnit || 0;
        const amount = quantity * pricePerUnit;
        return [
            (index + 1).toString(),
            item.product?.name || 'Item',
            quantity,
            formatCurrency(pricePerUnit),
            formatCurrency(amount)
        ]
    });
}


export const generatePdfForTemplate2 = (transaction: Transaction, company: Company | null | undefined, party: Party | null | undefined): jsPDF => {
    const doc = new jsPDF();
    const subtotal = transaction.items?.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0) || transaction.amount || 0;
    const tax = subtotal * 0.13; // 13% tax
    const totalAmount = subtotal + tax;

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.businessName || 'Your Company', 20, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company?.emailId || '', 20, 37);
    doc.text(company?.mobileNumber || '', 20, 44);

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Invoice #${transaction._id.slice(-6).toUpperCase()}`, doc.internal.pageSize.getWidth() - 20, 30, { align: 'right'});
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Issued: ${new Intl.DateTimeFormat('en-US').format(new Date(transaction.date))}`, doc.internal.pageSize.getWidth() - 20, 37, { align: 'right' });
    doc.text(`Payment Due: ${new Intl.DateTimeFormat('en-US').format(new Date(new Date(transaction.date).setDate(new Date(transaction.date).getDate() + 30)))}`, doc.internal.pageSize.getWidth() - 20, 44, { align: 'right' });

    doc.line(15, 60, doc.internal.pageSize.getWidth() - 15, 60);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(party?.name || 'Client Name', 20, 75);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(party?.email || '', 20, 82);
    doc.text(party?.contactNumber || '', 20, 89);

    const body = getItemsBodyTemplate2(transaction);
    body.push(['', '', '', 'HST', '13%', formatCurrency(tax)]);

    autoTable(doc, {
        startY: 100,
        head: [['S.No.', 'Item Description', 'Qty', 'Rate', 'Sub-total']],
        body: body,
        foot: [
            ['', '', '', '', 'Total', formatCurrency(totalAmount)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [238, 238, 238], textColor: [0,0,0] },
        footStyles: { fillColor: [238, 238, 238], textColor: [0,0,0], fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.text('Thank you for your business! Payment is expected within 31 days.', 20, finalY);

    return doc;
}

const getItemsBodyTemplate3 = (transaction: Transaction) => {
    if (!transaction.items || transaction.items.length === 0) {
        const amount = transaction.amount || 0;
        const quantity = transaction.quantity || 1;
        const price = transaction.pricePerUnit || amount;
        return [[
            '1',
            { content: `${transaction.product?.name || 'Item'}\n${transaction.description || ''}`, styles: { cellWidth: 'auto' } },
            quantity,
            formatCurrency(price),
            formatCurrency(amount)
        ]];
    }
    return transaction.items.map((item, index) => {
        const quantity = item.quantity || 0;
        const pricePerUnit = item.pricePerUnit || 0;
        const amount = quantity * pricePerUnit;
        return [
            (index + 1).toString(),
            { content: `${item.product?.name || 'Item'}\n${transaction.description || ''}`, styles: { cellWidth: 'auto' } },
            quantity,
            formatCurrency(pricePerUnit),
            formatCurrency(amount)
        ]
    });
};

export const generatePdfForTemplate3 = (transaction: Transaction, company: Company | null | undefined, party: Party | null | undefined): jsPDF => {
    const doc = new jsPDF();
    const subtotal = transaction.items?.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0) || transaction.amount || 0;
    const tax = subtotal * 0.10;
    const discount = subtotal * 0.10;
    const total = subtotal + tax - discount;
    
    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(company?.businessName || 'Your Company', 20, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(company?.emailId || '', 20, 27);
    doc.text(company?.mobileNumber || '', 20, 34);
    
    doc.text(`Invoice number: INV-${transaction._id.slice(-6).toUpperCase()}`, doc.internal.pageSize.getWidth() - 20, 20, { align: 'right' });
    doc.text(`Invoice date: ${new Intl.DateTimeFormat('en-GB').format(new Date(transaction.date))}`, doc.internal.pageSize.getWidth() - 20, 27, { align: 'right' });
    
    // Bill To
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill to:', 20, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(party?.name || 'N/A', 20, 57);
    doc.text(party?.address || '', 20, 64);

    // Table
    autoTable(doc, {
        startY: 75,
        head: [['S.No.', 'Items', 'Quantity', 'Price', 'Amount']],
        body: getItemsBodyTemplate3(transaction),
        foot: [
            ['', '', '', 'Subtotal', formatCurrency(subtotal)],
            ['', '', '', 'Tax (10%)', formatCurrency(tax)],
            ['', '', '', 'Discount (10%)', `- ${formatCurrency(discount)}`],
            ['', '', '', { content: 'Total', styles: { fontStyle: 'bold' } }, { content: formatCurrency(total), styles: { fontStyle: 'bold' } }],
        ],
        theme: 'plain',
        footStyles: { halign: 'right' },
        bodyStyles: {},
        headStyles: { fontStyle: 'bold' }
    });

    // Footer
    const finalY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.text('Please pay the invoice before the due date.', doc.internal.pageSize.getWidth() / 2, finalY, { align: 'center' });

    return doc;
}
