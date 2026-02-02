import { useCallback, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useKeybindListener, KEY } from '@/lib/keybinds';
import { useLanguage } from '@/hooks/useLanguage';

export default function AppLayout() {
  const [showHelp, setShowHelp] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleKey = useCallback((key) => {
    if (key === KEY.CLOSE_MODAL) {
      setShowHelp(false);
      window.dispatchEvent(new CustomEvent('keybind:close-modal'));
    } else if (key === KEY.FOCUS_SEARCH) {
      window.dispatchEvent(new CustomEvent('keybind:focus-search'));
    } else if (key === KEY.CREATE_TASK) {
      window.dispatchEvent(new CustomEvent('keybind:create-task'));
    } else if (key === KEY.NAV_DASHBOARD) {
      navigate('/dashboard');
    } else if (key === KEY.NAV_TASKS) {
      navigate('/tasks');
    } else if (key === KEY.NAV_REPORTS) {
      navigate('/reports');
    } else if (key === KEY.NAV_INVOICES) {
      navigate('/invoices');
    } else if (key === KEY.RELOAD) {
      window.dispatchEvent(new CustomEvent('keybind:reload'));
    } else if (key === KEY.HELP) {
      setShowHelp(true);
    }
  }, [navigate]);

  useKeybindListener(handleKey);

  return (
    <div className="app-layout bg-[#0a0e14]">
      <aside className="app-sidebar">
        <Sidebar />
      </aside>
      <div className="app-main-wrap">
        <Header />
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)} role="presentation">
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcut-help-title"
          >
            <h3 id="shortcut-help-title">{t('shortcutHelp')}</h3>
            <ul className="shortcut-list">
              <li><kbd>Esc</kbd> — {t('shortcutCloseModal')}</li>
              <li><kbd>Super</kbd> + <kbd>K</kbd> — {t('shortcutFocusSearch')}</li>
              <li><kbd>Super</kbd> + <kbd>N</kbd> — {t('shortcutCreateTask')}</li>
              <li><kbd>Super</kbd> + <kbd>D</kbd> — Navigate to Dashboard</li>
              <li><kbd>Super</kbd> + <kbd>T</kbd> — Navigate to Tasks</li>
              <li><kbd>Super</kbd> + <kbd>R</kbd> — Navigate to Reports</li>
              <li><kbd>Super</kbd> + <kbd>I</kbd> — Navigate to Invoices</li>
              <li><kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> — Reload current page data</li>
              <li><kbd>Super</kbd> + <kbd>?</kbd> — {t('shortcutHelpKey')}</li>
            </ul>
            <div className="modal-actions">
              <button type="button" className="btn-compact primary" onClick={() => setShowHelp(false)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

