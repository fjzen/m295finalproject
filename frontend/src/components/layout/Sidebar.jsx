import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  UserCog,
  FileText,
  Receipt,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';

/** Spec roles only: ADMIN, MANAGER, WORKER. Visibility per project spec. */
const navSections = [
  { titleKey: 'overview', items: [{ nameKey: 'dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'WORKER'] }] },
  { titleKey: 'work', items: [{ nameKey: 'tasks', myTasksKey: 'myTasks', href: '/tasks', icon: CheckSquare, roles: ['ADMIN', 'MANAGER', 'WORKER'] }] },
  { titleKey: 'data', items: [
    { nameKey: 'customers', href: '/customers', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { nameKey: 'employees', href: '/employees', icon: UserCog, roles: ['ADMIN', 'MANAGER'] },
  ]},
  { titleKey: 'finance', items: [
    { nameKey: 'reports', href: '/reports', icon: FileText, roles: ['ADMIN', 'MANAGER', 'WORKER'] },
    { nameKey: 'invoices', href: '/invoices', icon: Receipt, roles: ['ADMIN'] },
  ]},
];

export default function Sidebar() {
  const { role, user } = useAuth();
  const { t } = useLanguage();
  const effectiveRole = role || 'WORKER';

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h2 className="sidebar-brand-title">{t('service')}</h2>
        <p className="sidebar-brand-sub">Glauser AG</p>
      </div>

      <nav className="sidebar-nav">
        {navSections.map((section) => {
          const filteredItems = section.items.filter((item) =>
            item.roles.includes(effectiveRole)
          );
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.titleKey} className="sidebar-nav-section">
              <div className="sidebar-nav-section-title">{t(section.titleKey)}</div>
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const label = item.myTasksKey && effectiveRole === 'WORKER' ? t(item.myTasksKey) : t(item.nameKey);
                return (
                  <NavLink
                    key={item.nameKey}
                    to={item.href}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`.trim()
                    }
                  >
                    <Icon className="sidebar-link-icon" aria-hidden />
                    {label}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-footer-name">
          {user?.employee
            ? `${user.employee.first_name ?? ''} ${user.employee.last_name ?? ''}`.trim() || 'User'
            : 'User'}
        </p>
        <p className="sidebar-footer-role">{effectiveRole}</p>
      </div>
    </div>
  );
}
