import React, { useState, useMemo, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Sparkles, 
  RefreshCw, 
  HelpCircle, 
  UserPlus, 
  ExternalLink,
  ShieldCheck,
  Scale
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Customer, Invoice } from '../types';

interface AxReconciliationViewProps {
  customers: Customer[];
  invoices: Invoice[];
  onSelectCustomer?: (customer: Customer) => void;
  onAddCustomersBatch?: (newCustomers: Customer[]) => Promise<void> | void;
}

export interface AxRowData {
  customerAccount: string;
  name: string;
  axClosingBalance: number;
}

export interface ReconciliationItem {
  customerCode: string;
  axName: string;
  systemName: string;
  axBalance: number;
  systemBalance: number;
  difference: number; // systemBalance - axBalance
  absDifference: number;
  status: 'exact_match' | 'minor_difference' | 'positive_diff' | 'negative_diff' | 'ax_only' | 'system_only';
  customerInSystem?: Customer;
}

export const AxReconciliationView: React.FC<AxReconciliationViewProps> = ({
  customers,
  invoices,
  onSelectCustomer,
  onAddCustomersBatch,
}) => {
  // AX Raw uploaded rows
  const [axRows, setAxRows] = useState<AxRowData[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [uploadDate, setUploadDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successNotification, setSuccessNotification] = useState<string>('');

  // Threshold & Filter State
  // User asked: "مع طلب مني انه يطلعى الفرق لو الموجب كام او السالب كام لان ممكن يكون سالب جنيهات فقط او موجب جنيهات فقط وانا مش عايزهم يظهروا"
  const [threshold, setThreshold] = useState<number>(10); // Ignore differences <= 10 EGP by default
  const [filterType, setFilterType] = useState<
    'all' | 'discrepancies_only' | 'positive_only' | 'negative_only' | 'matches_only' | 'ax_only' | 'system_only'
  >('discrepancies_only');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map system customers by code (normalize by removing spaces and leading zeros for robust matching)
  const systemCustomersByCode = useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach((c) => {
      const normCode = (c.code || '').trim().replace(/^0+/, '');
      if (normCode) {
        map.set(normCode, c);
      }
      // Also map exact code
      if (c.code) {
        map.set(c.code.trim(), c);
      }
    });
    return map;
  }, [customers]);

  // Calculate system balance for each customer directly from customer.totalOutstanding or invoices
  const getSystemCustomerBalance = (customer: Customer): number => {
    if (customer.totalOutstanding !== undefined && customer.totalOutstanding !== null) {
      return customer.totalOutstanding;
    }
    const custInvs = invoices.filter((i) => i.customerId === customer.id);
    return custInvs.reduce((sum, inv) => sum + (inv.remainingAmount ?? 0), 0);
  };

  // Perform reconciliation comparison
  const reconciliationData = useMemo<ReconciliationItem[]>(() => {
    if (axRows.length === 0) return [];

    const matchedSystemCodes = new Set<string>();
    const items: ReconciliationItem[] = [];

    // 1. Process all AX rows
    axRows.forEach((ax) => {
      const rawCode = (ax.customerAccount || '').trim();
      const normCode = rawCode.replace(/^0+/, '');

      // Try finding customer in system by code or normalized code
      const custInSystem =
        systemCustomersByCode.get(normCode) ||
        systemCustomersByCode.get(rawCode) ||
        customers.find(
          (c) =>
            (c.name && ax.name && c.name.trim().toLowerCase() === ax.name.trim().toLowerCase()) ||
            (c.code && (c.code.includes(rawCode) || rawCode.includes(c.code)))
        );

      if (custInSystem) {
        matchedSystemCodes.add(custInSystem.id);
        const sysBalance = getSystemCustomerBalance(custInSystem);
        const diff = Number((sysBalance - ax.axClosingBalance).toFixed(2));
        const absDiff = Math.abs(diff);

        let status: ReconciliationItem['status'] = 'exact_match';
        if (absDiff === 0) {
          status = 'exact_match';
        } else if (absDiff <= threshold) {
          status = 'minor_difference'; // فروق قروش وجنيهات مهملة
        } else if (diff > 0) {
          status = 'positive_diff'; // رصيد البرنامج أكبر
        } else {
          status = 'negative_diff'; // رصيد AX أكبر
        }

        items.push({
          customerCode: custInSystem.code || rawCode,
          axName: ax.name,
          systemName: custInSystem.name,
          axBalance: ax.axClosingBalance,
          systemBalance: sysBalance,
          difference: diff,
          absDifference: absDiff,
          status,
          customerInSystem: custInSystem,
        });
      } else {
        // Customer exists in AX but NOT in system
        items.push({
          customerCode: rawCode,
          axName: ax.name,
          systemName: 'غير مسجل بالنظام',
          axBalance: ax.axClosingBalance,
          systemBalance: 0,
          difference: Number((-ax.axClosingBalance).toFixed(2)),
          absDifference: Math.abs(ax.axClosingBalance),
          status: 'ax_only',
        });
      }
    });

    // 2. Add customers in system that were NOT in AX sheet
    customers.forEach((c) => {
      if (!matchedSystemCodes.has(c.id)) {
        const sysBalance = getSystemCustomerBalance(c);
        // Only include if they have a non-zero balance or if user wants to see all
        if (Math.abs(sysBalance) > 0) {
          items.push({
            customerCode: c.code || 'بدون كود',
            axName: 'غير موجود في شيت AX',
            systemName: c.name,
            axBalance: 0,
            systemBalance: sysBalance,
            difference: Number(sysBalance.toFixed(2)),
            absDifference: Math.abs(sysBalance),
            status: 'system_only',
            customerInSystem: c,
          });
        }
      }
    });

    return items;
  }, [axRows, systemCustomersByCode, customers, invoices, threshold]);

  // Overall Statistics
  const stats = useMemo(() => {
    let totalAxBalance = 0;
    let totalSystemBalance = 0;

    let exactMatchCount = 0;
    let minorDiffCount = 0;
    let positiveDiffCount = 0;
    let negativeDiffCount = 0;
    let axOnlyCount = 0;
    let systemOnlyCount = 0;

    let totalPositiveAmount = 0; // مجموع الفروق الموجبة
    let totalNegativeAmount = 0; // مجموع الفروق السالبة

    reconciliationData.forEach((item) => {
      totalAxBalance += item.axBalance;
      totalSystemBalance += item.systemBalance;

      if (item.status === 'exact_match') {
        exactMatchCount++;
      } else if (item.status === 'minor_difference') {
        minorDiffCount++;
      } else if (item.status === 'positive_diff') {
        positiveDiffCount++;
        totalPositiveAmount += item.difference;
      } else if (item.status === 'negative_diff') {
        negativeDiffCount++;
        totalNegativeAmount += Math.abs(item.difference);
      } else if (item.status === 'ax_only') {
        axOnlyCount++;
      } else if (item.status === 'system_only') {
        systemOnlyCount++;
      }
    });

    const totalDiscrepanciesCount = positiveDiffCount + negativeDiffCount + axOnlyCount + systemOnlyCount;
    const netDifference = totalSystemBalance - totalAxBalance;

    return {
      totalAxBalance,
      totalSystemBalance,
      netDifference,
      exactMatchCount,
      minorDiffCount,
      positiveDiffCount,
      negativeDiffCount,
      totalPositiveAmount,
      totalNegativeAmount,
      axOnlyCount,
      systemOnlyCount,
      totalDiscrepanciesCount,
      totalRows: reconciliationData.length,
    };
  }, [reconciliationData]);

  // Filtered rows to display in table
  const filteredItems = useMemo(() => {
    return reconciliationData.filter((item) => {
      // 1. Text Search Filter (by code or name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const codeMatch = item.customerCode.toLowerCase().includes(query);
        const axNameMatch = item.axName.toLowerCase().includes(query);
        const sysNameMatch = item.systemName.toLowerCase().includes(query);
        if (!codeMatch && !axNameMatch && !sysNameMatch) return false;
      }

      // 2. Threshold & Difference Type Filter
      switch (filterType) {
        case 'discrepancies_only':
          // Only show differences greater than threshold (exclude exact and minor differences)
          return (
            item.status === 'positive_diff' ||
            item.status === 'negative_diff' ||
            item.status === 'ax_only' ||
            item.status === 'system_only'
          );
        case 'positive_only':
          return item.status === 'positive_diff';
        case 'negative_only':
          return item.status === 'negative_diff';
        case 'matches_only':
          return item.status === 'exact_match' || item.status === 'minor_difference';
        case 'ax_only':
          return item.status === 'ax_only';
        case 'system_only':
          return item.status === 'system_only';
        case 'all':
        default:
          return true;
      }
    });
  }, [reconciliationData, searchQuery, filterType]);

  // Sample data identical to the user's AX screenshot for 1-click test
  const sampleAxRows: AxRowData[] = [
    { customerAccount: '66011613', name: 'بي تك للتجاره والتوزيع', axClosingBalance: 1239804.65 },
    { customerAccount: '66011620', name: 'noon online', axClosingBalance: -557204.2 },
    { customerAccount: '66011639', name: 'غزة - الحرفيين - القاهرة', axClosingBalance: 0.01 },
    { customerAccount: '66011640', name: 'jumia online', axClosingBalance: 33841.17 },
    { customerAccount: '66011647', name: 'العامر - حلوان - القاهره', axClosingBalance: 51900.0 },
    { customerAccount: '66011650', name: 'شركه مشروعى للتجارة', axClosingBalance: -25991.0 },
    { customerAccount: '66011664', name: 'جوميا ايجيبت', axClosingBalance: 18196804.34 },
    { customerAccount: '66011670', name: 'شركة جملة- ش عبد العزيز- وسط البلد- القاهره', axClosingBalance: 111100.07 },
    { customerAccount: '6601168', name: 'سيفين سيفين - السراج مول - مدينه نصر - القاهرة', axClosingBalance: 29.99 },
    { customerAccount: '66011686', name: 'amazon online 2', axClosingBalance: -4629437.51 },
    { customerAccount: '66011715', name: 'التجمع الخامس - القاهرة - AI اتصال للتجارة', axClosingBalance: -3848.05 },
    { customerAccount: '66011745', name: 'البطل الروماني - عزبة النخل - القاهرة', axClosingBalance: 0.02 },
    { customerAccount: '66011792', name: 'ريموز للتوريدات العموميه', axClosingBalance: 10585903.07 },
    { customerAccount: '66011810', name: 'شركه فودافون للتجاره', axClosingBalance: -7299266.52 },
    { customerAccount: '66011875', name: 'الغلبان -السيدة زينب-القاهرة', axClosingBalance: 0.0 },
    { customerAccount: '66011935', name: 'اي تي ستور-ش احمد عصمت-عين شمس-القاهرة', axClosingBalance: 0 },
    { customerAccount: '66011981', name: 'مدينه نصر-القاهرة-VOOC', axClosingBalance: 0 },
    { customerAccount: '66012006', name: 'Amazon Online 3', axClosingBalance: 26738.15 },
    { customerAccount: '66012174', name: 'كاسبر للتجارة والتوزيع - شارع عبد العزيز - القاهرة', axClosingBalance: -4.33 },
    { customerAccount: '66012187', name: 'ش عبد العزيز - القاهرة - ZAIN', axClosingBalance: 766.65 },
    { customerAccount: '66012206', name: 'سيجنال للتوزيع - النزهة الجديدة - القاهرة', axClosingBalance: 510500.55 },
    { customerAccount: '66012369', name: '5G store - حلوان - القاهرة', axClosingBalance: 0.03 },
    { customerAccount: '66012370', name: 'التقوى - حلوان - القاهرة', axClosingBalance: -19619.99 },
    { customerAccount: '66012430', name: 'سيلفى', axClosingBalance: -9036000.0 },
  ];

  // Download template Excel file identical to AX export
  const downloadAxTemplateExcel = () => {
    const templateRows = sampleAxRows.map((row) => ({
      'Customer account': row.customerAccount,
      'Name': row.name,
      '14-9Closing balance': row.axClosingBalance,
    }));

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!views'] = [{ rightToLeft: false }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, 'نموذج_شيت_أرصدة_AX_للمطابقة.xlsx');
  };

  const loadSampleAxData = () => {
    setAxRows(sampleAxRows);
    setFileName('شيت_أرصدة_AX_14-9.xlsx (نموذج مطابق للصورة)');
    setUploadDate(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    setSuccessNotification(`تم تحميل بيانات النموذج بنجاح (${sampleAxRows.length} عميل من شيت AX)`);
    setErrorMessage('');
    setTimeout(() => setSuccessNotification(''), 4000);
  };

  // Helper to parse numbers safely from strings (handling Arabic/English digits, commas, negative signs)
  const parseAmount = (val: unknown): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).trim();
    // Check if wrapped in parenthesis for negative: (100) -> -100
    const isParenNegative = /^\(.*\)$/.test(str);
    const cleaned = str.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned) || 0;
    return isParenNegative ? -Math.abs(num) : num;
  };

  // Intelligent parser for Excel workbook or CSV text
  const processParsedData = (jsonData: Array<Record<string, unknown>>, sourceName: string) => {
    if (!jsonData || jsonData.length === 0) {
      setErrorMessage('الملف لا يحتوي على بيانات أو غير قابل للقراءة');
      return;
    }

    const firstRow = jsonData[0];
    const keys = Object.keys(firstRow);

    // Detect Account/Code column
    let accountKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes('account') ||
        lower.includes('customer account') ||
        lower.includes('code') ||
        lower.includes('كود') ||
        lower.includes('حساب') ||
        lower.includes('رقم العميل')
      );
    });

    // Detect Name column
    let nameKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return lower.includes('name') || lower.includes('اسم') || lower.includes('العميل');
    });

    // Detect Balance column (e.g. "14-9Closing balance", "Closing balance", "Balance", "الرصيد")
    let balanceKey = keys.find((k) => {
      const lower = k.toLowerCase();
      return (
        lower.includes('closing') ||
        lower.includes('balance') ||
        lower.includes('رصيد') ||
        lower.includes('إغلاق') ||
        lower.includes('مديونية')
      );
    });

    // Fallbacks based on position if headers aren't standard
    if (!accountKey && keys.length > 0) accountKey = keys[0];
    if (!nameKey && keys.length > 1) nameKey = keys[1];
    if (!balanceKey && keys.length > 2) balanceKey = keys[2];

    if (!accountKey || !balanceKey) {
      setErrorMessage('تعذر العثور على عمود كود العميل أو الرصيد في الشيت');
      return;
    }

    const parsed: AxRowData[] = [];

    jsonData.forEach((row) => {
      const rawCode = row[accountKey as string];
      const rawName = nameKey ? row[nameKey] : '';
      const rawBal = row[balanceKey as string];

      const codeStr = rawCode ? String(rawCode).trim() : '';
      if (!codeStr || codeStr.toLowerCase() === 'total' || codeStr.includes('الإجمالي')) {
        return; // skip totals or blank rows
      }

      parsed.push({
        customerAccount: codeStr,
        name: rawName ? String(rawName).trim() : 'بدون اسم',
        axClosingBalance: parseAmount(rawBal),
      });
    });

    if (parsed.length === 0) {
      setErrorMessage('لم يتم العثور على صفوف صالحة للمطابقة في الملف');
      return;
    }

    setAxRows(parsed);
    setFileName(sourceName);
    setUploadDate(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
    setErrorMessage('');
    setSuccessNotification(`تمت قراءة ${parsed.length} عميل من شيت AX بنجاح والمطابقة مع النظام!`);
    setTimeout(() => setSuccessNotification(''), 4000);
  };

  // Handle file upload (.xlsx, .xls, .csv)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        processParsedData(json, file.name);
      } catch (err) {
        console.error('Excel parse error:', err);
        setErrorMessage('حدث خطأ أثناء قراءة ملف الإكسيل. تأكد من سلامة الملف وصيغته.');
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setErrorMessage('تعذر قراءة الملف من جهازك');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  // Export Reconciliation Report to Excel
  const handleExportReconciliation = () => {
    if (reconciliationData.length === 0) return;

    // Use current filteredItems or all items based on user context
    const rowsToExport = filteredItems.map((item, index) => {
      let statusArabic = 'مطابق تماماً';
      if (item.status === 'minor_difference') statusArabic = `فروق مهملة (أقل من ${threshold} ج.م)`;
      else if (item.status === 'positive_diff') statusArabic = 'رصيد البرنامج أكبر (مديونية زائدة)';
      else if (item.status === 'negative_diff') statusArabic = 'رصيد AX أكبر (مديونية زائدة في AX)';
      else if (item.status === 'ax_only') statusArabic = 'عميل في AX فقط (غير مسجل بالنظام)';
      else if (item.status === 'system_only') statusArabic = 'عميل بالنظام فقط (غير موجود في شيت AX)';

      return {
        'م': index + 1,
        'كود العميل': item.customerCode,
        'اسم العميل (AX)': item.axName,
        'اسم العميل (البرنامج)': item.systemName,
        'رصيد سيستم AX (ج.م)': item.axBalance,
        'رصيد البرنامج (ج.م)': item.systemBalance,
        'الفرق (البرنامج - AX)': item.difference,
        'القيمة المطلقة للفارق': item.absDifference,
        'حالة المطابقة': statusArabic,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    // RTL sheet support
    worksheet['!views'] = [{ rightToLeft: true }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'مطابقة أرصدة AX');

    // Add Summary sheet
    const summaryData = [
      { 'البيان': 'تاريخ المطابقة', 'القيمة': new Date().toLocaleDateString('ar-EG') },
      { 'البيان': 'اسم شيت AX المرفوع', 'القيمة': fileName || 'شيت AX' },
      { 'البيان': 'حد الفروق المهملة', 'القيمة': `± ${threshold} ج.م` },
      { 'البيان': 'إجمالي رصيد شيت AX', 'القيمة': stats.totalAxBalance },
      { 'البيان': 'إجمالي رصيد البرنامج', 'القيمة': stats.totalSystemBalance },
      { 'البيان': 'صافي الفرق العام', 'القيمة': stats.netDifference },
      { 'البيان': 'عدد العملاء المطابقين تماماً', 'القيمة': stats.exactMatchCount },
      { 'البيان': 'عدد الفروق المهملة البسيطة', 'القيمة': stats.minorDiffCount },
      { 'البيان': 'عدد الفروق الموجبة (البرنامج أكبر)', 'القيمة': stats.positiveDiffCount },
      { 'البيان': 'إجمالي مبالغ الفروق الموجبة', 'القيمة': stats.totalPositiveAmount },
      { 'البيان': 'عدد الفروق السالبة (AX أكبر)', 'القيمة': stats.negativeDiffCount },
      { 'البيان': 'إجمالي مبالغ الفروق السالبة', 'القيمة': stats.totalNegativeAmount },
      { 'البيان': 'عملاء في AX فقط', 'القيمة': stats.axOnlyCount },
      { 'البيان': 'عملاء في البرنامج فقط', 'القيمة': stats.systemOnlyCount },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!views'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص المطابقة الإحصائي');

    const cleanDate = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `تقرير_مطابقة_أرصدة_AX_${cleanDate}.xlsx`);
  };

  // Batch import customers that exist in AX but not in system
  const handleImportMissingAxCustomers = async () => {
    const missingItems = reconciliationData.filter((i) => i.status === 'ax_only');
    if (missingItems.length === 0) return;

    if (
      !window.confirm(
        `هل تريد إضافة ${missingItems.length} عميل جديد من شيت AX إلى قاعدة بيانات البرنامج مباشرة؟`
      )
    ) {
      return;
    }

    const newCustomers: Customer[] = missingItems.map((item, idx) => ({
      id: `cust-ax-${Date.now()}-${idx}`,
      code: item.customerCode,
      name: item.axName,
      phone: '',
      region: 'القاهرة',
      creditLimit: Math.max(item.axBalance * 1.2, 50000),
      paymentTermsDays: 45,
      status: item.axBalance > 1000000 ? 'يحتاج متابعة' : 'جيد',
      totalOutstanding: item.axBalance,
      notes: `تم استيراده تلقائياً من شيت AX برصيد افتتاحي ${item.axBalance.toLocaleString()} ج.م`,
    }));

    if (onAddCustomersBatch) {
      await onAddCustomersBatch(newCustomers);
      setSuccessNotification(`تمت إضافة ${newCustomers.length} عميل جديد إلى البرنامج بنجاح!`);
      setTimeout(() => setSuccessNotification(''), 4000);
    }
  };

  return (
    <div id="ax-reconciliation-page" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            مطابقة الحسابات وتسوية الأرصدة (AX Reconciliation)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            مطابقة أرصدة سيستم الشركة (AX) مع البرنامج
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            ارفع شيت المديونية والأرصدة المسحوب من سيستم AX؛ ليقوم البرنامج تلقائياً بمطابقة كل عميل بكوده،
            واستخراج فروق المديونية وتجاهل فروق الجنيهات والقروش البسيطة التي تحددها، مع إمكانية تصدير التقرير كاملاً.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="btn-download-ax-template-header"
            onClick={downloadAxTemplateExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/40 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95"
            title="تحميل ملف إكسيل فارغ بنفس تنسيق وأعمدة سيستم AX لاستخدامه وتجربته"
          >
            <Download className="w-4 h-4" />
            تحميل نسخة نموذج الشيت (Excel)
          </button>

          <button
            id="btn-sample-ax-data"
            onClick={loadSampleAxData}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            تجربة نموذج شيت AX الجاهز
          </button>

          <label
            htmlFor="ax-file-upload-input"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Upload className="w-4 h-4" />
            {isProcessing ? 'جاري الفحص...' : 'رفع شيت AX (Excel / CSV)'}
          </label>
          <input
            ref={fileInputRef}
            id="ax-file-upload-input"
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Notifications */}
      {successNotification && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium text-sm">{successNotification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium text-sm">{errorMessage}</span>
        </div>
      )}

      {/* Empty State / Upload Drop Area if no AX rows loaded */}
      {axRows.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <FileSpreadsheet className="w-10 h-10" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-slate-800">
              لم يتم رفع شيت أرصدة AX حتى الآن
            </h3>
            <p className="text-slate-500 text-sm">
              قم برفع شيت الإكسيل المسحوب من AX بأعمدته المعتادة (Customer account, Name, Closing balance)
              أو اضغط على زر النموذج للتجربة الفورية.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <label
              htmlFor="ax-file-upload-input-center"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              اختيار ملف الإكسيل من جهازك
            </label>
            <input
              id="ax-file-upload-input-center"
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              id="btn-download-ax-template-empty"
              onClick={downloadAxTemplateExcel}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              تحميل شيت النموذج الإكسيل (Excel Template)
            </button>

            <button
              onClick={loadSampleAxData}
              className="inline-flex items-center gap-2 px-5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-sm font-semibold transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              تجربة نموذج بيانات AX فوري
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span>✓ يدعم كود العميل الرقمي</span>
            <span>✓ يتعرف تلقائياً على أعمدة الأرصدة والتاريخ</span>
            <span>✓ يعالج الفروق الموجبة والسالبة بدقة</span>
          </div>
        </div>
      ) : (
        <>
          {/* File Info & Quick Threshold Controls */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-base">{fileName}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-md">
                    {axRows.length} عميل في AX
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  تم الاستيراد والمطابقة في: {uploadDate || 'الآن'} | إجمالي عملاء النظام:{' '}
                  {customers.length} عميل
                </p>
              </div>
            </div>

            {/* Threshold & Difference Tolerance Control - Key user requirement */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>تجاهل فروق الجنيهات والقروش الأقل من:</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    id="threshold-amount-input"
                    type="number"
                    min="0"
                    step="1"
                    value={threshold}
                    onChange={(e) => setThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-20 px-2.5 py-1 text-center font-bold text-slate-800 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute left-1.5 top-1.5 text-xs text-slate-400 pointer-events-none">
                    ج.م
                  </span>
                </div>

                {/* Quick tolerance chips */}
                <div className="flex items-center gap-1">
                  {[0, 5, 10, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setThreshold(val)}
                      className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                        threshold === val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {val === 0 ? 'كل الفروق' : `${val} ج`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total AX Balance */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>إجمالي رصيد شيت AX</span>
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {stats.totalAxBalance.toLocaleString('ar-EG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <div className="text-xs text-slate-500">
                رصيد إغلاق العملاء في شيت الشركة
              </div>
            </div>

            {/* Total System Balance */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>إجمالي رصيد البرنامج</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-950">
                {stats.totalSystemBalance.toLocaleString('ar-EG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-xs font-normal text-slate-500">ج.م</span>
              </div>
              <div className="text-xs text-slate-500">
                إجمالي المديونية الحالية المسجلة بالبرنامج
              </div>
            </div>

            {/* Positive Differences (System > AX) */}
            <div
              onClick={() => setFilterType('positive_only')}
              className={`border rounded-xl p-5 shadow-xs space-y-2 cursor-pointer transition-all ${
                filterType === 'positive_only'
                  ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                  : 'bg-white border-amber-200 hover:bg-amber-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-amber-800">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  الفروق الموجبة (البرنامج أكبر)
                </span>
                <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded-full text-xs font-bold">
                  {stats.positiveDiffCount} عميل
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-900">
                +{stats.totalPositiveAmount.toLocaleString('ar-EG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-xs font-normal text-amber-700">ج.م</span>
              </div>
              <div className="text-xs text-amber-700">
                مديونية زائدة مسجلة في البرنامج عن AX
              </div>
            </div>

            {/* Negative Differences (AX > System) */}
            <div
              onClick={() => setFilterType('negative_only')}
              className={`border rounded-xl p-5 shadow-xs space-y-2 cursor-pointer transition-all ${
                filterType === 'negative_only'
                  ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20'
                  : 'bg-white border-rose-200 hover:bg-rose-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
                <span className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  الفروق السالبة (AX أكبر)
                </span>
                <span className="px-2 py-0.5 bg-rose-200/60 text-rose-900 rounded-full text-xs font-bold">
                  {stats.negativeDiffCount} عميل
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-900">
                -{stats.totalNegativeAmount.toLocaleString('ar-EG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                <span className="text-xs font-normal text-rose-700">ج.م</span>
              </div>
              <div className="text-xs text-rose-700">
                مديونية زائدة في AX لم تسجل بالبرنامج
              </div>
            </div>
          </div>

          {/* Action Bar & Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  id="reconciliation-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بكود العميل أو اسم العميل في AX أو البرنامج..."
                  className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    مسح
                  </button>
                )}
              </div>

              {/* Action Buttons: Export to Excel & Add Missing Customers */}
              <div className="flex flex-wrap items-center gap-2">
                {stats.axOnlyCount > 0 && (
                  <button
                    id="btn-import-missing-customers"
                    onClick={handleImportMissingAxCustomers}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    إضافة {stats.axOnlyCount} عميل جديد للبرنامج
                  </button>
                )}

                <button
                  id="btn-export-ax-reconciliation-excel"
                  onClick={handleExportReconciliation}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  تصدير تقرير المطابقة إلى Excel ({filteredItems.length})
                </button>
              </div>
            </div>

            {/* Filter Chips / Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                عرض النتائج:
              </span>

              <button
                onClick={() => setFilterType('discrepancies_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filterType === 'discrepancies_only'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>الفروق الأكبر من الحد المسموح</span>
                <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[11px]">
                  {stats.totalDiscrepanciesCount}
                </span>
              </button>

              <button
                onClick={() => setFilterType('positive_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filterType === 'positive_only'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>فروق موجبة (البرنامج أكبر)</span>
                <span className="px-1.5 py-0.2 bg-amber-200/60 rounded-md text-[11px]">
                  {stats.positiveDiffCount}
                </span>
              </button>

              <button
                onClick={() => setFilterType('negative_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filterType === 'negative_only'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <span>فروق سالبة (AX أكبر)</span>
                <span className="px-1.5 py-0.2 bg-rose-200/60 rounded-md text-[11px]">
                  {stats.negativeDiffCount}
                </span>
              </button>

              <button
                onClick={() => setFilterType('matches_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  filterType === 'matches_only'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>مطابق (أو فروق مهملة أقل من {threshold} ج)</span>
                <span className="px-1.5 py-0.2 bg-emerald-200/60 rounded-md text-[11px]">
                  {stats.exactMatchCount + stats.minorDiffCount}
                </span>
              </button>

              {stats.axOnlyCount > 0 && (
                <button
                  onClick={() => setFilterType('ax_only')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterType === 'ax_only'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <span>في AX فقط (غير مسجل)</span>
                  <span className="px-1.5 py-0.2 bg-purple-200/60 rounded-md text-[11px]">
                    {stats.axOnlyCount}
                  </span>
                </button>
              )}

              {stats.systemOnlyCount > 0 && (
                <button
                  onClick={() => setFilterType('system_only')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterType === 'system_only'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  <span>بالنظام فقط (غير موجود بـ AX)</span>
                  <span className="px-1.5 py-0.2 bg-sky-200/60 rounded-md text-[11px]">
                    {stats.systemOnlyCount}
                  </span>
                </button>
              )}

              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                عرض كل العملاء ({stats.totalRows})
              </button>
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-xs">
                    <th className="py-3.5 px-4">كود العميل</th>
                    <th className="py-3.5 px-4">اسم العميل (في شيت AX)</th>
                    <th className="py-3.5 px-4">اسم العميل (في البرنامج)</th>
                    <th className="py-3.5 px-4 text-left">رصيد سيستم AX</th>
                    <th className="py-3.5 px-4 text-left">رصيد البرنامج</th>
                    <th className="py-3.5 px-4 text-left">الفرق (البرنامج - AX)</th>
                    <th className="py-3.5 px-4 text-center">حالة المطابقة</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold">لا توجد سجلات تطابق الفلتر المختار</p>
                        <p className="text-xs text-slate-400 mt-1">
                          يمكنك اختيار فلتر آخر أو تقليل حد الفروق المهملة
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item, idx) => {
                      const isPositive = item.difference > 0;
                      const isNegative = item.difference < 0;

                      return (
                        <tr
                          key={`${item.customerCode}-${idx}`}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          {/* Code */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                            {item.customerCode}
                          </td>

                          {/* AX Name */}
                          <td className="py-3.5 px-4 font-medium text-slate-800">
                            {item.axName}
                          </td>

                          {/* System Name */}
                          <td className="py-3.5 px-4">
                            {item.customerInSystem ? (
                              <span className="text-slate-800">{item.systemName}</span>
                            ) : (
                              <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-xs font-semibold">
                                غير مسجل بالنظام
                              </span>
                            )}
                          </td>

                          {/* AX Balance */}
                          <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-700">
                            {item.axBalance.toLocaleString('ar-EG', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            <span className="text-xs font-normal text-slate-400">ج.م</span>
                          </td>

                          {/* System Balance */}
                          <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-900">
                            {item.systemBalance.toLocaleString('ar-EG', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            <span className="text-xs font-normal text-slate-400">ج.م</span>
                          </td>

                          {/* Difference */}
                          <td className="py-3.5 px-4 text-left font-mono">
                            {item.status === 'exact_match' ? (
                              <span className="text-slate-400 font-semibold">0.00 ج.م</span>
                            ) : item.status === 'minor_difference' ? (
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-xs font-bold">
                                {isPositive ? '+' : ''}
                                {item.difference.toFixed(2)} ج.م (مهمل)
                              </span>
                            ) : isPositive ? (
                              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-xs font-black">
                                +{item.difference.toLocaleString('ar-EG', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{' '}
                                ج.م
                              </span>
                            ) : (
                              <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs font-black">
                                {item.difference.toLocaleString('ar-EG', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{' '}
                                ج.م
                              </span>
                            )}
                          </td>

                          {/* Match Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {item.status === 'exact_match' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                مطابق تماماً
                              </span>
                            )}
                            {item.status === 'minor_difference' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                                فرق طفيف (&le; {threshold} ج)
                              </span>
                            )}
                            {item.status === 'positive_diff' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
                                <TrendingUp className="w-3.5 h-3.5" />
                                البرنامج أكبر
                              </span>
                            )}
                            {item.status === 'negative_diff' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-bold">
                                <TrendingDown className="w-3.5 h-3.5" />
                                AX أكبر
                              </span>
                            )}
                            {item.status === 'ax_only' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-900 rounded-full text-xs font-bold">
                                في AX فقط
                              </span>
                            )}
                            {item.status === 'system_only' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-100 text-sky-900 rounded-full text-xs font-bold">
                                بالنظام فقط
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            {item.customerInSystem ? (
                              <button
                                onClick={() => onSelectCustomer && onSelectCustomer(item.customerInSystem!)}
                                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
                                title="عرض كشف حساب العميل بالبرنامج"
                              >
                                كشف الحساب
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400">غير مسجل</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                إجمالي السجلات المعروضة: <strong>{filteredItems.length}</strong> من أصل{' '}
                <strong>{stats.totalRows}</strong> سجل مطابقة
              </div>
              <div className="flex items-center gap-4">
                <span>
                  صافي الفرق العام:{' '}
                  <strong className={stats.netDifference >= 0 ? 'text-amber-700' : 'text-rose-700'}>
                    {stats.netDifference > 0 ? '+' : ''}
                    {stats.netDifference.toLocaleString('ar-EG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    ج.م
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
