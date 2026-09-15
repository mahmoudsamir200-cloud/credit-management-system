import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Upload, 
  AlertCircle, 
  Building, 
  Calendar, 
  Image as ImageIcon, 
  Eye, 
  Trash2, 
  CheckCircle2,
  UserCheck,
  Edit3
} from 'lucide-react';
import { Customer, Invoice, DEFAULT_AREA_MANAGERS, getDefaultAreaManagerForRegion } from '../types';
import { processUploadFile, formatFileSize } from '../utils/fileHelper';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onAddInvoice: (invoice: Omit<Invoice, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'daysOverdue'>) => void;
  onQuickAddCustomer: (customer: Customer) => void;
}

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  isOpen,
  onClose,
  customers,
  onAddInvoice,
  onQuickAddCustomer,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [axReference, setAxReference] = useState('');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Default due date: 30 days from today
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 30);
  const [dueDate, setDueDate] = useState(defaultDue.toISOString().slice(0, 10));
  
  // Area Manager state
  const currentCustomer = customers.find((c) => c.id === customerId);
  const [areaManager, setAreaManager] = useState<string>(() => {
    return currentCustomer ? getDefaultAreaManagerForRegion(currentCustomer.region) : DEFAULT_AREA_MANAGERS[0];
  });
  const [isCustomAreaManager, setIsCustomAreaManager] = useState(false);
  const [customAreaManagerName, setCustomAreaManagerName] = useState('');

  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentData, setAttachmentData] = useState<string | undefined>(undefined);
  const [attachmentType, setAttachmentType] = useState<string | undefined>(undefined);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileSizeText, setFileSizeText] = useState('');

  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Quick Customer add modal within
  const [showNewCustomerField, setShowNewCustomerField] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerCreditLimit, setNewCustomerCreditLimit] = useState(200000);

  // Sync default area manager if customer changes or loads
  useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
      if (!isCustomAreaManager) {
        setAreaManager(getDefaultAreaManagerForRegion(customers[0].region));
      }
    }
  }, [customers, customerId, isCustomAreaManager]);

  if (!isOpen) return null;

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const cust = customers.find((c) => c.id === id);
    if (cust) {
      if (cust.paymentTermsDays) {
        const newDue = new Date(issueDate);
        newDue.setDate(newDue.getDate() + cust.paymentTermsDays);
        setDueDate(newDue.toISOString().slice(0, 10));
      }
      if (!isCustomAreaManager) {
        setAreaManager(getDefaultAreaManagerForRegion(cust.region));
      }
    }
  };

  const handleCreateNewCustomer = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      setError('يرجى كتابة اسم العميل الجديد');
      return;
    }
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      code: `AX-C${Math.floor(100 + Math.random() * 900)}`,
      name: newCustomerName.trim(),
      phone: newCustomerPhone || '—',
      creditLimit: Number(newCustomerCreditLimit) || 100000,
      paymentTermsDays: 30,
      region: 'القاهرة',
      status: 'جيد',
    };
    onQuickAddCustomer(newCust);
    setCustomerId(newCust.id);
    if (!isCustomAreaManager) {
      setAreaManager(getDefaultAreaManagerForRegion(newCust.region));
    }
    setShowNewCustomerField(false);
    setNewCustomerName('');
    setError('');
  };

  const handleInvoiceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        setError('حجم الملف كبير جداً (الحد الأقصى 8 ميجابايت)');
        return;
      }
      setIsProcessingFile(true);
      try {
        const processed = await processUploadFile(file);
        setAttachmentName(processed.name);
        setAttachmentData(processed.dataUrl);
        setAttachmentType(processed.type);
        setFileSizeText(formatFileSize(processed.size));
      } catch {
        setError('حدث خطأ أثناء معالجة صورة الفاتورة');
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentName('');
    setAttachmentData(undefined);
    setAttachmentType(undefined);
    setFileSizeText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setError('يرجى إدخال رقم الفاتورة');
      return;
    }
    if (!customerId) {
      setError('يرجى اختيار العميل');
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError('يرجى إدخال مبلغ صحيح للفاتورة');
      return;
    }

    const finalAreaManager = isCustomAreaManager 
      ? customAreaManagerName.trim() 
      : areaManager.trim();

    if (!finalAreaManager) {
      setError('يرجى تحديد أو إدخال مدير المنطقة المسؤول عن الفاتورة (حقل إلزامي لربط الفاتورة بالتقارير والبحث)');
      return;
    }

    const selectedCustomer = customers.find((c) => c.id === customerId);

    onAddInvoice({
      invoiceNumber: invoiceNumber.trim(),
      axReference: axReference.trim() || undefined,
      customerId,
      customerName: selectedCustomer ? selectedCustomer.name : 'عميل غير محدد',
      region: selectedCustomer?.region,
      areaManager: finalAreaManager,
      issueDate,
      dueDate,
      totalAmount: Number(totalAmount),
      description: description.trim() || undefined,
      attachmentName: attachmentName.trim() || undefined,
      attachmentData,
      attachmentType,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-stone-200 text-right space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900">تسجيل فاتورة جديدة</h3>
              <p className="text-xs text-stone-500">إدراج فاتورة آجلة جديدة لمتابعة استحقاقها</p>
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
          
          {/* Numbers: Invoice # and AX Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                رقم الفاتورة *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="مثال: INV-2024-007"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 font-mono font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                رقم مرجع نظام AX (أمر البيع / المشروع)
              </label>
              <input
                type="text"
                value={axReference}
                onChange={(e) => setAxReference(e.target.value)}
                placeholder="مثال: AX-SO-89499"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 font-mono text-stone-900"
              />
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">العميل *</label>
              <button
                type="button"
                onClick={() => setShowNewCustomerField(!showNewCustomerField)}
                className="text-[11px] text-amber-700 font-semibold hover:underline"
              >
                {showNewCustomerField ? 'اختر من القائمة' : '+ إضافة عميل جديد'}
              </button>
            </div>

            {!showNewCustomerField ? (
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 bg-white text-stone-900 font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) — حد ائتمان: {c.creditLimit.toLocaleString()} ج.م
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div className="text-[11px] font-bold text-amber-900">بيانات العميل الجديد السريعة:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="اسم الشركة / العميل *"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-stone-300 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="رقم الهاتف"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="px-2.5 py-1.5 rounded border border-stone-300 text-xs bg-white"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <input
                    type="number"
                    placeholder="سقف الائتمان (ج.م)"
                    value={newCustomerCreditLimit}
                    onChange={(e) => setNewCustomerCreditLimit(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded border border-stone-300 text-xs bg-white w-48"
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewCustomer}
                    className="px-3 py-1.5 rounded bg-amber-600 text-white font-semibold text-[11px] hover:bg-amber-700"
                  >
                    حفظ العميل واختياره
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Area Manager Selection (Required) */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>مدير المنطقة المسؤول *</span>
                <span className="text-[10px] text-blue-700 bg-blue-100/80 font-bold px-2 py-0.5 rounded-full">
                  إلزامي للتقارير والبحث
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsCustomAreaManager(!isCustomAreaManager);
                  setError('');
                }}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{isCustomAreaManager ? 'اختر من القائمة المعتمدة' : '+ كتابة اسم مدير مخصص'}</span>
              </button>
            </div>

            {!isCustomAreaManager ? (
              <div className="space-y-1">
                <select
                  value={areaManager}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomAreaManager(true);
                      setCustomAreaManagerName('');
                    } else {
                      setAreaManager(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-semibold shadow-2xs"
                >
                  {DEFAULT_AREA_MANAGERS.map((mgr) => (
                    <option key={mgr} value={mgr}>
                      {mgr}
                    </option>
                  ))}
                  <option value="__custom__">+ إدخال اسم مدير آخر يدويّاً...</option>
                </select>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>تم التعيين تلقائياً بحسب منطقة العميل، ويمكنك تغييره أو كتابة اسم مخصص.</span>
                  {currentCustomer?.region && (
                    <span className="text-blue-700 font-semibold">منطقة العميل: {currentCustomer.region}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  placeholder="اكتب الاسم الكامل لمدير المنطقة (مثال: أ. محمد عبد السلام - مدير مبيعات القناة)"
                  value={customAreaManagerName}
                  onChange={(e) => setCustomAreaManagerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 font-bold placeholder:font-normal placeholder:text-slate-400"
                  autoFocus
                />
                <p className="text-[10px] text-blue-800">
                  يمكنك البحث عن الفاتورة في أي شاشة أو تقرير بمجرد كتابة اسم هذا المدير فقط.
                </p>
              </div>
            )}
          </div>

          {/* Amount & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                المبلغ الإجمالي (ج.م) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="any"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 font-mono font-bold text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">تاريخ الإصدار *</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 font-mono text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">تاريخ الاستحقاق *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 font-mono font-bold text-amber-900"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">وصف البضاعة / التوريد</label>
            <input
              type="text"
              placeholder="مثال: توريد شحنة مواد بناء لمشروع التجمع"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 text-stone-900"
            />
          </div>

          {/* Attachment / Invoice Photo / Scan Upload */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700">
                صورة الفاتورة الآجلة أو إذن الصرف (مستند الإثبات)
              </label>
              {fileSizeText && (
                <span className="text-[11px] text-emerald-600 font-medium">
                  تم تجهيز الملف ({fileSizeText})
                </span>
              )}
            </div>

            {!attachmentData ? (
              <label className="border border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 cursor-pointer bg-stone-50/50 hover:bg-stone-50 transition group">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-800">
                      {isProcessingFile ? 'جاري قراءة وضغط الصورة...' : 'اضغط لإرفاق صورة الفاتورة أو إذن التسليم'}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      يدعم تصوير الكاميرا من الموبايل أو رفع ملف PDF / JPG (يحفظ سحابياً مع الفاتورة)
                    </div>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs group-hover:border-amber-400">
                  اختيار مستند
                </span>

                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleInvoiceFileChange}
                />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  {attachmentType?.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-200 bg-white shrink-0">
                      <img src={attachmentData} alt="معاينة" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg border border-emerald-200 bg-white flex items-center justify-center text-emerald-700 shrink-0 font-bold text-xs">
                      PDF
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{attachmentName}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      جاهزة للحفظ السحابي التلقائي مع هذه الفاتورة
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="إزالة الصورة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">ملاحظات إضافية</label>
            <textarea
              rows={2}
              placeholder="شروط خاصة، أرقام تواصل، تفاصيل الاستلام..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 text-stone-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>حفظ وتسجيل الفاتورة</span>
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
