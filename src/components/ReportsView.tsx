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
  Building
} from 'lucide-react';
import { Customer, Invoice, Payment, AgingBucket, ActiveNavView } from '../types';
import { calculateCollectedAmount, formatNumber, exportInvoicesToCSV } from '../utils/storage';

interface ReportsViewProps {
  activeView: ActiveNavView;
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  aging: AgingBucket[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeView,
  customers = [],
  invoices = [],
  payments = [],
  aging = [],
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Calculations
  const totalDebt = invoices.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCollected = calculateCollectedAmount(invoices);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

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
    exportInvoicesToCSV(invoices);
  };

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
                ? 'تقرير الأداء الإقليمي والفروع' 
                : activeView === 'report_risks' 
                ? 'تقرير ومصفوفة تقييم المخاطر الائتمانية' 
                : activeView === 'report_collection' 
                ? 'تقرير مؤشرات وكفاءة التحصيل' 
                : 'التقرير المالي والتنفيذي الشامل'}
            </h2>
            <p className="text-xs text-slate-500">
              تحليلات دقيقة لأعمار الديون، معدلات السداد، واستغلال السقوف الائتمانية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسيل / CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي المديونية المستحقة</span>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">
            {totalDebt.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-blue-600 font-medium mt-0.5 block">عبر جميع الفروع والمناطق</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">إجمالي المبالغ المحصلة</span>
          <div className="text-xl font-black text-emerald-600 mt-1 font-mono">
            {totalCollected.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">بنسبة تحصيل عامة {collectionRate}%</span>
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
