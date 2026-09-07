import React, { useState } from 'react';
import { 
  HandCoins, 
  CalendarClock, 
  CheckCircle2, 
  Clock, 
  AlertOctagon, 
  PhoneCall, 
  Plus, 
  User, 
  CreditCard, 
  Filter, 
  Search,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { 
  Customer, 
  Invoice, 
  Payment, 
  PromiseToPay, 
  CollectionTask, 
  ActiveNavView 
} from '../types';

interface CollectionsViewProps {
  activeView: ActiveNavView;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  promisesToPay: PromiseToPay[];
  collectionTasks: CollectionTask[];
  onAddPromiseToPay: (promise: Omit<PromiseToPay, 'id' | 'status'>) => void;
  onUpdatePromiseStatus: (promiseId: string, status: PromiseToPay['status']) => void;
  onUpdateTaskStatus: (taskId: string, status: CollectionTask['status']) => void;
  onSelectInvoiceForPayment: (invoice: Invoice) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const CollectionsView: React.FC<CollectionsViewProps> = ({
  activeView,
  customers = [],
  invoices = [],
  payments = [],
  promisesToPay = [],
  collectionTasks = [],
  onAddPromiseToPay,
  onUpdatePromiseStatus,
  onUpdateTaskStatus,
  onSelectInvoiceForPayment,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPromiseModal, setShowNewPromiseModal] = useState(false);
  
  // New Promise state
  const [selectedCustId, setSelectedCustId] = useState(customers[0]?.id || '');
  const [promiseAmount, setPromiseAmount] = useState(250000);
  const [promisedDate, setPromisedDate] = useState(new Date().toISOString().slice(0, 10));
  const [contactPerson, setContactPerson] = useState('');
  const [collectorName, setCollectorName] = useState('أحمد محمد');
  const [promiseNotes, setPromiseNotes] = useState('');

  // Sub-view determination
  const isPromisesView = activeView === 'promise_to_pay';
  const isDailyFollowup = activeView === 'daily_followup' || activeView === 'collection_plan';
  const isCriticalOverdue = activeView === 'critical_overdue';
  const isPaymentsList = activeView === 'payments_list';

  // Critical overdue invoices (overdue > 45 days)
  const criticalInvoices = invoices.filter(inv => inv.status === 'overdue' && (inv.daysOverdue || 0) > 45);

  const handleCreatePromise = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustId);
    if (!cust) return;

    onAddPromiseToPay({
      customerId: cust.id,
      customerName: cust.name,
      amount: Number(promiseAmount),
      promisedDate,
      contactPerson: contactPerson || cust.contactPerson,
      collectorName,
      notes: promiseNotes || 'تم الاتصال بالعميل وأكد تحويل المبلغ في الموعد المحدد',
    });

    setShowNewPromiseModal(false);
    setPromiseNotes('');
  };

  return (
    <div id="collections-view" className="p-4 sm:p-6 space-y-6 text-right max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <HandCoins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isPromisesView 
                ? 'إدارة وعود السداد والتعهدات المالية' 
                : isCriticalOverdue 
                ? 'متابعة المتأخرات الحرجة والتحصيل القانوني' 
                : isPaymentsList 
                ? 'سجل مدفوعات وسدادات العملاء' 
                : 'خطة التحصيل وجدول المتابعة اليومية'}
            </h2>
            <p className="text-xs text-slate-500">
              جدولة مهام المحصلين، متابعة التعهدات، وتوثيق استلام الشيكات والتحويلات البنكية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewPromiseModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل وعد سداد جديد</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي وعود السداد هذا الأسبوع</span>
          <div className="text-lg font-black text-slate-900 mt-1 font-mono">
            {promisesToPay.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            {promisesToPay.filter(p => p.status === 'تم الوفاء').length} وعود تم تحصيلها بنجاح
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">وعود سداد قيد الانتظار</span>
          <div className="text-lg font-black text-amber-600 mt-1 font-mono">
            {promisesToPay.filter(p => p.status === 'قيد الانتظار').length} <span className="text-xs font-normal text-slate-500">وعد</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">تتطلب متابعة هاتفية اليوم</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">مهام المحصلين المكتملة اليوم</span>
          <div className="text-lg font-black text-blue-600 mt-1 font-mono">
            {collectionTasks.filter(t => t.status === 'مكتمل').length} / {collectionTasks.length}
          </div>
          <span className="text-[11px] text-blue-600 block mt-0.5">بنسبة إنجاز 75%</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي المتأخرات الحرجة (+45 يوم)</span>
          <div className="text-lg font-black text-rose-600 mt-1 font-mono">
            {criticalInvoices.reduce((acc, curr) => acc + curr.remainingAmount, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-rose-500 block mt-0.5">{criticalInvoices.length} فواتير ذات أولوية قصوى</span>
        </div>
      </div>

      {/* Promises to Pay Table */}
      {(isPromisesView || !isCriticalOverdue && !isPaymentsList) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">سجل وعود وتعهدات السداد</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="p-3">العميل</th>
                  <th className="p-3">المبلغ الموعود</th>
                  <th className="p-3">تاريخ الوعد</th>
                  <th className="p-3">مسؤول الاتصال</th>
                  <th className="p-3">المحصل المسند إليه</th>
                  <th className="p-3">الملاحظات والتفاصيل</th>
                  <th className="p-3 text-center">حالة الوعد</th>
                  <th className="p-3 text-center">إجراء المتابعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promisesToPay.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{p.customerName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{(p.promisedAmount ?? p.amount ?? 0).toLocaleString()} ج.م</td>
                    <td className="p-3 font-mono text-slate-700">{p.promisedDate || p.promiseDate || '—'}</td>
                    <td className="p-3 text-slate-600">{p.contactPerson || 'الإدارة المالية'}</td>
                    <td className="p-3 text-slate-700 font-medium">{p.collectorName}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate" title={p.notes}>{p.notes}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        p.status === 'تم الوفاء'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'تم الإخلال'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {p.status === 'قيد الانتظار' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onUpdatePromiseStatus(p.id, 'تم الوفاء')}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition"
                            title="تم السداد بالفعل"
                          >
                            تم السداد
                          </button>
                          <button
                            onClick={() => onUpdatePromiseStatus(p.id, 'تم الإخلال')}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition"
                            title="لم يلتزم العميل"
                          >
                            إخلال بالوعد
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">مكتمل</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Tasks for Collectors Table */}
      {isDailyFollowup && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">جدول مهام وزيارات المحصلين اليومية</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="p-3">العميل المستهدف</th>
                  <th className="p-3">المنطقة</th>
                  <th className="p-3">المحصل المسند</th>
                  <th className="p-3">المبلغ المستهدف</th>
                  <th className="p-3">نوع المهمة</th>
                  <th className="p-3">تاريخ الاستحقاق</th>
                  <th className="p-3 text-center">الأولوية</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">تحديث</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collectionTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{t.customerName}</td>
                    <td className="p-3 text-slate-600">{t.region}</td>
                    <td className="p-3 text-slate-700 font-semibold">{t.assignedTo || t.collectorName}</td>
                    <td className="p-3 font-mono font-bold text-blue-700">{(t.targetAmount || 0).toLocaleString()} ج.م</td>
                    <td className="p-3 text-slate-600">{t.taskType || 'متابعة تحصيل'}</td>
                    <td className="p-3 font-mono text-slate-600">{t.dueDate}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'عاجل' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {t.status !== 'مكتمل' ? (
                        <button
                          onClick={() => onUpdateTaskStatus(t.id, 'مكتمل')}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] transition"
                        >
                          تم الإنجاز
                        </button>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Critical Overdue View */}
      {isCriticalOverdue && (
        <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="text-base font-bold">الفواتير الحرجة المتأخرة أكثر من 45 يوماً</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
              {criticalInvoices.length} فواتير حرجة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-rose-100 text-slate-500 font-semibold bg-rose-50/50">
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">المنطقة</th>
                  <th className="p-3">المبلغ المتبقي</th>
                  <th className="p-3">تاريخ الاستحقاق</th>
                  <th className="p-3 text-center">أيام التأخير</th>
                  <th className="p-3 text-center">الإجراء الموصى به</th>
                  <th className="p-3 text-center">سداد فوري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {criticalInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-rose-50/30 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="p-3 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="p-3 text-slate-600">{inv.region || 'القاهرة'}</td>
                    <td className="p-3 font-mono font-bold text-rose-600">{inv.remainingAmount.toLocaleString()} ج.م</td>
                    <td className="p-3 font-mono text-slate-600">{inv.dueDate}</td>
                    <td className="p-3 text-center font-mono font-black text-rose-700">
                      {inv.daysOverdue} يوم
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 text-[10px] font-bold">
                        إنذار رسمي / إيقاف ائتماني
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectInvoiceForPayment(inv)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition"
                      >
                        تسجيل سداد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: New Promise to Pay */}
      {showNewPromiseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">تسجيل وعد سداد جديد للعميل</h3>
              <button 
                onClick={() => setShowNewPromiseModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromise} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">العميل</label>
                <select
                  value={selectedCustId}
                  onChange={(e) => setSelectedCustId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:border-emerald-500"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (المديونية القائمة: {(c.totalOutstanding || 0).toLocaleString()} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ الموعود بسداده (ج.م)</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={promiseAmount}
                    onChange={(e) => setPromiseAmount(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ الوعد بالسداد</label>
                  <input
                    type="date"
                    value={promisedDate}
                    onChange={(e) => setPromisedDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اسم المسؤول المتصل به</label>
                  <input
                    type="text"
                    placeholder="مثال: أ. طارق الشاذلي - المدير المالي"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المحصل المسند إليه</label>
                  <select
                    value={collectorName}
                    onChange={(e) => setCollectorName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:border-emerald-500"
                  >
                    <option value="أحمد محمد">أحمد محمد</option>
                    <option value="سارة علي">سارة علي</option>
                    <option value="محمد عبد الله">محمد عبد الله</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات المكالمة / وسيلة السداد المتفق عليها</label>
                <textarea
                  rows={3}
                  value={promiseNotes}
                  onChange={(e) => setPromiseNotes(e.target.value)}
                  placeholder="مثال: تم الاتفاق على إرسال شيك مصرفي أو تحويل بنكي على حساب البنك الأهلي المصري..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewPromiseModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  حفظ الوعد وتثبيته
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
