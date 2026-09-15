import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Customer, Invoice, Payment, ActivityLog } from '../types';
import { updateInvoiceStatuses } from './storage';
import { INITIAL_CUSTOMERS, INITIAL_INVOICES, INITIAL_PAYMENTS, INITIAL_LOGS } from '../data/mockData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Subscriptions for real-time synchronization across team members
export function subscribeToCustomers(
  onUpdate: (customers: Customer[]) => void,
  onError?: (err: any) => void
) {
  const path = 'customers';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Customer);
      });
      onUpdate(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToInvoices(
  onUpdate: (invoices: Invoice[]) => void,
  onError?: (err: any) => void
) {
  const path = 'invoices';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Invoice[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Invoice);
      });
      // Sort and update overdue statuses
      const updated = updateInvoiceStatuses(list);
      onUpdate(updated);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToPayments(
  onUpdate: (payments: Payment[]) => void,
  onError?: (err: any) => void
) {
  const path = 'payments';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: Payment[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Payment);
      });
      onUpdate(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToLogs(
  onUpdate: (logs: ActivityLog[]) => void,
  onError?: (err: any) => void
) {
  const path = 'activityLogs';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: ActivityLog[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ActivityLog);
      });
      // Sort newest first
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      onUpdate(list);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// Single Operations
export async function saveCustomerToCloud(customer: Customer): Promise<void> {
  const path = `customers/${customer.id}`;
  try {
    await setDoc(doc(db, 'customers', customer.id), customer);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveInvoiceToCloud(invoice: Invoice): Promise<void> {
  const path = `invoices/${invoice.id}`;
  try {
    await setDoc(doc(db, 'invoices', invoice.id), invoice);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function savePaymentToCloud(payment: Payment): Promise<void> {
  const path = `payments/${payment.id}`;
  try {
    await setDoc(doc(db, 'payments', payment.id), payment);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function saveLogToCloud(log: ActivityLog): Promise<void> {
  const path = `activityLogs/${log.id}`;
  try {
    await setDoc(doc(db, 'activityLogs', log.id), log);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteInvoiceFromCloud(invoiceId: string): Promise<void> {
  const path = `invoices/${invoiceId}`;
  try {
    await deleteDoc(doc(db, 'invoices', invoiceId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Batch Import from Excel/AX directly to Cloud
export async function batchImportInvoicesToCloud(invoices: Invoice[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    invoices.forEach((inv) => {
      const ref = doc(db, 'invoices', inv.id);
      batch.set(ref, inv);
    });
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'invoices (batch)');
  }
}

export async function batchImportCustomersToCloud(newCustomers: Customer[]): Promise<void> {
  try {
    for (let i = 0; i < newCustomers.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = newCustomers.slice(i, i + 400);
      chunk.forEach((cust) => {
        const ref = doc(db, 'customers', cust.id);
        batch.set(ref, cust);
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'customers (batch)');
  }
}

// Clear all collections on the cloud
export async function clearAllCloudData(): Promise<void> {
  try {
    const collections = ['customers', 'invoices', 'payments', 'activityLogs'];
    for (const colName of collections) {
      const snap = await getDocs(collection(db, colName));
      if (snap.empty) continue;
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'all_collections');
  }
}

// Seed Demo Data to Cloud if totally empty
export async function seedDemoDataToCloud(): Promise<void> {
  try {
    const batch = writeBatch(db);

    INITIAL_CUSTOMERS.forEach((c) => {
      batch.set(doc(db, 'customers', c.id), c);
    });

    INITIAL_INVOICES.forEach((i) => {
      batch.set(doc(db, 'invoices', i.id), i);
    });

    INITIAL_PAYMENTS.forEach((p) => {
      batch.set(doc(db, 'payments', p.id), p);
    });

    INITIAL_LOGS.forEach((l) => {
      batch.set(doc(db, 'activityLogs', l.id), l);
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_demo_data');
  }
}
