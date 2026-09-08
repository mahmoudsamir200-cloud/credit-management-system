import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Pencil,
  ChevronRight,
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { ActiveNavView, CompanySettings, Customer, Invoice, Payment } from '../types';
import { formatCurrency } from '../utils/storage';
import { DOCUMENT_TYPE_LABELS } from '../utils/fileHelper';
import { CustomerDocumentsModal } from './CustomerDocumentsModal';
import { UniGroupLogo } from './UniGroupLogo';

interface CustomerLedgerProps {
  activeView?: ActiveNavView;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer?: (customer: Customer) => void;
  onSelectCustomerForInvoice: (customer: Customer) => void;
  onSelectInvoiceForPayment: (invoice: Invoice) => void;
  companySettings?: CompanySettings;
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({
  activeView = 'customers_directory',
  customers = [],
  invoices = [],
  payments = [],
  onAddCustomer,
  onUpdateCustomer,
  onSelectCustomerForInvoice,
  onSelectInvoiceForPayment,
  companySettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerForStatement, setSelectedCustomerForStatement] = useState<Customer | null>(null);
  const [selectedCustomerForDocs, setSelectedCustomerForDocs] = useState<Customer | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

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
    const documentTypes = new Set((c.documents || []).map((document) => document.type));
    const requiredDocumentTypes = ['commercial_register', 'tax_card'] as const;
    const missingRequiredDocuments = requiredDocumentTypes.filter((type) => !documentTypes.has(type));

    return {
      ...c,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      overdueCount,
      utilizationRate,
      invoiceCount: custInvoices.length,
      documentCount: c.documents?.length || 0,
      missingRequiredDocuments,
    };
  });

  const filteredCustomers = enrichedCustomers.filter((c) =>
    (activeView !== 'guarantees_documents' || c.missingRequiredDocuments.length > 0) &&
    (c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery))
  );
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const visibleCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const cust: Customer = {
      ...(editingCustomer || {}),
      id: editingCustomer?.id || `cust-${Date.now()}`,
      code: newCode.trim() || `AX-C${Date.now().toString().slice(-3)}`,
      name: newName.trim(),
      phone: newPhone.trim() || '—',
      creditLimit: Number(newCreditLimit) || 100000,
      paymentTermsDays: Number(newTermsDays) || 30,
      region: editingCustomer?.region || 'القاهرة',
      status: editingCustomer?.status || 'جيد',
      notes: newNotes.trim() || undefined,
    };

    if (editingCustomer && onUpdateCustomer) {
      onUpdateCustomer(cust);
    } else {
      onAddCustomer(cust);
    }
    setShowAddCustomerModal(false);
    setEditingCustomer(null);
    setNewName('');
    setNewPhone('');
    setNewNotes('');
    setNewCode(`AX-C${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCode(customer.code);
    setNewName(customer.name);
    setNewPhone(customer.phone === '—' ? '' : customer.phone);
    setNewCreditLimit(customer.creditLimit);
    setNewTermsDays(customer.paymentTermsDays);
    setNewNotes(customer.notes || '');
    setShowAddCustomerModal(true);
  };

  // Statement data for selected customer
  const statementInvoices = selectedCustomerForStatement
    ? invoices.filter((i) => i.customerId === selectedCustomerForStatement.id)
    : [];
  const statementPayments = selectedCustomerForStatement
    ? payments.filter((p) => p.customerId === selectedCustomerForStatement.id)
    : [];

  const statementModal = selectedCustomerForStatement ? (
    <div className="customer-statement-overlay fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:static print:bg-white print:p-0">
      <div id="customer-statement" className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-stone-200 text-right space-y-5 max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none print:p-8">
        {/* Statement content remains in the normal modal below. */}
        <div className="flex items-start justify-between gap-6 pb-4 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <UniGroupLogo
              size="md"
              variant="full"
              showSubtitle={false}
              customLogoUrl={companySettings?.logoUrl}
              customCompanyName={companySettings?.companyName}
            />
          </div>
          <div className="text-left text-[11px] text-stone-500 leading-relaxed">
            <div className="font-bold text-slate-900 text-sm">كشف حساب عميل</div>
            <div>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</div>
            {companySettings?.phone && <div>هاتف: {companySettings.phone}</div>}
            {companySettings?.email && <div>{companySettings.email}</div>}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 pb-3 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">{selectedCustomerForStatement.code}</span>
              <h3 className="text-base font-bold text-stone-900">كشف حساب: {selectedCustomerForStatement.name}</h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">سجل جميع الفواتير الصادرة والمدفوعات المسددة والرصيد القائم</p>
            {selectedCustomerForStatement.phone && <p className="text-[11px] text-stone-500 mt-1">هاتف العميل: {selectedCustomerForStatement.phone}</p>}
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => setSelectedCustomerForDocs(selectedCustomerForStatement)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-semibold"><ShieldCheck className="w-3.5 h-3.5 text-amber-700" /><span>المستندات الرسمية ({selectedCustomerForStatement.documents?.length || 0})</span></button>
            <button onClick={() => window.setTimeout(() => window.print(), 100)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-700"><Printer className="w-3.5 h-3.5" /><span>طباعة</span></button>
            <button onClick={() => setSelectedCustomerForStatement(null)} className="text-stone-400 text-sm font-bold p-1">✕</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center print:bg-white">
          <div className="p-2 rounded-lg border border-slate-200 bg-white"><span className="text-stone-500 block">إجمالي الفواتير</span><span className="font-bold text-stone-900 text-sm">{formatCurrency(statementInvoices.reduce((a, b) => a + b.totalAmount, 0))}</span></div>
          <div className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/60"><span className="text-stone-500 block">إجمالي المسدد</span><span className="font-bold text-emerald-700 text-sm">{formatCurrency(statementInvoices.reduce((a, b) => a + b.paidAmount, 0))}</span></div>
          <div className="p-2 rounded-lg border border-amber-200 bg-amber-50/70"><span className="text-stone-500 block">الرصيد القائم المستحق</span><span className="font-bold text-red-700 text-sm">{formatCurrency(statementInvoices.reduce((a, b) => a + b.remainingAmount, 0))}</span></div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-stone-800 mb-2">الفواتير المستحقة والمسددة:</h4>
          <div className="border border-stone-200 rounded-lg overflow-hidden">
            <table className="w-full text-right text-xs"><thead className="bg-stone-50 text-stone-600 border-b border-stone-200"><tr><th className="p-2.5">رقم الفاتورة</th><th className="p-2.5">مرجع AX</th><th className="p-2.5">الإصدار</th><th className="p-2.5">الاستحقاق</th><th className="p-2.5">المبلغ</th><th className="p-2.5">المسدد</th><th className="p-2.5">المتبقي</th><th className="p-2.5 text-center">الحالة</th></tr></thead>
              <tbody className="divide-y divide-stone-100">{statementInvoices.map((inv) => <tr key={inv.id}><td className="p-2.5 font-mono font-bold text-stone-900">{inv.invoiceNumber}</td><td className="p-2.5 font-mono text-stone-500">{inv.axReference || '—'}</td><td className="p-2.5 font-mono text-stone-600">{inv.issueDate}</td><td className="p-2.5 font-mono text-stone-600">{inv.dueDate}</td><td className="p-2.5 font-semibold text-stone-900">{formatCurrency(inv.totalAmount)}</td><td className="p-2.5 text-emerald-700 font-medium">{formatCurrency(inv.paidAmount)}</td><td className="p-2.5 font-bold text-amber-900">{formatCurrency(inv.remainingAmount)}</td><td className="p-2.5 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-stone-100 text-stone-700'}`}>{inv.status === 'paid' ? 'مسددة' : inv.status === 'overdue' ? 'متأخرة' : 'آجلة'}</span></td></tr>)}</tbody>
            </table>
          </div>
        </div>

        {statementPayments.length > 0 && <div><h4 className="text-xs font-bold text-stone-800 mb-2">سجل التحصيلات السابقة:</h4><div className="border border-stone-200 rounded-lg overflow-hidden"><table className="w-full text-right text-xs"><thead className="bg-stone-50 text-stone-600 border-b border-stone-200"><tr><th className="p-2.5">تاريخ السداد</th><th className="p-2.5">الفاتورة</th><th className="p-2.5">المبلغ</th><th className="p-2.5">طريقة الدفع</th><th className="p-2.5">رقم المرجع / الشيك</th></tr></thead><tbody className="divide-y divide-stone-100">{statementPayments.map((p) => <tr key={p.id}><td className="p-2.5 font-mono text-stone-700">{p.paymentDate}</td><td className="p-2.5 font-mono font-semibold text-stone-900">{p.invoiceNumber}</td><td className="p-2.5 font-bold text-emerald-700">{formatCurrency(p.amount)}</td><td className="p-2.5 text-stone-600">{p.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : p.paymentMethod === 'cheque' ? 'شيك' : 'نقدي'}</td><td className="p-2.5 font-mono text-stone-500">{p.referenceNumber}</td></tr>)}</tbody></table></div></div>}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-end print:mt-8"><button onClick={() => setSelectedCustomerForStatement(null)} className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs print:hidden">إغلاق</button></div>
      </div>
    </div>
  ) : null;

  return (
    <div id="customers-view" className="space-y-5">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
            <h2 className="text-base font-bold text-stone-900">{activeView === 'guarantees_documents' ? 'الضمانات والمستندات الناقصة' : 'سجل العملاء وحدود الائتمان'}</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {activeView === 'guarantees_documents' ? 'متابعة العملاء الذين يحتاجون استكمال السجل التجاري أو البطاقة الضريبية وفتح مستنداتهم مباشرة' : 'متابعة أرصدة مديونية العملاء وسقوف الائتمان المسموح بها مع كشوف الحساب'}
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="بحث باسم العميل، كود AX، أو رقم الهاتف..."
            className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
          />
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-500">
            إجمالي العملاء: <strong className="text-stone-900">{filteredCustomers.length}</strong>
          </div>
          <div className="text-[11px] text-stone-500">عرض {pageSize} عميلاً في الصفحة</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-right text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="p-3 font-bold">العميل</th>
                <th className="p-3 font-bold">الهاتف</th>
                <th className="p-3 font-bold">المديونية</th>
                <th className="p-3 font-bold">الحد الائتماني</th>
                <th className="p-3 font-bold">الاستخدام</th>
                <th className="p-3 font-bold">المتأخرات</th>
                <th className="p-3 font-bold">المستندات</th>
                <th className="p-3 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visibleCustomers.map((c) => {
          const isOverLimit = c.totalOutstanding > c.creditLimit;
          const isNearLimit = c.utilizationRate >= 80 && !isOverLimit;

          return (
            <tr
              key={c.id}
              className="hover:bg-amber-50/30 transition"
            >
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-bold text-stone-900">{c.name}</div>
                    <div className="font-mono text-[10px] text-stone-500">{c.code} · {c.region}</div>
                  </div>
                  {c.overdueCount > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">{c.overdueCount} متأخرة</span>}
                </div>
              </td>
              <td className="p-3 font-mono text-stone-600">{c.phone || '—'}</td>
              <td className="p-3 font-mono font-bold text-amber-900">{formatCurrency(c.totalOutstanding)}</td>
              <td className="p-3 font-mono text-stone-700">{formatCurrency(c.creditLimit)}</td>
              <td className="p-3 min-w-[150px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`font-mono font-bold ${isOverLimit ? 'text-red-700' : isNearLimit ? 'text-amber-700' : 'text-emerald-700'}`}>{c.utilizationRate.toFixed(1)}%</span>
                  {isOverLimit && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden"><div style={{ width: `${Math.min(100, c.utilizationRate)}%` }} className={`h-full rounded-full ${isOverLimit ? 'bg-red-600' : isNearLimit ? 'bg-amber-500' : 'bg-emerald-500'}`} /></div>
              </td>
              <td className="p-3 font-mono text-red-700">{c.overdueCount > 0 ? `${c.overdueCount} فاتورة` : 'لا يوجد'}</td>
              <td className="p-3">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${c.missingRequiredDocuments.length === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {c.missingRequiredDocuments.length === 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  {c.missingRequiredDocuments.length === 0 ? `مكتمل (${c.documentCount})` : `ناقص ${c.missingRequiredDocuments.length}`}
                </span>
              </td>
              <td className="p-3">
                <div className="flex items-center justify-center gap-1.5">
                  <button
                  onClick={() => setSelectedCustomerForStatement(c)}
                  className="px-2 py-1 rounded border border-stone-200 text-stone-700 hover:bg-stone-50 text-[11px] font-semibold whitespace-nowrap"
                >
                  كشف الحساب
                </button>
                <button
                  onClick={() => setSelectedCustomerForDocs(c)}
                  className="p-1.5 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800"
                  title="المستندات"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                </button>
                <button
                  onClick={() => handleEditCustomer(c)}
                  className="p-1.5 rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800"
                  title="تعديل بيانات العميل"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectCustomerForInvoice(c)}
                  className="p-1.5 rounded bg-stone-900 hover:bg-stone-800 text-white"
                  title="إصدار فاتورة جديدة لهذا العميل"
                >
                  + فاتورة
                </button>
                </div>
              </td>
            </tr>
          );
              })}
              {visibleCustomers.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-stone-500">لا توجد نتائج مطابقة للبحث</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-stone-200 bg-stone-50/50 text-xs">
          <span className="text-stone-500">صفحة {currentPage} من {totalPages}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="px-3 py-1.5 rounded border border-stone-300 bg-white text-stone-700 disabled:opacity-40">السابق</button>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="px-3 py-1.5 rounded border border-stone-300 bg-white text-stone-700 disabled:opacity-40">التالي</button>
          </div>
        </div>
      </div>

      {/* Customer Account Statement Modal (كشف الحساب التفصيلي) */}
      {selectedCustomerForStatement && (
        <div className="customer-statement-inline hidden">
          <div id="customer-statement" className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl border border-stone-200 text-right space-y-5 max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none print:p-8">
            
            {/* Top Corporate Branding for Statement */}
            <div className="flex items-start justify-between gap-6 pb-4 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <UniGroupLogo
                  size="md"
                  variant="full"
                  showSubtitle={false}
                  customLogoUrl={companySettings?.logoUrl}
                  customCompanyName={companySettings?.companyName}
                />
              </div>
              <div className="text-left text-[11px] text-stone-500 leading-relaxed">
                <div className="font-bold text-slate-900 text-sm">كشف حساب عميل</div>
                <div>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</div>
                {companySettings?.phone && <div>هاتف: {companySettings.phone}</div>}
                {companySettings?.email && <div>{companySettings.email}</div>}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 pb-3 border-b border-stone-200">
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
                {selectedCustomerForStatement.phone && (
                  <p className="text-[11px] text-stone-500 mt-1">هاتف العميل: {selectedCustomerForStatement.phone}</p>
                )}
              </div>

              <div className="flex items-center gap-2 print:hidden">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-center print:bg-white">
              <div className="p-2 rounded-lg border border-slate-200 bg-white">
                <span className="text-stone-500 block">إجمالي الفواتير</span>
                <span className="font-bold text-stone-900 text-sm">
                  {formatCurrency(statementInvoices.reduce((a, b) => a + b.totalAmount, 0))}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/60">
                <span className="text-stone-500 block">إجمالي المسدد</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {formatCurrency(statementInvoices.reduce((a, b) => a + b.paidAmount, 0))}
                </span>
              </div>
              <div className="p-2 rounded-lg border border-amber-200 bg-amber-50/70">
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

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between print:mt-8">
              <span className="text-[10px] text-stone-400">هذا الكشف صادر من النظام بناءً على البيانات المسجلة حتى تاريخ الإصدار.</span>
              <button
                onClick={() => setSelectedCustomerForStatement(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs hover:bg-stone-50 print:hidden"
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
              <h3 className="text-base font-bold text-stone-900">{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
              <button onClick={() => { setShowAddCustomerModal(false); setEditingCustomer(null); }} className="text-stone-400 hover:text-stone-600">✕</button>
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
                  {editingCustomer ? 'حفظ التعديلات' : 'حفظ العميل'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddCustomerModal(false); setEditingCustomer(null); }}
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

      {statementModal && createPortal(statementModal, document.body)}
    </div>
  );
};
