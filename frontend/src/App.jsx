import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/hooks/useLanguage';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Customers from '@/pages/Customers';
import Employees from '@/pages/Employees';
import Tasks from '@/pages/Tasks';
import Reports from '@/pages/Reports';
import Invoices from '@/pages/Invoices';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="tasks" element={<Tasks />} />
              <Route
                path="customers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="employees"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                    <Employees />
                  </ProtectedRoute>
                }
              />
              <Route path="reports" element={<Reports />} />
              <Route
                path="invoices"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
            </Route>
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
