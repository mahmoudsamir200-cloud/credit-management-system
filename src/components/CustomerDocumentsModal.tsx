import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Eye, 
  Download, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  FileCheck2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Customer, CustomerDocument, CustomerDocumentType } from '../types';
import { DOCUMENT_TYPE_LABELS, processUploadFile, formatFileSize } from '../utils/fileHelper';
import { DocumentViewerModal } from './DocumentViewerModal';

interface CustomerDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onUpdateCustomer: (updated: Customer) => void;
}

export const CustomerDocumentsModal: React.FC<CustomerDocumentsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onUpdateCustomer,
}) => {
  const [activeViewerDoc, setActiveViewerDoc] = useState<CustomerDocument | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [docType, setDocType] = useState<CustomerDocumentType>('commercial_register');
  const [docTitle, setDocTitle] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    dataUrl: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !customer) return null;

  const documents = customer.documents || [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('الحد الأقصى لحجم الملف هو 5 ميجابايت.');
        return;
      }
      setIsProcessing(true);
      try {
        const processed = await processUploadFile(file);
        setSelectedFile(processed);
        if (!docTitle) {
          setDocTitle(DOCUMENT_TYPE_LABELS[docType] || file.name.replace(/\.[^/.]+$/, ''));
        }
      } catch {
        setErrorMsg('حدث خطأ أثناء قراءة الملف، يرجى المحاولة مرة أخرى.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('يرجى اختيار ملف لرفعه');
      return;
    }

    const newDoc: CustomerDocument = {
      id: `doc-${Date.now()}`,
      type: docType,
      title: docTitle.trim() || DOCUMENT_TYPE_LABELS[docType],
      fileData: selectedFile.dataUrl,
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      uploadedAt: new Date().toISOString().slice(0, 10),
      notes: docNotes.trim(),
    };

    const updatedCustomer: Customer = {
      ...customer,
      documents: [newDoc, ...documents],
    };

    onUpdateCustomer(updatedCustomer);
    // Reset form
    setSelectedFile(null);
    setDocTitle('');
    setDocNotes('');
    setShowAddForm(false);
    setErrorMsg('');
  };

  const handleDeleteDocument = (docId: string) => {
    const updatedCustomer: Customer = {
      ...customer,
      documents: documents.filter((d) => d.id !== docId),
    };
    onUpdateCustomer(updatedCustomer);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border border-stone-200 text-right">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900">
                  مستندات وأوراق العميل: <span className="text-amber-700">{customer.name}</span>
                </h2>
                <p className="text-xs text-stone-500">
                  السجل التجاري، البطاقة الضريبية، عقود التوريد والضمانات الرسمية
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-stone-700">
                المستندات المرفقة ({documents.length})
              </div>

              {!showAddForm && (
                <button
                  onClick={() => {
                    setShowAddForm(true);
                    setDocTitle(DOCUMENT_TYPE_LABELS[docType]);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إرفاق مستند جديد</span>
                </button>
              )}
            </div>

            {/* Upload New Document Form */}
            {showAddForm && (
              <form onSubmit={handleSaveDocument} className="bg-stone-50 border border-stone-300 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-amber-600" />
                    <span>إرفاق مستند أو وثيقة رسمية للعميل</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedFile(null);
                    }}
                    className="text-stone-400 hover:text-stone-700 text-xs"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">نوع المستند</label>
                    <select
                      value={docType}
                      onChange={(e) => {
                        const val = e.target.value as CustomerDocumentType;
                        setDocType(val);
                        setDocTitle(DOCUMENT_TYPE_LABELS[val]);
                      }}
                      className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="commercial_register">السجل التجاري</option>
                      <option value="tax_card">البطاقة الضريبية</option>
                      <option value="contract">عقد الاتفاق / التوريد</option>
                      <option value="guarantee_cheque">شيك ضمان</option>
                      <option value="national_id">بطاقة الرقم القومي للمفوض</option>
                      <option value="other">مستند آخر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">عنوان / وصف المستند</label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="مثال: السجل التجاري لعام 2026"
                      className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* File Upload Box */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ملف المستند (صورة أو PDF)</label>
                  <label className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white transition group">
                    <UploadCloud className="w-8 h-8 text-stone-400 group-hover:text-amber-600 mb-2 transition" />
                    {isProcessing ? (
                      <span className="text-xs text-stone-500">جاري معالجة الملف وضغطه...</span>
                    ) : selectedFile ? (
                      <div className="text-center">
                        <span className="text-xs font-bold text-emerald-700 block truncate max-w-xs">
                          ✓ {selectedFile.name}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          الحجم: {formatFileSize(selectedFile.size)} (جاهز للرفع السحابي)
                        </span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <span className="text-xs font-semibold text-stone-700 block">
                          اضغط لاختيار صورة من الكاميرا أو ملف PDF، أو اسحب الملف هنا
                        </span>
                        <span className="text-[10px] text-stone-400">
                          (JPG, PNG, WebP, PDF — صور السجل والبطاقة بدقة واضحة)
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ملاحظات إضافية (اختياري)</label>
                  <input
                    type="text"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="مثال: ساري حتى تاريخ 2027/12/31"
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedFile(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-200 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || isProcessing}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-50 shadow-xs"
                  >
                    حفظ المستند في السحابة
                  </button>
                </div>
              </form>
            )}

            {/* Document List */}
            {documents.length === 0 ? (
              <div className="text-center py-12 px-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                <FileCheck2 className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-700 mb-1">لا توجد مستندات مرفقة لهذا العميل حتى الآن</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                  يمكنك حفظ السجل التجاري، البطاقة الضريبية، عقود التوريد، وشيكات الضمان لتكون محفوظة سحابياً والرجوع إليها في أي وقت.
                </p>
                {!showAddForm && (
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      setDocTitle(DOCUMENT_TYPE_LABELS[docType]);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إرفاق أول مستند الآن</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {documents.map((doc) => {
                  const isImg = doc.fileType.startsWith('image/') || doc.fileData.startsWith('data:image/');
                  return (
                    <div
                      key={doc.id}
                      className="bg-white border border-stone-200 hover:border-amber-300 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-2xs transition group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail or Icon */}
                        {isImg ? (
                          <div
                            onClick={() => setActiveViewerDoc(doc)}
                            className="w-14 h-14 rounded-lg overflow-hidden bg-stone-100 border border-stone-200 shrink-0 cursor-pointer hover:opacity-90 relative group/thumb"
                          >
                            <img
                              src={doc.fileData}
                              alt={doc.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div 
                            onClick={() => setActiveViewerDoc(doc)}
                            className="w-14 h-14 rounded-lg bg-stone-100 border border-stone-200 shrink-0 flex items-center justify-center text-amber-700 cursor-pointer"
                          >
                            <FileText className="w-6 h-6" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              {DOCUMENT_TYPE_LABELS[doc.type] || 'مستند'}
                            </span>
                            <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {doc.uploadedAt}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-stone-900 mt-1 truncate" title={doc.title}>
                            {doc.title}
                          </h4>
                          {doc.notes && (
                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-xs">
                        <span className="text-[10px] text-stone-400 font-mono truncate max-w-[120px]">
                          {doc.fileName}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setActiveViewerDoc(doc)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition"
                            title="معاينة المستند"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={doc.fileData}
                            download={doc.fileName}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition"
                            title="تنزيل المستند"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف ${doc.title}؟`)) {
                                handleDeleteDocument(doc.id);
                              }
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                            title="حذف المستند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              جميع المستندات مشفرة ومحفوظة سحابياً ومتاحة لفريقك في أي وقت.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition"
            >
              إغلاق
            </button>
          </div>

        </div>
      </div>

      {/* Document Viewer Modal */}
      {activeViewerDoc && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setActiveViewerDoc(null)}
          title={activeViewerDoc.title}
          subtitle={`العميل: ${customer.name} — ${DOCUMENT_TYPE_LABELS[activeViewerDoc.type]}`}
          fileData={activeViewerDoc.fileData}
          fileName={activeViewerDoc.fileName}
          fileType={activeViewerDoc.fileType}
          onDelete={() => handleDeleteDocument(activeViewerDoc.id)}
        />
      )}
    </>
  );
};
