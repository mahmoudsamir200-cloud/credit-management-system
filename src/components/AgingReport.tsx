import React, { useState } from 'react';
import { BarChart3, Printer, Download, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Customer, Invoice, AgingBucket } from '../types';
import { formatCurrency } from '../utils/storage';

interface AgingReportProps {
  customers: Customer[];
  invoices: Invoice[];
  aging: AgingBucket[];
}

export const AgingReport: React.FC<AgingReportProps> = ({
  customers = [],
  invoices = [],
  aging = [],
}) => {
  const [filterText, setFilterText] = useState('');

  // Calculate customer aging matrix
  const customerRows = (customers || []).map((c) => {
    const custInvoices = (invoices || []).filter((i) => i.customerId === c.id && i.remainingAmount > 0);

    let current = 0;
    let b1to30 = 0;
    let b31to60 = 0;
    let b61to90 = 0;
    let b90plus = 0;

    custInvoices.forEach((inv) => {
      const days = inv.daysOverdue || 0;
      if (days <= 0) {
        current += inv.remainingAmount;
      } else if (days <= 30) {
        b1to30 += inv.remainingAmount;
      } else if (days <= 60) {
        b31to60 += inv.remainingAmount;
      } else if (days <= 90) {
        b61to90 += inv.remainingAmount;
      } else {
        b90plus += inv.remainingAmount;
      }
    });

    const total = current + b1to30 + b31to60 + b61to90 + b90plus;

    return {
      id: c.id,
      code: c.code,
      name: c.name,
      creditLimit: c.creditLimit,
      current,
      b1to30,
      b31to60,
      b61to90,
      b90plus,
      total,
      unpaidInvoicesCount: custInvoices.length,
    };
  }).filter((r) => r.total > 0 || !filterText);

  const filteredRows = customerRows.filter((r) =>
    r.name.toLowerCase().includes(filterText.toLowerCase()) ||
    r.code.toLowerCase().includes(filterText.toLowerCase())
  );

  // Grand totals
  const grandCurrent = filteredRows.reduce((a, b) => a + b.current, 0);
  const grand1to30 = filteredRows.reduce((a, b) => a + b.b1to30, 0);
  const grand31to60 = filteredRows.reduce((a, b) => a + b.b31to60, 0);
  const grand61to90 = filteredRows.reduce((a, b) => a + b.b61to90, 0);
  const grand90plus = filteredRows.reduce((a, b) => a + b.b90plus, 0);
  const grandTotal = grandCurrent + grand1to30 + grand31to60 + grand61to90 + grand90plus;

  const handleExportCSV = () => {
    const headers = ['كود العميل', 'اسم العميل', 'سقف الائتمان', 'غير مستحقة', '1-30 يوم', '31-60 يوم', '61-90 يوم', 'أكثر من 90 يوم', 'إجمالي المديونية'];
    const rows = filteredRows.map((r) => [
      r.code,
      `"${r.name}"`,
      r.creditLimit,
      r.current,
      r.b1to30,
      r.b31to60,
      r.b61to90,
      r.b90plus,
      r.total,
    ]);

    const csv = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `تقرير_أعمار_الديون_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div id="aging-view" className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">تقرير أعمار الديون والآجال (Aging Matrix)</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            تحليل تفصيلي لمستحقات كل عميل مقسمة بحسب فترات التأخير لترتيب أولويات التحصيل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition"
          >
            <Printer className="w-3.5 h-3.5 text-stone-500" />
            <span>طباعة التقرير</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Aging Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {aging.map((b) => (
          <div key={b.key} className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mb-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="truncate">{b.label}</span>
            </div>
            <div className="text-base font-bold text-stone-900 font-mono">
              {formatCurrency(b.amount)}
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {b.count} فواتير قائمة
            </div>
          </div>
        ))}
      </div>

      {/* Table of Customers */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
          <input
            type="text"
            placeholder="تصفية باسم العميل أو الكود..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 w-64 bg-white"
          />
          <span className="text-xs text-stone-500">
            عدد العملاء المدينين: <strong>{filteredRows.filter(r => r.total > 0).length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="p-3">العميل</th>
                <th className="p-3">سقف الائتمان</th>
                <th className="p-3 text-emerald-800">غير مستحقة (سارية)</th>
                <th className="p-3 text-amber-700">1 - 30 يوم</th>
                <th className="p-3 text-orange-700">31 - 60 يوم</th>
                <th className="p-3 text-red-600">61 - 90 يوم</th>
                <th className="p-3 text-red-900">أكثر من 90 يوم</th>
                <th className="p-3 font-bold text-stone-900 bg-stone-100/70">إجمالي المديونية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/70 transition">
                  
                  <td className="p-3 font-sans">
                    <div className="font-bold text-stone-900">{row.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">{row.code}</div>
                  </td>

                  <td className="p-3 text-stone-600">
                    {formatCurrency(row.creditLimit)}
                  </td>

                  <td className={`p-3 ${row.current > 0 ? 'text-stone-800 font-semibold' : 'text-stone-300'}`}>
                    {row.current > 0 ? formatCurrency(row.current) : '—'}
                  </td>

                  <td className={`p-3 ${row.b1to30 > 0 ? 'text-amber-800 font-semibold' : 'text-stone-300'}`}>
                    {row.b1to30 > 0 ? formatCurrency(row.b1to30) : '—'}
                  </td>

                  <td className={`p-3 ${row.b31to60 > 0 ? 'text-orange-800 font-semibold' : 'text-stone-300'}`}>
                    {row.b31to60 > 0 ? formatCurrency(row.b31to60) : '—'}
                  </td>

                  <td className={`p-3 ${row.b61to90 > 0 ? 'text-red-700 font-bold bg-red-50/40' : 'text-stone-300'}`}>
                    {row.b61to90 > 0 ? formatCurrency(row.b61to90) : '—'}
                  </td>

                  <td className={`p-3 ${row.b90plus > 0 ? 'text-red-900 font-bold bg-red-100/40' : 'text-stone-300'}`}>
                    {row.b90plus > 0 ? formatCurrency(row.b90plus) : '—'}
                  </td>

                  <td className="p-3 font-bold text-stone-900 bg-stone-50/70">
                    {formatCurrency(row.total)}
                  </td>

                </tr>
              ))}
            </tbody>

            {/* Grand Total Footer */}
            <tfoot className="bg-stone-100/90 font-bold text-stone-900 border-t-2 border-stone-300 font-mono">
              <tr>
                <td className="p-3 font-sans">الإجمالي العام لجميع العملاء</td>
                <td className="p-3 text-stone-600">
                  {formatCurrency(customers.reduce((a, b) => a + b.creditLimit, 0))}
                </td>
                <td className="p-3 text-emerald-800">{formatCurrency(grandCurrent)}</td>
                <td className="p-3 text-amber-800">{formatCurrency(grand1to30)}</td>
                <td className="p-3 text-orange-800">{formatCurrency(grand31to60)}</td>
                <td className="p-3 text-red-700">{formatCurrency(grand61to90)}</td>
                <td className="p-3 text-red-900">{formatCurrency(grand90plus)}</td>
                <td className="p-3 text-base text-stone-900 bg-stone-200/80">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
