import React, { useState } from 'react';
import { CreditCard, FileText, Pencil, ShieldCheck, Wallet } from 'lucide-react';
import { CompanySettings, Customer, Invoice, Payment } from '../types';
import { formatCurrency } from '../utils/storage';
import { CustomerDocumentsModal } from './CustomerDocumentsModal';

interface CustomerProfileProps {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  companySettings?: CompanySettings;
  onUpdateCustomer?: (customer: Customer) => void;
  onSelectInvoiceForPayment: (invoice: Invoice) => void;
  onEditCustomer?: (customer: Customer) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customers = [],
  invoices = [],
  payments = [],
  companySettings,
  onUpdateCustomer,
  onSelectInvoiceForPayment,
  onEditCustomer,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [showDocuments, setShowDocuments] = useState(false);
  const customer = customers.find((item) => item.id === selectedCustomerId) || customers[0];

  if (!customer) {
    return (
      <div className="bg-white rounded-xl border border-stone-200 p-10 text-center text-stone-500">
        لا توجد بيانات عملاء لعرض الملف
      </div>
    );
  }

  const customerInvoices = invoices.filter((invoice) => invoice.customerId === customer.id);
  const customerPayments = payments.filter((payment) => payment.customerId === customer.id);
  const totalInvoiced = customerInvoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const totalPaid = customerInvoices.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0);
  const totalOutstanding = customerInvoices.reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);
  const overdueInvoices = customerInvoices.filter((invoice) => invoice.status === 'overdue');
  const utilization = customer.creditLimit > 0 ? (totalOutstanding / customer.creditLimit) * 100 : 0;

  return (
    <div className="space-y-5 text-right max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">ملف العميل</h2>
          <p className="text-xs text-stone-500 mt-1">عرض شامل للبيانات المالية، الفواتير، المدفوعات والمستندات</p>
        </div>
        <select
          value={customer.id}
          onChange={(event) => setSelectedCustomerId(event.target.value)}
          className="w-full sm:w-72 px-3 py-2 rounded-lg border border-stone-300 bg-white text-xs text-stone-900"
        >
          {customers.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.code}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-bold px-2 py-1 rounded bg-stone-100 text-stone-700">{customer.code}</span>
              <h3 className="text-lg font-black text-stone-900">{customer.name}</h3>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${customer.isSuspended ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {customer.isSuspended ? 'موقوف' : customer.status}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2">{customer.phone || 'لا يوجد هاتف'} · {customer.region} · فترة الآجل {customer.paymentTermsDays} يوم</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDocuments(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> المستندات ({customer.documents?.length || 0})
            </button>
            {onEditCustomer && <button onClick={() => onEditCustomer(customer)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-bold"><Pencil className="w-4 h-4" /> تعديل</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50"><span className="text-[11px] text-stone-500">إجمالي الفواتير</span><strong className="block text-base text-stone-900 mt-1">{formatCurrency(totalInvoiced)}</strong></div>
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50"><span className="text-[11px] text-stone-500">إجمالي المسدد</span><strong className="block text-base text-emerald-700 mt-1">{formatCurrency(totalPaid)}</strong></div>
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50"><span className="text-[11px] text-stone-500">الرصيد القائم</span><strong className="block text-base text-amber-900 mt-1">{formatCurrency(totalOutstanding)}</strong></div>
          <div className="p-3 rounded-xl border border-red-200 bg-red-50"><span className="text-[11px] text-stone-500">فواتير متأخرة</span><strong className="block text-base text-red-700 mt-1">{overdueInvoices.length} فاتورة</strong></div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs"><span className="text-stone-500">استخدام الحد الائتماني</span><strong className="text-stone-800">{utilization.toFixed(1)}% من {formatCurrency(customer.creditLimit)}</strong></div>
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden mt-1"><div className={`h-full rounded-full ${utilization > 100 ? 'bg-red-600' : utilization >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, utilization)}%` }} /></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs text-stone-800">
          <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-blue-600" /><h3 className="text-sm font-bold text-stone-900">فواتير العميل</h3></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right text-xs text-stone-700"><thead className="bg-stone-100 text-stone-800"><tr><th className="p-2 font-bold">الفاتورة</th><th className="p-2 font-bold">الاستحقاق</th><th className="p-2 font-bold">الإجمالي</th><th className="p-2 font-bold">المتبقي</th><th className="p-2 font-bold">الحالة</th><th className="p-2 font-bold">إجراء</th></tr></thead><tbody className="divide-y divide-stone-200">{customerInvoices.map((invoice) => <tr key={invoice.id} className="hover:bg-stone-50"><td className="p-2 font-mono font-bold text-stone-900">{invoice.invoiceNumber}</td><td className="p-2 font-mono text-stone-700">{invoice.dueDate}</td><td className="p-2 text-stone-700">{formatCurrency(invoice.totalAmount)}</td><td className="p-2 font-bold text-amber-800">{formatCurrency(invoice.remainingAmount)}</td><td className="p-2 text-stone-700">{invoice.status === 'paid' ? 'مسددة' : invoice.status === 'overdue' ? 'متأخرة' : 'آجلة'}</td><td className="p-2">{invoice.remainingAmount > 0 && <button onClick={() => onSelectInvoiceForPayment(invoice)} className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700"><CreditCard className="w-3.5 h-3.5" /> سداد</button>}</td></tr>)}</tbody></table></div>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs text-stone-800">
          <div className="flex items-center gap-2 mb-3"><Wallet className="w-4 h-4 text-emerald-600" /><h3 className="text-sm font-bold text-stone-900">آخر المدفوعات</h3></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-right text-xs text-stone-700"><thead className="bg-stone-100 text-stone-800"><tr><th className="p-2 font-bold">التاريخ</th><th className="p-2 font-bold">الفاتورة</th><th className="p-2 font-bold">المبلغ</th><th className="p-2 font-bold">المرجع</th></tr></thead><tbody className="divide-y divide-stone-200">{customerPayments.slice(0, 10).map((payment) => <tr key={payment.id} className="hover:bg-stone-50"><td className="p-2 font-mono text-stone-700">{payment.paymentDate}</td><td className="p-2 font-mono text-stone-900">{payment.invoiceNumber}</td><td className="p-2 font-bold text-emerald-700">{formatCurrency(payment.amount)}</td><td className="p-2 font-mono text-stone-600">{payment.referenceNumber || '—'}</td></tr>)}</tbody></table></div>
          {customerPayments.length === 0 && <div className="py-8 text-center text-xs text-stone-500">لا توجد مدفوعات مسجلة لهذا العميل</div>}
        </section>
      </div>

      {showDocuments && <CustomerDocumentsModal isOpen={true} customer={customer} onClose={() => setShowDocuments(false)} onUpdateCustomer={(updated) => { onUpdateCustomer?.(updated); setShowDocuments(false); }} />}
      {companySettings && null}
    </div>
  );
};
