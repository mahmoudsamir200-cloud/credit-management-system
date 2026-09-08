import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  ShieldCheck, 
  FileText, 
  HandCoins, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  ChevronLeft,
  X,
  UserCheck,
  FileCheck,
  AlertOctagon,
  CalendarClock,
  CircleDollarSign,
  TrendingUp,
  MapPin,
  FileSpreadsheet,
  Layers,
  History,
  ShieldAlert
} from 'lucide-react';
import { ActiveNavView, CompanySettings } from '../types';
import { UniGroupLogo } from './UniGroupLogo';

interface SidebarProps {
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCloudConnected?: boolean;
  companySettings?: CompanySettings;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: {
    id: ActiveNavView;
    title: string;
    badge?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpenMobile,
  onCloseMobile,
  isCloudConnected = true,
  companySettings,
}) => {
  // Keep track of which accordion categories are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    customers: true,
    credit: true,
    invoices: true,
    collections: true,
    reports: false,
    admin: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const navSections: NavSection[] = [
    {
      id: 'customers',
      title: 'العملاء',
      icon: Users,
      items: [
        { id: 'customers_directory', title: 'دليل العملاء' },
        { id: 'customers_profile', title: 'ملف العميل' },
        { id: 'credit_limits', title: 'الحدود الائتمانية' },
        { id: 'guarantees_documents', title: 'الضمانات والمستندات' },
      ]
    },
    {
      id: 'credit',
      title: 'الائتمان',
      icon: ShieldCheck,
      items: [
        { id: 'credit_positions', title: 'المراكز الائتمانية' },
        { id: 'credit_requests', title: 'طلبات الائتمان' },
        { id: 'limit_increases', title: 'طلبات زيادة الحد' },
        { id: 'credit_approvals', title: 'الموافقات', badge: 4 },
        { id: 'suspended_customers', title: 'العملاء الموقوفون', badge: 5 },
      ]
    },
    {
      id: 'invoices',
      title: 'الحسابات المدينة',
      icon: FileText,
      items: [
        { id: 'invoices_list', title: 'الفواتير' },
        { id: 'customer_balances', title: 'أرصدة العملاء' },
        { id: 'debt_aging', title: 'أعمار الديون' },
        { id: 'overdue_invoices', title: 'المتأخرات', badge: 23 },
      ]
    },
    {
      id: 'collections',
      title: 'التحصيل',
      icon: HandCoins,
      items: [
        { id: 'collection_plan', title: 'خطة التحصيل' },
        { id: 'daily_followup', title: 'المتابعة اليومية' },
        { id: 'promise_to_pay', title: 'وعد السداد' },
        { id: 'payments_list', title: 'المدفوعات' },
        { id: 'critical_overdue', title: 'المتأخرات الحرجة' },
      ]
    },
    {
      id: 'reports',
      title: 'التقارير',
      icon: BarChart3,
      items: [
        { id: 'report_aging', title: 'تقرير أعمار الديون' },
        { id: 'report_collection', title: 'تقرير التحصيل' },
        { id: 'report_debt', title: 'تقرير المديونية' },
        { id: 'report_risks', title: 'تقرير المخاطر' },
        { id: 'report_limits', title: 'تقرير استخدام الحدود' },
        { id: 'report_branches', title: 'تقرير أداء الفروع' },
        { id: 'report_executive', title: 'التقارير التنفيذية' },
      ]
    },
    {
      id: 'admin',
      title: 'الإدارة',
      icon: Settings,
      items: [
        { id: 'admin_users', title: 'المستخدمون' },
        { id: 'admin_permissions', title: 'الصلاحيات' },
        { id: 'admin_branches', title: 'الفروع والمناطق' },
        { id: 'admin_audit_logs', title: 'سجل العمليات' },
        { id: 'admin_settings', title: 'إعدادات النظام' },
      ]
    }
  ];

  const handleSelectView = (view: ActiveNavView) => {
    setActiveView(view);
    if (window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        id="app-main-sidebar"
        className={`fixed lg:sticky top-0 right-0 z-40 h-screen w-72 bg-[#0d1b2a] text-slate-200 border-l border-slate-800/80 flex flex-col shrink-0 transition-transform duration-300 ease-in-out select-none shadow-2xl lg:shadow-none ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header inside Sidebar (Mobile close & Logo) */}
        <div className="p-3 border-b border-slate-800/80 flex items-center justify-between lg:hidden">
          <UniGroupLogo
            size="sm"
            variant="full"
            customLogoUrl={companySettings?.logoUrl}
            customCompanyName={companySettings?.companyName}
          />
          <button 
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Desktop Brand Header */}
        <div 
          onClick={() => handleSelectView('dashboard')}
          className="hidden lg:flex items-center justify-between p-3.5 border-b border-slate-800/80 bg-[#09131d]/60 cursor-pointer hover:bg-slate-850 transition select-none"
          title="الانتقال للرئيسية"
        >
          <UniGroupLogo
            size="md"
            variant="full"
            customLogoUrl={companySettings?.logoUrl}
            customCompanyName={companySettings?.companyName}
          />
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 custom-scrollbar">
          
          {/* Main Dashboard (الرئيسية) */}
          <button
            id="nav-btn-dashboard"
            onClick={() => handleSelectView('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className={`w-4.5 h-4.5 ${activeView === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
              <span>الرئيسية</span>
            </div>
            {activeView === 'dashboard' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* Accordion Categories */}
          {navSections.map((section) => {
            const SectionIcon = section.icon;
            const isOpen = openSections[section.id];
            const isAnySubActive = section.items.some(item => item.id === activeView);

            return (
              <div key={section.id} className="pt-1">
                {/* Category Header Button */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-colors ${
                    isAnySubActive 
                      ? 'text-blue-400 bg-blue-950/40' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon className="w-4 h-4 text-slate-400" />
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Sub-items List */}
                {isOpen && (
                  <div className="mt-1 space-y-0.5 pr-2.5 border-r border-slate-800 mr-3">
                    {section.items.map((item) => {
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          id={`nav-item-${item.id}`}
                          onClick={() => handleSelectView(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition ${
                            isActive
                              ? 'bg-blue-600/90 text-white font-semibold shadow-xs'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{item.title}</span>
                          {item.badge !== undefined && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-white text-blue-800'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Status Bar: متصل الآن */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#09131d] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">متصل الآن</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">v2.6 Enterprise</span>
        </div>
      </aside>
    </>
  );
};
