import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Calendar, Check, AlertCircle } from 'lucide-react';
import { Invoice, Payment, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/storage';

interface PaymentModalProps {
  invoice: Invoice | null;
  invoices: Invoice[];
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (paymentData: Omit<Payment, 'id'>) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  invoices,
  isOpen,
  onClose,
  onRecordPayment,
}) => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const unpaidInvoices = invoices.filter((i) => i.remainingAmount > 0);

  // Sync state when invoice prop changes or modal opens
  useEffect(() => {
    if (invoice) {
      setSelectedInvoiceId(invoice.id);
      setAmount(invoice.remainingAmount);
    } else if (unpaidInvoices.length > 0) {
      setSelectedInvoiceId(unpaidInvoices[0].id);
      setAmount(unpaidInvoices[0].remainingAmount);
    }
    setError('');
    setReferenceNumber('');
    setNotes('');
  }, [invoice, isOpen]);

  // When changing dropdown invoice selection
  const currentInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const target = invoices.find((i) => i.id === id);
    if (target) {
      setAmount(target.remainingAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInvoice) {
      setError('يرجى اختيار الفاتورة المراد سدادها');
      return;
    }
    if (amount <= 0) {
      setError('المبلغ يجب أن يكون أكبر من صفر');
      return;
    }
    if (amount > currentInvoice.remainingAmount) {
      setError(`المبلغ المدخل (${formatCurrency(amount)}) أكبر من المتبقي على الفاتورة (${formatCurrency(currentInvoice.remainingAmount)})`);
      return;
    }

    onRecordPayment({
      invoiceId: currentInvoice.id,
      invoiceNumber: currentInvoice.invoiceNumber,
      customerId: currentInvoice.customerId,
      customerName: currentInvoice.customerName,
      amount: Number(amount),
      paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber || 'سداد مباشر',
      notes,
    });

    onClose();
  };

  if (!isOpen) return null;

  const remainingAfterPayment = currentInvoice ? currentInvoice.remainingAmount - (Number(amount) || 0) : 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 text-right space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900">تسجيل سداد / تحصيل</h3>
              <p className="text-xs text-stone-500">سداد كامل أو جزئي لفاتورة آجلة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Invoice Selection */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">اختر الفاتورة المستحقة</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white text-stone-900 font-medium"
            >
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} — {inv.customerName} (المتبقي: {formatCurrency(inv.remainingAmount)})
                </option>
              ))}
            </select>
          </div>

          {currentInvoice && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[11px] text-stone-500 block">إجمالي الفاتورة</span>
                <span className="font-bold text-stone-900 text-xs">{formatCurrency(currentInvoice.totalAmount)}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">المسدد سابقاً</span>
                <span className="font-bold text-emerald-700 text-xs">{formatCurrency(currentInvoice.paidAmount)}</span>
              </div>
              <div>
                <span className="text-[11px] text-stone-500 block">المتبقي حالياً</span>
                <span className="font-bold text-red-700 text-xs">{formatCurrency(currentInvoice.remainingAmount)}</span>
              </div>
            </div>
          )}

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                المبلغ المسدد (ج.م) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={currentInvoice?.remainingAmount}
                  step="any"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono font-bold text-stone-900"
                />
              </div>
              {currentInvoice && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-stone-500">
                  <button
                    type="button"
                    onClick={() => setAmount(currentInvoice.remainingAmount)}
                    className="text-amber-700 font-semibold hover:underline"
                  >
                    سداد كامل المبلغ
                  </button>
                  <span>المتبقي بعد السداد: {formatCurrency(Math.max(0, remainingAfterPayment))}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">تاريخ التحصيل / السداد *</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 font-mono text-stone-900"
              />
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">طريقة السداد</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 bg-white text-stone-900"
              >
                <option value="bank_transfer">تحويل بنكي</option>
                <option value="cheque">شيك بنكي</option>
                <option value="cash">نقدي (خزينة)</option>
                <option value="deposit">إيداع نقدي بالبنك</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">رقم الإيصال / الشيك / الحوالة</label>
              <input
                type="text"
                placeholder="مثال: CHQ-99120 أو TR-CIB-41"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-900 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">ملاحظات التحصيل (اختياري)</label>
            <input
              type="text"
              placeholder="مثال: تم استلام الشيك ومودع للتحصيل بتاريخ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-900"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>تأكيد تسجيل السداد</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs transition"
            >
              إلغاء
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
