import { 
  Customer, 
  Invoice, 
  Payment, 
  ActivityLog, 
  AgingBucket, 
  CreditApprovalRequest, 
  PromiseToPay, 
  CollectionTask, 
  SystemNotification 
} from '../types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_INVOICES, 
  INITIAL_PAYMENTS, 
  INITIAL_LOGS,
  INITIAL_CREDIT_REQUESTS,
  INITIAL_PROMISES_TO_PAY,
  INITIAL_COLLECTION_TASKS,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

const STORAGE_KEYS = {
  CUSTOMERS: 'ar_system_customers_v2',
  INVOICES: 'ar_system_invoices_v2',
  PAYMENTS: 'ar_system_payments_v2',
  LOGS: 'ar_system_logs_v2',
  CREDIT_REQUESTS: 'ar_system_credit_requests_v2',
  PROMISES_TO_PAY: 'ar_system_promises_to_pay_v2',
  COLLECTION_TASKS: 'ar_system_collection_tasks_v2',
  NOTIFICATIONS: 'ar_system_notifications_v2',
  INITIALIZED: 'ar_system_initialized_flag_v2',
};

export function loadCustomers(): Customer[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (isInit !== null && saved !== null) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading customers from storage', e);
  }
  return INITIAL_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers', e);
  }
}

export function loadInvoices(): Invoice[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (isInit !== null && saved !== null) {
      const parsed: Invoice[] = JSON.parse(saved);
      return updateInvoiceStatuses(parsed);
    }
  } catch (e) {
    console.error('Error loading invoices from storage', e);
  }
  return updateInvoiceStatuses(INITIAL_INVOICES);
}

export function saveInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error('Error saving invoices', e);
  }
}

export function loadPayments(): Payment[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    if (isInit !== null && saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading payments from storage', e);
  }
  return INITIAL_PAYMENTS;
}

export function savePayments(payments: Payment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  } catch (e) {
    console.error('Error saving payments', e);
  }
}

export function loadLogs(): ActivityLog[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (isInit !== null && saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading logs from storage', e);
  }
  return INITIAL_LOGS;
}

export function saveLogs(logs: ActivityLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Error saving logs', e);
  }
}

export function loadCreditRequests(): CreditApprovalRequest[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.CREDIT_REQUESTS);
    if (isInit !== null && saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading credit requests from storage', e);
  }
  return INITIAL_CREDIT_REQUESTS;
}

export function saveCreditRequests(requests: CreditApprovalRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.CREDIT_REQUESTS, JSON.stringify(requests));
  } catch (e) {
    console.error('Error saving credit requests', e);
  }
}

export function loadPromisesToPay(): PromiseToPay[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.PROMISES_TO_PAY);
    if (isInit !== null && saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading promises to pay', e);
  }
  return INITIAL_PROMISES_TO_PAY;
}

export function savePromisesToPay(promises: PromiseToPay[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.PROMISES_TO_PAY, JSON.stringify(promises));
  } catch (e) {
    console.error('Error saving promises to pay', e);
  }
}

export function loadCollectionTasks(): CollectionTask[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.COLLECTION_TASKS);
    if (isInit !== null && saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading collection tasks', e);
  }
  return INITIAL_COLLECTION_TASKS;
}

export function saveCollectionTasks(tasks: CollectionTask[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.COLLECTION_TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving collection tasks', e);
  }
}

export function loadNotifications(): SystemNotification[] {
  try {
    const isInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (isInit !== null && saved !== null) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading notifications', e);
  }
  return INITIAL_NOTIFICATIONS;
}

export function saveNotifications(notifications: SystemNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  } catch (e) {
    console.error('Error saving notifications', e);
  }
}

// Clear all data to start completely fresh
export function clearAllSystemData(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CREDIT_REQUESTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PROMISES_TO_PAY, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.COLLECTION_TASKS, JSON.stringify([]));
  } catch (e) {
    console.error('Error clearing system data', e);
  }
}

// Reset to initial demo data
export function resetSystemToDemo(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
    localStorage.setItem(STORAGE_KEYS.CREDIT_REQUESTS, JSON.stringify(INITIAL_CREDIT_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.PROMISES_TO_PAY, JSON.stringify(INITIAL_PROMISES_TO_PAY));
    localStorage.setItem(STORAGE_KEYS.COLLECTION_TASKS, JSON.stringify(INITIAL_COLLECTION_TASKS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  } catch (e) {
    console.error('Error resetting system data', e);
  }
}


// Automatically recalculates invoice status & overdue days based on today's date
export function updateInvoiceStatuses(invoices: Invoice[]): Invoice[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return invoices.map((inv) => {
    const dueDate = new Date(inv.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isPastDue = diffDays > 0;

    let status = inv.status;
    if (inv.remainingAmount <= 0) {
      status = 'paid';
    } else if (isPastDue) {
      status = 'overdue';
    } else if (inv.paidAmount > 0) {
      status = 'partial';
    } else {
      status = 'unpaid';
    }

    return {
      ...inv,
      status,
      daysOverdue: isPastDue && inv.remainingAmount > 0 ? diffDays : 0,
    };
  });
}

// Calculate Aging Buckets for Outstanding Invoices
export function calculateAging(invoices: Invoice[]): AgingBucket[] {
  const unpaid = invoices.filter((i) => i.remainingAmount > 0);

  const buckets: AgingBucket[] = [
    { key: 'current', label: 'غير مستحقة (في الموعد)', amount: 0, count: 0, color: '#10B981' },
    { key: '1-30', label: 'متأخرة 1 - 30 يوم', amount: 0, count: 0, color: '#F59E0B' },
    { key: '31-60', label: 'متأخرة 31 - 60 يوم', amount: 0, count: 0, color: '#F97316' },
    { key: '61-90', label: 'متأخرة 61 - 90 يوم', amount: 0, count: 0, color: '#EF4444' },
    { key: '90+', label: 'متأخرة أكثر من 90 يوم (حرجة)', amount: 0, count: 0, color: '#991B1B' },
  ];

  unpaid.forEach((inv) => {
    const days = inv.daysOverdue || 0;
    if (days <= 0) {
      buckets[0].amount += inv.remainingAmount;
      buckets[0].count += 1;
    } else if (days <= 30) {
      buckets[1].amount += inv.remainingAmount;
      buckets[1].count += 1;
    } else if (days <= 60) {
      buckets[2].amount += inv.remainingAmount;
      buckets[2].count += 1;
    } else if (days <= 90) {
      buckets[3].amount += inv.remainingAmount;
      buckets[3].count += 1;
    } else {
      buckets[4].amount += inv.remainingAmount;
      buckets[4].count += 1;
    }
  });

  return buckets;
}

// Format Currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format Number with Commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-EG').format(num);
}

// Export Invoices to CSV
export function exportInvoicesToCSV(invoices: Invoice[]): void {
  const headers = [
    'رقم الفاتورة',
    'مرجع AX',
    'اسم العميل',
    'تاريخ الإصدار',
    'تاريخ الاستحقاق',
    'المبلغ الإجمالي',
    'المسدد',
    'المتبقي',
    'الحالة',
    'أيام التأخير',
    'ملاحظات',
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.axReference || '',
    `"${inv.customerName.replace(/"/g, '""')}"`,
    inv.issueDate,
    inv.dueDate,
    inv.totalAmount,
    inv.paidAmount,
    inv.remainingAmount,
    inv.status === 'paid' ? 'مسددة' : inv.status === 'overdue' ? 'متأخرة' : inv.status === 'partial' ? 'سداد جزئي' : 'غير مسددة',
    inv.daysOverdue || 0,
    `"${(inv.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `تقرير_الفواتير_والآجل_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
