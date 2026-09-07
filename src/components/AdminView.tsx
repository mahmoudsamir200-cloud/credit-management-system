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
  CloudCheck
} from 'lucide-react';
import { ActivityLog, ActiveNavView } from '../types';

interface AdminViewProps {
  activeView: ActiveNavView;
  logs: ActivityLog[];
  onClearAllData?: () => void;
  onResetDemoData?: () => void;
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-3xl">
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
