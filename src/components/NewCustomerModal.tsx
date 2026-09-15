import React, { useState } from 'react';
import { UserPlus, Building, Phone, MapPin, ShieldAlert, Calendar, DollarSign, FileText, X, Check } from 'lucide-react';
import { Customer, EgyptianRegion, CustomerRiskStatus } from '../types';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomer: (customer: Customer) => void;
}

const REGIONS: EgyptianRegion[] = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدلتا', 'الصعيد', 'أخرى'];

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({
  isOpen,
  onClose,
  onAddCustomer,
}) => {
  const [code, setCode] = useState(() => `CUST-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [region, setRegion] = useState<EgyptianRegion>('القاهرة');
  const [creditLimit, setCreditLimit] = useState<number | ''>(150000);
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [status, setStatus] = useState<CustomerRiskStatus>('جيد');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم العميل أو اسم المؤسسة');
      return;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      code: code.trim() || `CUST-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      phone: phone.trim() || '—',
      region,
      creditLimit: Number(creditLimit) || 0,
      paymentTermsDays: Number(paymentTermsDays) || 30,
      status,
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      overdueAmount: 0,
      notes: notes.trim() || undefined,
    };

    onAddCustomer(newCustomer);
    setName('');
    setPhone('');
    setNotes('');
    setCode(`CUST-${Math.floor(1000 + Math.random() * 9000)}`);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-right space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">إضافة عميل جديد للنظام</h3>
              <p className="text-xs text-slate-500">تسجيل بيانات العميل، السقف الائتماني، وفترة السداد</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">كود العميل</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: CUST-101"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المنطقة الجغرافية</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as EgyptianRegion)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-hidden"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              اسم العميل / الشركة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="مثال: شركة النيل للتجارة والتوزيع"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:border-blue-500 focus:outline-hidden text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / مسؤول الاتصال</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">فترة السداد / الآجل (أيام)</label>
              <input
                type="number"
                min="0"
                max="180"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">الحد الائتماني المسموح به (ج.م)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: 150000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-700 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تقييم المخاطر المبدئي</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerRiskStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:border-blue-500 focus:outline-hidden"
              >
                <option value="جيد">جيد (سجل ائتماني ممتاز)</option>
                <option value="يحتاج متابعة">يحتاج متابعة</option>
                <option value="حرج">حرج (مخاطر مرتفعة)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">ملاحظات أو تفاصيل إضافية</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="أي اشتراطات خاصة أو أوراق ضمان مطلوبة..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 focus:border-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>إضافة العميل الآن</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
