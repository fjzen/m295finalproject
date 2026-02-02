/**
 * Simple EN/DE dictionary for sidebar, page titles, primary buttons.
 * Missing keys fall back to EN.
 */
export const translations = {
  en: {
    // Sidebar
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    myTasks: 'My Tasks',
    customers: 'Customers',
    employees: 'Employees',
    reports: 'Reports',
    invoices: 'Invoices',
    overview: 'Overview',
    work: 'Work',
    data: 'Data',
    finance: 'Finance',
    // Page titles
    service: 'Service',
    tasksPage: 'Tasks',
    tasksSubtitle: 'Manage service tasks',
    dashboardPage: 'Dashboard',
    customersPage: 'Customers',
    employeesPage: 'Employees',
    reportsPage: 'Reports',
    reportsSubtitle: 'View and manage work reports',
    invoicesPage: 'Invoices',
    // Buttons
    createTask: 'Create Task',
    createInvoice: 'Create invoice',
    backToLogin: 'Back to login',
    logout: 'Logout',
    cancel: 'Cancel',
    searchPlaceholder: 'Search by description or customer…',
    filterRole: 'Filter Role ▼',
    addEmployee: 'Add Employee',
    back: 'Back',
    submitReport: 'Submit report',
    approve: 'Approve',
    reject: 'Reject',
    assign: 'Assign',
    complete: 'Complete',
    invoice: 'Invoice',
    // Shortcuts
    shortcutHelp: 'Keyboard shortcuts',
    shortcutCloseModal: 'Close modal',
    shortcutFocusSearch: 'Focus search (Tasks)',
    shortcutCreateTask: 'Create task (ADMIN)',
    shortcutHelpKey: 'Show this help',
    markAsPaid: 'Mark as Paid',
    paid: 'Paid',
    unpaid: 'Unpaid',
  },
  de: {
    dashboard: 'Dashboard',
    tasks: 'Aufgaben',
    myTasks: 'Meine Aufgaben',
    customers: 'Kunden',
    employees: 'Mitarbeiter',
    reports: 'Berichte',
    invoices: 'Rechnungen',
    overview: 'Übersicht',
    work: 'Arbeit',
    data: 'Daten',
    finance: 'Finanzen',
    service: 'Service',
    tasksPage: 'Aufgaben',
    tasksSubtitle: 'Aufträge verwalten',
    dashboardPage: 'Dashboard',
    customersPage: 'Kunden',
    employeesPage: 'Mitarbeiter',
    reportsPage: 'Berichte',
    reportsSubtitle: 'Berichte anzeigen und verwalten',
    invoicesPage: 'Rechnungen',
    createTask: 'Auftrag erstellen',
    createInvoice: 'Rechnung erstellen',
    backToLogin: 'Zurück zum Login',
    logout: 'Abmelden',
    cancel: 'Abbrechen',
    searchPlaceholder: 'Suche nach Beschreibung oder Kunde…',
    filterRole: 'Rolle filtern ▼',
    addEmployee: 'Mitarbeiter hinzufügen',
    back: 'Zurück',
    submitReport: 'Bericht absenden',
    approve: 'Genehmigen',
    reject: 'Ablehnen',
    assign: 'Zuweisen',
    complete: 'Abschliessen',
    invoice: 'Rechnung',
    shortcutHelp: 'Tastenkürzel',
    shortcutCloseModal: 'Modal schliessen',
    shortcutFocusSearch: 'Suche fokussieren (Aufgaben)',
    shortcutCreateTask: 'Auftrag erstellen (ADMIN)',
    shortcutHelpKey: 'Diese Hilfe anzeigen',
    markAsPaid: 'Als bezahlt markieren',
    paid: 'Bezahlt',
    unpaid: 'Unbezahlt',
  },
};

const STORAGE_KEY = 'lang';
const DEFAULT_LANG = 'en';

export function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'de' ? 'de' : 'en';
  } catch {
    return DEFAULT_LANG;
  }
}

export function setStoredLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang === 'de' ? 'de' : 'en');
  } catch {
    // ignore
  }
}

export function t(lang, key) {
  const dict = translations[lang] ?? translations.en;
  return dict[key] ?? translations.en[key] ?? key;
}
