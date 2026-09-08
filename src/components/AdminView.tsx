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
  RotateCcw
} from 'lucide-react';
import { ActivityLog, ActiveNavView, CompanySettings } from '../types';
import { DEFAULT_COMPANY_LOGO, DEFAULT_COMPANY_NAME, DEFAULT_COMPANY_NAME_AR } from '../utils/companyBranding';

interface AdminViewProps {
  activeView: ActiveNavView;
  logs: ActivityLog[];
  onClearAllData?: () => void;
  onResetDemoData?: () => void;
  companySettings?: CompanySettings;
  onUpdateCompanySettings?: (settings: CompanySettings) => void;
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
  onClearAllData,
  onResetDemoData,
  companySettings,
  onUpdateCompanySettings,
}) => {
  const [users, setUsers] = useState<SystemUser[]>([
    {
      id: 'usr-1',
      name: 'محمود سمير',
      role: 'مدير عام الائتمان والتحصيل',
      department: 'إدارة الائتمان والمخاطر',
      email: 'mahmoudsamir200@gmail.com',
      phone: '01002345678',
      status: 'نشط',
      lastActive: 'الآن (متصل)',
    },
    {
      id: 'usr-2',
      name: 'أحمد محمد',
      role: 'مسؤول تحصيل أول',
      department: 'فريق التحصيل الميداني',
      email: 'ahmed.mohamed@company.com',
      phone: '01112345679',
      status: 'نشط',
      lastActive: 'منذ 15 دقيقة',
    },
    {
      id: 'usr-3',
      name: 'سارة علي',
      role: 'أخصائي ائتمان ومخاطر',
      department: 'إدارة الائتمان والمخاطر',
      email: 'sara.ali@company.com',
      phone: '01223456780',
      status: 'نشط',
      lastActive: 'منذ ساعتين',
    },
    {
      id: 'usr-4',
      name: 'محمد عبد الله',
      role: 'محاسب عملاء وحسابات مدينة',
      department: 'الإدارة المالية',
      email: 'm.abdallah@company.com',
      phone: '01098765432',
      status: 'نشط',
      lastActive: 'منذ 35 دقيقة',
    },
  ]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('مسؤول تحصيل');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

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
                {users.map((u) => (
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
                ))}
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

              {onResetDemoData && (
                <button
                  type="button"
                  onClick={onResetDemoData}
                  className="px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold text-xs"
                >
                  إعادة تعيين البيانات للشاشة
                </button>
              )}
            </div>
          </form>
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
