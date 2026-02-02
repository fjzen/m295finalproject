import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { Plus, RefreshCw } from 'lucide-react';

const STATUS_CLASS = {
  CREATED: 'status-created',
  ASSIGNED: 'status-assigned',
  COMPLETED: 'status-completed',
  APPROVED: 'status-approved',
  INVOICED: 'status-invoiced',
};

function statusClass(status) {
  return STATUS_CLASS[status] ?? 'status-invoiced';
}

function statusLabel(status) {
  if (!status) return '—';
  const labels = {
    CREATED: 'Created — not assigned',
    ASSIGNED: 'Assigned — awaiting completion',
    COMPLETED: 'Completed — awaiting approval',
    APPROVED: 'Approved — ready for invoicing',
    INVOICED: 'Invoiced — closed',
  };
  return labels[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
}

function statusShortLabel(status) {
  if (!status) return '—';
  const shortLabels = {
    CREATED: 'Created',
    ASSIGNED: 'Assigned',
    COMPLETED: 'Completed',
    APPROVED: 'Approved',
    INVOICED: 'Invoiced',
  };
  return shortLabels[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
}

/** Role + status: who can do what. Spec flow: CREATED→ASSIGNED→COMPLETED→APPROVED→INVOICED */
function canAssign(role) {
  return role === 'MANAGER' || role === 'ADMIN';
}
function canComplete(role, task, userId) {
  if (role !== 'WORKER' || task.status !== 'ASSIGNED' || userId == null) return false;
  return Number(task.employee_id) === Number(userId);
}
function canApprove(role, task) {
  return role === 'MANAGER' && task.status === 'COMPLETED';
}
function canInvoice(role, task) {
  return role === 'ADMIN' && task.status === 'APPROVED';
}

export default function Tasks() {
  const { role, user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoiceTask, setInvoiceTask] = useState(null);
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceNote, setInvoiceNote] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createDescription, setCreateDescription] = useState('');
  const [createCustomerId, setCreateCustomerId] = useState('');
  const [createPriority, setCreatePriority] = useState('normal');
  const [createLocation, setCreateLocation] = useState('');
  const [createNotes, setCreateNotes] = useState('');
  const [createError, setCreateError] = useState('');
  const [invoiceError, setInvoiceError] = useState('');
  const [assignTask, setAssignTask] = useState(null);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignError, setAssignError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [completeTask, setCompleteTask] = useState(null);
  const [completeDescription, setCompleteDescription] = useState('');
  const [completeHours, setCompleteHours] = useState('');
  const [completeMaterials, setCompleteMaterials] = useState('');
  const [completeError, setCompleteError] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onCloseModal = () => {
      setCreateOpen(false);
      setInvoiceTask(null);
      setAssignTask(null);
      setCompleteTask(null);
    };
    const onCreateTask = () => {
      if (role === 'ADMIN') setCreateOpen(true);
    };
    const onFocusSearch = () => searchInputRef.current?.focus();
    const onReload = () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      refetch();
    };
    window.addEventListener('keybind:close-modal', onCloseModal);
    window.addEventListener('keybind:create-task', onCreateTask);
    window.addEventListener('keybind:focus-search', onFocusSearch);
    window.addEventListener('keybind:reload', onReload);
    return () => {
      window.removeEventListener('keybind:close-modal', onCloseModal);
      window.removeEventListener('keybind:create-task', onCreateTask);
      window.removeEventListener('keybind:focus-search', onFocusSearch);
      window.removeEventListener('keybind:reload', onReload);
    };
  }, [role]);

  const { data: tasks, isLoading, isError, refetch } = useQuery({
    queryKey: ['tasks', role, user?.employee?.id],
    queryFn: async () => {
      let query = supabase
        .from('task')
        .select(`
          *,
          customer:contact_customer_id(first_name, last_name),
          employee:employee_id(first_name, last_name)
        `)
        ;

      if (role === 'WORKER' && user?.employee?.id != null) {
        const eid = Number(user.employee.id);
        if (!Number.isNaN(eid)) query = query.eq('employee_id', eid);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
          alert(error.message);
          console.log(error);
          throw error;
        }

      return data ?? [];
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data } = await supabase.from('customer').select('id, first_name, last_name').order('last_name');
      return data ?? [];
    },
    enabled: createOpen && role === 'ADMIN',
  });

  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data } = await supabase.from('employee').select('id, first_name, last_name').order('last_name');
      return data ?? [];
    },
    enabled: !!assignTask && (role === 'MANAGER' || role === 'ADMIN'),
  });

  const statusFiltered =
    statusFilter === 'all' ? tasks : tasks?.filter((t) => t.status === statusFilter) ?? [];
  const q = searchTerm.trim().toLowerCase();
  const filteredTasks = q
    ? statusFiltered.filter((t) => {
        const desc = (t.description ?? '').toLowerCase();
        const cust = t.customer
          ? `${t.customer.first_name} ${t.customer.last_name}`.toLowerCase()
          : '';
        return desc.includes(q) || cust.includes(q);
      })
    : statusFiltered;

  const createTask = useMutation({
    mutationFn: async () => {
      if (!createDescription.trim()) throw new Error('Description is required.');
      if (!createCustomerId) throw new Error('Customer is required.');
      const customerId = Number(createCustomerId);
      const payload = {
        description: createDescription.trim(),
        contact_customer_id: customerId,
        billing_customer_id: customerId,
        status: 'CREATED',
        ...(user?.employee?.id && { created_by_id: user.employee.id }),
        ...(createPriority && { priority: createPriority }),
        ...(createLocation.trim() && { location_address: createLocation.trim() }),
        ...(createNotes.trim() && { notes: createNotes.trim() }),
      };
      const { data, error } = await query.order('created_at', { ascending: false });
if (error) {
  console.log(error);
  throw error;
}

    },
    onSuccess: () => {
      setCreateOpen(false);
      setCreateDescription('');
      setCreateCustomerId('');
      setCreatePriority('normal');
      setCreateLocation('');
      setCreateNotes('');
      setCreateError('');
      setSuccessMessage('Task created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-task-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tasks'] });
    },
    onError: (err) => {
      setCreateError(err.message ?? 'Failed to create task.');
    },
  });

  const openInvoiceModal = (task) => {
    setInvoiceTask(task);
    setInvoiceAmount('');
    setInvoiceNote('');
    setInvoiceError('');
  };

  const closeInvoiceModal = () => {
    setInvoiceTask(null);
    setInvoiceAmount('');
    setInvoiceNote('');
    setInvoiceError('');
  };

  const openAssignModal = (task) => {
    setAssignTask(task);
    setAssignEmployeeId('');
    setAssignError('');
  };

  const closeAssignModal = () => {
    setAssignTask(null);
    setAssignEmployeeId('');
    setAssignError('');
  };

  const assignTaskMutation = useMutation({
    mutationFn: async () => {
      if (!assignTask?.id || !assignEmployeeId) throw new Error('Select an employee.');
      const { error } = await supabase
        .from('task')
        .update({ employee_id: Number(assignEmployeeId), status: 'ASSIGNED' })
        .eq('id', assignTask.id);
      if (error) throw error;
    },
    onSuccess: () => {
      closeAssignModal();
      setSuccessMessage('Task assigned successfully! The employee can now see this task.');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-task-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tasks'] });
    },
    onError: (err) => {
      setAssignError(err.message ?? 'Failed to assign task.');
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: async () => {
      if (!completeTask?.id || !completeDescription.trim()) {
        throw new Error('Work description is required.');
      }
      if (!completeHours || completeHours === '') {
        throw new Error('Hours worked is required.');
      }
      if (!completeMaterials?.trim()) {
        throw new Error('Materials used is required.');
      }
      const taskId = completeTask.id;
      const payload = {
        task_id: taskId,
        description: completeDescription.trim(),
        hours_worked: Number(completeHours) || 0,
        materials_used: completeMaterials.trim(),
      };
      const { error: insertError } = await supabase.from('report').insert(payload);
      if (insertError) throw insertError;
      const { error: updateError } = await supabase
        .from('task')
        .update({ status: 'COMPLETED', completed_at: new Date().toISOString() })
        .eq('id', taskId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setCompleteTask(null);
      setCompleteDescription('');
      setCompleteHours('');
      setCompleteMaterials('');
      setCompleteError('');
      setSuccessMessage('Task completed! Report submitted. Awaiting manager approval.');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-task-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['my-assigned-tasks'] });
    },
    onError: (err) => {
      setCompleteError(err.message ?? 'Failed to complete task.');
    },
  });

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!invoiceTask?.id) throw new Error('No task selected.');
      const amount = Number(invoiceAmount);
      if (Number.isNaN(amount) || amount < 0) throw new Error('Valid amount (CHF) is required.');
      const taskId = invoiceTask.id;
      const { error: insertError } = await supabase.from('invoice').insert({
        task_id: taskId,
        amount,
        ...(invoiceNote.trim() && { invoice_notes: invoiceNote.trim() }),
      });
      if (insertError) throw insertError;
      const taskUpdate = {
        status: 'INVOICED',
        ...(invoiceTask.approved_at == null && { approved_at: new Date().toISOString() }),
        ...(invoiceTask.completed_at == null && { completed_at: new Date().toISOString() }),
      };
      const { error: updateError } = await supabase.from('task').update(taskUpdate).eq('id', taskId);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      closeInvoiceModal();
      setSuccessMessage('Invoice created successfully! Task is now invoiced.');
      setTimeout(() => setSuccessMessage(''), 3000);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-task-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-recent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      setInvoiceError(err.message ?? 'Failed to create invoice.');
    },
  });

  const submitInvoice = (e) => {
    e.preventDefault();
    setInvoiceError('');
    createInvoice.mutate();
  };

  const filters = ['all', 'CREATED', 'ASSIGNED', 'COMPLETED', 'APPROVED', 'INVOICED'];
  const currentUserId = user?.employee?.id != null ? Number(user.employee.id) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{role === 'WORKER' ? t('myTasks') : t('tasksPage')}</h1>
          <p className="page-subtitle">{t('tasksSubtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-compact secondary"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
              refetch();
            }}
            title="Reload tasks"
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
          {role === 'ADMIN' && (
            <button
              type="button"
              className="btn-compact primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus style={{ width: 14, height: 14 }} />
              {t('createTask')}
            </button>
          )}
        </div>
      </div>

      <div className="explorer-filters" style={{ marginBottom: '1rem' }}>
        <input
          ref={searchInputRef}
          type="search"
          className="explorer-search"
          placeholder={t('searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search tasks"
        />
      </div>

      {successMessage && (
        <div className="form-success" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.375rem' }}>
          {successMessage}
        </div>
      )}

      <div className="filter-row">
        {filters.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={statusFilter === status ? 'btn-compact primary' : 'btn-compact secondary'}
          >
            {status === 'all' ? 'All' : statusShortLabel(status)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : isError ? (
        <div className="table-wrap" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Failed to load tasks. Please try again.</p>
          <button
            type="button"
            className="btn-compact primary"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
                <th>Status</th>
                <th>Description</th>
                <th>Customer</th>
                <th>Worker</th>
                <th>Priority</th>
                <th className="cell-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(tasks?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    {role === 'WORKER' 
                      ? 'No tasks are currently assigned to you. Tasks will appear here once they are assigned by a manager or administrator.'
                      : 'No tasks found in the system. Create a new task to get started.'}
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    No tasks match the current filter or search. Try adjusting your filters or search terms.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="cell-status">
                      <span className={`status-badge ${statusClass(task.status)}`} title={statusLabel(task.status)}>
                        {statusShortLabel(task.status)}
                      </span>
                    </td>
                    <td>{task.description ?? '—'}</td>
                    <td>
                      {task.customer
                        ? `${task.customer.first_name} ${task.customer.last_name}`
                        : '—'}
                    </td>
                    <td>
                      {task.employee
                        ? `${task.employee.first_name} ${task.employee.last_name}`
                        : 'Unassigned'}
                    </td>
                    <td>{task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Normal'}</td>
                    <td className="cell-actions">
                      {canAssign(role) && task.status === 'CREATED' && (
                        <button
                          type="button"
                          className="btn-compact secondary"
                          onClick={() => openAssignModal(task)}
                        >
                          {t('assign')}
                        </button>
                      )}
                      {canComplete(role, task, currentUserId) && (
                        <button
                          type="button"
                          className="btn-compact secondary"
                          onClick={() => {
                            setCompleteTask(task);
                            setCompleteDescription('');
                            setCompleteHours('');
                            setCompleteMaterials('');
                            setCompleteError('');
                          }}
                        >
                          {t('complete')}
                        </button>
                      )}
                      {canInvoice(role, task) && (
                        <button
                          type="button"
                          className="btn-compact primary"
                          onClick={() => openInvoiceModal(task)}
                        >
                          {t('invoice')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)} role="presentation">
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
          >
            <h3 id="create-task-title">{t('createTask')}</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTask.mutate();
              }}
            >
              <div className="field">
                <label htmlFor="create-description">Description (required)</label>
                <input
                  id="create-description"
                  type="text"
                  className="form-input"
                  placeholder="Task description"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="create-customer">Customer</label>
                <select
                  id="create-customer"
                  className="explorer-select"
                  value={createCustomerId}
                  onChange={(e) => setCreateCustomerId(e.target.value)}
                  required
                >
                  <option value="">Select customer</option>
                  {customers?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="create-priority">Priority</label>
                <select
                  id="create-priority"
                  className="explorer-select"
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="create-location">Location</label>
                <input
                  id="create-location"
                  type="text"
                  className="form-input"
                  placeholder="Address or location"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="create-notes">Notes</label>
                <input
                  id="create-notes"
                  type="text"
                  className="form-input"
                  placeholder="Optional notes"
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                />
              </div>
              {createError && <p className="form-error">{createError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-compact secondary" onClick={() => setCreateOpen(false)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-compact primary" disabled={createTask.isPending}>
                  {createTask.isPending ? '…' : t('createTask')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignTask && (
        <div className="modal-overlay" onClick={closeAssignModal} role="presentation">
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-task-title"
          >
            <h3 id="assign-task-title">{t('assign')}</h3>
            <p className="modal-task-desc">{assignTask.description ?? '—'}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignTaskMutation.mutate();
              }}
            >
              <div className="field">
                <label htmlFor="assign-employee">Employee (required)</label>
                <select
                  id="assign-employee"
                  className="explorer-select"
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                  required
                >
                  <option value="">Select employee</option>
                  {employees?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
              {assignError && <p className="form-error">{assignError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-compact secondary" onClick={closeAssignModal}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-compact primary" disabled={assignTaskMutation.isPending}>
                  {assignTaskMutation.isPending ? '…' : t('assign')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {completeTask && (
        <div className="modal-overlay" onClick={() => setCompleteTask(null)} role="presentation">
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-task-title"
          >
            <h3 id="complete-task-title">{t('complete')} Task</h3>
            <p className="modal-task-desc">{completeTask.description ?? '—'}</p>
            <p style={{ fontSize: '0.875rem', color: '#a0aec0', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              Submit a report describing the work performed to complete this task.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                completeTaskMutation.mutate();
              }}
            >
              <div className="field">
                <label htmlFor="complete-description">Work Description (required)</label>
                <textarea
                  id="complete-description"
                  className="form-input"
                  placeholder="Describe the work performed..."
                  value={completeDescription}
                  onChange={(e) => setCompleteDescription(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className="field">
                <label htmlFor="complete-hours">Hours Worked (required)</label>
                <input
                  id="complete-hours"
                  type="number"
                  min="0"
                  step="0.25"
                  className="form-input"
                  placeholder="0.00"
                  value={completeHours}
                  onChange={(e) => setCompleteHours(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="complete-materials">Materials Used (required)</label>
                <input
                  id="complete-materials"
                  type="text"
                  className="form-input"
                  placeholder="List materials used"
                  value={completeMaterials}
                  onChange={(e) => setCompleteMaterials(e.target.value)}
                  required
                />
              </div>
              {completeError && <p className="form-error">{completeError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-compact secondary" onClick={() => setCompleteTask(null)}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-compact primary" disabled={completeTaskMutation.isPending}>
                  {completeTaskMutation.isPending ? '…' : t('complete')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceTask && (
        <div className="modal-overlay" onClick={closeInvoiceModal} role="presentation">
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-modal-title"
          >
            <h3 id="invoice-modal-title">{t('createInvoice')}</h3>
            <p className="modal-task-desc">
              Task: {invoiceTask.description}
            </p>
            <p className="modal-task-desc" style={{ fontSize: '0.75rem', marginTop: '-0.5rem' }}>
              PDF export coming later.
            </p>
            <form onSubmit={submitInvoice}>
              <div className="field">
                <label htmlFor="invoice-amount">Amount (CHF) (required)</label>
                <input
                  id="invoice-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={invoiceAmount}
                  onChange={(e) => setInvoiceAmount(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="invoice-note">Note (optional)</label>
                <input
                  id="invoice-note"
                  type="text"
                  placeholder="Optional note"
                  value={invoiceNote}
                  onChange={(e) => setInvoiceNote(e.target.value)}
                />
              </div>
              {invoiceError && <p className="form-error">{invoiceError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-compact secondary" onClick={closeInvoiceModal}>
                  {t('cancel')}
                </button>
                <button type="submit" className="btn-compact primary" disabled={createInvoice.isPending}>
                  {createInvoice.isPending ? '…' : t('createInvoice')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
