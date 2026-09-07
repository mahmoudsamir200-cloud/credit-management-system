import React, { useState } from 'react';
import { CreditCard, Search, Plus, Download, Printer, CheckCircle2 } from 'lucide-react';
import { Payment } from '../types';
import { formatCurrency } from '../utils/storage';

interface PaymentListProps {
  payments: Payment[];
  onOpenNewPayment: () => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  payments = [],
  onOpenNewPayment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  const filteredPayments = (payments || []).filter((p) => {
    const matchesSearch =
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  const totalFiltered = filteredPayments.reduce((acc, curr) => acc + curr.amount, 0);

  const handleExportCSV = () => {
    const headers = ['تاريخ السداد', 'رقم الفاتورة', 'اسم العميل', 'المبلغ المسدد', 'طريقة السداد', 'رقم المرجع / الشيك', 'ملاحظات'];
    const rows = filteredPayments.map((p) => [
      p.paymentDate,
      p.invoiceNumber,
      `"${p.customerName}"`,
      p.amount,
      p.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : p.paymentMethod === 'cheque' ? 'شيك' : 'نقدي',
      `"${p.referenceNumber}"`,
      `"${p.notes || ''}"`,
    ]);

    const csv = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `سجل_التحصيلات_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div id="payments-view" className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">سجل المدفوعات والتحصيلات</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            توثيق جميع حركات السداد والشيكات والتحويلات المسجلة على الفواتير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير كشف</span>
          </button>

          <button
            onClick={onOpenNewPayment}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل سداد جديد</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة، العميل، رقم الشيك أو الحوالة..."
              className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 bg-white text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">جميع طرق السداد</option>
              <option value="bank_transfer">تحويل بنكي</option>
              <option value="cheque">شيك بنكي</option>
              <option value="cash">نقدي (خزينة)</option>
              <option value="deposit">إيداع نقدي</option>
            </select>
          </div>

        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-600">
          <span>عدد الحركات: <strong>{filteredPayments.length}</strong> عملية سداد</span>
          <span>إجمالي المبلغ المحصل: <strong className="text-emerald-700">{formatCurrency(totalFiltered)}</strong></span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <CreditCard className="w-8 h-8 mx-auto text-stone-400 mb-2" />
            <p className="text-sm font-medium">لا توجد عمليات سداد مطابقة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="p-3">تاريخ السداد</th>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">المبلغ المسدد</th>
                  <th className="p-3">طريقة السداد</th>
                  <th className="p-3">المرجع / الشيك</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/70 transition">
                    <td className="p-3 text-stone-600 whitespace-nowrap">{p.paymentDate}</td>
                    <td className="p-3 font-bold text-stone-900">{p.invoiceNumber}</td>
                    <td className="p-3 font-sans font-bold text-stone-800">{p.customerName}</td>
                    <td className="p-3 font-bold text-emerald-700 whitespace-nowrap">
                      +{formatCurrency(p.amount)}
                    </td>
                    <td className="p-3 font-sans whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-700 border border-stone-200">
                        {p.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : p.paymentMethod === 'cheque' ? 'شيك' : 'نقدي'}
                      </span>
                    </td>
                    <td className="p-3 text-stone-600">{p.referenceNumber}</td>
                    <td className="p-3 font-sans text-stone-500 text-[11px] max-w-[200px] truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
