import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Customer, 
  Invoice, 
  Payment, 
  ActivityLog, 
  ActiveNavView,
  CreditApprovalRequest,
  PromiseToPay,
  CollectionTask,
  SystemNotification,
  CompanySettings
} from './types';
import {
  calculateAging,
  updateInvoiceStatuses,
  loadCreditRequests,
  saveCreditRequests,
  loadPromisesToPay,
  savePromisesToPay,
  loadCollectionTasks,
  saveCollectionTasks,
  loadNotifications,
  saveNotifications,
  loadCompanySettings,
  saveCompanySettings,
} from './utils/storage';
import {
  subscribeToCustomers,
  subscribeToInvoices,
  subscribeToPayments,
  subscribeToLogs,
  saveCustomerToCloud,
  saveInvoiceToCloud,
  savePaymentToCloud,
  saveLogToCloud,
  deleteInvoiceFromCloud,
  batchImportInvoicesToCloud,
  clearAllCloudData,
} from './utils/firestoreService';
import { testConnection } from './firebase';

import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { PaymentModal } from './components/PaymentModal';
import { NewInvoiceModal } from './components/NewInvoiceModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { CustomerLedger } from './components/CustomerLedger';
import { CustomerProfile } from './components/CustomerProfile';
import { AgingReport } from './components/AgingReport';
import { PaymentList } from './components/PaymentList';
import { ActivityLogView } from './components/ActivityLogView';
import { CreditManagementView } from './components/CreditManagementView';
import { CollectionsView } from './components/CollectionsView';
import { ReportsView } from './components/ReportsView';
import { AdminView } from './components/AdminView';

export default function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [creditRequests, setCreditRequests] = useState<CreditApprovalRequest[]>(() => loadCreditRequests());
  const [promisesToPay, setPromisesToPay] = useState<PromiseToPay[]>(() => loadPromisesToPay());
  const [collectionTasks, setCollectionTasks] = useState<CollectionTask[]>(() => loadCollectionTasks());
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => loadNotifications());
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => loadCompanySettings());

  const handleUpdateCompanySettings = (newSettings: CompanySettings) => {
    setCompanySettings(newSettings);
    saveCompanySettings(newSettings);
  };

  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const initialCheckDone = useRef(false);

  // Active navigation view (matches Enterprise hierarchy)
  const [activeView, setActiveView] = useState<ActiveNavView>('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Modals state
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [customerFilterForInvoices, setCustomerFilterForInvoices] = useState<string>('');

  // Setup Real-time Firestore Subscriptions
  useEffect(() => {
    testConnection().then((connected) => {
      setIsCloudConnected(connected);
    });

    const unsubCustomers = subscribeToCustomers(
      (data) => {
        setCustomers(data || []);
        setIsCloudConnected(true);
      },
      (err) => console.error('Cloud customer sync error:', err)
    );

    const unsubInvoices = subscribeToInvoices(
      (data) => {
        const safeData = data || [];
        setInvoices(safeData);
        setIsCloudConnected(true);

        // An empty cloud database is a valid real state; do not inject demo records.
        initialCheckDone.current = true;
      },
      (err) => console.error('Cloud invoices sync error:', err)
    );

    const unsubPayments = subscribeToPayments(
      (data) => {
        setPayments(data || []);
        setIsCloudConnected(true);
      },
      (err) => console.error('Cloud payments sync error:', err)
    );

    const unsubLogs = subscribeToLogs(
      (data) => {
        setLogs(data || []);
        setIsCloudConnected(true);
      },
      (err) => console.error('Cloud logs sync error:', err)
    );

    return () => {
      unsubCustomers();
      unsubInvoices();
      unsubPayments();
      unsubLogs();
    };
  }, []);

  // Recalculate customer aging whenever invoices change
  const aging = useMemo(() => calculateAging(invoices || []), [invoices]);

  // Recalculate customer balances whenever invoices/payments change
  useEffect(() => {
    if (!customers || customers.length === 0) return;

    let hasChanges = false;
    const updatedCustomers = customers.map((customer) => {
      const custInvoices = (invoices || []).filter((i) => i.customerId === customer.id);
      const totalInvoiced = custInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = custInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
      const totalOutstanding = custInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);
      const overdueAmount = custInvoices
        .filter((i) => i.status === 'overdue' || (i.daysOverdue || 0) > 0)
        .reduce((sum, i) => sum + i.remainingAmount, 0);

      if (
        customer.totalInvoiced !== totalInvoiced ||
        customer.totalPaid !== totalPaid ||
        customer.totalOutstanding !== totalOutstanding ||
        customer.overdueAmount !== overdueAmount
      ) {
        hasChanges = true;
        return {
          ...customer,
          totalInvoiced,
          totalPaid,
          totalOutstanding,
          overdueAmount,
        };
      }
      return customer;
    });

    if (hasChanges) {
      setCustomers(updatedCustomers);
      updatedCustomers.forEach((c) => {
        saveCustomerToCloud(c).catch((e) => console.warn('Sync customer totals error:', e));
      });
    }
  }, [invoices, payments]);

  // Handler: Add or update customer
  const handleAddCustomer = async (newCustomer: Customer) => {
    await saveCustomerToCloud(newCustomer);
    await saveLogToCloud({
      id: `log-${Date.now()}`,
      type: 'customer_added',
      title: 'إضافة عميل جديد',
      details: `تم تسجيل العميل: ${newCustomer.name} برقم كود ${newCustomer.code} وحد ائتماني ${newCustomer.creditLimit.toLocaleString()} ج.م`,
      timestamp: new Date().toISOString(),
    });
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    await saveCustomerToCloud(updatedCustomer);
  };

  // Handler: Add invoice
  const handleAddInvoice = async (newInv: Invoice) => {
    const updatedInvList = updateInvoiceStatuses([...invoices, newInv]);
    const finalInvoice = updatedInvList.find((i) => i.id === newInv.id) || newInv;

    await saveInvoiceToCloud(finalInvoice);
    await saveLogToCloud({
      id: `log-${Date.now()}`,
      type: 'invoice_created',
      title: 'إنشاء فاتورة جديدة',
      details: `تم إصدار الفاتورة رقم ${newInv.invoiceNumber} للعميل ${newInv.customerName} بمبلغ ${newInv.totalAmount.toLocaleString()} ج.م ${
        newInv.attachmentName ? '(مرفق بها المستند)' : ''
      }`,
      timestamp: new Date().toISOString(),
      amount: newInv.totalAmount,
    });
  };

  // Handler: Update invoice
  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    const updatedList = updateInvoiceStatuses(
      invoices.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i))
    );
    const finalInv = updatedList.find((i) => i.id === updatedInvoice.id) || updatedInvoice;
    await saveInvoiceToCloud(finalInv);
  };

  // Handler: Delete invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    await deleteInvoiceFromCloud(invoiceId);
    await saveLogToCloud({
      id: `log-${Date.now()}`,
      type: 'invoice_created',
      title: 'حذف فاتورة',
      details: `تم إلغاء/حذف الفاتورة رقم ${inv.invoiceNumber} للعميل ${inv.customerName}`,
      timestamp: new Date().toISOString(),
    });
  };

  // Handler: Record payment
  const handleRecordPayment = async (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
    };

    const targetInvoice = invoices.find((i) => i.id === newPayment.invoiceId);
    if (targetInvoice) {
      const newPaid = targetInvoice.paidAmount + newPayment.amount;
      const newRemaining = Math.max(0, targetInvoice.totalAmount - newPaid);
      let newStatus: Invoice['status'] = targetInvoice.status;

      if (newRemaining <= 0) {
        newStatus = 'paid';
      } else if (newPaid > 0) {
        newStatus = 'partial';
      }

      const updatedInvoice: Invoice = {
        ...targetInvoice,
        paidAmount: newPaid,
        remainingAmount: newRemaining,
        status: newStatus,
      };

      await saveInvoiceToCloud(updatedInvoice);
    }

    await savePaymentToCloud(newPayment);
    await saveLogToCloud({
      id: `log-${Date.now()}`,
      type: 'payment_recorded',
      title: 'تحصيل دفعة مالية',
      details: `سداد مبلغ ${newPayment.amount.toLocaleString()} ج.م على الفاتورة ${newPayment.invoiceNumber} (${newPayment.customerName})`,
      timestamp: new Date().toISOString(),
      amount: newPayment.amount,
    });
  };

  // Handler: Batch Excel Import
  const handleImportInvoices = async (importedInvoices: Invoice[]) => {
    const processed = updateInvoiceStatuses(importedInvoices);
    await batchImportInvoicesToCloud(processed);
    await saveLogToCloud({
      id: `log-${Date.now()}`,
      type: 'invoice_created',
      title: 'استيراد جماعي للفواتير',
      details: `تم استيراد ${importedInvoices.length} فاتورة بنجاح ومطابقتها مع السجلات السحابية`,
      timestamp: new Date().toISOString(),
    });
  };

  // Handler: Credit Approval/Rejection
  const handleApproveCreditRequest = (requestId: string) => {
    const req = creditRequests.find((r) => r.id === requestId);
    if (!req) return;

    const updatedRequests = creditRequests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'موافق عليه' as const, reviewedDate: new Date().toISOString().slice(0, 10) }
        : r
    );
    setCreditRequests(updatedRequests);
    saveCreditRequests(updatedRequests);

    // Update customer credit limit if matching customer exists
    const customer = customers.find((c) => c.id === req.customerId || c.name === req.customerName);
    if (customer) {
      const newLimit = (customer.creditLimit || 0) + req.requestedIncrease;
      const updatedCust = { ...customer, creditLimit: newLimit };
      saveCustomerToCloud(updatedCust);
    }

    saveLogToCloud({
      id: `log-${Date.now()}`,
      type: 'credit_approval',
      title: 'موافقة على زيادة حد ائتماني',
      details: `تمت الموافقة على طلب الزيادة رقم ${req.requestNumber} للعميل ${req.customerName} بقيمة ${req.requestedIncrease.toLocaleString()} ج.م`,
      timestamp: new Date().toISOString(),
      amount: req.requestedIncrease,
    });
  };

  const handleRejectCreditRequest = (requestId: string) => {
    const req = creditRequests.find((r) => r.id === requestId);
    if (!req) return;

    const updatedRequests = creditRequests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'مرفوض' as const, reviewedDate: new Date().toISOString().slice(0, 10) }
        : r
    );
    setCreditRequests(updatedRequests);
    saveCreditRequests(updatedRequests);
  };

  const handleAddCreditRequest = (
    reqData: Omit<CreditApprovalRequest, 'id' | 'requestNumber' | 'status'>
  ) => {
    const newReq: CreditApprovalRequest = {
      ...reqData,
      id: `cr-${Date.now()}`,
      requestNumber: `CR-${String(creditRequests.length + 1).padStart(4, '0')}`,
      status: 'قيد المراجعة',
    };
    const updated = [newReq, ...creditRequests];
    setCreditRequests(updated);
    saveCreditRequests(updated);
  };

  // Handler: Suspend/Unsuspend customer
  const handleToggleSuspendCustomer = async (customerId: string, reason?: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const isNowSuspended = !cust.isSuspended;
    const updatedCust: Customer = {
      ...cust,
      isSuspended: isNowSuspended,
      status: isNowSuspended ? 'موقوف' : 'جيد',
      suspensionReason: isNowSuspended ? (reason || 'تجاوز حد الائتمان ومماطلة السداد') : undefined,
    };

    await saveCustomerToCloud(updatedCust);
    await saveLogToCloud({
      id: `log-${Date.now()}`,
      type: 'credit_suspension',
      title: isNowSuspended ? 'إيقاف تعامل عميل' : 'إعادة تفعيل عميل',
      details: isNowSuspended
        ? `تم إيقاف التعامل مع العميل ${cust.name} - السبب: ${reason || 'تجاوز الحد الائتماني'}`
        : `تم رفع الإيقاف وإعادة تفعيل التعامل مع العميل ${cust.name}`,
      timestamp: new Date().toISOString(),
    });
  };

  // Handler: Collections Promises
  const handleAddPromiseToPay = (promiseData: Omit<PromiseToPay, 'id' | 'status'>) => {
    const newPromise: PromiseToPay = {
      ...promiseData,
      id: `p2p-${Date.now()}`,
      status: 'قيد الانتظار',
    };
    const updated = [newPromise, ...promisesToPay];
    setPromisesToPay(updated);
    savePromisesToPay(updated);
  };

  const handleUpdatePromiseStatus = (promiseId: string, status: PromiseToPay['status']) => {
    const updated = promisesToPay.map((p) => (p.id === promiseId ? { ...p, status } : p));
    setPromisesToPay(updated);
    savePromisesToPay(updated);
  };

  const handleUpdateTaskStatus = (taskId: string, status: CollectionTask['status']) => {
    const updated = collectionTasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setCollectionTasks(updated);
    saveCollectionTasks(updated);
  };

  // Quick select customer to filter invoices
  const handleSelectCustomerForInvoice = (cust: Customer) => {
    setCustomerFilterForInvoices(cust.id);
    setActiveView('invoices_list');
  };

  const handleSelectCustomer = (cust: Customer) => {
    setCustomerFilterForInvoices(cust.id);
    setActiveView('customers_directory');
  };

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoiceForPayment(inv);
    setActiveView('invoices_list');
  };

  const handleOpenPaymentForInvoice = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setIsPaymentModalOpen(true);
  };

  // Clear and reset demo data
  const handleClearAllData = async () => {
    await clearAllCloudData();
    setCustomers([]);
    setInvoices([]);
    setPayments([]);
    setLogs([]);
  };

  const handleResetDemoData = async () => {
    await seedDemoDataToCloud();
  };

  // Decide what main view component to display based on activeView
  const renderMainView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            invoices={invoices}
            customers={customers}
            payments={payments}
            creditRequests={creditRequests}
            onSelectCustomer={handleSelectCustomer}
            onSelectInvoice={handleSelectInvoice}
            onSelectInvoiceForPayment={handleOpenPaymentForInvoice}
            setActiveView={setActiveView}
            onApproveCreditRequest={handleApproveCreditRequest}
            onRejectCreditRequest={handleRejectCreditRequest}
            companySettings={companySettings}
            onUpdateCompanySettings={handleUpdateCompanySettings}
          />
        );

      case 'customers_directory':
      case 'guarantees_documents':
        return (
          <CustomerLedger
            activeView={activeView}
            customers={customers}
            invoices={invoices}
            payments={payments}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onSelectCustomerForInvoice={handleSelectCustomerForInvoice}
            onSelectInvoiceForPayment={handleOpenPaymentForInvoice}
            companySettings={companySettings}
          />
        );

      case 'customers_profile':
        return (
          <CustomerProfile
            customers={customers}
            invoices={invoices}
            payments={payments}
            companySettings={companySettings}
            onUpdateCustomer={handleUpdateCustomer}
            onSelectInvoiceForPayment={handleOpenPaymentForInvoice}
          />
        );

      case 'credit_positions':
      case 'credit_limits':
      case 'credit_requests':
      case 'limit_increases':
      case 'credit_approvals':
      case 'suspended_customers':
        return (
          <CreditManagementView
            activeView={activeView}
            customers={customers}
            invoices={invoices}
            creditRequests={creditRequests}
            onApproveRequest={handleApproveCreditRequest}
            onRejectRequest={handleRejectCreditRequest}
            onAddCreditRequest={handleAddCreditRequest}
            onToggleSuspendCustomer={handleToggleSuspendCustomer}
            onSelectCustomer={handleSelectCustomer}
          />
        );

      case 'invoices_list':
      case 'customer_balances':
        return (
          <InvoiceList
            invoices={invoices}
            customers={customers}
            onOpenNewInvoice={() => setIsNewInvoiceModalOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
            onSelectInvoiceForPayment={handleOpenPaymentForInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            initialCustomerFilter={customerFilterForInvoices}
          />
        );

      case 'overdue_invoices':
        return (
          <InvoiceList
            invoices={invoices.filter((i) => i.status === 'overdue' || (i.daysOverdue || 0) > 0)}
            customers={customers}
            onOpenNewInvoice={() => setIsNewInvoiceModalOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
            onSelectInvoiceForPayment={handleOpenPaymentForInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateInvoice={handleUpdateInvoice}
            initialCustomerFilter={customerFilterForInvoices}
          />
        );

      case 'debt_aging':
        return (
          <AgingReport
            customers={customers}
            invoices={invoices}
            aging={aging}
          />
        );

      case 'collection_plan':
      case 'daily_followup':
      case 'promise_to_pay':
      case 'critical_overdue':
        return (
          <CollectionsView
            activeView={activeView}
            customers={customers}
            invoices={invoices}
            payments={payments}
            promisesToPay={promisesToPay}
            collectionTasks={collectionTasks}
            onAddPromiseToPay={handleAddPromiseToPay}
            onUpdatePromiseStatus={handleUpdatePromiseStatus}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onSelectInvoiceForPayment={handleOpenPaymentForInvoice}
            onSelectCustomer={handleSelectCustomer}
          />
        );

      case 'payments_list':
        return (
          <PaymentList
            payments={payments}
            onOpenNewPayment={() => {
              setSelectedInvoiceForPayment(null);
              setIsPaymentModalOpen(true);
            }}
          />
        );

      case 'report_aging':
      case 'report_collection':
      case 'report_debt':
      case 'report_risks':
      case 'report_limits':
      case 'report_branches':
      case 'report_executive':
        return (
          <ReportsView
            activeView={activeView}
            customers={customers}
            invoices={invoices}
            payments={payments}
            aging={aging}
          />
        );

      case 'admin_users':
      case 'admin_permissions':
      case 'admin_branches':
      case 'admin_audit_logs':
      case 'admin_settings':
        return (
          <AdminView
            activeView={activeView}
            logs={logs}
            onClearAllData={handleClearAllData}
            onResetDemoData={handleResetDemoData}
            companySettings={companySettings}
            onUpdateCompanySettings={handleUpdateCompanySettings}
          />
        );

      default:
        return (
          <Dashboard
            invoices={invoices}
            customers={customers}
            payments={payments}
            creditRequests={creditRequests}
            onSelectCustomer={handleSelectCustomer}
            onSelectInvoice={handleSelectInvoice}
            onSelectInvoiceForPayment={handleOpenPaymentForInvoice}
            setActiveView={setActiveView}
            onApproveCreditRequest={handleApproveCreditRequest}
            onRejectCreditRequest={handleRejectCreditRequest}
            companySettings={companySettings}
            onUpdateCompanySettings={handleUpdateCompanySettings}
          />
        );
    }
  };

  return (
    <div 
      id="app-root" 
      className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-['Tajawal',sans-serif] selection:bg-blue-500 selection:text-white" 
      dir="rtl"
    >
      {/* Top Header Navigation Bar */}
      <TopBar
        onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        notifications={notifications}
        onOpenNewInvoice={() => setIsNewInvoiceModalOpen(true)}
        onOpenPayment={() => {
          setSelectedInvoiceForPayment(null);
          setIsPaymentModalOpen(true);
        }}
        setActiveView={setActiveView}
        onClearAllData={handleClearAllData}
        onResetDemoData={handleResetDemoData}
        companySettings={companySettings}
      />

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isCloudConnected={isCloudConnected}
          companySettings={companySettings}
          customers={customers}
          invoices={invoices}
          creditRequests={creditRequests}
        />

        {/* Dynamic View Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#090d16] p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {renderMainView()}
        </main>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        invoice={selectedInvoiceForPayment}
        invoices={invoices}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedInvoiceForPayment(null);
        }}
        onRecordPayment={handleRecordPayment}
      />

      <NewInvoiceModal
        isOpen={isNewInvoiceModalOpen}
        customers={customers}
        onClose={() => setIsNewInvoiceModalOpen(false)}
        onAddInvoice={handleAddInvoice}
        onQuickAddCustomer={handleAddCustomer}
      />

      <ExcelImportModal
        isOpen={isImportModalOpen}
        customers={customers}
        onClose={() => setIsImportModalOpen(false)}
        onImportInvoices={handleImportInvoices}
      />
    </div>
  );
}
