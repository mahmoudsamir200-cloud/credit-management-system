import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  ShieldCheck, 
  MapPin, 
  History, 
  Plus, 
  UserCheck, 
  Lock, 
  Mail, 
  Phone, 
  Check, 
  X,
  BellRing,
  Database,
  CloudCheck,
  Building2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  AlertTriangle,
  UserPlus,
  FileSpreadsheet,
  FilePlus,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Customer, Invoice, Payment, ActivityLog, ActiveNavView, CompanySettings } from '../types';
import { DEFAULT_COMPANY_LOGO, DEFAULT_COMPANY_NAME, DEFAULT_COMPANY_NAME_AR } from '../utils/companyBranding';

interface AdminViewProps {
  activeView: ActiveNavView;
  logs: ActivityLog[];
  customers?: Customer[];
  invoices?: Invoice[];
  payments?: Payment[];
  onClearAllData?: () => Promise<void> | void;
  onResetDemoData?: () => Promise<void> | void;
  onOpenNewCustomer?: () => void;
  onOpenNewInvoice?: () => void;
  onOpenImport?: () => void;
  companySettings?: CompanySettings;
  onUpdateCompanySettings?: (settings: CompanySettings) => void;
  setActiveView?: (view: ActiveNavView) => void;
}

interface SystemUser {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'نشط' | 'معطل';
  lastActive: string;
}

export const AdminView: React.FC<AdminViewProps> = ({
  activeView,
  logs = [],
  customers = [],
  invoices = [],
  payments = [],
  onClearAllData,
  onResetDemoData,
  onOpenNewCustomer,
  onOpenNewInvoice,
  onOpenImport,
  companySettings,
  onUpdateCompanySettings,
  setActiveView,
}) => {
  const [users, setUsers] = useState<SystemUser[]>([]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('مسؤول تحصيل');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  // Clear & Reset Data States
  const [showConfirmClearModal, setShowConfirmClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccessMessage, setClearSuccessMessage] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState(false);

  // Settings State
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [creditAlertThreshold, setCreditAlertThreshold] = useState(90);
  const [autoSuspendOnDays, setAutoSuspendOnDays] = useState(60);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Company Branding & Logo State
  const [companyName, setCompanyName] = useState(companySettings?.companyName || DEFAULT_COMPANY_NAME_AR);
  const [companyNameEn, setCompanyNameEn] = useState(companySettings?.companyNameEn || DEFAULT_COMPANY_NAME);
  const [logoUrl, setLogoUrl] = useState(companySettings?.logoUrl || DEFAULT_COMPANY_LOGO);
  const [slogan, setSlogan] = useState(companySettings?.slogan || 'إدارة ذكية .. تحصيل أفضل');
  const [brandingSavedMessage, setBrandingSavedMessage] = useState(false);

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم ملف اللوجو يجب ألا يتعدى 2 ميجابايت لسرعة التحميل.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateCompanySettings) {
      onUpdateCompanySettings({
        companyName: companyName.trim() || DEFAULT_COMPANY_NAME_AR,
        companyNameEn: companyNameEn.trim() || DEFAULT_COMPANY_NAME,
        logoUrl: logoUrl.trim() || DEFAULT_COMPANY_LOGO,
        slogan: slogan.trim() || 'إدارة ذكية .. تحصيل أفضل',
        phone: companySettings?.phone || '',
        email: companySettings?.email || '',
        address: companySettings?.address || '',
      });
    }
    setBrandingSavedMessage(true);
    setTimeout(() => setBrandingSavedMessage(false), 3500);
  };

  const handleResetToDefaultLogo = () => {
    setLogoUrl(DEFAULT_COMPANY_LOGO);
    setCompanyName(DEFAULT_COMPANY_NAME_AR);
    setCompanyNameEn(DEFAULT_COMPANY_NAME);
    if (onUpdateCompanySettings) {
      onUpdateCompanySettings({
        companyName: DEFAULT_COMPANY_NAME_AR,
        companyNameEn: DEFAULT_COMPANY_NAME,
        logoUrl: DEFAULT_COMPANY_LOGO,
        slogan: 'إدارة ذكية .. تحصيل أفضل',
        phone: companySettings?.phone || '',
        email: companySettings?.email || '',
        address: companySettings?.address || '',
      });
    }
    setBrandingSavedMessage(true);
    setTimeout(() => setBrandingSavedMessage(false), 3000);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    setUsers(prev => [
      ...prev,
      {
        id: `usr-${Date.now()}`,
        name: newUserName,
        role: newUserRole,
        department: newUserRole.includes('تحصيل') ? 'فريق التحصيل الميداني' : 'إدارة الائتمان والمخاطر',
        email: newUserEmail || `${Date.now()}@company.com`,
        phone: newUserPhone || '01000000000',
        status: 'نشط',
        lastActive: 'اليوم',
      }
    ]);

    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPhone('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  const handleExecuteClear = async () => {
    if (!onClearAllData) return;
    try {
      setIsClearing(true);
      await onClearAllData();
      setShowConfirmClearModal(false);
      setClearSuccessMessage(true);
      setTimeout(() => setClearSuccessMessage(false), 6000);
    } catch (e) {
      console.error('Error clearing data:', e);
    } finally {
      setIsClearing(false);
    }
  };

  const handleExecuteResetDemo = async () => {
    if (!onResetDemoData) return;
    try {
      setIsResetting(true);
      await onResetDemoData();
      setResetSuccessMessage(true);
      setTimeout(() => setResetSuccessMessage(false), 5000);
    } catch (e) {
      console.error('Error resetting demo data:', e);
    } finally {
      setIsResetting(false);
    }
  };

  const isAuditView = activeView === 'admin_audit_logs';
  const isSettingsView = activeView === 'admin_settings';
  const isBranchesView = activeView === 'admin_branches';

  return (
    <div id="admin-management-view" className="p-4 sm:p-6 space-y-6 text-right max-w-[1600px] mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {isAuditView 
                ? 'سجل العمليات والتدقيق الشامل' 
                : isSettingsView 
                ? 'إعدادات النظام والسياسة الائتمانية' 
                : isBranchesView 
                ? 'إدارة الفروع والمناطق الجغرافية' 
                : 'إدارة المستخدمين والصلاحيات'}
            </h2>
            <p className="text-xs text-slate-500">
              التحكم في أدوار العمل، فترات السماح، والتدقيق الأمني لجميع حركات النظام
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAuditView && !isSettingsView && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Users & Permissions View */}
      {!isAuditView && !isSettingsView && !isBranchesView && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">مستخدمو النظام والصلاحيات الممنوحة</h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">المسمى الوظيفي والدور</th>
                  <th className="p-3">الإدارة</th>
                  <th className="p-3">البريد الإلكتروني</th>
                  <th className="p-3">الهاتف</th>
                  <th className="p-3 text-center">آخر نشاط</th>
                  <th className="p-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.length > 0 ? users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 font-semibold text-blue-700">{u.role}</td>
                    <td className="p-3 text-slate-600">{u.department}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">{u.phone}</td>
                    <td className="p-3 text-center text-slate-500 text-[11px]">{u.lastActive}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      لا توجد حسابات مستخدمين فعلية مرتبطة بالنظام حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Logs View */}
      {isAuditView && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">سجل التدقيق وتتبع العمليات المالية</h3>
            </div>
            <span className="text-xs text-slate-500">{logs.length} سجلات موثقة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">المستخدم المنفذ</th>
                  <th className="p-3">تفاصيل الحركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{log.timestamp}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{log.user}</td>
                    <td className="p-3 text-slate-700 leading-relaxed">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Settings View */}
      {isSettingsView && (
        <div className="space-y-6 max-w-3xl">
          {/* Card 1: Company Logo & Corporate Branding */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">شعار وهوية الشركة والمؤسسة</h3>
                  <p className="text-[11px] text-slate-500">
                    تخصيص اللوجو واسم الشركة ليظهر في الشريط العلوي، القائمة الجانبية، وكشوف الحساب المطبوعة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetToDefaultLogo}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                title="استعادة شعار يوني جروب Uni-Group الأصلي"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الشعار الافتراضي</span>
              </button>
            </div>

            {brandingSavedMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تم حفظ وتحديث شعار وهوية الشركة بنجاح وتطبيقه على النظام فوراً!</span>
              </div>
            )}

            {/* Logo Preview & Live Card */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                  <img
                    src={logoUrl || DEFAULT_COMPANY_LOGO}
                    alt={companyName}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== DEFAULT_COMPANY_LOGO) {
                        target.src = DEFAULT_COMPANY_LOGO;
                      }
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{companyName || DEFAULT_COMPANY_NAME_AR}</span>
                    <span className="text-xs text-blue-400 font-mono font-semibold">{companyNameEn || DEFAULT_COMPANY_NAME}</span>
                  </div>
                  <p className="text-[11px] text-blue-200/80 mt-0.5">{slogan || 'إدارة ذكية .. تحصيل أفضل'}</p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    معاينة حية للشعار المعتمد
                  </span>
                </div>
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-xs">
                <Upload className="w-4 h-4" />
                <span>رفع لوجو جديد</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Branding Edit Form */}
            <form onSubmit={handleSaveBranding} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">اسم الشركة (بالعربية)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: يوني جروب أو اسم شركتكم"
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold">اسم الشركة (بالإنجليزية)</label>
                  <input
                    type="text"
                    value={companyNameEn}
                    onChange={(e) => setCompanyNameEn(e.target.value)}
                    placeholder="e.g. Uni-Group"
                    className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">رابط صورة الشعار (URL مباشر) أو مسار الصورة</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoUrl.startsWith('data:image') ? 'صورة مرفوعة (Base64 محلي)' : logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500 font-mono text-[11px]"
                  />
                  <label className="cursor-pointer px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>تصفح ملف</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  يمكنك رفع صورة اللوجو مباشرة من جهازك (PNG أو JPG) أو كتابة رابط الشعار مباشرة على الإنترنت.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-700 font-bold">الشعار اللفظي للنظام / الترويسة الفرعية</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="مثال: إدارة ذكية .. تحصيل أفضل"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد وحفظ الشعار والهوية</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Credit Policy & Alert Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Settings className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">إعدادات السياسة الائتمانية والتنبيهات</h3>
            </div>

          {settingsSavedMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ وتطبيق إعدادات السياسة الائتمانية بنجاح على جميع العمليات.</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">فترة السماح قبل احتساب التأخير (أيام)</label>
              <input
                type="number"
                min="0"
                max="30"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full sm:w-48 border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              />
              <p className="text-[11px] text-slate-500">الفترة الإضافية الممنوحة بعد تاريخ استحقاق الفاتورة دون تطبيق عقوبات ائتمانية.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">نسبة استغلال الحد الائتماني لإطلاق تحذير أصفر (%)</label>
              <input
                type="number"
                min="50"
                max="100"
                value={creditAlertThreshold}
                onChange={(e) => setCreditAlertThreshold(Number(e.target.value))}
                className="w-full sm:w-48 border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              />
              <p className="text-[11px] text-slate-500">عند وصول رصيد العميل إلى هذه النسبة من السقف، يظهر في مركز التنبيهات.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-700 font-bold">حد الإيقاف الائتماني التلقائي (أيام تأخير)</label>
              <input
                type="number"
                min="30"
                max="120"
                value={autoSuspendOnDays}
                onChange={(e) => setAutoSuspendOnDays(Number(e.target.value))}
                className="w-full sm:w-48 border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
              />
              <p className="text-[11px] text-slate-500">عدد أيام التأخير التي بعدها يوصي النظام بالإيقاف الائتماني الفوري للعميل.</p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>

        {/* Card 3: Database & Demo Data Management */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">إدارة قاعدة البيانات ومسح البيانات التجريبية</h3>
                <p className="text-[11px] text-slate-500">
                  تفريغ النظام من البيانات الوهمية والتجريبية لبدء تسجيل وإدخال بياناتك وقوائم عملائك وفواتيرك الحقيقية
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              قاعدة البيانات السحابية متصلة
            </span>
          </div>

          {clearSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-extrabold text-sm">تم مسح وتصفير كافة البيانات بنجاح!</p>
                <p className="text-emerald-700 font-normal">
                  قاعدة البيانات الآن فارغة ونظيفة 100% وجاهزة لاستقبال بياناتك. يمكنك الآن البدء بإضافة أول عميل أو إصدار فاتورة أو استيراد ملف إكسيل.
                </p>
              </div>
            </div>
          )}

          {resetSuccessMessage && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>تم إعادة شحن البيانات التجريبية بنجاح لاختبار النظام.</span>
            </div>
          )}

          {/* Live Data Summary Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[11px] text-slate-500 font-medium">العملاء المسجلون</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{customers.length}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[11px] text-slate-500 font-medium">الفواتير المسجلة</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{invoices.length}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[11px] text-slate-500 font-medium">سندات التحصيل</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{payments.length}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[11px] text-slate-500 font-medium">سجلات التدقيق</div>
              <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{logs.length}</div>
            </div>
          </div>

          {/* Wipe Demo Data Callout */}
          <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-900">مسح البيانات التجريبية وتصفير النظام</h4>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  هذا الخيار يمسح جميع العملاء التجريبيين، الفواتير، المقبوضات، وسجلات المتابعة نهائياً من السحابة والمتصفح لبدء إدخال بياناتك وقوائمك الفعلية من الصفر.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmClearModal(true)}
                disabled={isClearing}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>مسح كافة البيانات التجريبية وبدء نظام جديد فارغ</span>
              </button>

              {onResetDemoData && (
                <button
                  type="button"
                  onClick={handleExecuteResetDemo}
                  disabled={isResetting}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                  title="استرجاع البيانات التوضيحية للاختبار"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>إعادة شحن بيانات تجريبية للاختبار</span>
                </button>
              )}
            </div>
          </div>

          {/* Fast Data Entry Launchpad */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900">إدخال البيانات الجديدة الخاصة بك:</h4>
            </div>
            <p className="text-[11px] text-slate-500">
              استخدم الخيارات التالية لبدء إدخال بيانات مؤسستك الحقيقية وقوائمك المالية بكل سهولة:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Add New Customer */}
              <button
                type="button"
                onClick={onOpenNewCustomer}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 transition text-right group space-y-2 bg-slate-50/60 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">إضافة عميل جديد</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">تسجيل عميل جديد، كود الحساب، والحد الائتماني</div>
                </div>
              </button>

              {/* Option 2: New Invoice */}
              <button
                type="button"
                onClick={onOpenNewInvoice}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/60 transition text-right group space-y-2 bg-slate-50/60 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">إصدار فاتورة جديدة</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">إنشاء فاتورة مبيعات آجل وتحديد تاريخ الاستحقاق</div>
                </div>
              </button>

              {/* Option 3: Excel Import */}
              <button
                type="button"
                onClick={onOpenImport}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 transition text-right group space-y-2 bg-slate-50/60 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">استيراد إكسيل شامل</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">رفع وتحديث مئات الفواتير والعملاء من ملف Excel أو CSV</div>
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    )}

      {/* Modal: Confirm Wipe All Data */}
      {showConfirmClearModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right border border-red-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">تأكيد مسح كافة البيانات التجريبية</h3>
                <p className="text-xs text-red-600 font-semibold">تحذير: هذا الإجراء نهائي ولا يمكن التراجع عنه</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              <p>
                أنت على وشك مسح وتصفير كافة البيانات المسجلة حالياً، بما في ذلك:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium pr-2">
                <li>جميع سجلات العملاء ({customers.length} عميل)</li>
                <li>كافة الفواتير ومطالبات الآجل ({invoices.length} فاتورة)</li>
                <li>جميع سندات التحصيل والمقبوضات ({payments.length} سند)</li>
                <li>سجلات التدقيق ومهام المتابعة ووعود السداد</li>
              </ul>
              <p className="text-slate-500 text-[11px] pt-1">
                بعد المسح، ستصبح قاعدة البيانات نظيفة تماماً ومستعدة لاستقبال بياناتك الحقيقية.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowConfirmClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
              >
                إلغاء والتراجع
              </button>
              <button
                type="button"
                onClick={handleExecuteClear}
                disabled={isClearing}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {isClearing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري المسح...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، امسح وابدأ نظاماً جديداً</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add System User */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">إضافة مستخدم جديد للنظام</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: خالد إبراهيم"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الدور والصلاحية</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:border-blue-500"
                >
                  <option value="مسؤول تحصيل أول">مسؤول تحصيل أول</option>
                  <option value="محصل ميداني">محصل ميداني</option>
                  <option value="أخصائي ائتمان">أخصائي ائتمان</option>
                  <option value="مدير ائتمان فرعي">مدير ائتمان فرعي</option>
                  <option value="محاسب عملاء">محاسب عملاء</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@company.com"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="010XXXXXXXX"
                  className="w-full border border-slate-300 rounded-lg p-2 text-slate-900 focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-xs"
                >
                  حفظ المستخدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
