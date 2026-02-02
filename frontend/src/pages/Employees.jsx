import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Plus, ArrowLeft } from 'lucide-react';
import { toSpecRole } from '@/lib/roles';

export default function Employees() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await supabase
        .from('employee')
        .select('*')
        .order('last_name');
      return data ?? [];
    },
  });

  const filtered =
    employees?.filter((emp) => {
      const specRole = toSpecRole(emp.role);
      const name = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.toLowerCase();
      const matchSearch = !search.trim() || name.includes(search.trim().toLowerCase());
      const matchRole = roleFilter === 'all' || specRole === roleFilter;
      return matchSearch && matchRole;
    }) ?? [];

  return (
    <div>
      <div className="explorer-toolbar">
        <Link to="/dashboard" className="explorer-back" aria-label="Back to dashboard">
          <ArrowLeft size={18} aria-hidden />
          Back
        </Link>
        <button type="button" className="btn-compact primary">
          <Plus style={{ width: 14, height: 14 }} />
          Add Employee
        </button>
      </div>

      <div className="explorer-title-row">
        <h1 className="page-title">Employees</h1>
      </div>

      <div className="explorer-filters">
        <input
          type="search"
          className="explorer-search"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search employees"
        />
        <select
          className="explorer-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by role"
        >
          <option value="all">Filter Role ▼</option>
          <option value="ADMIN">ADMIN</option>
          <option value="MANAGER">MANAGER</option>
          <option value="WORKER">WORKER</option>
        </select>
      </div>

      {isLoading ? (
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="task-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Salary (CHF)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    No employees match the filter.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td>{toSpecRole(emp.role)}</td>
                    <td>
                      {emp.salary != null
                        ? Number(emp.salary).toLocaleString()
                        : '—'}
                    </td>
                    <td>Active</td>
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
