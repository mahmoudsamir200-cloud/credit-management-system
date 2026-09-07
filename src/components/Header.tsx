import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Users, 
  BarChart3, 
  History, 
  Download, 
  Database,
  Building2,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { exportInvoicesToCSV } from '../utils/storage';
import { Invoice } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  invoices: Invoice[];
  onOpenImport: () => void;
  onOpenNewInvoice: () => void;
  onClearAllData: () => void;
  onResetDemoData: () => void;
  isDataEmpty: boolean;
  isCloudConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  invoices,
  onOpenImport,
  onOpenNewInvoice,
  onClearAllData,
  onResetDemoData,
  isDataEmpty,
  isCloudConnected,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم والتلخيص', icon: LayoutDashboard },
    { id: 'invoices', label: 'الفواتير والآجل', icon: Receipt },
    { id: 'customers', label: 'سجل العملاء والائتمان', icon: Users },
    { id: 'aging', label: 'أعمار الديون', icon: BarChart3 },
    { id: 'payments', label: 'سجل السدادات', icon: CreditCard },
    { id: 'logs', label: 'سجل العمليات', icon: History },
  ];

  return (
    <header id="main-system-header" className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Brand & AX Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-stone-900 tracking-tight">نظام مراقبة الآجل والتحصيل</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                  مكمل لنظام AX
                </span>
                <span 
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                    isCloudConnected 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                  title={isCloudConnected ? "متصل بسحابة Google Firestore اللحظية — التعديلات تتزامن فوراً مع فريق العمل" : "جاري الاتصال بالسحابة..."}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <Cloud className="w-3 h-3" />
                  <span>{isCloudConnected ? 'سحابة لحظية متصلة' : 'جاري المزامنة...'}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500">
                متابعة الفواتير الآجلة، أعمار الديون، وسداد المستحقات
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            
            {/* Clear or Reset Data Button */}
            {!isDataEmpty ? (
              <button
                id="btn-clear-demo-data"
                onClick={() => setShowConfirmClear(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition"
                title="تفريغ كل البيانات التجريبية للبدء بإدخال بياناتك الفعلية"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تفريغ وبدء بياناتي</span>
              </button>
            ) : (
              <button
                id="btn-restore-demo-data"
                onClick={onResetDemoData}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 transition"
                title="استعادة البيانات التجريبية للتجربة"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>استعادة بيانات تجريبية</span>
              </button>
            )}

            <button
              id="btn-import-ax-excel"
              onClick={onOpenImport}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 transition"
              title="استيراد من إكسيل أو تقرير AX"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>استيراد من AX / Excel</span>
            </button>

            <button
              id="btn-export-csv"
              onClick={() => exportInvoicesToCSV(invoices)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 transition"
              title="تصدير كشف الفواتير لإكسيل"
            >
              <Download className="w-3.5 h-3.5 text-stone-600" />
              <span>تصدير كشف</span>
            </button>

            <button
              id="btn-new-invoice-header"
              onClick={onOpenNewInvoice}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 active:scale-98 transition shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>تسجيل فاتورة جديدة</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 space-x-reverse overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-amber-600 text-amber-900 bg-amber-50/50 rounded-t-lg'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Confirm Clear Data Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 text-right space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">تفريغ البيانات للبدء ببياناتك</h3>
                <p className="text-xs text-stone-500 mt-0.5">هل تريد مسح البيانات التجريبية نهائياً؟</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
              سيتم مسح جميع الفواتير والعملاء والسدادات التجريبية الحالية لتصبح لوحة التحكم نظيفة تماماً، ويمكنك بعد ذلك رفع فواتيرك وإضافة عملائك الفعليين.
            </p>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => {
                  onClearAllData();
                  setShowConfirmClear(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs"
              >
                نعم، امسح وابدأ من الصفر
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
