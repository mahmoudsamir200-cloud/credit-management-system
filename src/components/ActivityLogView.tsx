import React from 'react';
import { History, Receipt, CreditCard, Users, AlertTriangle } from 'lucide-react';
import { ActivityLog } from '../types';
import { formatCurrency } from '../utils/storage';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ logs = [], onClearLogs }) => {
  const safeLogs = logs || [];
  return (
    <div id="logs-view" className="space-y-5">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-stone-900">سجل العمليات والنشاطات</h2>
          <p className="text-xs text-stone-500 mt-0.5">
            توثيق كامل لكافة الفواتير المسجلة، السدادات المحصلة، والتنبيهات الآلية
          </p>
        </div>

        {safeLogs.length > 0 && (
          <button
            onClick={() => {
              if (confirm('هل تريد مسح سجل النشاطات القديم؟')) {
                onClearLogs();
              }
            }}
            className="text-xs text-stone-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition"
          >
            تفريغ السجل
          </button>
        )}
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs p-5">
        {safeLogs.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-xs">
            لا توجد حركات مسجلة حتى الآن
          </div>
        ) : (
          <div className="space-y-4">
            {safeLogs.map((log) => {
              const isPayment = log.type === 'payment_recorded';
              const isInvoice = log.type === 'invoice_created';
              const isAlert = log.type === 'credit_alert';

              return (
                <div key={log.id} className="flex items-start gap-3 pb-4 border-b border-stone-100 last:border-0">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isPayment ? 'bg-emerald-50 text-emerald-700' :
                    isInvoice ? 'bg-amber-50 text-amber-700' :
                    isAlert ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {isPayment && <CreditCard className="w-4 h-4" />}
                    {isInvoice && <Receipt className="w-4 h-4" />}
                    {isAlert && <AlertTriangle className="w-4 h-4" />}
                    {!isPayment && !isInvoice && !isAlert && <Users className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{log.title}</span>
                      <span className="text-[11px] text-stone-400 font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-stone-600 mt-0.5 leading-relaxed">{log.details}</p>
                    {log.amount && (
                      <span className="inline-block mt-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-stone-50 border border-stone-200 text-stone-800">
                        المبلغ: {formatCurrency(log.amount)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
