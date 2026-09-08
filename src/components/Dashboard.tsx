import React, { useState, useMemo } from 'react';
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
import { calculateAging, calculateCollectedAmount, formatNumber } from '../utils/storage';
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

  const customerDebtSummary = useMemo(() => {
    return (customers || []).map((customer) => {
      const outstanding = (invoices || [])
        .filter((invoice) => invoice.customerId === customer.id)
        .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);

      const overdue = (invoices || [])
        .filter((invoice) => invoice.customerId === customer.id && (invoice.status === 'overdue' || (invoice.daysOverdue || 0) > 0))
        .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);

      return {
        ...customer,
        totalOutstanding: outstanding,
        overdueAmount: overdue,
      };
    });
  }, [customers, invoices]);

  const totalOutstanding = useMemo(
    () => (invoices || []).reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0),
    [invoices]
  );

  const totalOutstandingShort = useMemo(
    () => totalOutstanding >= 1000000 ? `${(totalOutstanding / 1000000).toFixed(1)}M` : totalOutstanding.toLocaleString(),
    [totalOutstanding]
  );

  const totalInvoiced = useMemo(
    () => (invoices || []).reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0),
    [invoices]
  );

  const totalCollected = useMemo(
    () => calculateCollectedAmount(invoices || []),
    [invoices]
  );

  const overdueAmount = useMemo(
    () => (invoices || [])
      .filter((invoice) => invoice.status === 'overdue' || (invoice.daysOverdue || 0) > 0)
      .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0),
    [invoices]
  );

  const availableCredit = useMemo(() => {
    return (customerDebtSummary || []).reduce((sum, customer) => {
      const customerBalance = (invoices || [])
        .filter((invoice) => invoice.customerId === customer.id)
        .reduce((total, invoice) => total + (invoice.remainingAmount || 0), 0);
      const remainingLimit = Math.max((customer.creditLimit || 0) - customerBalance, 0);
      return sum + remainingLimit;
    }, 0);
  }, [customerDebtSummary, invoices]);

  const dueTodayAmount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (invoices || [])
      .filter((invoice) => {
        if (invoice.remainingAmount <= 0) return false;
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      })
      .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);
  }, [invoices]);

  const dueIn48HoursAmount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (invoices || [])
      .filter((invoice) => {
        if (invoice.remainingAmount <= 0) return false;
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 2;
      })
      .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);
  }, [invoices]);

  const dueIn48HoursInvoices = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (invoices || []).filter((invoice) => {
      if (invoice.remainingAmount <= 0) return false;
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 2;
    });
  }, [invoices]);

  const riskCounts = useMemo(() => {
    const overdueInvoiceCount = (invoices || []).filter((invoice) => invoice.status === 'overdue' || (invoice.daysOverdue || 0) > 0).length;
    const overLimitCustomersCount = (customers || []).filter((customer) => {
      const customerOutstanding = (invoices || [])
        .filter((invoice) => invoice.customerId === customer.id)
        .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);
      return (customer.creditLimit || 0) > 0 && customerOutstanding > (customer.creditLimit || 0);
    }).length;
    const pendingApprovalsCount = (creditRequests || []).filter((request) => request.status === 'قيد المراجعة').length;
    const suspendedCustomersCount = (customers || []).filter((customer) => customer.isSuspended).length;
    const followUpCount = (customers || []).filter((customer) => (customer.status === 'يحتاج متابعة' || customer.status === 'حرج')).length;

    return {
      overdueInvoiceCount,
      overLimitCustomersCount,
      pendingApprovalsCount,
      suspendedCustomersCount,
      followUpCount,
    };
  }, [customers, invoices, creditRequests]);

  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  const top10Customers = useMemo(
    () => [...customerDebtSummary].sort((a, b) => (b.totalOutstanding || 0) - (a.totalOutstanding || 0)).slice(0, 10),
    [customerDebtSummary]
  );

  const invoicesDueToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (invoices || [])
      .filter((invoice) => {
        if (invoice.remainingAmount <= 0) return false;
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      })
      .slice(0, 5);
  }, [invoices]);

  const recentPayments = useMemo(
    () => [...(payments || [])].sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).slice(0, 4),
    [payments]
  );

  const trendMonths = useMemo(() => {
    const result: { month: string; debt: number; collected: number; rate: number }[] = [];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);
      date.setHours(0, 0, 0, 0);

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(date);

      const debt = (invoices || [])
        .filter((invoice) => {
          const issueMonth = invoice.issueDate?.slice(0, 7);
          return issueMonth === monthKey || invoice.dueDate?.slice(0, 7) === monthKey;
        })
        .reduce((sum, invoice) => sum + (invoice.remainingAmount || 0), 0);

      const collected = (payments || [])
        .filter((payment) => payment.paymentDate?.slice(0, 7) === monthKey)
        .reduce((sum, payment) => sum + (payment.amount || 0), 0);

      result.push({
        month: monthLabel,
        debt,
        collected,
        rate: debt > 0 ? (collected / debt) * 100 : 0,
      });
    }

    return result;
  }, [invoices, payments]);

  const trendChartMax = useMemo(
    () => Math.max(...trendMonths.flatMap((item) => [item.debt, item.collected]), 1),
    [trendMonths]
  );

  const regions = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; color: string }>();
    const palette = ['#2563eb', '#0284c7', '#0d9488', '#16a34a', '#dc2626', '#9333ea'];
    const orderedNames = ['القاهرة', 'الجيزة', 'الدلتا', 'الصعيد', 'الإسكندرية', 'أخرى'];

    const source = customerDebtSummary.length > 0 ? customerDebtSummary : customers;

    source.forEach((customer, index) => {
      const region = customer.region || 'أخرى';
      const amount = (customer.totalOutstanding || 0) || 0;
      if (!map.has(region)) {
        map.set(region, {
          name: region,
          amount: 0,
          color: palette[orderedNames.indexOf(region) >= 0 ? orderedNames.indexOf(region) : Math.min(index, palette.length - 1)],
        });
      }
      map.get(region)!.amount += amount;
    });

    const data = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    const total = data.reduce((sum, item) => sum + item.amount, 0);

    return data.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.amount / total) * 100) : 0,
    }));
  }, [customerDebtSummary, customers]);

  const agingSegments = useMemo(() => {
    const bucketData = calculateAging(invoices || []);
    const total = bucketData.reduce((sum, bucket) => sum + bucket.amount, 0);

    return bucketData
      .filter((bucket) => bucket.amount > 0)
      .map((bucket, index) => {
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
        return {
          label: bucket.label,
          percentage: total > 0 ? Math.round((bucket.amount / total) * 100) : 0,
          color: colors[index] || '#64748b',
        };
      });
  }, [invoices]);

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
          <span>
            {new Intl.DateTimeFormat('ar-EG', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }).format(new Date())}
          </span>
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
              {formatNumber(totalOutstanding)} <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>{Math.max(0, Math.round(collectionRate))}% من الشهر الماضي</span>
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
              {formatNumber(availableCredit)} <span className="text-xs font-normal text-blue-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>{Math.max(0, Math.round((availableCredit / Math.max(totalInvoiced, 1)) * 100))}% من المجموع</span>
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
              {formatNumber(overdueAmount)} <span className="text-xs font-normal text-rose-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>{riskCounts.overdueInvoiceCount} فاتورة متأخرة</span>
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
              {formatNumber(dueTodayAmount)} <span className="text-xs font-normal text-amber-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>{invoicesDueToday.length} فاتورة مستحقة اليوم</span>
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
              {formatNumber(dueIn48HoursAmount)} <span className="text-xs font-normal text-teal-600">ج.م</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>{dueIn48HoursInvoices.length} فاتورة قريبة الاستحقاق</span>
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
              {Math.round(collectionRate)}%
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowUp className="w-3 h-3" />
              <span>{formatNumber(totalCollected)} محصلة</span>
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
              {riskCounts.suspendedCustomersCount}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-1">
              <ArrowDown className="w-3 h-3" />
              <span>{riskCounts.followUpCount} تحتاج متابعة</span>
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
              {[0, 10, 20, 30, 40, 50].map((val) => {
                const y = 180 - (val / 50) * 160;
                const axisValue = (trendChartMax * val) / 50;
                return (
                  <g key={val}>
                    <line x1="40" y1={y} x2="480" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="30" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontFamily="sans-serif">
                      {axisValue >= 1000000 ? `${(axisValue / 1000000).toFixed(1)}M` : Math.round(axisValue).toLocaleString()}
                    </text>
                  </g>
                );
              })}

              {/* Bars and Line points */}
              {trendMonths.map((item, idx) => {
                const xCenter = 80 + idx * 70;
                const debtHeight = (item.debt / trendChartMax) * 160;
                const collHeight = (item.collected / trendChartMax) * 160;
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
                {regions.map((region, index) => {
                  const circumference = 2 * Math.PI * 38;
                  const offset = regions
                    .slice(0, index)
                    .reduce((sum, item) => sum + (item.percentage / 100) * circumference, 0);
                  const segment = (region.percentage / 100) * circumference;
                  return (
                    <circle
                      key={region.name}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={region.color}
                      strokeWidth="18"
                      strokeDasharray={`${segment} ${circumference - segment}`}
                      strokeDashoffset={-offset}
                    />
                  );
                })}
              </svg>
              {/* Center Total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-black text-slate-800 leading-none">{totalOutstandingShort}</span>
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
                {riskCounts.overdueInvoiceCount}
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
                {riskCounts.overLimitCustomersCount}
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
                {riskCounts.pendingApprovalsCount}
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
                {riskCounts.suspendedCustomersCount}
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
                {riskCounts.followUpCount}
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
                  {agingSegments.map((segment, index) => {
                    const circumference = 2 * Math.PI * 38;
                    const offset = agingSegments
                      .slice(0, index)
                      .reduce((sum, item) => sum + (item.percentage / 100) * circumference, 0);
                    const segmentLength = (segment.percentage / 100) * circumference;
                    return (
                      <circle
                        key={segment.label}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={segment.color}
                        strokeWidth="16"
                        strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                        strokeDashoffset={-offset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-slate-800 leading-none">{totalOutstandingShort}</span>
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

    </div>
  );
};
