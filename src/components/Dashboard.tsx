import React, { useState, useRef } from 'react';
import { 
  Home, 
  Calendar, 
  Wallet, 
  Coins, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Users, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  FileText, 
  CreditCard, 
  TrendingUp, 
  Check, 
  X, 
  Eye, 
  MapPin,
  ExternalLink,
  Plus,
  CheckCircle2,
  Upload,
  ZoomIn,
  Settings as SettingsIcon,
  RefreshCw,
  Sparkles,
  Building2
} from 'lucide-react';
import { 
  Invoice, 
  Customer, 
  Payment, 
  CreditApprovalRequest, 
  ActiveNavView,
  CompanySettings
} from '../types';
import { formatNumber } from '../utils/storage';
import { UniGroupLogo } from './UniGroupLogo';

interface DashboardProps {
  invoices: Invoice[];
  customers: Customer[];
  payments: Payment[];
  creditRequests: CreditApprovalRequest[];
  onSelectCustomer: (customer: Customer) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onSelectInvoiceForPayment: (invoice: Invoice) => void;
  setActiveView: (view: ActiveNavView) => void;
  onApproveCreditRequest: (requestId: string) => void;
  onRejectCreditRequest: (requestId: string) => void;
  companySettings?: CompanySettings;
  onUpdateCompanySettings?: (newSettings: Partial<CompanySettings>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  invoices = [],
  customers = [],
  payments = [],
  creditRequests = [],
  onSelectCustomer,
  onSelectInvoice,
  onSelectInvoiceForPayment,
  setActiveView,
  onApproveCreditRequest,
  onRejectCreditRequest,
  companySettings,
  onUpdateCompanySettings,
}) => {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً، يرجى اختيار ملف بحجم أقل من 3 ميجابايت');
      return;
    }
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result && onUpdateCompanySettings) {
        onUpdateCompanySettings({ logoUrl: result });
        setLogoSuccessMsg('تم تحديث الشعار وتثبيته بنجاح!');
        setTimeout(() => setLogoSuccessMsg(''), 3500);
      }
      setIsUploadingLogo(false);
    };
    reader.onerror = () => {
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    if (onUpdateCompanySettings) {
      onUpdateCompanySettings({ logoUrl: '/assets/unigroup_logo.jpg' });
      setLogoSuccessMsg('تمت استعادة الشعار الرسمي الافتراضي!');
      setTimeout(() => setLogoSuccessMsg(''), 3500);
    }
  };

  // Top 10 debtor customers matching screenshot
  const top10Customers = [...(customers || [])]
    .sort((a, b) => (b.totalOutstanding || 0) - (a.totalOutstanding || 0))
    .slice(0, 10);

  // Invoices due today (matches screenshot list INV-1042 -> INV-1046)
  const invoicesDueToday = (invoices || []).filter(i => i.isDueToday || i.status === 'unpaid').slice(0, 5);

  // Recent payments
  const recentPayments = [...(payments || [])]
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
    .slice(0, 4);

  // 6 months historical trend data
  const trendMonths = [
    { month: 'أبريل', debt: 27.2, collected: 17.5, rate: 64 },
    { month: 'مايو', debt: 31.0, collected: 20.8, rate: 67 },
    { month: 'يونيو', debt: 34.5, collected: 23.2, rate: 67 },
    { month: 'يوليو', debt: 37.8, collected: 25.4, rate: 67 },
    { month: 'أغسطس', debt: 41.5, collected: 31.5, rate: 76 },
    { month: 'سبتمبر', debt: 45.2, collected: 34.4, rate: 76 },
  ];

  // Regions breakdown matching screenshot exactly
  const regions = [
    { name: 'القاهرة', amount: 14500000, percentage: 32, color: '#2563eb' },
    { name: 'الجيزة', amount: 9200000, percentage: 20, color: '#0284c7' },
    { name: 'الدلتا', amount: 8750000, percentage: 19, color: '#0d9488' },
    { name: 'الصعيد', amount: 6300000, percentage: 14, color: '#16a34a' },
    { name: 'الإسكندرية', amount: 4500000, percentage: 10, color: '#dc2626' },
    { name: 'أخرى', amount: 2000000, percentage: 5, color: '#9333ea' },
  ];

  // Debt Aging distribution matching screenshot
  const agingSegments = [
    { label: '0 - 30 يوم', percentage: 58, color: '#10b981' },
    { label: '31 - 60 يوم', percentage: 18, color: '#3b82f6' },
    { label: '61 - 90 يوم', percentage: 12, color: '#f59e0b' },
    { label: 'أكثر من 90 يوم', percentage: 12, color: '#ef4444' },
  ];

  return (
    <div id="enterprise-dashboard" className="p-4 sm:p-6 space-y-6 text-right max-w-[1600px] mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
            لوحة التحكم الرئيسية
          </h2>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-2xs">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>الأحد 06 سبتمبر 2026</span>
        </div>
      </div>

      {/* Corporate Identity & Live Logo Showcase Banner */}
      <div 
        id="dashboard-corporate-brand-banner"
        className="relative overflow-hidden bg-gradient-to-r from-[#0a1320] via-[#0f2137] to-[#0a1320] rounded-2xl border border-slate-700/70 p-4 sm:p-5 text-white shadow-xl"
      >
        {/* Decorative background glow */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Right Section: Live Logo Display & Details */}
          <div className="flex items-center gap-4">
            
            {/* Live Logo Preview Box */}
            <div 
              onClick={() => setShowLogoModal(true)}
              className="relative group cursor-pointer shrink-0"
              title="انقر لتكبير ومعاينة الشعار بدقة عالية"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-lg border-2 border-blue-400/50 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105 group-hover:border-blue-400">
                <img
                  src={companySettings?.logoUrl || '/assets/unigroup_logo.jpg'}
                  alt={companySettings?.companyName || 'شعار يوني جروب'}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/unigroup_logo.jpg';
                  }}
                />
              </div>

              {/* Hover Zoom Overlay */}
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                <ZoomIn className="w-5 h-5 text-blue-300" />
                <span>تكبير</span>
              </div>
            </div>

            {/* Corporate Info & Badges */}
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  معاينة حية ومؤكدة للشعار
                </span>
                <span className="text-[11px] text-blue-300 font-mono px-2 py-0.5 rounded bg-blue-500/15 border border-blue-400/30">
                  Uni-Group Enterprise
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                  مفعل في كافة الشاشات وكشوف الحسابات الرسمية
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{companySettings?.companyName || 'مجموعة يوني جروب - Uni-Group'}</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {companySettings?.slogan || 'نظام إدارة الائتمان والتحصيل ومتابعة المستحقات المالية'}
              </p>

              {logoSuccessMsg && (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-600/50 px-2.5 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>{logoSuccessMsg}</span>
                </div>
              )}
            </div>

          </div>

          {/* Left Section: Interactive Logo Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
            {/* Hidden File Input for instant upload */}
            <input
              type="file"
              ref={logoFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoFileUpload}
            />

            <button
              onClick={() => logoFileInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 disabled:opacity-50"
              title="رفع صورة شعار جديدة من جهازك"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploadingLogo ? 'جاري التحميل..' : 'رفع شعار جديد'}</span>
            </button>

            <button
              onClick={() => setShowLogoModal(true)}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow-xs"
              title="معاينة الشعار بحجم كبير على خلفيات مختلفة"
            >
              <ZoomIn className="w-4 h-4 text-blue-400" />
              <span>معاينة مكبرة</span>
            </button>

            <button
              onClick={() => setActiveView('admin_settings')}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow-xs"
              title="الانتقال إلى إعدادات الهوية والبيانات المؤسسية"
            >
              <SettingsIcon className="w-4 h-4 text-slate-400" />
              <span>إعدادات الهوية</span>
            </button>

            <button
              onClick={handleResetLogo}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition shadow-xs"
              title="استعادة الشعار الرسمي الافتراضي (Uni-Group)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Row 1: 7 Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        
        {/* Card 1: إجمالي المديونية */}
        <div className="bg-[#f8fafc] border border-slate-200/90 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">إجمالي المديونية</span>
            <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              45,230,750 <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>12% من الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 2: المتاح الائتماني */}
        <div className="bg-[#f0f7ff] border border-blue-100 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-900">المتاح الائتماني</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base sm:text-lg font-black text-blue-950 leading-tight">
              18,750,000 <span className="text-xs font-normal text-blue-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>8% من الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 3: المتأخرات */}
        <div className="bg-[#fff1f2] border border-rose-100 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-900">المتأخرات</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base sm:text-lg font-black text-rose-950 leading-tight">
              12,340,200 <span className="text-xs font-normal text-rose-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>25% من الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 4: مستحق اليوم */}
        <div className="bg-[#fffbeb] border border-amber-100 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">مستحق اليوم</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base sm:text-lg font-black text-amber-950 leading-tight">
              4,850,000 <span className="text-xs font-normal text-amber-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>18% من الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 5: مستحق خلال 48 ساعة */}
        <div className="bg-[#f0fdfa] border border-teal-100 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-900">مستحق خلال 48 ساعة</span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base sm:text-lg font-black text-teal-950 leading-tight">
              7,620,500 <span className="text-xs font-normal text-teal-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>10% من الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 6: نسبة التحصيل */}
        <div className="bg-[#f0fdf4] border border-emerald-100 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">نسبة التحصيل</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base sm:text-lg font-black text-emerald-950 leading-tight">
              76%
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>6% من الشهر الماضي</span>
            </div>
          </div>
        </div>

        {/* Card 7: عملاء على إيقاف ائتماني */}
        <div className="bg-[#faf5ff] border border-purple-100 rounded-xl p-3.5 shadow-2xs hover:shadow-xs transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900">عملاء على إيقاف ائتماني</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-base sm:text-lg font-black text-purple-950 leading-tight">
              5
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowDown className="w-3 h-3" />
              <span>2% من الشهر الماضي</span>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Charts & Risk Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Widget 1: تطور المديونية خلال آخر 6 أشهر */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">تطور المديونية خلال آخر 6 أشهر</h3>
            </div>
          </div>

          {/* SVG Custom High-Precision Chart */}
          <div className="w-full h-52 relative flex items-end">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
              {/* Horizontal Grid lines */}
              {[0, 10, 20, 30, 40, 50].map((val, idx) => {
                const y = 180 - (val / 50) * 160;
                return (
                  <g key={val}>
                    <line x1="40" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="30" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
                      {val}M
                    </text>
                  </g>
                );
              })}

              {/* Bars and Line points */}
              {trendMonths.map((item, idx) => {
                const xCenter = 80 + idx * 70;
                const debtHeight = (item.debt / 50) * 160;
                const collHeight = (item.collected / 50) * 160;
                const rateY = 180 - (item.rate / 100) * 160;

                return (
                  <g key={item.month} className="group cursor-pointer">
                    {/* Bar 1: Total Debt */}
                    <rect
                      x={xCenter - 14}
                      y={180 - debtHeight}
                      width="13"
                      height={debtHeight}
                      rx="3"
                      fill="#2563eb"
                      className="hover:opacity-80 transition"
                    />
                    {/* Bar 2: Collected */}
                    <rect
                      x={xCenter + 2}
                      y={180 - collHeight}
                      width="13"
                      height={collHeight}
                      rx="3"
                      fill="#38bdf8"
                      className="hover:opacity-80 transition"
                    />
                    {/* Month Label */}
                    <text
                      x={xCenter}
                      y="196"
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                      fontWeight="bold"
                    >
                      {item.month}
                    </text>
                  </g>
                );
              })}

              {/* Line: Collection Rate % */}
              <polyline
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="2.5"
                points={trendMonths.map((item, idx) => {
                  const xCenter = 80 + idx * 70;
                  const y = 180 - (item.rate / 100) * 160;
                  return `${xCenter},${y}`;
                }).join(' ')}
              />

              {/* Points on Line */}
              {trendMonths.map((item, idx) => {
                const xCenter = 80 + idx * 70;
                const y = 180 - (item.rate / 100) * 160;
                return (
                  <circle
                    key={idx}
                    cx={xCenter}
                    cy={y}
                    r="4"
                    fill="#8b5cf6"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
              <span>إجمالي المديونية</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
              <span>المحصل</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" />
              <span>نسبة التحصيل</span>
            </div>
          </div>
        </div>

        {/* Widget 2: توزيع المديونية حسب المناطق */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">توزيع المديونية حسب المناطق</h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-auto">
            {/* Donut Chart SVG */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* SVG Donut Slices */}
                {/* Circumference = 2 * PI * 38 = 238.76 */}
                {/* القاهرة: 32% (strokeDasharray: 76.4 162.3) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#2563eb" strokeWidth="18" strokeDasharray="76.4 162.4" strokeDashoffset="0" />
                {/* الجيزة: 20% (strokeDasharray: 47.7 191) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0284c7" strokeWidth="18" strokeDasharray="47.7 191" strokeDashoffset="-76.4" />
                {/* الدلتا: 19% (strokeDasharray: 45.3 193.4) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0d9488" strokeWidth="18" strokeDasharray="45.3 193.4" strokeDashoffset="-124.1" />
                {/* الصعيد: 14% (strokeDasharray: 33.4 205.3) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#16a34a" strokeWidth="18" strokeDasharray="33.4 205.3" strokeDashoffset="-169.4" />
                {/* الإسكندرية: 10% (strokeDasharray: 23.8 214.9) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#dc2626" strokeWidth="18" strokeDasharray="23.8 214.9" strokeDashoffset="-202.8" />
                {/* أخرى: 5% (strokeDasharray: 11.9 226.8) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#9333ea" strokeWidth="18" strokeDasharray="11.9 226.8" strokeDashoffset="-226.6" />
              </svg>
              {/* Center Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-slate-800 leading-none">45.2M</span>
                <span className="text-[10px] text-slate-500 font-medium">ج.م</span>
              </div>
            </div>

            {/* Region List */}
            <div className="w-full space-y-1.5">
              {regions.map((reg) => (
                <div 
                  key={reg.name}
                  onClick={() => setActiveView('report_branches')}
                  className="flex items-center justify-between text-xs hover:bg-slate-50 p-1 rounded-md cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: reg.color }} />
                    <span className="font-semibold text-slate-700">{reg.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-slate-600 text-[11px]">{reg.amount.toLocaleString()}</span>
                    <span className="font-bold text-slate-900 text-[11px] w-7 text-left">{reg.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Widget 3: مركز المخاطر والتنبيهات */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">مركز المخاطر والتنبيهات</h3>
            </div>
          </div>

          <div className="space-y-2 my-auto">
            {/* 1. فواتير متأخرة */}
            <button
              onClick={() => setActiveView('overdue_invoices')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition" />
                <span className="text-xs font-semibold text-slate-700">فواتير متأخرة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold text-xs">
                23
              </span>
            </button>

            {/* 2. عملاء متجاوزون للحد الائتماني */}
            <button
              onClick={() => setActiveView('credit_limits')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition" />
                <span className="text-xs font-semibold text-slate-700">عملاء متجاوزون للحد الائتماني</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-xs">
                7
              </span>
            </button>

            {/* 3. طلبات موافقة ائتمانية */}
            <button
              onClick={() => setActiveView('credit_approvals')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition" />
                <span className="text-xs font-semibold text-slate-700">طلبات موافقة ائتمانية</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-xs">
                4
              </span>
            </button>

            {/* 4. عملاء على إيقاف ائتماني */}
            <button
              onClick={() => setActiveView('suspended_customers')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition" />
                <span className="text-xs font-semibold text-slate-700">عملاء على إيقاف ائتماني</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-xs">
                5
              </span>
            </button>

            {/* 5. شكايا/ضمانات تحتاج متابعة */}
            <button
              onClick={() => setActiveView('guarantees_documents')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-0.5 transition" />
                <span className="text-xs font-semibold text-slate-700">شكايا/ضمانات تحتاج متابعة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-xs">
                3
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Row 3: Detailed Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Panel 1: أكبر 10 عملاء مديونية (Left - Width 4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">أكبر 10 عملاء مديونية</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-medium">
                    <th className="pb-2 w-6">م</th>
                    <th className="pb-2">العميل</th>
                    <th className="pb-2">المنطقة</th>
                    <th className="pb-2">إجمالي المديونية</th>
                    <th className="pb-2">المتأخر</th>
                    <th className="pb-2 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {top10Customers.map((cust, idx) => (
                    <tr 
                      key={cust.id} 
                      onClick={() => onSelectCustomer(cust)}
                      className="hover:bg-blue-50/50 cursor-pointer transition"
                    >
                      <td className="py-2 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 font-bold text-slate-900">{cust.name}</td>
                      <td className="py-2 text-slate-600">{cust.region}</td>
                      <td className="py-2 font-mono font-semibold text-slate-800">
                        {(cust.totalOutstanding || 0).toLocaleString()}
                      </td>
                      <td className="py-2 font-mono text-rose-600">
                        {(cust.overdueAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          cust.status === 'حرج'
                            ? 'bg-rose-600 text-white'
                            : cust.status === 'يحتاج متابعة'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}>
                          {cust.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-left">
            <button
              onClick={() => setActiveView('customers_directory')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>عرض جميع العملاء</span>
              <span>←</span>
            </button>
          </div>
        </div>

        {/* Panel 2: الفواتير المستحقة اليوم & أحدث عمليات السداد (Middle - Width 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 2.1 الفواتير المستحقة اليوم */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">الفواتير المستحقة اليوم</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-medium">
                    <th className="pb-2">رقم الفاتورة</th>
                    <th className="pb-2">العميل</th>
                    <th className="pb-2">المنطقة</th>
                    <th className="pb-2">القيمة</th>
                    <th className="pb-2">تاريخ الاستحقاق</th>
                    <th className="pb-2 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoicesDueToday.map((inv) => (
                    <tr 
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-amber-50/50 cursor-pointer transition"
                    >
                      <td className="py-2 font-mono font-bold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="py-2 text-slate-800 font-semibold">{inv.customerName}</td>
                      <td className="py-2 text-slate-500">{inv.region || 'القاهرة'}</td>
                      <td className="py-2 font-mono font-bold text-slate-900">{inv.totalAmount.toLocaleString()}</td>
                      <td className="py-2 text-slate-500 font-mono text-[11px]">{inv.dueDate}</td>
                      <td className="py-2 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                          استحقاق اليوم
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-left">
              <button
                onClick={() => setActiveView('invoices_list')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>عرض كل الفواتير</span>
                <span>←</span>
              </button>
            </div>
          </div>

          {/* 2.2 أحدث عمليات السداد */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">أحدث عمليات السداد</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-medium">
                    <th className="pb-2">التاريخ</th>
                    <th className="pb-2">العميل</th>
                    <th className="pb-2">رقم الفاتورة</th>
                    <th className="pb-2">المبلغ</th>
                    <th className="pb-2">تم بواسطة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-emerald-50/40 transition">
                      <td className="py-2 text-slate-500 font-mono text-[11px]">{p.paymentDate}</td>
                      <td className="py-2 font-bold text-slate-800">{p.customerName}</td>
                      <td className="py-2 font-mono text-slate-600">{p.invoiceNumber}</td>
                      <td className="py-2 font-mono font-bold text-emerald-600">{p.amount.toLocaleString()}</td>
                      <td className="py-2 text-slate-600 text-[11px]">{p.recordedBy || 'المسؤول المالي'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-left">
              <button
                onClick={() => setActiveView('payments_list')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>عرض كل عمليات السداد</span>
                <span>←</span>
              </button>
            </div>
          </div>

        </div>

        {/* Panel 3: أعمار الديون & طلبات الموافقة الائتمانية (Right - Width 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 3.1 أعمار الديون */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">أعمار الديون</h3>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              {/* Donut Chart SVG */}
              <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {/* 0-30: 58% (138.5) */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10b981" strokeWidth="16" strokeDasharray="138.5 100.3" strokeDashoffset="0" />
                  {/* 31-60: 18% (43.0) */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray="43.0 195.8" strokeDashoffset="-138.5" />
                  {/* 61-90: 12% (28.7) */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="16" strokeDasharray="28.7 210.1" strokeDashoffset="-181.5" />
                  {/* 90+: 12% (28.7) */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="16" strokeDasharray="28.7 210.1" strokeDashoffset="-210.2" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-800 leading-none">45.2M</span>
                  <span className="text-[9px] text-slate-500">ج.م</span>
                </div>
              </div>

              {/* Legend & Breakdown */}
              <div className="w-full space-y-2">
                {agingSegments.map((seg) => (
                  <div 
                    key={seg.label}
                    onClick={() => setActiveView('debt_aging')}
                    className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 p-1 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="font-semibold text-slate-700">{seg.label}</span>
                    </div>
                    <span className="font-bold text-slate-900">{seg.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3.2 طلبات الموافقة الائتمانية */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">طلبات الموافقة الائتمانية</h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 font-medium">
                    <th className="pb-2">رقم الطلب</th>
                    <th className="pb-2">العميل</th>
                    <th className="pb-2">الزيادة المطلوبة</th>
                    <th className="pb-2 text-center">الحالة</th>
                    <th className="pb-2 text-center">تاريخ الطلب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(creditRequests || []).map((req) => (
                    <tr 
                      key={req.id} 
                      onClick={() => setActiveView('credit_approvals')}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="py-2 font-mono font-bold text-slate-700">{req.requestNumber}</td>
                      <td className="py-2 font-semibold text-slate-900">{req.customerName}</td>
                      <td className="py-2 font-mono font-bold text-blue-600">{req.requestedIncrease.toLocaleString()}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          req.status === 'موافق عليه'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'مرفوض'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2 text-center text-slate-500 font-mono text-[11px]">{req.requestDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-left">
              <button
                onClick={() => setActiveView('credit_approvals')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>متابعة كل الموافقات</span>
                <span>←</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Full Resolution Logo Showcase Modal */}
      {showLogoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLogoModal(false)}
        >
          <div 
            className="bg-[#0e1826] border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-white">معاينة الشعار وهوية الشركة المعتمدة</h3>
              </div>
              <button 
                onClick={() => setShowLogoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-5">
              {/* Dark & Light Background Previews */}
              <div className="grid grid-cols-2 gap-4">
                {/* On Dark Surface */}
                <div className="p-4 rounded-xl bg-[#09111c] border border-slate-800 text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">على خلفية داكنة (شاشات النظام)</span>
                  <div className="w-24 h-24 mx-auto rounded-xl bg-white p-2 shadow-inner flex items-center justify-center">
                    <img 
                      src={companySettings?.logoUrl || '/assets/unigroup_logo.jpg'} 
                      alt="Uni-Group Logo Dark" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                </div>

                {/* On Light Surface */}
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 block">على خلفية فاتحة (الفواتير والطباعة)</span>
                  <div className="w-24 h-24 mx-auto rounded-xl bg-white p-2 shadow-inner border border-slate-200 flex items-center justify-center">
                    <img 
                      src={companySettings?.logoUrl || '/assets/unigroup_logo.jpg'} 
                      alt="Uni-Group Logo Light" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                </div>
              </div>

              {/* Identity Specifications */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">اسم الشركة المعتمد:</span>
                  <span className="font-bold text-white">{companySettings?.companyName || 'مجموعة يوني جروب - Uni-Group'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">الاسم الإنجليزي:</span>
                  <span className="font-mono text-blue-300">{companySettings?.companyNameEn || 'Uni-Group'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">حالة الاعتماد:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    معتمد ومثبت في التخزين المحلي
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setShowLogoModal(false);
                  logoFileInputRef.current?.click();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Upload className="w-4 h-4" />
                <span>رفع شعار بديل</span>
              </button>

              <button
                onClick={() => setShowLogoModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
