import { useState } from 'react';
import { Plus, Search, Edit } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import CustomerForm from '@/components/customers/CustomerForm';

export default function Customers() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ message: '', error: false });

  const { data: customers, isLoading, error } = useCustomers();

  const filteredCustomers =
    customers?.filter(
      (c) =>
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    ) ?? [];

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const handleSuccess = (message, isError = false) => {
    setToast({ message, error: isError });
    setTimeout(() => setToast({ message: '', error: false }), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-red-400 font-medium">Error loading customers</p>
          <p className="text-sm text-[#a0aec0] mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Customers</h1>
          <p className="text-[#a0aec0]">Manage your customer database</p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="btn-compact primary"
        >
          <Plus style={{ width: 14, height: 14 }} />
          Add Customer
        </button>
      </div>

      {toast.message && (
        <div
          className={`rounded-lg p-3 ${
            toast.error ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="bg-[#1a1f2e] border border-[#2d3748] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2d3748]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#718096]" />
            <input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#2d3748] bg-[#0a0e14] text-white placeholder-[#718096]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d3748]">
                <th className="text-left py-3 px-4 font-medium text-[#a0aec0]">Name</th>
                <th className="text-left py-3 px-4 font-medium text-[#a0aec0]">Phone</th>
                <th className="text-left py-3 px-4 font-medium text-[#a0aec0]">Email</th>
                <th className="text-left py-3 px-4 font-medium text-[#a0aec0]">Address</th>
                <th className="text-right py-3 px-4 font-medium text-[#a0aec0]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#a0aec0]">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-[#2d3748] hover:bg-[#252d3d] transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-white">
                      {customer.first_name} {customer.last_name}
                    </td>
                    <td className="py-3 px-4 text-[#a0aec0]">{customer.phone}</td>
                    <td className="py-3 px-4 text-[#a0aec0]">{customer.email}</td>
                    <td className="py-3 px-4 text-[#a0aec0]">{customer.address}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleEdit(customer)}
                        className="p-2 rounded-lg hover:bg-[#252d3d] text-[#a0aec0] hover:text-white transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <CustomerForm
          customer={editingCustomer}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
