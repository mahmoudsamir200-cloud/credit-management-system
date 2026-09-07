import React, { useState } from 'react';
import { Download, Printer, X, ZoomIn, ZoomOut, FileText, Image as ImageIcon } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fileData?: string; // base64 or url
  fileName?: string;
  fileType?: string;
  onDelete?: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  fileData,
  fileName = 'document',
  fileType = 'image/jpeg',
  onDelete,
}) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !fileData) return null;

  const isImage = fileType.startsWith('image/') || fileData.startsWith('data:image/');
  const isPdf = fileType === 'application/pdf' || fileData.startsWith('data:application/pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    link.click();
  };

  const handlePrint = () => {
    const printWin = window.open('', '_blank');
    if (printWin) {
      if (isImage) {
        printWin.document.write(`
          <html dir="rtl">
            <head><title>${title}</title></head>
            <body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;">
              <img src="${fileData}" style="max-width:100%;max-height:100vh;" onload="window.print();window.close();" />
            </body>
          </html>
        `);
      } else {
        window.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden border border-stone-200 text-right">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-100 text-amber-800">
                {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </span>
              <h3 className="font-bold text-sm text-stone-900">{title}</h3>
            </div>
            {subtitle && <p className="text-[11px] text-stone-500 mt-0.5">{subtitle}</p>}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {isImage && (
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-lg p-1">
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="p-1 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-100"
                  title="تصغير"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1 font-semibold text-stone-600">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  className="p-1 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-100"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 transition"
              title="طباعة المستند"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold transition"
              title="تحميل الملف على جهازك"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Canvas */}
        <div className="flex-1 overflow-auto bg-stone-900/5 p-4 flex items-center justify-center min-h-[400px]">
          {isImage ? (
            <div className="transition-transform duration-150 origin-center" style={{ transform: `scale(${zoom})` }}>
              <img
                src={fileData}
                alt={title}
                className="max-h-[70vh] w-auto max-w-full rounded shadow-lg object-contain bg-white"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={fileData}
              title={title}
              className="w-full h-[70vh] rounded-lg border border-stone-200 bg-white"
            />
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow-xs border border-stone-200 space-y-3">
              <FileText className="w-12 h-12 text-amber-600 mx-auto" />
              <div className="font-bold text-stone-900 text-sm">{fileName}</div>
              <p className="text-xs text-stone-500">تم حفظ هذا المستند في السحابة</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-bold"
              >
                تنزيل الملف
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200 bg-white flex items-center justify-between text-xs text-stone-500">
          <span className="truncate">اسم الملف: <strong className="text-stone-700 font-mono">{fileName}</strong></span>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('هل أنت متأكد من حذف هذا المستند؟')) {
                  onDelete();
                  onClose();
                }
              }}
              className="text-red-600 hover:text-red-700 font-semibold"
            >
              حذف هذا المستند
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
