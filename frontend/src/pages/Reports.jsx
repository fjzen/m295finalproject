import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { RefreshCw } from 'lucide-react';

export default function Reports() {
  const { role, user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [submitTaskId, setSubmitTaskId] = useState('');
  const [submitDescription, setSubmitDescription] = useState('');
  const [submitHours, setSubmitHours] = useState('');
  const [submitMaterials, setSubmitMaterials] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedReport, setExpandedReport] = useState(null);

  useEffect(() => {
    const handleReload = () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      refetch();
    };
    window.addEventListener('keybind:reload', handleReload);
    return () => window.removeEventListener('keybind:reload', handleReload);
  }, [queryClient, refetch]);

  const { data: reports, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', role, user?.employee?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report')
        .select('*, task(id, description, status, contact_customer_id, employee_id, employee(first_name, last_name), customer:contact_customer_id(first_name, last_name))')
        .order('report_date', { ascending: false });

      if (error) throw error;

      // EMPLOYEEs only see their own reports - filter in JavaScript since Supabase doesn't support nested filtering
      if (role === 'WORKER' && user?.employee?.id != null) {
        const eid = Number(user.employee.id);
        if (!Number.isNaN(eid) && data) {
          return data.filter((r) => Number(r.task?.employee_id) === eid);
        }
      }

      return data ?? [];
    },
  });

  const { data: myAssignedTasks } = useQuery({
    queryKey: ['my-assigned-tasks', user?.employee?.id],
    queryFn: async () => {
      if (role !== 'WORKER' || user?.employee?.id == null) return [];
      const eid = Number(user.employee.id);
      if (Number.isNaN(eid)) return [];
      const { data } = await supabase
        .from('task')
        .select('id, description, customer:contact_customer_id(first_name, last_name)')
        .eq('employee_id', eid)
        .eq('status', 'ASSIGNED');
      return data ?? [];
    },
    enabled: role === 'WORKER' && !!user?.employee?.id,
  });

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!submitTaskId || !submitDescription.trim()) {
        throw new Error('Task and work description are required.');
      }
      if (submitHours === '' || submitHours == null) {
        throw new Error('Hours worked is required.');
      }
      if (!submitMaterials?.trim()) {
        throw new Error('Materials used is required.');
      }
      const payload = {
        task_id: Number(submitTaskId),
        description: submitDescription.trim(),
        hours_worked: Number(submitHours) || 0,
        materials_used: submitMaterials.trim(),
      };
      const { error: insertError } = await supabase.from('report').insert(payload);
      if (insertError) throw insertError;
      const { error: updateError } = await supabase
        .from('task')
        .update({ status: 'COMPLETED' })
        .eq('id', Number(submitTaskId));
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setSubmitTaskId('');
      setSubmitDescription('');
      setSubmitHours('');
      setSubmitMaterials('');
      setSubmitError('');
      setSuccessMessage('Report submitted successfully! Awaiting manager approval.');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-assigned-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tasks'] });
    },
    onError: (err) => {
      setSubmitError(err.message ?? 'Failed to submit report.');
    },
  });

  const approveTask = useMutation({
    mutationFn: async (taskId) => {
      const { error } = await supabase.from('task').update({ status: 'APPROVED', approved_at: new Date().toISOString() }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      setSuccessMessage('Task approved! It is now ready for invoicing.');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tasks'] });
    },
  });

  const rejectTask = useMutation({
    mutationFn: async (taskId) => {
      const { error } = await supabase.from('task').update({ status: 'ASSIGNED' }).eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      setSuccessMessage('Task rejected. It has been returned to ASSIGNED status for additional work.');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tasks'] });
    },
  });

  const handleSubmitReport = (e) => {
    e.preventDefault();
    submitReport.mutate();
  };

  const task = (r) => r.task;
  const isCompleted = (r) => task(r)?.status === 'COMPLETED';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('reportsPage')}</h1>
          <p className="page-subtitle">{t('reportsSubtitle')}</p>
        </div>
        <button
          type="button"
          className="btn-compact secondary"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            refetch();
          }}
          title="Reload reports"
        >
          <RefreshCw style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {successMessage && (
        <div className="form-success" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.375rem' }}>
          {successMessage}
        </div>
      )}

      {role === 'WORKER' && (myAssignedTasks?.length ?? 0) > 0 && (
        <div className="table-wrap" style={{ marginBottom: '1.5rem' }}>
          <h2 className="dashboard-recent h2" style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}>
            {t('submitReport')}
          </h2>
          <form onSubmit={handleSubmitReport}>
            <div className="explorer-filters" style={{ flexWrap: 'wrap', alignItems: 'flex-end', gap: '1rem' }}>
              <div className="field" style={{ minWidth: '12rem' }}>
                <label htmlFor="report-task">Task</label>
                <select
                  id="report-task"
                  className="explorer-select"
                  value={submitTaskId}
                  onChange={(e) => setSubmitTaskId(e.target.value)}
                  required
                >
                  <option value="">Select task</option>
                  {myAssignedTasks?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.description ?? `Task #${t.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1, minWidth: '12rem' }}>
                <label htmlFor="report-desc">Work description</label>
                <input
                  id="report-desc"
                  type="text"
                  className="form-input"
                  placeholder="What was done"
                  value={submitDescription}
                  onChange={(e) => setSubmitDescription(e.target.value)}
                  required
                />
              </div>
              <div className="field" style={{ width: '6rem' }}>
                <label htmlFor="report-hours">Hours worked (required)</label>
                <input
                  id="report-hours"
                  type="number"
                  min="0"
                  step="0.25"
                  className="form-input"
                  placeholder="0"
                  value={submitHours}
                  onChange={(e) => setSubmitHours(e.target.value)}
                  required
                />
              </div>
              <div className="field" style={{ minWidth: '10rem' }}>
                <label htmlFor="report-materials">Materials used (required)</label>
                <input
                  id="report-materials"
                  type="text"
                  className="form-input"
                  placeholder="Materials used"
                  value={submitMaterials}
                  onChange={(e) => setSubmitMaterials(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-compact primary" disabled={submitReport.isPending}>
                {submitReport.isPending ? '…' : t('submitReport')}
              </button>
            </div>
            {submitError && <p className="form-error" style={{ marginTop: '0.5rem' }}>{submitError}</p>}
          </form>
        </div>
      )}

      <h2 className="dashboard-recent h2" style={{ marginBottom: '0.75rem', fontSize: '0.9375rem', fontWeight: 600 }}>
        {t('reportsPage')}
      </h2>
      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : isError ? (
        <div className="table-wrap" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Failed to load reports. Please try again.</p>
          <button
            type="button"
            className="btn-compact primary"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['reports'] });
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
                <th>Description</th>
                <th>Hours</th>
                <th>Materials</th>
                <th>Task Status</th>
                {role === 'MANAGER' && <th className="cell-actions">Actions</th>}
                {(role === 'WORKER' || role === 'ADMIN') && <th>Details</th>}
              </tr>
            </thead>
            <tbody>
              {!reports?.length ? (
                <tr>
                  <td colSpan={role === 'MANAGER' ? 7 : role === 'WORKER' ? 7 : 7} className="table-empty">
                    {role === 'WORKER' 
                      ? 'No reports submitted yet. Submit a report for an assigned task above.'
                      : 'No reports yet.'}
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id}>
                    <td>{r.report_date ?? '—'}</td>
                    <td>{task(r)?.description ?? '—'}</td>
                    <td>
                      {expandedReport === r.id ? (
                        <div>
                          <div style={{ marginBottom: '0.5rem' }}>{r.description ?? r.work_performed ?? '—'}</div>
                          <button
                            type="button"
                            onClick={() => setExpandedReport(null)}
                            style={{ fontSize: '0.875rem', color: '#60a5fa' }}
                          >
                            Show less
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ marginBottom: '0.5rem' }}>
                            {(r.description ?? r.work_performed ?? '').substring(0, 50)}
                            {((r.description ?? r.work_performed ?? '').length > 50) && '...'}
                          </div>
                          {((r.description ?? r.work_performed ?? '').length > 50) && (
                            <button
                              type="button"
                              onClick={() => setExpandedReport(r.id)}
                              style={{ fontSize: '0.875rem', color: '#60a5fa' }}
                            >
                              Show more
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>{r.hours_worked != null ? Number(r.hours_worked).toFixed(2) : '—'}</td>
                    <td>{r.materials_used ?? '—'}</td>
                    <td>
                      <span className={`status-badge ${task(r)?.status === 'COMPLETED' ? 'status-completed' : task(r)?.status === 'APPROVED' ? 'status-approved' : 'status-assigned'}`}>
                        {task(r)?.status ?? '—'}
                      </span>
                    </td>
                    {role === 'MANAGER' && (
                      <td className="cell-actions">
                        {isCompleted(r) && (
                          <>
                            <button
                              type="button"
                              className="btn-compact primary"
                              onClick={() => approveTask.mutate(task(r).id)}
                              disabled={approveTask.isPending}
                            >
                              {t('approve')}
                            </button>
                            <button
                              type="button"
                              className="btn-compact secondary"
                              onClick={() => rejectTask.mutate(task(r).id)}
                              disabled={rejectTask.isPending}
                            >
                              {t('reject')}
                            </button>
                          </>
                        )}
                      </td>
                    )}
                    {(role === 'WORKER' || role === 'ADMIN') && (
                      <td>
                        {task(r)?.status === 'COMPLETED' && role === 'WORKER' && (
                          <span style={{ fontSize: '0.875rem', color: '#a0aec0' }}>Awaiting approval</span>
                        )}
                        {task(r)?.status === 'APPROVED' && role === 'ADMIN' && (
                          <span style={{ fontSize: '0.875rem', color: '#10b981' }}>Ready for invoicing</span>
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

