import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useNotifications } from '@/hooks/useNotifications';

const routeKeys = {
  dashboard: { labelKey: 'dashboardPage', descKey: null },
  tasks: { labelKey: 'tasksPage', descKey: 'tasksSubtitle' },
  customers: { labelKey: 'customersPage', descKey: null },
  employees: { labelKey: 'employeesPage', descKey: null },
  reports: { labelKey: 'reportsPage', descKey: null },
  invoices: { labelKey: 'invoicesPage', descKey: null },
};

function getBreadcrumb(pathname, t) {
  const base = t('service');
  const segment = pathname.split('/').filter(Boolean)[0] || 'dashboard';
  const meta = routeKeys[segment];
  const current = meta ? t(meta.labelKey) : segment.charAt(0).toUpperCase() + segment.slice(1);
  const description = meta?.descKey ? t(meta.descKey) : null;
  return { segments: [base, current], description };
}

export default function Header() {
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { segments, description } = getBreadcrumb(location.pathname, t);
  const { unreadNotifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    navigate(notification.link);
    setShowNotifications(false);
  };

  const first = (user?.employee?.first_name ?? '')[0] || '?';
  const last = (user?.employee?.last_name ?? '')[0] || '?';
  const initials = user?.employee ? `${first}${last}` : 'U';

  return (
    <header className="header-bar">
      <div>
        <nav className="header-breadcrumb" aria-label="Breadcrumb">
          {segments.map((seg, i) => (
            <span key={i}>
              {i > 0 && <span className="header-breadcrumb-sep"> / </span>}
              <span className={i === segments.length - 1 ? 'header-breadcrumb-current' : ''}>
                {seg}
              </span>
            </span>
          ))}
        </nav>
        {description && (
          <p className="header-description">{description}</p>
        )}
      </div>

      <div className="header-actions">
        <div className="header-lang-switcher" role="group" aria-label="Language">
          <button
            type="button"
            className={`header-lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
          <button
            type="button"
            className={`header-lang-btn ${lang === 'de' ? 'active' : ''}`}
            onClick={() => setLang('de')}
            aria-pressed={lang === 'de'}
          >
            DE
          </button>
        </div>
        <div ref={notificationRef} style={{ position: 'relative' }}>
          <button 
            type="button" 
            className="header-btn-icon" 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} aria-hidden />
            {unreadCount > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0.5rem',
                backgroundColor: '#1a1f2e',
                border: '1px solid #2d3748',
                borderRadius: '0.5rem',
                minWidth: '320px',
                maxWidth: '400px',
                maxHeight: '500px',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
              }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid #2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600 }}>Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              {unreadNotifications.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#a0aec0' }}>
                  No new notifications
                </div>
              ) : (
                <div>
                  {unreadNotifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid #2d3748',
                        cursor: 'pointer',
                        color: 'inherit',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2d3748'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{notif.title}</div>
                      <div style={{ fontSize: '0.875rem', color: '#a0aec0' }}>{notif.message}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="header-user-wrap">
          <div className="header-user-avatar">{initials}</div>
          <button
            type="button"
            onClick={signOut}
            className="header-btn-logout"
          >
            <LogOut size={16} aria-hidden />
            {t('logout')}
          </button>
        </div>
      </div>
    </header>
  );
}
