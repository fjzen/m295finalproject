/**
 * Centralized keyboard shortcuts. Hyprland-style.
 * Respects role restrictions (callers check role).
 */

import { useEffect } from 'react';

export const KEY = {
  CLOSE_MODAL: 'Escape',
  FOCUS_SEARCH: 'Super+K',
  CREATE_TASK: 'Super+N',
  NAV_DASHBOARD: 'Super+D',
  NAV_TASKS: 'Super+T',
  NAV_REPORTS: 'Super+R',
  NAV_INVOICES: 'Super+I',
  RELOAD: 'Super+Shift+R',
  HELP: 'Super+?',
};

function normalizeKey(e) {
  if (e.key === 'Escape') return 'Escape';
  // Use Meta (Super/Windows/Command) key, not Ctrl
  const meta = e.metaKey; // Only Meta/Super, not Ctrl
  if (meta && e.key?.toLowerCase() === 'k') return 'Super+K';
  if (meta && e.key?.toLowerCase() === 'n') return 'Super+N';
  if (meta && e.key?.toLowerCase() === 'd') return 'Super+D';
  if (meta && e.key?.toLowerCase() === 't') return 'Super+T';
  if (meta && e.key?.toLowerCase() === 'r' && !e.shiftKey) return 'Super+R';
  if (meta && e.key?.toLowerCase() === 'i') return 'Super+I';
  if (meta && e.shiftKey && e.key?.toLowerCase() === 'r') return 'Super+Shift+R';
  if (meta && e.key === '?') return 'Super+?';
  return null;
}

function isInputTarget(e) {
  const tag = e.target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || e.target?.getAttribute('contenteditable') === 'true';
}

/**
 * Register global keydown listener. Call from App/Layout.
 * callback(key) is called with normalized key. For Escape we always fire; for others we skip when focus is in input/textarea.
 */
export function useKeybindListener(callback) {
  useEffect(() => {
    const onKeyDown = (e) => {
      const key = normalizeKey(e);
      if (!key) return;
      if (key !== 'Escape' && isInputTarget(e)) return;
      e.preventDefault();
      callback(key);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [callback]);
}
