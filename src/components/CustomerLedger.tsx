import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  Phone, 
  CheckCircle2, 
  Clock,
  Printer,
  ChevronRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { Customer, Invoice, Payment } from '../types';
import { formatCurrency } from '../utils/storage';
import { CustomerDocumentsModal } from './CustomerDocumentsModal';
import { UniGroupLogo } from './UniGroupLogo';

interface CustomerLedgerProps {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onSelectCustomerForInvoice: (customer: Customer) => void;
  onSelectInvoiceForPayment: (invoice: Invoice) => void;
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({
  customers = [],
  invoices = [],
  payments = [],
  onAddCustomer,
  onUpdateCustomer,
  onSelectCustomerForInvoice,
  onSelectInvoiceForPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);
  const [selectedCustomerForDocs, setSelectedCustomerForDocs] = useState<Customer | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  // New customer form state
  const [newCode, setNewCode] = useState(`AX-C${Math.floor(100 + Math.random() * 900)}`);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState(300000);
  const [newTermsDays, setNewTermsDays] = useState(30);
  const [newNotes, setNewNotes] = useState('');

  // Calculate dynamic stats for each customer
  const enrichedCustomers = customers.map((c) => {
    const custInvoices = invoices.filter((i) => i.customerId === c.id);
    const totalInvoiced = custInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const totalPaid = custInvoices.reduce((acc, curr) => acc + curr.paidAmount, 0);
    const totalOutstanding = custInvoices.reduce((acc, curr) => acc + curr.remainingAmount, 0);
    const overdueCount = custInvoices.filter((i) => i.status === 'overdue').length;
    const utilizationRate = c.creditLimit > 0 ? (totalOutstanding / c.creditLimit) * 100 : 0;

    return {
      ...c,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      overdueCount,
      utilizationRate,
      invoiceCount: custInvoices.length,
    };
  });

  const filteredCustomers = enrichedCustomers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const cust: Customer = {
      id: `cust-${Date.now()}`,
      code: newCode.trim() || `AX-C${Date.now().toString().slice(-3)}`,
      name: newName.trim(),
      phone: newPhone.trim() || '—',
      creditLimit: Number(newCreditLimit) || 100000,
      paymentTermsDays: Number(newTermsDays) || 30,
      region: 'القاهرة',
      status: 'جيد',
      notes: newNotes.trim() || undefined,
    };

    onAddCustomer(cust);
    setShowAddCustomerModal(false);
    setNewName('');
    setNewPhone('');
    setNewNotes('');
    setNewCode(`AX-C${Math.floor(100 + Math.random() * 900)}`);
  };

  // Statement data for selected customer
  const statementInvoices = selectedCustomerForStatement
    ? invoices.filter((i) => i.customerId === selectedCustomerForStatement.id)
    : [];
  const statementPayments = selectedCustomerForStatement
    ? payments.filter((p) => p.customerId === selectedCustomerForStatement.id)
    : [];

  return (
    <div id="customers-view" className="space-y-5">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">سجل العملاء وحدود الائتمان</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            متابعة أرصدة مديونية العملاء وسقوف الائتمان المسموح بها مع كشوف الحساب
          </p>
        </div>

        <button
          onClick={() => setShowAddCustomerModal(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العميل، كود AX، أو رقم الهاتف..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
          />
        </div>
      </div>

      {/* Customers Cards / Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((c) => {
          const isOverLimit = c.totalOutstanding > c.creditLimit;
          const isNearLimit = c.utilizationRate >= 80 && !isOverLimit;

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {c.code}
                      </span>
                      {c.overdueCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                          {c.overdueCount} متأخرة
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-stone-900 text-sm mt-1">{c.name}</h3>
                  </div>

                  {c.phone && (
                    <div className="text-stone-400 hover:text-stone-600 text-xs flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" />
                      <span>{c.phone}</span>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">المديونية الحالية:</span>
                    <strong className={`font-bold ${c.totalOutstanding > 0 ? 'text-amber-900' : 'text-stone-700'}`}>
                      {formatCurrency(c.totalOutstanding)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">سقف الائتمان:</span>
                    <span className="font-mono text-stone-700 font-semibold">{formatCurrency(c.creditLimit)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">فترة الآجل المعتادة:</span>
                    <span className="text-stone-700">{c.paymentTermsDays} يوم</span>
                  </div>

                  {/* Credit Utilization Bar */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-stone-500">استهلاك الائتمان</span>
                      <span className={`font-mono font-bold ${isOverLimit ? 'text-red-700' : isNearLimit ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {c.utilizationRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, c.utilizationRate)}%` }}
                        className={`h-full rounded-full transition-all ${
                          isOverLimit ? 'bg-red-600' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    {isOverLimit && (
                      <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>تجاوز سقف الائتمان بمقدار {formatCurrency(c.totalOutstanding - c.creditLimit)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5 flex-wrap">
                <button
                  onClick={() => setSelectedCustomerForStatement(c)}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition text-center whitespace-nowrap"
                >
                  كشف الحساب
                </button>

                <button
                  onClick={() => setSelectedCustomerForDocs(c)}
                  className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition whitespace-nowrap"
                  title="عرض وإرفاق السجل التجاري والبطاقة الضريبية والمستندات"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>المستندات</span>
                  {c.documents && c.documents.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-700 text-white text-[10px] flex items-center justify-center font-bold">
                      {c.documents.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onSelectCustomerForInvoice(c)}
                  className="py-1.5 px-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition whitespace-nowrap"
                  title="إصدار فاتورة جديدة لهذا العميل"
                >
                  + فاتورة
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Account Statement Modal (كشف الحساب التفصيلي) */}
      {selectedCustomerForStatement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-stone-200 text-right space-y-4 max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none print:p-0">
            
            {/* Top Corporate Branding for Statement */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="bg-slate-900 px-3 py-1.5 rounded-xl inline-block">
                <UniGroupLogo size="sm" variant="full" />
              </div>
              <div className="text-left font-mono text-[11px] text-stone-500">
                <div className="font-bold text-stone-700">كشف حساب عميل معتمد</div>
                <div>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                    {selectedCustomerForStatement.code}
                  </span>
                  <h3 className="text-base font-bold text-stone-900">
                    كشف حساب: {selectedCustomerForStatement.name}
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  سجل جميع الفواتير الصادرة والمدفوعات المسددة والرصيد القائم
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCustomerForDocs(selectedCustomerForStatement)}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold transition"
                  title="عرض وإرفاق مستندات العميل"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>المستندات الرسمية ({selectedCustomerForStatement.documents?.length || 0})</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
                  title="طباعة كشف الحساب"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button
                  onClick={() => setSelectedCustomerForStatement(null)}
                  className="text-stone-400 hover:text-stone-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-center">
              <div>
                <span className="text-stone-500 block">إجمالي الفواتير</span>
                <span className="font-bold text-stone-900 text-sm">
                  {formatCurrency(statementInvoices.reduce((a, b) => a + b.totalAmount, 0))}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">إجمالي المسدد</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(statementInvoices.reduce((a, b) => a + b.paidAmount, 0))}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">الرصيد القائم المستحق</span>
                <span className="font-bold text-red-700 text-sm">
                  {formatCurrency(statementInvoices.reduce((a, b) => a + b.remainingAmount, 0))}
                </span>
              </div>
            </div>

            {/* Invoices Breakdown Table */}
            <div>
              <h4 className="text-xs font-bold text-stone-800 mb-2">الفواتير المستحقة والمسددة:</h4>
              <div className="border border-stone-200 rounded-lg overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                    <tr>
                      <th className="p-2.5">رقم الفاتورة</th>
                      <th className="p-2.5">مرجع AX</th>
                      <th className="p-2.5">الإصدار</th>
                      <th className="p-2.5">الاستحقاق</th>
                      <th className="p-2.5">المبلغ</th>
                      <th className="p-2.5">المسدد</th>
                      <th className="p-2.5">المتبقي</th>
                      <th className="p-2.5 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {statementInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-stone-50">
                        <td className="p-2.5 font-mono font-bold text-stone-900">{inv.invoiceNumber}</td>
                        <td className="p-2.5 font-mono text-stone-500">{inv.axReference || '—'}</td>
                        <td className="p-2.5 font-mono text-stone-600">{inv.issueDate}</td>
                        <td className="p-2.5 font-mono text-stone-600">{inv.dueDate}</td>
                        <td className="p-2.5 font-semibold text-stone-900">{formatCurrency(inv.totalAmount)}</td>
                        <td className="p-2.5 text-emerald-700 font-medium">{formatCurrency(inv.paidAmount)}</td>
                        <td className="p-2.5 font-bold text-amber-900">{formatCurrency(inv.remainingAmount)}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {inv.status === 'paid' ? 'مسددة' : inv.status === 'overdue' ? 'متأخرة' : 'آجلة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments Log for this Customer */}
            {statementPayments.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-stone-800 mb-2">سجل التحصيلات السابقة:</h4>
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                      <tr>
                        <th className="p-2.5">تاريخ السداد</th>
                        <th className="p-2.5">الفاتورة</th>
                        <th className="p-2.5">المبلغ</th>
                        <th className="p-2.5">طريقة الدفع</th>
                        <th className="p-2.5">رقم المرجع / الشيك</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {statementPayments.map((p) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-mono text-stone-700">{p.paymentDate}</td>
                          <td className="p-2.5 font-mono font-semibold text-stone-900">{p.invoiceNumber}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                          <td className="p-2.5 text-stone-600">
                            {p.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : p.paymentMethod === 'cheque' ? 'شيك' : 'نقدي'}
                          </td>
                          <td className="p-2.5 font-mono text-stone-500">{p.referenceNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                onClick={() => setSelectedCustomerForStatement(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs hover:bg-stone-50"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 text-right space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">إضافة عميل جديد</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">كود العميل بنظام AX</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">اسم العميل / الشركة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة المقاولون العرب"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono text-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">فترة الآجل (أيام)</label>
                  <input
                    type="number"
                    value={newTermsDays}
                    onChange={(e) => setNewTermsDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">سقف الائتمان المسموح به (ج.م)</label>
                <input
                  type="number"
                  step="any"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 font-mono font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                >
                  حفظ العميل
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Documents Modal */}
      {selectedCustomerForDocs && (
        <CustomerDocumentsModal
          isOpen={true}
          onClose={() => setSelectedCustomerForDocs(null)}
          customer={selectedCustomerForDocs}
          onUpdateCustomer={(updated) => {
            if (onUpdateCustomer) {
              onUpdateCustomer(updated);
            }
            setSelectedCustomerForDocs(updated);
            if (selectedCustomerForStatement?.id === updated.id) {
              setSelectedCustomerForStatement(updated);
            }
          }}
        />
      )}

    </div>
  );
};
