import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { RefreshCw } from 'lucide-react';

export default function Invoices() {
  const { role } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState('');

  const { data: invoices, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice')
        .select('*, task(id, description, status)')
        .order('invoice_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const { error } = await supabase
        .from('invoice')
        .update({ 
          payment_status: 'PAID',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoiceId);
      if (error) throw error;
    },
    onSuccess: (_, invoiceId) => {
      const invoice = invoices?.find(inv => inv.id === invoiceId);
      setSuccessMessage(`Invoice for "${invoice?.task?.description ?? 'Task'}" marked as paid.`);
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-invoice-count'] });
    },
  });

  const task = (inv) => inv.task;
  const isPaid = (inv) => inv.payment_status === 'PAID' || inv.payment_status === 'paid';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('invoicesPage')}</h1>
          <p className="page-subtitle">Create invoices from approved tasks (Tasks → Invoice)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-compact secondary"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
              refetch();
            }}
            title="Reload invoices"
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="form-success" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.375rem' }}>
          {successMessage}
        </div>
      )}

      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : isError ? (
        <div className="table-wrap" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Failed to load invoices. Please try again.</p>
          <button
            type="button"
            className="btn-compact primary"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['invoices'] });
              refetch();
            }}
          >
            <RefreshCw style={{ width: 14, height: 14, marginRight: '0.5rem' }} />
            Retry
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task</th>
                <th>Amount (CHF)</th>
                <th>Status</th>
                {role === 'ADMIN' && <th className="cell-actions">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {!invoices?.length ? (
                <tr>
                  <td colSpan={role === 'ADMIN' ? 5 : 4} className="table-empty">
                    No invoices yet. Create one from an approved task on the Tasks page.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr 
                    key={inv.id}
                    className={isPaid(inv) ? 'invoice-paid' : ''}
                    style={isPaid(inv) ? { 
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      borderLeft: '3px solid #10b981'
                    } : {}}
                  >
                    <td>{inv.invoice_date ?? '—'}</td>
                    <td>{task(inv)?.description ?? `Task #${inv.task_id}`}</td>
                    <td>{inv.amount != null ? Number(inv.amount).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                    <td>
                      <span className={`status-badge ${isPaid(inv) ? 'status-approved' : 'status-assigned'}`}>
                        {isPaid(inv) ? t('paid') : t('unpaid')}
                      </span>
                    </td>
                    {role === 'ADMIN' && (
                      <td className="cell-actions">
                        {!isPaid(inv) && (
                          <button
                            type="button"
                            className="btn-compact primary"
                            onClick={() => markPaidMutation.mutate(inv.id)}
                            disabled={markPaidMutation.isPending}
                          >
                            {t('markAsPaid')}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
