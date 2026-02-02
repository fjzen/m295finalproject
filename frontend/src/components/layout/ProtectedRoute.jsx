import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, role, hasLinkedEmployee, signOut } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e14]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasLinkedEmployee) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e14]">
        <div className="text-center max-w-md px-6">
          <p className="text-[#a0aec0] mb-4">
            No employee account linked. Contact your administrator.
          </p>
          <button
            type="button"
            onClick={() => signOut()}
            className="btn-compact primary"
          >
            {t('backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0e14]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-[#a0aec0]">You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}

