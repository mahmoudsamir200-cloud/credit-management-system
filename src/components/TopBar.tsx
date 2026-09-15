import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  Plus, 
  CreditCard, 
  User, 
  AlertTriangle,
  Info,
  LogOut,
  Settings as SettingsIcon,
  Database,
  UserPlus
} from 'lucide-react';
import { SystemNotification, ActiveNavView, CompanySettings } from '../types';
import { UniGroupLogo } from './UniGroupLogo';

interface TopBarProps {
  onToggleSidebar: () => void;
  notifications: SystemNotification[];
  onOpenNewCustomer?: () => void;
  onOpenNewInvoice: () => void;
  onOpenPayment: () => void;
  setActiveView: (view: ActiveNavView) => void;
  onClearAllData?: () => void;
  onResetDemoData?: () => void;
  companySettings?: CompanySettings;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  notifications = [],
  onOpenNewCustomer,
  onOpenNewInvoice,
  onOpenPayment,
  setActiveView,
  onClearAllData,
  onResetDemoData,
  companySettings,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeNotifs = notifications || [];

  const unreadNotifsCount = safeNotifs.filter(n => !n.read).length;

  return (
    <header id="enterprise-topbar" className="bg-[#0b1320] border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Right Section: Logo & Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="تبديل القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => setActiveView('dashboard')}
            className="cursor-pointer group hover:opacity-95 transition"
            title="الانتقال إلى لوحة التحكم الرئيسية"
          >
            <UniGroupLogo
              size="md"
              variant="full"
              customLogoUrl={companySettings?.logoUrl}
              customCompanyName={companySettings?.companyName}
            />
          </div>
        </div>

        {/* Left Section: Actions, Notifications, User */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* Quick Action: New Customer */}
          {onOpenNewCustomer && (
            <button
              onClick={onOpenNewCustomer}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="تسجيل عميل جديد"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>عميل جديد</span>
            </button>
          )}
          
          {/* Quick Action: New Invoice */}
          <button
            onClick={onOpenNewInvoice}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>فاتورة جديدة</span>
          </button>

          {/* Quick Action: New Payment */}
          <button
            onClick={onOpenPayment}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>تسجيل سداد</span>
          </button>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="مركز الإشعارات والتنبيهات"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border border-[#0b1320]">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-right">
                <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">التنبيهات والإشعارات</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                      {unreadNotifsCount} جديدة
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsNotifOpen(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    إغلاق
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 custom-scrollbar">
                  {safeNotifs.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => {
                        setActiveView('debt_aging');
                        setIsNotifOpen(false);
                      }}
                      className="p-3 hover:bg-slate-800/50 cursor-pointer transition flex items-start gap-2.5"
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.type === 'critical' ? (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        ) : n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-white">{n.title}</div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-500 block mt-1">{n.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-800 bg-slate-900/50 text-center">
                  <button
                    onClick={() => {
                      setActiveView('admin_audit_logs');
                      setIsNotifOpen(false);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    عرض كل سجل العمليات والتدقيق ←
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                م.س
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">محمود سمير</div>
                <div className="text-[10px] text-slate-400 leading-tight">مدير الائتمان</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-right">
                <div className="p-3 border-b border-slate-800">
                  <div className="text-xs font-bold text-white">محمود سمير</div>
                  <div className="text-[11px] text-blue-400">مدير عام الائتمان والتحصيل</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">mahmoudsamir200@gmail.com</div>
                </div>
                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveView('admin_users');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition text-right"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>الملف الشخصي والصلاحيات</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveView('admin_settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition text-right"
                  >
                    <SettingsIcon className="w-4 h-4 text-slate-400" />
                    <span>إعدادات النظام والائتمان</span>
                  </button>
                  {onResetDemoData && (
                    <button
                      onClick={() => {
                        onResetDemoData();
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-amber-300 hover:bg-amber-950/40 rounded-lg transition text-right"
                    >
                      <Database className="w-4 h-4 text-amber-400" />
                      <span>إعادة تعيين البيانات للشاشة</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setActiveView('admin_settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/40 rounded-lg transition text-right"
                  >
                    <Database className="w-4 h-4 text-rose-400" />
                    <span>مسح البيانات التجريبية وإعدادات النظام</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
