import React, { useState, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  CheckSquare,
  Square,
  RotateCcw,
  Search,
  Eye,
  Calendar,
  UserCheck,
  Building,
  DollarSign,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowUpDown,
  CheckCircle2,
  FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, Invoice, Payment } from '../types';

export interface ColumnDefinition {
  id: string;
  label: string;
  category: 'core' | 'customer' | 'financial' | 'dates' | 'management';
  description: string;
  align?: 'right' | 'center' | 'left';
  format?: (row: ReportRow) => string | React.ReactNode;
  exportFormat?: (row: ReportRow) => string | number;
}

export interface ReportRow {
  invoiceId: string;
  invoiceNumber: string;
  customerCode: string;
  customerName: string;
  region: string;
  areaManager: string;
  transactionType: 'INVOICE' | 'consignment' | 'CN' | 'INVOICE-';
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  creditLimit: number;
  issueDate: string;
  dueDate: string;
  paymentTermsDays: number;
  daysOverdue: number;
  dueStatus: 'due_today' | 'overdue' | 'future' | 'paid';
  dueStatusLabel: string;
  statusArabic: string;
  notes: string;
  customerRiskStatus: string;
}

interface CustomReportBuilderProps {
  customers: Customer[];
  invoices: Invoice[];
  payments: Payment[];
  onSelectCustomer?: (customer: Customer) => void;
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  customers = [],
  invoices = [],
  onSelectCustomer,
}) => {
  // Map customers for rapid O(1) lookup
  const customersMap = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => {
      map.set(c.id, c);
      if (c.code) map.set(c.code, c);
    });
    return map;
  }, [customers]);

  // Available Columns Catalog
  const allColumns: ColumnDefinition[] = useMemo(() => [
    {
      id: 'customerCode',
      label: 'كود العميل',
      category: 'customer',
      description: 'كود العميل الرقمي المعتمد في السيستم وAX',
      align: 'center',
      exportFormat: (r) => r.customerCode,
    },
    {
      id: 'customerName',
      label: 'اسم الشركة / العميل',
      category: 'customer',
      description: 'الاسم التجاري أو الشخصي للعميل',
      align: 'right',
      exportFormat: (r) => r.customerName,
    },
    {
      id: 'region',
      label: 'الفرع / المنطقة',
      category: 'customer',
      description: 'الفرع الجغرافي (الجيزة، القاهرة، الإسكندرية...)',
      align: 'center',
      exportFormat: (r) => r.region,
    },
    {
      id: 'areaManager',
      label: 'اسم المدير المسئول',
      category: 'management',
      description: 'مدير المنطقة المشرف على العميل والفواتير',
      align: 'right',
      exportFormat: (r) => r.areaManager,
    },
    {
      id: 'invoiceNumber',
      label: 'رقم الفاتورة',
      category: 'core',
      description: 'الرقم المرجعي للفاتورة بالدفاتر',
      align: 'center',
      exportFormat: (r) => r.invoiceNumber,
    },
    {
      id: 'transactionType',
      label: 'نوع المعاملة',
      category: 'core',
      description: 'فاتورة بيع، أمانات (consignment)، أو إشعار دائن (CN)',
      align: 'center',
      exportFormat: (r) => r.transactionType,
    },
    {
      id: 'totalAmount',
      label: 'القيمة الإجمالية',
      category: 'financial',
      description: 'إجمالي قيمة الفاتورة أو المستند',
      align: 'left',
      exportFormat: (r) => r.totalAmount,
    },
    {
      id: 'paidAmount',
      label: 'المسدد',
      category: 'financial',
      description: 'المبالغ المحصلة من الفاتورة حتى الآن',
      align: 'left',
      exportFormat: (r) => r.paidAmount,
    },
    {
      id: 'remainingAmount',
      label: 'المديونية المتبقية المستحقة',
      category: 'financial',
      description: 'صافي الرصيد المطلوب تحصيله من الفاتورة',
      align: 'left',
      exportFormat: (r) => r.remainingAmount,
    },
    {
      id: 'creditLimit',
      label: 'قيمة الحد الائتماني',
      category: 'financial',
      description: 'سقف التسهيل الائتماني المعتمد للعميل',
      align: 'left',
      exportFormat: (r) => r.creditLimit,
    },
    {
      id: 'issueDate',
      label: 'تاريخ التسجيل (الفاتورة)',
      category: 'dates',
      description: 'تاريخ تحرير الفاتورة بالسيستم',
      align: 'center',
      exportFormat: (r) => r.issueDate,
    },
    {
      id: 'dueDate',
      label: 'تاريخ الاستحقاق (التحصيل)',
      category: 'dates',
      description: 'الموعد المحدد لتحصيل قيمة الفاتورة',
      align: 'center',
      exportFormat: (r) => r.dueDate,
    },
    {
      id: 'paymentTermsDays',
      label: 'عدد أيام الآجل',
      category: 'dates',
      description: 'فترة الائتمان الممنوحة (بالأيام)',
      align: 'center',
      exportFormat: (r) => r.paymentTermsDays,
    },
    {
      id: 'daysOverdue',
      label: 'أيام التأخير',
      category: 'dates',
      description: 'كم يوماً مضت على استحقاق الفاتورة دون سداد',
      align: 'center',
      exportFormat: (r) => r.daysOverdue,
    },
    {
      id: 'dueStatusLabel',
      label: 'حالة الاستحقاق',
      category: 'dates',
      description: 'مستحق اليوم، متأخر، أو قادم مستقبلاً',
      align: 'center',
      exportFormat: (r) => r.dueStatusLabel,
    },
    {
      id: 'statusArabic',
      label: 'حالة السداد',
      category: 'core',
      description: 'غير مسددة، مسددة جزئياً، أو مسددة بالكامل',
      align: 'center',
      exportFormat: (r) => r.statusArabic,
    },
    {
      id: 'customerRiskStatus',
      label: 'تصنيف مخاطر العميل',
      category: 'customer',
      description: 'تقييم الائتمان: جيد، يحتاج متابعة، حرج، موقوف',
      align: 'center',
      exportFormat: (r) => r.customerRiskStatus,
    },
    {
      id: 'notes',
      label: 'الملاحظات والبيان',
      category: 'core',
      description: 'أي ملاحظات خاصة بالمعاملة أو الاتفاق',
      align: 'right',
      exportFormat: (r) => r.notes || '',
    },
  ], []);

  // Default selected columns matching user's image & request
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([
    'customerCode',
    'customerName',
    'remainingAmount',
    'issueDate',
    'dueDate',
    'paymentTermsDays',
    'areaManager',
    'creditLimit',
    'transactionType',
    'dueStatusLabel',
  ]);

  // Quick Preset Profiles
  const presets = [
    {
      name: 'مطابق لشيت الإكسيل (الصورة)',
      description: 'الكود، الاسم، القيمة، التاريخ، تاريخ التحصيل، أيام الآجل، المدير، الحد، نوع المعاملة',
      cols: ['customerCode', 'customerName', 'remainingAmount', 'issueDate', 'dueDate', 'paymentTermsDays', 'areaManager', 'creditLimit', 'transactionType'],
    },
    {
      name: 'تقرير التحصيل والمستحقات العاجلة',
      description: 'يركز على المستحقات وتاريخ الاستحقاق وأيام التأخير مع مدير المنطقة',
      cols: ['customerCode', 'customerName', 'remainingAmount', 'dueDate', 'dueStatusLabel', 'daysOverdue', 'areaManager', 'region'],
    },
    {
      name: 'تقرير الفواتير الشامل الكامل',
      description: 'يعرض جميع التفاصيل المالية والتواريخ والعملاء',
      cols: allColumns.map((c) => c.id),
    },
    {
      name: 'تقرير الائتمان والفروع',
      description: 'الحدود الائتمانية والمديونية لكل فرع ومدير',
      cols: ['customerCode', 'customerName', 'region', 'areaManager', 'creditLimit', 'remainingAmount', 'customerRiskStatus'],
    },
  ];

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterDueTiming, setFilterDueTiming] = useState<string>('all'); // all, due_today, overdue, future, paid
  const [filterTxType, setFilterTxType] = useState<string>('all'); // all, INVOICE, consignment, CN
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');

  // Dropdown options extracted strictly from actual data
  const availableManagers = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.areaManager && inv.areaManager.trim()) {
        set.add(inv.areaManager.trim());
      }
    });
    customers.forEach((c) => {
      if (c.areaManager && c.areaManager.trim()) {
        set.add(c.areaManager.trim());
      }
    });
    return Array.from(set).sort();
  }, [invoices, customers]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.region && inv.region.trim()) {
        set.add(inv.region.trim());
      }
    });
    customers.forEach((c) => {
      if (c.region && c.region.trim()) {
        set.add(c.region.trim());
      }
    });
    return Array.from(set).sort();
  }, [invoices, customers]);

  // Today's date in YYYY-MM-DD for accurate comparison
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Build All Unified Report Rows from live system data
  const rawRows: ReportRow[] = useMemo(() => {
    return invoices.map((inv) => {
      const cust = customersMap.get(inv.customerId) || customersMap.get(inv.customerName);
      const custCode = cust?.code || inv.customerId.replace('cust-', '');
      const custRegion = inv.region || cust?.region || 'غير محدد';
      const custManager = inv.areaManager || cust?.areaManager || 'غير محدد';
      const creditLimit = cust?.creditLimit || 0;
      const riskStatus = cust?.status || 'جيد';

      // Due calculations
      let daysOverdue = 0;
      let dueTiming: 'due_today' | 'overdue' | 'future' | 'paid' = 'future';
      let dueStatusLabel = 'مستحقة لاحقاً';

      if (inv.status === 'paid' || inv.remainingAmount <= 0) {
        dueTiming = 'paid';
        dueStatusLabel = 'مسددة بالكامل';
      } else {
        const dueDateObj = new Date(inv.dueDate);
        const todayObj = new Date(todayStr);
        const diffDays = Math.round((todayObj.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24));

        if (inv.dueDate === todayStr || diffDays === 0) {
          dueTiming = 'due_today';
          dueStatusLabel = 'مستحقة اليوم';
        } else if (diffDays > 0) {
          dueTiming = 'overdue';
          daysOverdue = diffDays;
          dueStatusLabel = `متأخرة (${diffDays} يوم)`;
        } else {
          dueTiming = 'future';
          dueStatusLabel = `قادمة (خلال ${Math.abs(diffDays)} يوم)`;
        }
      }

      // Calculate Payment Terms in Days
      let paymentTerms = 0;
      if (inv.issueDate && inv.dueDate) {
        const issueD = new Date(inv.issueDate);
        const dueD = new Date(inv.dueDate);
        paymentTerms = Math.max(0, Math.round((dueD.getTime() - issueD.getTime()) / (1000 * 60 * 60 * 24)));
      }
      if (!paymentTerms && cust?.paymentTermsDays) {
        paymentTerms = cust.paymentTermsDays;
      }

      // Detect transaction type (like user's Excel sheet)
      let txType: 'INVOICE' | 'consignment' | 'CN' | 'INVOICE-' = 'INVOICE';
      if (inv.totalAmount < 0 || inv.remainingAmount < 0) {
        txType = 'CN'; // إشعار دائن / خصم
      } else if (inv.notes?.toLowerCase().includes('consign') || inv.description?.toLowerCase().includes('أمانة') || inv.invoiceNumber.startsWith('CON-')) {
        txType = 'consignment';
      }

      const statusArabic = 
        inv.status === 'paid' ? 'مسددة' :
        inv.status === 'partial' ? 'مسددة جزئياً' :
        inv.status === 'overdue' ? 'متأخرة' : 'غير مسددة';

      return {
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerCode: custCode,
        customerName: inv.customerName,
        region: custRegion,
        areaManager: custManager,
        transactionType: txType,
        totalAmount: inv.totalAmount,
        paidAmount: inv.paidAmount,
        remainingAmount: inv.remainingAmount,
        creditLimit,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        paymentTermsDays: paymentTerms,
        daysOverdue,
        dueStatus: dueTiming,
        dueStatusLabel,
        statusArabic,
        notes: inv.notes || '',
        customerRiskStatus: riskStatus,
      };
    });
  }, [invoices, customersMap, todayStr]);

  // Filtered Rows based on user's dynamic selections
  const filteredRows = useMemo(() => {
    return rawRows.filter((row) => {
      // 1. Text Search (Customer Name, Code, Invoice Number, Notes)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesQuery =
          row.customerName.toLowerCase().includes(q) ||
          row.customerCode.toLowerCase().includes(q) ||
          row.invoiceNumber.toLowerCase().includes(q) ||
          row.areaManager.toLowerCase().includes(q) ||
          row.region.toLowerCase().includes(q) ||
          row.notes.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Area Manager filter
      if (filterManager !== 'all') {
        if (filterManager === 'unassigned') {
          if (row.areaManager && row.areaManager !== 'غير محدد') return false;
        } else if (!row.areaManager.includes(filterManager)) {
          return false;
        }
      }

      // 3. Region filter
      if (filterRegion !== 'all' && row.region !== filterRegion) {
        return false;
      }

      // 4. Due Timing Filter (مستحق اليوم، متأخر، إلخ)
      if (filterDueTiming !== 'all') {
        if (filterDueTiming === 'due_today' && row.dueStatus !== 'due_today') return false;
        if (filterDueTiming === 'overdue' && row.dueStatus !== 'overdue') return false;
        if (filterDueTiming === 'future' && row.dueStatus !== 'future') return false;
        if (filterDueTiming === 'unpaid' && row.remainingAmount <= 0) return false;
        if (filterDueTiming === 'paid' && row.dueStatus !== 'paid') return false;
      }

      // 5. Transaction Type Filter
      if (filterTxType !== 'all') {
        if (row.transactionType !== filterTxType) return false;
      }

      // 6. Dates range
      if (dateFrom && row.dueDate < dateFrom) return false;
      if (dateTo && row.dueDate > dateTo) return false;

      // 7. Min Amount
      if (minAmount) {
        const min = parseFloat(minAmount);
        if (!isNaN(min) && Math.abs(row.remainingAmount) < min) return false;
      }

      return true;
    });
  }, [rawRows, searchQuery, filterManager, filterRegion, filterDueTiming, filterTxType, dateFrom, dateTo, minAmount]);

  // Aggregate Metrics for Current Filtered View
  const aggregates = useMemo(() => {
    let totalOutstanding = 0;
    let totalDueToday = 0;
    let totalOverdue = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    const uniqueCustomers = new Set<string>();

    filteredRows.forEach((r) => {
      totalOutstanding += r.remainingAmount;
      uniqueCustomers.add(r.customerCode);
      if (r.dueStatus === 'due_today') {
        totalDueToday += r.remainingAmount;
      }
      if (r.dueStatus === 'overdue') {
        totalOverdue += r.remainingAmount;
      }
      if (r.remainingAmount > 0) positiveCount++;
      if (r.remainingAmount < 0) negativeCount++;
    });

    return {
      totalOutstanding,
      totalDueToday,
      totalOverdue,
      uniqueCustomersCount: uniqueCustomers.size,
      invoicesCount: filteredRows.length,
      positiveCount,
      negativeCount,
    };
  }, [filteredRows]);

  // Column Toggle Handler
  const toggleColumn = (colId: string) => {
    setSelectedColumnIds((prev) => {
      if (prev.includes(colId)) {
        if (prev.length <= 1) return prev; // Keep at least one column
        return prev.filter((id) => id !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  const selectAllColumns = () => {
    setSelectedColumnIds(allColumns.map((c) => c.id));
  };

  const deselectAllColumns = () => {
    // Keep 2 minimum
    setSelectedColumnIds(['customerCode', 'customerName', 'remainingAmount']);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterManager('all');
    setFilterRegion('all');
    setFilterDueTiming('all');
    setFilterTxType('all');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
  };

  const hasActiveFilters =
    searchQuery ||
    filterManager !== 'all' ||
    filterRegion !== 'all' ||
    filterDueTiming !== 'all' ||
    filterTxType !== 'all' ||
    dateFrom ||
    dateTo ||
    minAmount;

  // Export to Excel according to visible columns and active filters
  const handleExportExcel = () => {
    if (filteredRows.length === 0) return;

    // Filter columns that are checked
    const activeCols = allColumns.filter((col) => selectedColumnIds.includes(col.id));

    // Construct JSON data for sheet
    const sheetData = filteredRows.map((row, idx) => {
      const exportRow: Record<string, unknown> = {
        'م': idx + 1,
      };

      activeCols.forEach((col) => {
        exportRow[col.label] = col.exportFormat ? col.exportFormat(row) : (row as any)[col.id];
      });

      return exportRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    worksheet['!views'] = [{ rightToLeft: true }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير مخصص');

    // Summary Sheet
    const summaryData = [
      { 'البيان': 'تاريخ ووقت استخراج التقرير', 'القيمة': new Date().toLocaleString('ar-EG') },
      { 'البيان': 'إجمالي عدد الفواتير / المعاملات', 'القيمة': filteredRows.length },
      { 'البيان': 'عدد العملاء الفريدين', 'القيمة': aggregates.uniqueCustomersCount },
      { 'البيان': 'إجمالي الرصيد المستحق (ج.م)', 'القيمة': aggregates.totalOutstanding },
      { 'البيان': 'المديونية المستحقة اليوم (ج.م)', 'القيمة': aggregates.totalDueToday },
      { 'البيان': 'المديونية المتأخرة عن موعدها (ج.م)', 'القيمة': aggregates.totalOverdue },
      { 'البيان': 'مدير المنطقة المفلتر', 'القيمة': filterManager === 'all' ? 'جميع المديرين' : filterManager },
      { 'البيان': 'الفرع / المنطقة المفلترة', 'القيمة': filterRegion === 'all' ? 'جميع الفروع' : filterRegion },
      { 'البيان': 'توقيت الاستحقاق المفلتر', 'القيمة': filterDueTiming === 'all' ? 'الكل' : filterDueTiming },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!views'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص التقرير');

    const fileName = `تقرير_مخصص_${filterManager !== 'all' ? filterManager + '_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const printTableRef = useRef<HTMLDivElement>(null);
  const handlePrint = () => {
    window.print();
  };

  // Get selected Column objects
  const activeColumns = useMemo(() => {
    return allColumns.filter((col) => selectedColumnIds.includes(col.id));
  }, [allColumns, selectedColumnIds]);

  return (
    <div id="custom-reports-builder" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-right print:p-0">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 print:hidden">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            مُنشئ ومُخصص التقارير الديناميكي (Interactive Custom Report Builder)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            سحب وتخصيص تقارير الفواتير والمديونيات
          </h1>
          <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
            تحكم كامل باحترافية: حدد الأعمدة التي ترغب بظهورها بنقرة على علامة الصح (كود العميل، الفرع، المدير المسئول، رقم الفاتورة، تاريخ الاستحقاق، الحد الائتماني...)، وفلتر النتائج بحسب المدير، أو مديونية اليوم، أو المنطقة لتطابق شيتاتك وتقاريرك بدقة 100%.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-export-custom-excel"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
            title="تصدير النتائج الظاهرة فقط إلى شيت إكسيل منسق"
          >
            <Download className="w-4 h-4" />
            <span>تصدير إكسيل ({filteredRows.length})</span>
          </button>

          <button
            id="btn-print-custom-report"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-sm font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 print:hidden">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">إجمالي المستحق المفلتر</span>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">
            {aggregates.totalOutstanding.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
          </p>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900">مستحق اليوم</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-lg font-bold font-mono text-amber-950 mt-1">
            {aggregates.totalDueToday.toLocaleString()} <span className="text-xs font-normal text-amber-700">ج.م</span>
          </p>
        </div>

        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-800 block">المتأخرات (Overdue)</span>
          <p className="text-lg font-bold font-mono text-rose-950 mt-1">
            {aggregates.totalOverdue.toLocaleString()} <span className="text-xs font-normal text-rose-700">ج.م</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">عدد المعاملات والفواتير</span>
          <p className="text-lg font-bold font-mono text-slate-800 mt-1">
            {aggregates.invoicesCount} <span className="text-xs font-normal text-slate-400">سجل</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">العملاء المشمولين</span>
          <p className="text-lg font-bold font-mono text-blue-700 mt-1">
            {aggregates.uniqueCustomersCount} <span className="text-xs font-normal text-slate-400">عميل</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">الأعمدة الظاهرة بالتقرير</span>
          <p className="text-lg font-bold font-mono text-indigo-700 mt-1">
            {selectedColumnIds.length} <span className="text-xs font-normal text-slate-400">من {allColumns.length}</span>
          </p>
        </div>
      </div>

      {/* SECTION 1: COLUMN SELECTOR DRAWER (Checkboxes with Check/Uncheck Arrow) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden print:hidden">
        <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>تحديد وتخصيص أعمدة التقرير</span>
                <span className="text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  (الأعمدة التي بجانبها صح ستظهر، والتي تزيلها ستختفي فوراً)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                اضغط على أي عمود لإظهاره أو إخفائه من شاشة العرض وملف الإكسيل المصدر
              </p>
            </div>
          </div>

          {/* Quick presets & Select/Deselect all */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={selectAllColumns}
              className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition"
            >
              تحديد كل الأعمدة ({allColumns.length})
            </button>
            <button
              onClick={deselectAllColumns}
              className="text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
            >
              الأعمدة الأساسية فقط
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-5 py-3 bg-indigo-50/30 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-indigo-950 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            نماذج سريعة جاهزة:
          </span>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedColumnIds(p.cols)}
              className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 font-medium transition shrink-0 shadow-2xs"
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Checkbox Grid by category */}
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allColumns.map((col) => {
              const isChecked = selectedColumnIds.includes(col.id);
              return (
                <button
                  key={col.id}
                  id={`toggle-col-${col.id}`}
                  onClick={() => toggleColumn(col.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-blue-50/80 border-blue-300 text-blue-950 shadow-2xs ring-1 ring-blue-400/30'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className={`block text-xs font-bold truncate ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                      {col.label}
                    </span>
                    <span className="block text-[10px] text-slate-400 truncate mt-0.5">
                      {col.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: ADVANCED CRITERIA & FILTERS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              تصفية التقرير بحسب الشروط (المدير، المستحق اليوم، الفرع...)
            </h3>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط كل الفلاتر</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. General Search */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              بحث حر بالعميل أو الكود أو الفاتورة
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب اسم العميل، الكود، الفاتورة..."
                className="w-full pr-9 pl-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 2. Filter Area Manager */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              المدير المسئول (Area Manager)
            </label>
            <div className="relative">
              <select
                id="filter-manager-select"
                value={filterManager}
                onChange={(e) => setFilterManager(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
              >
                <option value="all">كل مديري المناطق ({availableManagers.length})</option>
                {availableManagers.map((mgr) => (
                  <option key={mgr} value={mgr}>
                    {mgr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Filter Due Timing (مستحق اليوم، متأخر...) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              توقيت الاستحقاق والمستحقات
            </label>
            <select
              id="filter-due-timing-select"
              value={filterDueTiming}
              onChange={(e) => setFilterDueTiming(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800 font-medium"
            >
              <option value="all">جميع الحالات الزمنية</option>
              <option value="due_today">⚡ مستحق اليوم فقط (Due Today)</option>
              <option value="overdue">⚠️ متأخرة عن موعدها (Overdue)</option>
              <option value="future">📅 قادمة مستقبلاً (خلال أيام)</option>
              <option value="unpaid">⏳ فواتير قائمة غير مسددة بالكامل</option>
              <option value="paid">✓ مسددة بالكامل</option>
            </select>
          </div>

          {/* 4. Filter Region / Branch */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              الفرع / المنطقة الجغرافية
            </label>
            <select
              id="filter-region-select"
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
            >
              <option value="all">جميع الفروع والمناطق</option>
              {availableRegions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Filter Transaction Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              نوع المعاملة (Type)
            </label>
            <select
              id="filter-txtype-select"
              value={filterTxType}
              onChange={(e) => setFilterTxType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800"
            >
              <option value="all">جميع المعاملات</option>
              <option value="INVOICE">فواتير بيع (INVOICE)</option>
              <option value="consignment">بضاعة أمانة (consignment)</option>
              <option value="CN">إشعارات دائنة / مرتجع (CN)</option>
            </select>
          </div>
        </div>

        {/* Quick Quick-Pills for 1-Click Filtering */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">اختصارات فورية:</span>
          
          <button
            onClick={() => setFilterDueTiming('due_today')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterDueTiming === 'due_today'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>⚡ مستحق اليوم ({aggregates.totalDueToday.toLocaleString()} ج)</span>
          </button>

          <button
            onClick={() => setFilterDueTiming('overdue')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterDueTiming === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-900 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span>⚠️ المتأخرات ({aggregates.totalOverdue.toLocaleString()} ج)</span>
          </button>

          {availableManagers.slice(0, 3).map((mgr) => (
            <button
              key={mgr}
              onClick={() => setFilterManager(mgr)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterManager === mgr
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              مدير: {mgr}
            </button>
          ))}

          {availableRegions.slice(0, 3).map((reg) => (
            <button
              key={reg}
              onClick={() => setFilterRegion(reg)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterRegion === reg
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              فرع: {reg}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: THE DYNAMIC INTERACTIVE TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden print:border-none print:shadow-none">
        
        {/* Table Toolbar */}
        <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              جدول المعاينة الحية للتقرير ({filteredRows.length} سجل مطابق)
            </h3>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            عرض {activeColumns.length} عمود مختار من أصل {allColumns.length}
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700 font-bold">
                <th className="p-3.5 text-center text-slate-400 w-12 font-mono">#</th>
                {activeColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`p-3.5 whitespace-nowrap text-slate-800 ${
                      col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'
                    }`}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={activeColumns.length + 1} className="p-12 text-center text-slate-400 space-y-2">
                    <Filter className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">
                      لا توجد بيانات مطابقة لمعايير الفلترة المحددة
                    </p>
                    <p className="text-xs text-slate-400">
                      جرّب توسيع نطاق البحث أو الضغط على «إعادة ضبط كل الفلاتر»
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const isNegative = row.remainingAmount < 0;
                  const isDueToday = row.dueStatus === 'due_today';
                  const isOverdue = row.dueStatus === 'overdue';

                  return (
                    <tr
                      key={row.invoiceId}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isDueToday ? 'bg-amber-50/30' : isOverdue ? 'bg-rose-50/20' : index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {activeColumns.map((col) => {
                        return (
                          <td
                            key={col.id}
                            className={`p-3 whitespace-nowrap ${
                              col.align === 'center' ? 'text-center' : col.align === 'left' ? 'text-left' : 'text-right'
                            }`}
                          >
                            {/* RENDER CUSTOM FORMATS PER COLUMN */}
                            {col.id === 'customerCode' && (
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                                {row.customerCode}
                              </span>
                            )}

                            {col.id === 'customerName' && (
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{row.customerName}</span>
                              </div>
                            )}

                            {col.id === 'region' && (
                              <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                                <Building className="w-3 h-3 text-slate-400" />
                                {row.region}
                              </span>
                            )}

                            {col.id === 'areaManager' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-blue-50/80 text-blue-900 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                                <UserCheck className="w-3 h-3 text-blue-600" />
                                {row.areaManager}
                              </span>
                            )}

                            {col.id === 'invoiceNumber' && (
                              <span className="font-mono font-semibold text-slate-700">
                                {row.invoiceNumber}
                              </span>
                            )}

                            {col.id === 'transactionType' && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  row.transactionType === 'INVOICE'
                                    ? 'bg-blue-100 text-blue-800'
                                    : row.transactionType === 'consignment'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {row.transactionType}
                              </span>
                            )}

                            {col.id === 'totalAmount' && (
                              <span className="font-mono font-bold text-slate-800">
                                {row.totalAmount.toLocaleString()} ج.م
                              </span>
                            )}

                            {col.id === 'paidAmount' && (
                              <span className="font-mono text-emerald-700 font-semibold">
                                {row.paidAmount.toLocaleString()} ج.م
                              </span>
                            )}

                            {col.id === 'remainingAmount' && (
                              <span
                                className={`font-mono font-bold text-sm ${
                                  isNegative
                                    ? 'text-purple-700'
                                    : isOverdue
                                    ? 'text-rose-700'
                                    : isDueToday
                                    ? 'text-amber-700'
                                    : 'text-slate-900'
                                }`}
                              >
                                {isNegative ? `(${Math.abs(row.remainingAmount).toLocaleString()})` : row.remainingAmount.toLocaleString()} ج.م
                              </span>
                            )}

                            {col.id === 'creditLimit' && (
                              <span className="font-mono text-slate-600">
                                {row.creditLimit ? `${row.creditLimit.toLocaleString()} ج.م` : '—'}
                              </span>
                            )}

                            {col.id === 'issueDate' && (
                              <span className="font-mono text-slate-600 text-[11px]">
                                {row.issueDate}
                              </span>
                            )}

                            {col.id === 'dueDate' && (
                              <span
                                className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                                  isDueToday
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : isOverdue
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                    : 'text-slate-700'
                                }`}
                              >
                                {row.dueDate}
                              </span>
                            )}

                            {col.id === 'paymentTermsDays' && (
                              <span className="font-mono font-semibold text-slate-600">
                                {row.paymentTermsDays ? `${row.paymentTermsDays} يوم` : '—'}
                              </span>
                            )}

                            {col.id === 'daysOverdue' && (
                              <span
                                className={`font-mono font-bold ${
                                  row.daysOverdue > 0 ? 'text-rose-600' : 'text-slate-400'
                                }`}
                              >
                                {row.daysOverdue > 0 ? `${row.daysOverdue} يوم` : '—'}
                              </span>
                            )}

                            {col.id === 'dueStatusLabel' && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                  isDueToday
                                    ? 'bg-amber-100 text-amber-900'
                                    : isOverdue
                                    ? 'bg-rose-100 text-rose-800'
                                    : row.dueStatus === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-50 text-blue-800'
                                }`}
                              >
                                {isDueToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />}
                                {row.dueStatusLabel}
                              </span>
                            )}

                            {col.id === 'statusArabic' && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  row.statusArabic === 'مسددة'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : row.statusArabic === 'مسددة جزئياً'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {row.statusArabic}
                              </span>
                            )}

                            {col.id === 'customerRiskStatus' && (
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  row.customerRiskStatus === 'جيد'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.customerRiskStatus === 'يحتاج متابعة'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {row.customerRiskStatus}
                              </span>
                            )}

                            {col.id === 'notes' && (
                              <span className="text-slate-500 text-[11px] truncate max-w-xs block">
                                {row.notes || '—'}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Row */}
        {filteredRows.length > 0 && (
          <div className="bg-slate-100/90 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-800">
            <div className="flex items-center gap-6">
              <span>إجمالي السجلات: {filteredRows.length} معاملة</span>
              <span>عدد العملاء: {aggregates.uniqueCustomersCount} عميل</span>
            </div>

            <div className="flex items-center gap-6 font-mono text-sm">
              <div className="text-slate-900">
                إجمالي المديونية المتبقية:{' '}
                <span className="text-blue-700 font-bold">
                  {aggregates.totalOutstanding.toLocaleString()} ج.م
                </span>
              </div>
              {aggregates.totalDueToday > 0 && (
                <div className="text-amber-800">
                  مستحق اليوم:{' '}
                  <span className="font-bold">{aggregates.totalDueToday.toLocaleString()} ج.م</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Instructional Helper Card at bottom */}
      <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-2xl p-5 text-xs text-slate-700 space-y-2 print:hidden">
        <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
          <Sparkles className="w-4 h-4 text-blue-600" />
          كيف تضمن دقة وسرعة سحب تقاريرك؟
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed pr-2">
          <li>
            <strong>إلغاء الأعمدة غير المرغوبة:</strong> اضغط على أي بطاقة عمود بالأعلى لإزالة علامة الصح فيختفي العمود فوراً من العرض ومن شيت الإكسيل المُصدّر.
          </li>
          <li>
            <strong>فلترة دقيقة وسريعة:</strong> اختر المدير المسئول (مثل: الأنصاري، الجيزة، عبد الله الشرياني) أو اضغط على «مستحق اليوم» لمشاهدة المديونيات المطلوب تحصيلها في الحال.
          </li>
          <li>
            <strong>تصدير فوري ومطابق:</strong> زر «تصدير إكسيل» يقوم بتنزيل ملف Excel يحتوي فقط على الأعمدة والصفوف التي حددتها مع شيت إضافي لملخص التقرير والإجماليات.
          </li>
        </ul>
      </div>

    </div>
  );
};
