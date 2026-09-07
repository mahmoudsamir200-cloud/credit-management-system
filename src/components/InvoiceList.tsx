import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  CreditCard, 
  Eye, 
  Trash2, 
  Paperclip, 
  Calendar, 
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Download,
  FileText
} from 'lucide-react';
import { Invoice, Customer } from '../types';
import { formatCurrency } from '../utils/storage';
import { DocumentViewerModal } from './DocumentViewerModal';
import { processUploadFile } from '../utils/fileHelper';

interface InvoiceListProps {
  invoices: Invoice[];
  customers: Customer[];
  onOpenNewInvoice: () => void;
  onOpenImport: () => void;
  onSelectInvoiceForPayment: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateInvoice?: (invoice: Invoice) => void;
  initialCustomerFilter?: string;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices = [],
  customers = [],
  onOpenNewInvoice,
  onOpenImport,
  onSelectInvoiceForPayment,
  onDeleteInvoice,
  onUpdateInvoice,
  initialCustomerFilter = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>(initialCustomerFilter);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<Invoice | null>(null);
  const [viewingAttachmentInvoice, setViewingAttachmentInvoice] = useState<Invoice | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Filter logic
  const filteredInvoices = invoices.filter((inv) => {
    // Search query matches invoice #, AX ref, or customer name
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.axReference && inv.axReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.description && inv.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      inv.status === statusFilter ||
      (statusFilter === 'unsettled' && inv.remainingAmount > 0);

    // Customer filter
    const matchesCustomer = !customerFilter || inv.customerId === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  // Calculate quick totals for filtered
  const totalAmountFiltered = filteredInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalRemainingFiltered = filteredInvoices.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  return (
    <div id="invoices-view" className="space-y-5">
      
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">سجل ومراقبة الفواتير والآجل</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            عرض وتتبع استحقاق الفواتير المربوطة بـ AX مع تسجيل السداد وتنبيهات التأخير
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-import-excel-invoices-view"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>استيراد من إكسيل</span>
          </button>

          <button
            id="btn-add-invoice"
            onClick={onOpenNewInvoice}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فاتورة</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400" />
            <input
              id="input-search-invoices"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم الفاتورة، مرجع AX، العميل..."
              className="w-full pr-9 pl-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-800"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-800 bg-white"
            >
              <option value="all">جميع الحالات ({invoices.length})</option>
              <option value="unsettled">غير مسددة ومتبقية ({invoices.filter(i => i.remainingAmount > 0).length})</option>
              <option value="overdue">متأخرة عن الموعد ({invoices.filter(i => i.status === 'overdue').length})</option>
              <option value="partial">سداد جزئي ({invoices.filter(i => i.status === 'partial').length})</option>
              <option value="unpaid">لم يسدد منها شيء ({invoices.filter(i => i.status === 'unpaid').length})</option>
              <option value="paid">مسددة بالكامل ({invoices.filter(i => i.status === 'paid').length})</option>
            </select>
          </div>

          {/* Customer Filter */}
          <div className="relative">
            <select
              id="select-customer-filter"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-stone-800 bg-white"
            >
              <option value="">جميع العملاء</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Filter Summary Stats */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-600">
          <span>نتائج البحث: <strong className="text-stone-900">{filteredInvoices.length}</strong> فاتورة</span>
          <div className="flex items-center gap-4">
            <span>إجمالي المبالغ: <strong className="text-stone-900">{formatCurrency(totalAmountFiltered)}</strong></span>
            <span>المتبقي غير المسدد: <strong className="text-amber-700">{formatCurrency(totalRemainingFiltered)}</strong></span>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <AlertCircle className="w-8 h-8 mx-auto text-stone-400 mb-2" />
            <p className="text-sm font-medium text-stone-700">لا توجد فواتير مطابقة للبحث أو الفلتر المحدد</p>
            <p className="text-xs text-stone-400 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="font-semibold py-3 px-3">رقم الفاتورة</th>
                  <th className="font-semibold py-3 px-3">العميل</th>
                  <th className="font-semibold py-3 px-3">تاريخ الإصدار</th>
                  <th className="font-semibold py-3 px-3">تاريخ الاستحقاق</th>
                  <th className="font-semibold py-3 px-3">المبلغ الإجمالي</th>
                  <th className="font-semibold py-3 px-3">المسدد</th>
                  <th className="font-semibold py-3 px-3">المتبقي</th>
                  <th className="font-semibold py-3 px-3 text-center">الحالة والتأخير</th>
                  <th className="font-semibold py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredInvoices.map((inv) => {
                  const isOverdue = inv.status === 'overdue' && inv.remainingAmount > 0;
                  return (
                    <tr key={inv.id} className="hover:bg-stone-50/60 transition">
                      
                      {/* Invoice # & AX Ref */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-stone-900">{inv.invoiceNumber}</div>
                        {inv.axReference && (
                          <div className="text-[10px] text-stone-500 font-mono flex items-center gap-1 mt-0.5">
                            <span>AX:</span>
                            <span className="font-semibold text-stone-700">{inv.axReference}</span>
                          </div>
                        )}
                        {inv.attachmentName && (
                          <button
                            type="button"
                            onClick={() => {
                              if (inv.attachmentData) {
                                setViewingAttachmentInvoice(inv);
                              } else {
                                setSelectedInvoiceForDetails(inv);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded mt-1 transition"
                            title={inv.attachmentData ? "اضغط لعرض صورة الفاتورة" : inv.attachmentName}
                          >
                            {inv.attachmentData ? <ImageIcon className="w-3 h-3 text-amber-600" /> : <Paperclip className="w-3 h-3" />}
                            <span className="truncate max-w-[85px]">{inv.attachmentName}</span>
                          </button>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-800">{inv.customerName}</div>
                        {inv.description && (
                          <div className="text-[11px] text-stone-500 truncate max-w-[160px] mt-0.5">
                            {inv.description}
                          </div>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-3 text-stone-600 font-mono whitespace-nowrap">
                        {inv.issueDate}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 font-mono whitespace-nowrap">
                        <span className={isOverdue ? 'text-red-700 font-bold' : 'text-stone-700'}>
                          {inv.dueDate}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap">
                        {formatCurrency(inv.totalAmount)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-3 font-medium text-emerald-700 whitespace-nowrap">
                        {inv.paidAmount > 0 ? formatCurrency(inv.paidAmount) : '—'}
                      </td>

                      {/* Remaining */}
                      <td className="py-3 px-3 font-bold whitespace-nowrap">
                        <span className={inv.remainingAmount > 0 ? 'text-amber-800' : 'text-stone-400'}>
                          {formatCurrency(inv.remainingAmount)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {inv.status === 'paid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>مسددة</span>
                          </span>
                        )}
                        {inv.status === 'overdue' && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                              <AlertCircle className="w-3 h-3" />
                              <span>متأخرة</span>
                            </span>
                            {inv.daysOverdue && inv.daysOverdue > 0 && (
                              <div className="text-[10px] font-bold text-red-600 font-mono">
                                +{inv.daysOverdue} يوم
                              </div>
                            )}
                          </div>
                        )}
                        {inv.status === 'partial' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>سداد جزئي</span>
                          </span>
                        )}
                        {inv.status === 'unpaid' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                            <span>غير مسددة</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.remainingAmount > 0 && (
                            <button
                              id={`btn-pay-${inv.id}`}
                              onClick={() => onSelectInvoiceForPayment(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] transition shadow-2xs"
                              title="تسجيل سداد لهذه الفاتورة"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>سداد</span>
                            </button>
                          )}
                          {inv.attachmentData && (
                            <button
                              onClick={() => setViewingAttachmentInvoice(inv)}
                              className="p-1.5 rounded-md text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                              title="عرض صورة ومستند الفاتورة"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            id={`btn-view-${inv.id}`}
                            onClick={() => setSelectedInvoiceForDetails(inv)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`btn-del-${inv.id}`}
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الفاتورة ${inv.invoiceNumber}؟`)) {
                                onDeleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="حذف الفاتورة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoiceForDetails && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 border border-stone-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">تفاصيل الفاتورة</h3>
              <button
                onClick={() => setSelectedInvoiceForDetails(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                <div>
                  <span className="text-stone-500 block">رقم الفاتورة</span>
                  <span className="font-mono font-bold text-sm text-stone-900">{selectedInvoiceForDetails.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">مرجع نظام AX</span>
                  <span className="font-mono font-semibold text-stone-800">{selectedInvoiceForDetails.axReference || 'غير محدد'}</span>
                </div>
              </div>

              <div>
                <span className="text-stone-500 block">اسم العميل</span>
                <span className="font-bold text-stone-900">{selectedInvoiceForDetails.customerName}</span>
              </div>

              {selectedInvoiceForDetails.description && (
                <div>
                  <span className="text-stone-500 block">وصف البضاعة / التوريد</span>
                  <span className="text-stone-800">{selectedInvoiceForDetails.description}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-500 block">تاريخ الإصدار</span>
                  <span className="font-mono text-stone-800">{selectedInvoiceForDetails.issueDate}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">تاريخ الاستحقاق</span>
                  <span className="font-mono font-bold text-stone-900">{selectedInvoiceForDetails.dueDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                <div>
                  <span className="text-stone-500 block">المبلغ الإجمالي</span>
                  <span className="font-bold text-stone-900">{formatCurrency(selectedInvoiceForDetails.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">المسدد</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(selectedInvoiceForDetails.paidAmount)}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">المتبقي</span>
                  <span className="font-bold text-amber-800">{formatCurrency(selectedInvoiceForDetails.remainingAmount)}</span>
                </div>
              </div>

              {/* Attachment Section */}
              <div className="space-y-1.5">
                <span className="text-stone-500 block">مستند الفاتورة / إذن الصرف</span>
                {selectedInvoiceForDetails.attachmentData ? (
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedInvoiceForDetails.attachmentType?.startsWith('image/') || selectedInvoiceForDetails.attachmentData.startsWith('data:image/') ? (
                        <div 
                          onClick={() => setViewingAttachmentInvoice(selectedInvoiceForDetails)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-amber-200 bg-white cursor-pointer hover:opacity-90 shrink-0"
                        >
                          <img 
                            src={selectedInvoiceForDetails.attachmentData} 
                            alt="الفاتورة" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={() => setViewingAttachmentInvoice(selectedInvoiceForDetails)}
                          className="w-12 h-12 rounded-lg border border-amber-200 bg-white flex items-center justify-center text-amber-700 font-bold text-xs cursor-pointer shrink-0"
                        >
                          PDF
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-stone-900 truncate">
                          {selectedInvoiceForDetails.attachmentName || 'صورة الفاتورة'}
                        </div>
                        <div className="text-[10px] text-stone-500">محفوظة سحابياً مع بيانات الفاتورة</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setViewingAttachmentInvoice(selectedInvoiceForDetails)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض الصورة</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-stone-300 bg-stone-50 flex items-center justify-between">
                    <span className="text-stone-500 text-xs">لا توجد صورة أو مسح ضوئي مرفق لهذه الفاتورة</span>
                    {onUpdateInvoice && (
                      <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingAttachment ? 'جاري الرفع...' : 'إرفاق صورة الآن'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={async (e) => {
                            if (e.target.files && e.target.files[0]) {
                              setIsUploadingAttachment(true);
                              try {
                                const processed = await processUploadFile(e.target.files[0]);
                                const updated: Invoice = {
                                  ...selectedInvoiceForDetails,
                                  attachmentName: processed.name,
                                  attachmentData: processed.dataUrl,
                                  attachmentType: processed.type,
                                };
                                onUpdateInvoice(updated);
                                setSelectedInvoiceForDetails(updated);
                              } catch (err) {
                                console.error('Upload error:', err);
                              } finally {
                                setIsUploadingAttachment(false);
                              }
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {selectedInvoiceForDetails.notes && (
                <div>
                  <span className="text-stone-500 block">ملاحظات</span>
                  <p className="text-stone-700 bg-stone-50 p-2 rounded-lg border border-stone-100">{selectedInvoiceForDetails.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              {selectedInvoiceForDetails.remainingAmount > 0 ? (
                <button
                  onClick={() => {
                    const inv = selectedInvoiceForDetails;
                    setSelectedInvoiceForDetails(null);
                    onSelectInvoiceForPayment(inv);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
                >
                  سداد الفاتورة الآن
                </button>
              ) : (
                <span className="text-xs font-semibold text-emerald-700">تم السداد بالكامل ✓</span>
              )}
              <button
                onClick={() => setSelectedInvoiceForDetails(null)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs hover:bg-stone-50 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Document Viewer for Invoices */}
      {viewingAttachmentInvoice && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setViewingAttachmentInvoice(null)}
          title={`صورة الفاتورة: ${viewingAttachmentInvoice.invoiceNumber}`}
          subtitle={`العميل: ${viewingAttachmentInvoice.customerName} — المبلغ: ${formatCurrency(viewingAttachmentInvoice.totalAmount)}`}
          fileData={viewingAttachmentInvoice.attachmentData}
          fileName={viewingAttachmentInvoice.attachmentName || `invoice-${viewingAttachmentInvoice.invoiceNumber}.jpg`}
          fileType={viewingAttachmentInvoice.attachmentType || 'image/jpeg'}
          onDelete={onUpdateInvoice ? () => {
            const updated: Invoice = {
              ...viewingAttachmentInvoice,
              attachmentName: undefined,
              attachmentData: undefined,
              attachmentType: undefined,
            };
            onUpdateInvoice(updated);
            if (selectedInvoiceForDetails?.id === viewingAttachmentInvoice.id) {
              setSelectedInvoiceForDetails(updated);
            }
          } : undefined}
        />
      )}

    </div>
  );
};
