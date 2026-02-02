import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

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

export default function Dashboard() {
  const { user, role } = useAuth();

  const { data: taskCount } = useQuery({
    queryKey: ['dashboard-task-count', role, user?.employee?.id],
    queryFn: async () => {
      let query = supabase.from('task').select('*', { count: 'exact', head: true });
      if (role === 'WORKER' && user?.employee?.id != null) {
        const eid = Number(user.employee.id);
        if (!Number.isNaN(eid)) query = query.eq('employee_id', eid);
      }
      const { count } = await query;
      return count ?? 0;
    },
  });

  const { data: employeeCount } = useQuery({
    queryKey: ['dashboard-employee-count'],
    queryFn: async () => {
      const { count } = await supabase.from('employee').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: customerCount } = useQuery({
    queryKey: ['dashboard-customer-count'],
    queryFn: async () => {
      const { count } = await supabase.from('customer').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: invoiceCount } = useQuery({
    queryKey: ['dashboard-invoice-count'],
    queryFn: async () => {
      const { count } = await supabase.from('invoice').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: recentTasks, isLoading: recentLoading } = useQuery({
    queryKey: ['dashboard-recent-tasks', role, user?.employee?.id],
    queryFn: async () => {
      let query = supabase
        .from('task')
        .select('id, description, status, created_at, customer:contact_customer_id(first_name, last_name), employee(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (role === 'WORKER' && user?.employee?.id != null) {
        const eid = Number(user.employee.id);
        if (!Number.isNaN(eid)) query = query.eq('employee_id', eid);
      }

      const { data } = await query;
      return data ?? [];
    },
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {user?.employee?.first_name ?? 'User'}
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <p className="dashboard-card-label">Total Tasks</p>
          <p className="dashboard-card-value">{taskCount ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-label">Employees</p>
          <p className="dashboard-card-value">{employeeCount ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-label">Customers</p>
          <p className="dashboard-card-value">{customerCount ?? 0}</p>
        </div>
        <div className="dashboard-card">
          <p className="dashboard-card-label">Invoices</p>
          <p className="dashboard-card-value">{invoiceCount ?? 0}</p>
        </div>
      </div>

      <div className="dashboard-recent">
        <h2>Recent Tasks</h2>
        {recentLoading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
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
                </tr>
              </thead>
              <tbody>
                {!recentTasks?.length ? (
                  <tr>
                    <td colSpan={4} className="table-empty">
                      No tasks yet.
                    </td>
                  </tr>
                ) : (
                  recentTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="cell-status">
                        <span className={`status-badge ${statusClass(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to="/tasks"
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          {task.description ?? '—'}
                        </Link>
                      </td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
