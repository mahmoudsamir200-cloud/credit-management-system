import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  AlertTriangle, 
  Building, 
  UserCheck, 
  ArrowUpRight, 
  FileText, 
  Search,
  Filter,
  Lock,
  Unlock,
  Coins
} from 'lucide-react';
import { Customer, CreditApprovalRequest, ActiveNavView, Invoice } from '../types';
import { formatCurrency } from '../utils/storage';

interface CreditManagementViewProps {
  activeView: ActiveNavView;
  customers: Customer[];
  invoices: Invoice[];
  creditRequests: CreditApprovalRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onAddCreditRequest: (request: Omit<CreditApprovalRequest, 'id' | 'requestNumber' | 'status'>) => void;
  onToggleSuspendCustomer: (customerId: string, reason?: string) => void;
  onSelectCustomer: (customer: Customer) => void;
}

export const CreditManagementView: React.FC<CreditManagementViewProps> = ({
  activeView,
  customers = [],
  invoices = [],
  creditRequests = [],
  onApproveRequest,
  onRejectRequest,
  onAddCreditRequest,
  onToggleSuspendCustomer,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [requestedIncrease, setRequestedIncrease] = useState(1000000);
  const [reason, setReason] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'over_limit' | 'near_limit' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'outstanding' | 'name'>('risk');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Suspended modal
  const [suspendModalCustomer, setSuspendModalCustomer] = useState<Customer | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');

  // Filter based on active sub-view
  const isSuspendedView = activeView === 'suspended_customers';
  const isApprovalsView = activeView === 'credit_approvals';
  const isLimitIncreaseView = activeView === 'limit_increases' || activeView === 'credit_requests';
  const isPositionsView = activeView === 'credit_positions';

  const enrichedCustomers = customers.map((customer) => {
    const outstanding = invoices
      .filter((invoice) => invoice.customerId === customer.id)
      .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);
    const limit = customer.creditLimit || 0;
    const utilization = limit > 0 ? (outstanding / limit) * 100 : 0;
    return { ...customer, outstanding, utilization };
  });

  const creditSummary = enrichedCustomers.reduce((summary, customer) => {
    summary.totalLimits += customer.creditLimit || 0;
    summary.totalOutstanding += customer.outstanding;
    if (customer.utilization > 100) summary.overLimit += 1;
    if (customer.utilization >= 80 && customer.utilization <= 100) summary.nearLimit += 1;
    if (customer.isSuspended || customer.status === 'موقوف') summary.suspended += 1;
    return summary;
  }, { totalLimits: 0, totalOutstanding: 0, overLimit: 0, nearLimit: 0, suspended: 0 });

  const filteredCustomers = enrichedCustomers.filter(c => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(normalizedSearch) || c.code.toLowerCase().includes(normalizedSearch);
    if (isSuspendedView) {
      return matchesSearch && (c.isSuspended || c.status === 'موقوف');
    }
    if (riskFilter === 'over_limit') return matchesSearch && c.utilization > 100;
    if (riskFilter === 'near_limit') return matchesSearch && c.utilization >= 80 && c.utilization <= 100;
    if (riskFilter === 'suspended') return matchesSearch && (c.isSuspended || c.status === 'موقوف');
    return matchesSearch;
  });

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    onAddCreditRequest({
      customerId: cust.id,
      customerName: cust.name,
      region: cust.region,
      currentLimit: cust.creditLimit,
      requestedIncrease: Number(requestedIncrease),
      requestDate: new Date().toISOString().slice(0, 10),
      reason: reason || 'طلب زيادة سقف التسهيلات الائتمانية',
    });

    setShowNewRequestModal(false);
    setReason('');
  };

  return (
    <div id="credit-management-view" className="p-4 sm:p-6 space-y-6 text-right max-w-[1600px] mx-auto">
      
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isSuspendedView ? 'سجل العملاء الموقوفين ائتمانياً' : isApprovalsView ? 'اعتماد طلبات الموافقة الائتمانية' : isPositionsView ? 'المراكز الائتمانية وتحليل المخاطر' : 'إدارة الحدود الائتمانية'}
            </h2>
            <p className="text-xs text-slate-500">
              {isPositionsView ? 'مراقبة الاستخدام والمديونية والتجاوزات لاتخاذ قرارات ائتمانية دقيقة' : 'إدارة الحدود وطلبات الزيادة والموافقات الائتمانية'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPositionsView && <button
            onClick={() => setShowNewRequestModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>طلب زيادة حد ائتماني جديد</span>
          </button>}
        </div>
      </div>

      {/* Approvals Section (Show at top if in approvals view) */}
      {(isApprovalsView || isLimitIncreaseView) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">طلبات التسهيل والزيادة الائتمانية</h3>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              إجمالي {creditRequests.length} طلبات مسجلة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="p-3">رقم الطلب</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">المنطقة</th>
                  <th className="p-3">الحد الحالي</th>
                  <th className="p-3">الزيادة المطلوبة</th>
                  <th className="p-3">الحد الجديد المقترح</th>
                  <th className="p-3">السبب / الملاحظات</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditRequests.map((req) => {
                  const newProposed = req.currentLimit + req.requestedIncrease;
                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-800">{req.requestNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{req.customerName}</td>
                      <td className="p-3 text-slate-600">{req.region}</td>
                      <td className="p-3 font-mono font-semibold text-slate-700">{req.currentLimit.toLocaleString()} ج.م</td>
                      <td className="p-3 font-mono font-bold text-blue-600">+{req.requestedIncrease.toLocaleString()} ج.م</td>
                      <td className="p-3 font-mono font-bold text-emerald-700">{newProposed.toLocaleString()} ج.م</td>
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={req.reason}>
                        {req.reason}
                        {req.reviewerNotes && <span className="block text-[10px] text-amber-600 mt-0.5">{req.reviewerNotes}</span>}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'موافق عليه'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'مرفوض'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {req.status === 'قيد المراجعة' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onApproveRequest(req.id)}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-xs transition"
                            >
                              موافقة واعتماد
                            </button>
                            <button
                              onClick={() => onRejectRequest(req.id)}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow-xs transition"
                            >
                              رفض الطلب
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            تم البت في {req.reviewedDate || req.requestDate}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isApprovalsView && !isLimitIncreaseView && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs"><span className="text-xs text-slate-500">إجمالي الحدود</span><strong className="block mt-1 text-lg text-slate-900">{formatCurrency(creditSummary.totalLimits)}</strong></div>
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs"><span className="text-xs text-slate-500">إجمالي المستخدم</span><strong className="block mt-1 text-lg text-blue-700">{formatCurrency(creditSummary.totalOutstanding)}</strong></div>
          <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-2xs"><span className="text-xs text-slate-500">إجمالي المتاح</span><strong className="block mt-1 text-lg text-emerald-700">{formatCurrency(Math.max(0, creditSummary.totalLimits - creditSummary.totalOutstanding))}</strong></div>
          <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-2xs"><span className="text-xs text-slate-500">متجاوزو الحد</span><strong className="block mt-1 text-lg text-rose-700">{creditSummary.overLimit} عميل</strong></div>
          <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs"><span className="text-xs text-slate-500">قريبون من الحد</span><strong className="block mt-1 text-lg text-amber-700">{creditSummary.nearLimit} عميل</strong></div>
        </div>
      )}

      {/* Customer Credit Positions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {isSuspendedView ? 'قائمة العملاء الموقوفين' : 'مراكز الائتمان وسقوف التسهيل الحالية'}
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="بحث باسم العميل أو الكود..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
          </div>
          <select value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setCurrentPage(1); }} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700">
            <option value="risk">الأعلى خطورة</option>
            <option value="outstanding">أعلى مديونية</option>
            <option value="name">اسم العميل</option>
          </select>
          </div>
        </div>

        {!isSuspendedView && !isApprovalsView && !isLimitIncreaseView && (
          <div className="flex items-center gap-2 flex-wrap border-t border-slate-100 pt-3">
            {[
              ['all', 'كل العملاء'],
              ['over_limit', 'متجاوزو الحد'],
              ['near_limit', 'قريبون من الحد'],
              ['suspended', 'موقوفون'],
              ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => { setRiskFilter(value as typeof riskFilter); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${riskFilter === value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="p-3">كود العميل</th>
                <th className="p-3">اسم الشركة / العميل</th>
                <th className="p-3">المنطقة</th>
                <th className="p-3">الحد الائتماني</th>
                <th className="p-3">المديونية القائمة</th>
                <th className="p-3">المتاح الائتماني</th>
                <th className="p-3">نسبة الاستغلال</th>
                <th className="p-3">شيكات وضمانات</th>
                <th className="p-3 text-center">الحالة</th>
                <th className="p-3 text-center">إجراءات الائتمان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...filteredCustomers]
                .sort((a, b) => {
                  if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
                  if (sortBy === 'outstanding') return b.outstanding - a.outstanding;
                  return b.utilization - a.utilization || b.outstanding - a.outstanding;
                })
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((c) => {
                const limit = c.creditLimit || 0;
                const outstanding = c.outstanding;
                const available = Math.max(0, limit - outstanding);
                const overage = Math.max(0, outstanding - limit);
                const utilRatio = Math.round(c.utilization);
                const isOverLimit = outstanding > limit;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-600">{c.code}</td>
                    <td className="p-3 font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onSelectCustomer(c)}>
                      {c.name}
                    </td>
                    <td className="p-3 text-slate-600">{c.region}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{limit.toLocaleString()} ج.م</td>
                    <td className="p-3 font-mono font-bold text-blue-700">{outstanding.toLocaleString()} ج.م</td>
                    <td className={`p-3 font-mono font-bold ${overage > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {available.toLocaleString()} ج.م
                      {overage > 0 && <span className="block text-[10px] text-rose-600 mt-0.5">تجاوز: {overage.toLocaleString()} ج.م</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              utilRatio > 90 ? 'bg-rose-600' : utilRatio > 75 ? 'bg-amber-500' : 'bg-blue-600'
                            }`} 
                            style={{ width: `${utilRatio}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-700">{utilRatio}%</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {(c.guaranteeAmount || 0).toLocaleString()} ج.م
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        c.isSuspended || c.status === 'موقوف'
                          ? 'bg-purple-600 text-white'
                          : isOverLimit
                          ? 'bg-rose-600 text-white'
                          : c.status === 'حرج'
                          ? 'bg-rose-100 text-rose-800'
                          : c.status === 'يحتاج متابعة'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.isSuspended || c.status === 'موقوف' ? 'موقوف ائتمانياً' : isOverLimit ? 'متجاوز الحد' : c.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isPositionsView ? (
                          <span className="px-2 py-1 rounded bg-slate-50 text-slate-600 text-[11px] font-medium">مراقبة فقط</span>
                        ) : c.isSuspended || c.status === 'موقوف' ? (
                          <button
                            onClick={() => onToggleSuspendCustomer(c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition border border-emerald-200"
                            title="فك الإيقاف والسماح بإصدار فواتير"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>فك الإيقاف</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSuspendModalCustomer(c);
                              setSuspendReasonInput('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition border border-rose-200"
                            title="إيقاف العميل ائتمانياً"
                          >
                            <Lock className="w-3 h-3" />
                            <span>إيقاف ائتماني</span>
                          </button>
                        )}
                        <button
                          onClick={() => onSelectCustomer(c)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition"
                        >
                          كشف الحساب
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span>إجمالي النتائج: {filteredCustomers.length} · صفحة {currentPage} من {Math.max(1, Math.ceil(filteredCustomers.length / pageSize))}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40">السابق</button>
            <button type="button" disabled={currentPage >= Math.ceil(filteredCustomers.length / pageSize)} onClick={() => setCurrentPage((page) => Math.min(Math.max(1, Math.ceil(filteredCustomers.length / pageSize)), page + 1))} className="px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-40">التالي</button>
          </div>
        </div>
      </div>

      {/* Modal: New Credit Limit Increase Request */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">طلب زيادة حد ائتماني جديد</h3>
              <button 
                onClick={() => setShowNewRequestModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اختر العميل</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:border-blue-500"
                  required
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (الحد الحالي: {c.creditLimit.toLocaleString()} ج.م - {c.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">مبلغ الزيادة المطلوبة (ج.م)</label>
                <input
                  type="number"
                  min="50000"
                  step="50000"
                  value={requestedIncrease}
                  onChange={(e) => setRequestedIncrease(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">مبررات الزيادة / الضمانات المقدمة</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: زيادة عقود التوريد، تقديم شيك ضمان بنكي مقبول الدفع من بنك مصر..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs"
                >
                  إرسال الطلب للاعتماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Suspension */}
      {suspendModalCustomer && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">إيقاف التعامل الائتماني للعميل</h3>
            </div>
            
            <p className="text-xs text-slate-600">
              أنت على وشك إيقاف التسهيلات الائتمانية لشركة <strong>{suspendModalCustomer.name}</strong> ومنع إصدار أي فواتير جديدة له.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">سبب الإيقاف (إلزامي للتدقيق)</label>
              <textarea
                rows={3}
                value={suspendReasonInput}
                onChange={(e) => setSuspendReasonInput(e.target.value)}
                placeholder="مثال: تجاوز السقف الائتماني، ارتداد شيكات، تعثر أكثر من 60 يوماً..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSuspendModalCustomer(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleSuspendCustomer(suspendModalCustomer.id, suspendReasonInput || 'إيقاف بقرار إدارة الائتمان');
                  setSuspendModalCustomer(null);
                }}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs"
              >
                تأكيد الإيقاف الائتماني
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
