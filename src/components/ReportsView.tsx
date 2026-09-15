import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Filter, 
  MapPin, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  Building,
  UserCheck,
  Search,
  X
} from 'lucide-react';
import { Customer, Invoice, Payment, AgingBucket, ActiveNavView } from '../types';
import { calculateCollectedAmount, formatNumber, exportInvoicesToCSV } from '../utils/storage';

interface ReportsViewProps {
  activeView: ActiveNavView;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  aging: AgingBucket[];
  onNavigateToCustomBuilder?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeView,
  customers = [],
  invoices = [],
  payments = [],
  aging = [],
  onNavigateToCustomBuilder,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedAreaManager, setSelectedAreaManager] = useState<string>('all');
  const [searchManagerQuery, setSearchManagerQuery] = useState<string>('');

  // Extract unique Area Managers from invoices
  const availableManagers = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.areaManager) set.add(inv.areaManager);
    });
    return Array.from(set).sort();
  }, [invoices]);

  // Filtered invoices according to selected area manager or manager search text
  const filteredInvoices = useMemo(() => {
    const q = searchManagerQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      // Area Manager dropdown filter
      const matchesManager = 
        selectedAreaManager === 'all' ||
        (selectedAreaManager === 'unassigned' && !inv.areaManager) ||
        inv.areaManager === selectedAreaManager;

      // Search by manager name or invoice/customer
      const matchesQuery = 
        !q ||
        (inv.areaManager && inv.areaManager.toLowerCase().includes(q)) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q);

      return matchesManager && matchesQuery;
    });
  }, [invoices, selectedAreaManager, searchManagerQuery]);

  // Calculations based on filtered invoices
  const totalDebt = filteredInvoices.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalInvoiced = filteredInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCollected = calculateCollectedAmount(filteredInvoices);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  // Area Managers Performance Report
  const areaManagersList = useMemo(() => {
    const managerMap = new Map<string, { 
      name: string; 
      region: string;
      debt: number; 
      invoiced: number; 
      collected: number; 
      overdueDebt: number;
      invoicesCount: number;
      rate: number;
    }>();

    invoices.forEach((invoice) => {
      const mgrName = invoice.areaManager || 'غير محدد';
      const existing = managerMap.get(mgrName) || { 
        name: mgrName, 
        region: invoice.region || '—',
        debt: 0, 
        invoiced: 0, 
        collected: 0, 
        overdueDebt: 0,
        invoicesCount: 0,
        rate: 0 
      };

      existing.invoicesCount += 1;
      existing.debt += invoice.remainingAmount || 0;
      existing.invoiced += invoice.totalAmount || 0;
      existing.collected += invoice.paidAmount || 0;
      if (invoice.status === 'overdue' && invoice.remainingAmount > 0) {
        existing.overdueDebt += invoice.remainingAmount;
      }
      if (invoice.region && existing.region === '—') {
        existing.region = invoice.region;
      }
      managerMap.set(mgrName, existing);
    });

    const results = Array.from(managerMap.values()).map((mgr) => {
      const rate = mgr.invoiced > 0 ? Math.min(100, Math.round((mgr.collected / mgr.invoiced) * 100)) : 0;
      return { ...mgr, rate };
    });

    return results.sort((a, b) => b.invoiced - a.invoiced);
  }, [invoices]);

  const regionsList = useMemo(() => {
    const regionMap = new Map<string, { name: string; debt: number; invoiced: number; collected: number; rate: number }>();
    const customerById = new Map(customers.map((customer) => [customer.id, customer]));

    invoices.forEach((invoice) => {
      const customer = customerById.get(invoice.customerId);
      const region = customer?.region || invoice.region || 'أخرى';
      const existing = regionMap.get(region) || { name: region, debt: 0, invoiced: 0, collected: 0, rate: 0 };
      existing.debt += invoice.remainingAmount || 0;
      existing.invoiced += invoice.totalAmount || 0;
      existing.collected += invoice.paidAmount || 0;
      regionMap.set(region, existing);
    });

    const results = Array.from(regionMap.values()).map((region) => {
      const rate = region.invoiced > 0 ? Math.min(100, Math.round((region.collected / region.invoiced) * 100)) : 0;
      return { ...region, rate };
    });

    return results.length > 0 ? results : [{ name: 'أخرى', debt: 0, invoiced: 0, collected: 0, rate: 0 }];
  }, [customers, invoices]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    exportInvoicesToCSV(filteredInvoices);
  };

  const isFiltered = selectedAreaManager !== 'all' || searchManagerQuery.trim() !== '';

  return (
    <div id="reports-view" className="p-4 sm:p-6 space-y-6 text-right max-w-[1600px] mx-auto print:p-0">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeView === 'report_branches' 
                ? 'تقرير الأداء الإقليمي ومديري المناطق' 
                : activeView === 'report_risks' 
                ? 'تقرير ومصفوفة تقييم المخاطر الائتمانية' 
                : activeView === 'report_collection' 
                ? 'تقرير مؤشرات وكفاءة التحصيل' 
                : 'التقرير المالي والتنفيذي الشامل'}
            </h2>
            <p className="text-xs text-slate-500">
              تحليلات دقيقة لأداء مديري المناطق، أعمار الديون، معدلات التحصيل والبحث المخصص
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToCustomBuilder && (
            <button
              onClick={onNavigateToCustomBuilder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="تخصيص واختيار الأعمدة والفلاتر (كود العميل، المدير، الفرع، الاستحقاق...)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>مُنشئ ومُخصص التقارير (Custom)</span>
            </button>
          )}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسيل / CSV {isFiltered && `(${filteredInvoices.length} مفلترة)`}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Area Manager Interactive Search & Filter Bar */}
      <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white p-4 rounded-2xl border border-blue-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">بحث وتصفية التقارير بمدير المنطقة</h3>
              <p className="text-[11px] text-slate-500">
                اختر المدير أو اكتب اسمه في شريط البحث لعرض الأرقام والمؤشرات الخاصة بفواتيره فقط
              </p>
            </div>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSelectedAreaManager('all');
                setSearchManagerQuery('');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 bg-white border border-rose-200 px-2.5 py-1 rounded-lg shadow-2xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>إلغاء التصفية وعرض الكل ({invoices.length} فاتورة)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Search by Manager Name */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchManagerQuery}
              onChange={(e) => setSearchManagerQuery(e.target.value)}
              placeholder="ابحث باسم مدير المنطقة فقط (مثال: أحمد، طارق، فاروق...)"
              className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 placeholder:text-slate-400"
            />
            {searchManagerQuery && (
              <button
                type="button"
                onClick={() => setSearchManagerQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Select Area Manager Dropdown */}
          <div className="relative">
            <select
              value={selectedAreaManager}
              onChange={(e) => setSelectedAreaManager(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-semibold"
            >
              <option value="all">جميع مديري المناطق ({invoices.length} فاتورة مسجلة)</option>
              {availableManagers.map((mgr) => {
                const count = invoices.filter((i) => i.areaManager === mgr).length;
                return (
                  <option key={mgr} value={mgr}>
                    {mgr} ({count} فاتورة)
                  </option>
                );
              })}
              {invoices.some((i) => !i.areaManager) && (
                <option value="unassigned">فواتير بدون مدير محدد ({invoices.filter((i) => !i.areaManager).length})</option>
              )}
            </select>
          </div>
        </div>

        {isFiltered && (
          <div className="pt-1 text-xs text-blue-900 font-semibold flex items-center justify-between border-t border-blue-100">
            <span>
              عرض نتائج تقرير: {selectedAreaManager !== 'all' ? selectedAreaManager : `بحث باسم "${searchManagerQuery}"`}
            </span>
            <span>عدد الفواتير المشمولة: {filteredInvoices.length} من أصل {invoices.length}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي المديونية المستحقة</span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {totalDebt.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">
            {isFiltered ? 'للمدير المحدد حالياً' : 'عبر جميع الفروع والمديرين'}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي المبالغ المحصلة</span>
          <div className="text-xl font-black text-emerald-600 mt-1 font-mono">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">بنسبة تحصيل {collectionRate}%</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">المتأخرات أكثر من 60 يوماً</span>
          <div className="text-xl font-black text-rose-600 mt-1 font-mono">
            {(
              (aging.find((a) => a.key === '61-90')?.amount || 0) +
              (aging.find((a) => a.key === '90+')?.amount || 0)
            ).toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">تتطلب مخصصات ديون مشكوك فيها</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي الضمانات البنكية المحتجزة</span>
          <div className="text-xl font-black text-purple-700 mt-1 font-mono">
            {customers.reduce((acc, curr) => acc + (curr.guaranteeAmount || 0), 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-purple-600 font-medium mt-0.5 block">شيكات ضمان وخطابات ضمان بنكية</span>
        </div>
      </div>

      {/* Area Managers Performance & Collection Table (Dedicated Report) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">تقرير أداء ومؤشرات تحصيل مديري المناطق</h3>
              <p className="text-xs text-slate-500">متابعة دقيقة لحجم مبيعات وفواتير كل مدير منطقة ونسب تحصيله والمتأخرات</p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60">
            {areaManagersList.length} مديرين مسجلين
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50/80">
                <th className="p-3">مدير المنطقة</th>
                <th className="p-3">عدد الفواتير</th>
                <th className="p-3">إجمالي الصادر (ج.م)</th>
                <th className="p-3">المحصل الفعلي (ج.م)</th>
                <th className="p-3">المديونية المتبقية (ج.م)</th>
                <th className="p-3">متأخرات حرجة</th>
                <th className="p-3">نسبة التحصيل</th>
                <th className="p-3 text-center">إجراء وتصفية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {areaManagersList.map((mgr) => {
                const isSelected = selectedAreaManager === mgr.name;
                return (
                  <tr 
                    key={mgr.name} 
                    className={`transition hover:bg-blue-50/40 ${isSelected ? 'bg-blue-50/70 font-semibold' : ''}`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {mgr.name.slice(0, 1)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{mgr.name}</div>
                          {mgr.region !== '—' && (
                            <span className="text-[10px] text-slate-500">{mgr.region}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">{mgr.invoicesCount}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{mgr.invoiced.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">{mgr.collected.toLocaleString()}</td>
                    <td className="p-3 font-mono font-bold text-amber-700">{mgr.debt.toLocaleString()}</td>
                    <td className="p-3 font-mono text-rose-600">
                      {mgr.overdueDebt > 0 ? (
                        <span className="font-bold">{mgr.overdueDebt.toLocaleString()}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${mgr.rate >= 75 ? 'bg-emerald-600' : mgr.rate >= 50 ? 'bg-blue-600' : 'bg-amber-500'}`}
                            style={{ width: `${mgr.rate}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700">{mgr.rate}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedAreaManager === mgr.name) {
                            setSelectedAreaManager('all');
                          } else {
                            setSelectedAreaManager(mgr.name);
                            setSearchManagerQuery('');
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer border ${
                          isSelected 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {isSelected ? 'إلغاء التصفية' : 'تصفية الفواتير'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regional Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">تقرير توزيع المديونية والأداء حسب الفروع والمناطق</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="p-3">المنطقة / الفرع</th>
                <th className="p-3">إجمالي المديونية</th>
                <th className="p-3">المحصل الفعلي</th>
                <th className="p-3">إجمالي الفواتير</th>
                <th className="p-3">نسبة الإنجاز</th>
                <th className="p-3">مستوى المخاطر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regionsList.map((r) => (
                <tr key={r.name} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-900">{r.name}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{r.debt.toLocaleString()} ج.م</td>
                  <td className="p-3 font-mono font-bold text-emerald-600">{r.collected.toLocaleString()} ج.م</td>
                  <td className="p-3 font-mono text-slate-600">{r.invoiced.toLocaleString()} ج.م</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${r.rate}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-700">{r.rate}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.rate >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.rate >= 75 ? 'مستقر' : 'يحتاج متابعة'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debt Aging Analysis Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">جدول تحليل أعمار الديون التفصيلي</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="p-3">فترة الاستحقاق (الشريحة العمرية)</th>
                <th className="p-3">إجمالي الرصيد</th>
                <th className="p-3">عدد الفواتير</th>
                <th className="p-3">النسبة من الإجمالي</th>
                <th className="p-3">نسبة المخصص المقترحة</th>
                <th className="p-3">قيمة مخصص الديون</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aging.map((b) => {
                const provRate = b.key === 'current' ? 1 : b.key === '1-30' ? 3 : b.key === '31-60' ? 10 : b.key === '61-90' ? 30 : 70;
                const provAmount = Math.round((b.amount * provRate) / 100);

                return (
                  <tr key={b.key} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{b.label}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{b.amount.toLocaleString()} ج.م</td>
                    <td className="p-3 font-mono text-slate-600">{b.count} فاتورة</td>
                    <td className="p-3 font-mono font-semibold text-blue-600">{b.percentage}%</td>
                    <td className="p-3 font-mono text-slate-700">{provRate}%</td>
                    <td className="p-3 font-mono font-bold text-rose-600">{provAmount.toLocaleString()} ج.م</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
