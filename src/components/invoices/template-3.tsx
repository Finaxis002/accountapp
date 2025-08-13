import type { Company, Party, Transaction } from '@/lib/types';

export const Template3 = () => {
  // Hardcoded data to exactly match the image
  const invoiceData = {
    title: "INVOICE",
    subtitle: "Accounting - Template Pack",
    companyWebsite: "WWW.COMPANYWEBSITE.COM",
    invoiceTo: {
      name: "ANDREAS DAVID",
      address: "123 STREET, CANADA"
    },
    invoiceNumber: "000111",
    date: "01 / 10 / 2024",
    items: [
      { description: "Lorem ipsum dolor", price: 10, quantity: 1, total: 10 },
      { description: "Lorem ipsum dolor", price: 40, quantity: 3, total: 120 },
      { description: "Lorem ipsum dolor", price: 30, quantity: 1, total: 30 },
      { description: "Lorem ipsum dolor", price: 190, quantity: 1, total: 190 },
      { description: "Lorem ipsum dolor", price: 90, quantity: 2, total: 180 }
    ],
    terms: "Lorem ipsum dolor sit asu sud amet, consectetur adipiscing elit, sed do eiusmod tempor incidid-ua  wu weurn avint.",
    subtotal: 530,
    tax: 50,
    total: 580,
    footer: {
      address: "your address here",
      email: "yourbusinessaccount@mail.com",
      phone: "123 456 789"
    }
  };

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto font-sans text-sm">
      {/* Title Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">{invoiceData.title}</h1>
        <p className="text-gray-600">{invoiceData.subtitle}</p>
        <div className="border-t border-gray-300 my-3"></div>
      </div>

      {/* Invoice Header */}
      <div className="flex justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{invoiceData.title}</h2>
          <p>{invoiceData.companyWebsite}</p>
        </div>
        <div className="text-right">
          <p className="font-bold">INVOICE NO. {invoiceData.invoiceNumber}</p>
          <p>DATE {invoiceData.date}</p>
        </div>
      </div>

      {/* Invoice To */}
      <div className="mb-6">
        <p className="font-bold">INVOICE TO:</p>
        <p className="font-bold">{invoiceData.invoiceTo.name}</p>
        <p>{invoiceData.invoiceTo.address}</p>
      </div>

      <div className="border-t border-gray-300 my-3"></div>

      {/* Items Table */}
      <div className="mb-6">
        <p className="font-bold mb-2">DESCRIPTION</p>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-300 text-left">
              <th className="pb-1 font-normal">DESCRIPTION</th>
              <th className="pb-1 font-normal text-right">PRICE</th>
              <th className="pb-1 font-normal text-right">QTY.</th>
              <th className="pb-1 font-normal text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">₹{item.price}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">₹{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-300 my-3"></div>

      {/* Terms and Totals */}
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="font-bold">Terms and conditions</p>
          <p className="mt-1">{invoiceData.terms}</p>
        </div>
        <div className="w-1/3">
          <div className="flex justify-between">
            <span className="font-bold">SUBTOTAL</span>
            <span>₹{invoiceData.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">TAX</span>
            <span>₹{invoiceData.tax}</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-300">
            <span className="font-bold">GRAND TOTAL</span>
            <span className="font-bold">₹{invoiceData.total}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 my-6"></div>

      {/* Footer */}
      <div className="text-center">
        <p>{invoiceData.footer.address}</p>
        <p>{invoiceData.footer.email}</p>
        <p>{invoiceData.footer.phone}</p>
      </div>
    </div>
  );
};