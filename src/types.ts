export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash' | 'deposit';

export type CustomerDocumentType = 
  | 'commercial_register' 
  | 'tax_card' 
  | 'contract' 
  | 'guarantee_cheque' 
  | 'national_id' 
  | 'other';

export type EgyptianRegion = 'القاهرة' | 'الجيزة' | 'الدلتا' | 'الصعيد' | 'الإسكندرية' | 'أخرى';

export type CustomerRiskStatus = 'جيد' | 'يحتاج متابعة' | 'حرج' | 'موقوف';

export interface CustomerDocument {
  id: string;
  type: CustomerDocumentType;
  title: string;
  fileData: string; // Base64 data URL
  fileName: string;
  fileType: string;
  uploadedAt: string;
  notes?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  region: EgyptianRegion;
  creditLimit: number;
  paymentTermsDays: number;
  status: CustomerRiskStatus;
  isSuspended?: boolean;
  suspensionReason?: string;
  totalInvoiced?: number;
  totalPaid?: number;
  totalOutstanding?: number;
  overdueAmount?: number;
  guaranteeAmount?: number;
  notes?: string;
  documents?: CustomerDocument[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  axReference?: string;
  customerId: string;
  customerName: string;
  region?: EgyptianRegion;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  notes?: string;
  description?: string;
  attachmentName?: string;
  attachmentData?: string; // Base64 data URL of the invoice scan or document
  attachmentType?: string;
  daysOverdue?: number;
  isDueToday?: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  recordedBy?: string;
  notes?: string;
}

export interface CreditApprovalRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  region: EgyptianRegion;
  currentLimit: number;
  requestedIncrease: number;
  status: 'قيد المراجعة' | 'موافق عليه' | 'مرفوض';
  requestDate: string;
  reviewedDate?: string;
  reason: string;
  reviewerNotes?: string;
}

export interface PromiseToPay {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber?: string;
  promisedAmount?: number;
  amount?: number;
  promiseDate?: string;
  promisedDate?: string;
  contactPerson?: string;
  status: 'قيد الانتظار' | 'تم الالتزام' | 'تم الوفاء' | 'تم الإخلال';
  notes: string;
  collectorName: string;
}

export interface CollectionTask {
  id: string;
  customerName: string;
  customerId: string;
  region: EgyptianRegion;
  targetAmount: number;
  priority: 'عالية' | 'متوسطة' | 'حرجة' | 'عاجل' | 'عادي';
  dueDate: string;
  status: 'قيد المتابعة' | 'تم التحصيل' | 'مكتمل' | 'مؤجل';
  notes: string;
  collectorName: string;
  assignedTo?: string;
  taskType?: string;
}

export interface AgingBucket {
  key: 'current' | '1-30' | '31-60' | '61-90' | '90+';
  label: string;
  amount: number;
  count: number;
  color: string;
}

export interface ActivityLog {
  id: string;
  type: 'invoice_created' | 'payment_recorded' | 'customer_added' | 'credit_alert' | 'credit_approval' | 'credit_suspension';
  title: string;
  details: string;
  timestamp: string;
  amount?: number;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  read: boolean;
  link?: string;
}

export type ActiveNavView = 
  | 'dashboard'
  // العملاء
  | 'customers_directory'
  | 'customers_profile'
  | 'credit_limits'
  | 'guarantees_documents'
  // الائتمان
  | 'credit_positions'
  | 'credit_requests'
  | 'limit_increases'
  | 'credit_approvals'
  | 'suspended_customers'
  // الحسابات المدينة
  | 'invoices_list'
  | 'customer_balances'
  | 'debt_aging'
  | 'overdue_invoices'
  // التحصيل
  | 'collection_plan'
  | 'daily_followup'
  | 'promise_to_pay'
  | 'payments_list'
  | 'critical_overdue'
  // التقارير
  | 'report_aging'
  | 'report_collection'
  | 'report_debt'
  | 'report_risks'
  | 'report_limits'
  | 'report_branches'
  | 'report_executive'
  // الإدارة
  | 'admin_users'
  | 'admin_permissions'
  | 'admin_branches'
  | 'admin_audit_logs'
  | 'admin_settings';

