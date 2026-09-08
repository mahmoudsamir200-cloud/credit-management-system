import React, { useState } from 'react';
import { FileSpreadsheet, Upload, Check, AlertCircle, FileText, Download } from 'lucide-react';
import { Customer, Invoice } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onImportInvoices: (importedInvoices: Invoice[]) => Promise<void> | void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  customers,
  onImportInvoices,
}) => {
  const [pasteData, setPasteData] = useState('');
  const [parsedRows, setParsedRows] = useState<Array<{
    invoiceNumber: string;
    axReference: string;
    customerName: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    description: string;
  }>>([]);
  const [error, setError] = useState('');
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const sampleTemplate = 
`رقم الفاتورة	مرجع AX	اسم العميل	تاريخ الإصدار	تاريخ الاستحقاق	المبلغ	وصف البضاعة
INV-2024-007	AX-SO-89510	شركة النيل للمقاولات العامة	2024-09-01	2024-10-15	75000	توريد حديد المرحلة الثالثة
INV-2024-008	AX-SO-89522	مجموعة الأهرام للتجارة والتوزيع	2024-09-02	2024-10-02	110000	بضائع مستوردة شحنة سبتمبر
INV-2024-009	AX-SO-89535	الشركة الهندسية للتجهيزات الفندقية	2024-09-03	2024-11-03	90000	معدات تبريد مركزي`;

  const handleParse = (text: string) => {
    setError('');
    const lines = text.trim().split('\n');
    if (lines.length < 1) {
      setError('يرجى لصق بيانات أو رفع ملف صالح');
      return;
    }

    const rows: typeof parsedRows = [];

    // Check if line 0 is a header
    const startIndex = lines[0].includes('الفاتورة') || lines[0].includes('Invoice') || lines[0].includes('المبلغ') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle both Tab-separated (Excel copy/paste) and Comma-separated (CSV)
      const delimiter = line.includes('\t') ? '\t' : ',';
      const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));

      if (parts.length >= 4) {
        const invNum = parts[0] || `INV-${Date.now()}-${i}`;
        const axRef = parts.length >= 6 ? parts[1] : '';
        const custName = parts.length >= 6 ? parts[2] : parts[1];
        const issue = parts.length >= 6 ? parts[3] : parts[2];
        const due = parts.length >= 6 ? parts[4] : parts[3];
        const amountStr = parts.length >= 6 ? parts[5] : parts[4];
        const desc = parts.length >= 7 ? parts[6] : '';

        const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, '')) || 0;

        if (amount > 0) {
          rows.push({
            invoiceNumber: invNum,
            axReference: axRef,
            customerName: custName || 'عميل تجاري',
            issueDate: issue || new Date().toISOString().slice(0, 10),
            dueDate: due || new Date().toISOString().slice(0, 10),
            totalAmount: amount,
            description: desc,
          });
        }
      }
    }

    if (rows.length === 0) {
      setError('تعذر قراءة الفواتير من النص المنسوخ. تأكد من ترتيب الأعمدة أو اضغط "تجربة نموذج جاهز".');
      return;
    }

    setParsedRows(rows);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPasteData(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    const unmatchedCustomers = parsedRows.filter((row) => !customers.some(
      (customer) => customer.name.toLowerCase() === row.customerName.toLowerCase()
    ));

    if (unmatchedCustomers.length > 0) {
      setError(`لا يمكن استيراد ${unmatchedCustomers.length} فاتورة: لم يتم العثور على عميل مطابق لـ ${unmatchedCustomers[0].customerName}`);
      return;
    }

    const newInvoices: Invoice[] = parsedRows.map((r, index) => {
      const matchedCustomer = customers.find(
        (c) => c.name.toLowerCase() === r.customerName.toLowerCase()
      );

      return {
        id: `inv-${Date.now()}-${index}`,
        invoiceNumber: r.invoiceNumber,
        axReference: r.axReference || undefined,
        customerId: matchedCustomer!.id,
        customerName: r.customerName,
        issueDate: r.issueDate,
        dueDate: r.dueDate,
        totalAmount: r.totalAmount,
        paidAmount: 0,
        remainingAmount: r.totalAmount,
        status: 'unpaid',
        daysOverdue: 0,
        description: r.description || undefined,
      };
    });

    try {
      await onImportInvoices(newInvoices);
      setImportSuccessCount(newInvoices.length);
      setTimeout(() => onClose(), 1200);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'تعذر حفظ الفواتير المستوردة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-stone-200 text-right space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900">استيراد الفواتير من Excel أو نظام AX</h3>
              <p className="text-xs text-stone-500">انسخ الصفوف مباشرة من شيت إكسيل أو ارفع ملف CSV</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-sm font-bold">
            ✕
          </button>
        </div>

        {importSuccessCount !== null ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-900">تم استيراد {importSuccessCount} فاتورة بنجاح!</h4>
            <p className="text-xs text-stone-500">تمت إضافة الفواتير وتحديث المديونية ومواعيد الاستحقاق فوراً.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold transition">
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                <span>رفع ملف CSV / Excel</span>
                <input type="file" accept=".csv, .txt, .tsv" className="hidden" onChange={handleFileUpload} />
              </label>

              <button
                type="button"
                onClick={() => {
                  setPasteData(sampleTemplate);
                  handleParse(sampleTemplate);
                }}
                className="text-amber-700 font-semibold hover:underline"
              >
                + ملء نموذج تجريبي جاهز
              </button>
            </div>

            {/* Paste Box */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                انسخ الأعمدة من إكسيل والصقها هنا:
              </label>
              <textarea
                rows={4}
                dir="ltr"
                placeholder="رقم الفاتورة	مرجع AX	اسم العميل	تاريخ الإصدار	تاريخ الاستحقاق	المبلغ	الوصف"
                value={pasteData}
                onChange={(e) => {
                  setPasteData(e.target.value);
                  handleParse(e.target.value);
                }}
                className="w-full p-2.5 text-xs font-mono rounded-lg border border-stone-300 focus:ring-1 focus:ring-amber-500 text-stone-800"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                الأعمدة المطلوبة بالترتيب: رقم الفاتورة • مرجع AX • اسم العميل • تاريخ الإصدار • تاريخ الاستحقاق • المبلغ • الوصف
              </p>
            </div>

            {/* Preview of Parsed Rows */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                  <span>معاينة الفواتير المقروءة ({parsedRows.length} فاتورة):</span>
                  <span className="text-emerald-700">
                    إجمالي المبلغ: {parsedRows.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()} ج.م
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-lg">
                  <table className="w-full text-right text-[11px]">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 sticky top-0">
                      <tr>
                        <th className="p-2">رقم الفاتورة</th>
                        <th className="p-2">مرجع AX</th>
                        <th className="p-2">العميل</th>
                        <th className="p-2">الاستحقاق</th>
                        <th className="p-2">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono">
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="p-2 font-bold text-stone-900">{r.invoiceNumber}</td>
                          <td className="p-2 text-stone-500">{r.axReference || '—'}</td>
                          <td className="p-2 font-sans font-medium text-stone-800">{r.customerName}</td>
                          <td className="p-2 text-stone-600">{r.dueDate}</td>
                          <td className="p-2 font-bold text-emerald-700">{r.totalAmount.toLocaleString()} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <button
                type="button"
                disabled={parsedRows.length === 0}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد استيراد ({parsedRows.length}) فاتورة</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
