import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';

export default function CustomerForm({ customer, onClose, onSuccess }) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: customer || {
      first_name: '',
      last_name: '',
      address: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (customer) reset(customer);
  }, [customer, reset]);

  const onSubmit = async (data) => {
    try {
      if (customer) {
        await updateMutation.mutateAsync({ id: customer.id, ...data });
        onSuccess?.('Customer updated successfully');
      } else {
        await createMutation.mutateAsync(data);
        onSuccess?.('Customer created successfully');
      }
      onClose();
    } catch (error) {
      onSuccess?.(error.message, true);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-[hsl(217,32%,17%)] border border-[hsl(217,32%,25%)] p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 rounded border border-[hsl(217,32%,25%)] bg-[hsl(222,84%,5%)]"
                {...register('first_name', { required: 'First name is required' })}
              />
              {errors.first_name && (
                <p className="text-sm text-red-400 mt-1">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 rounded border border-[hsl(217,32%,25%)] bg-[hsl(222,84%,5%)]"
                {...register('last_name', { required: 'Last name is required' })}
              />
              {errors.last_name && (
                <p className="text-sm text-red-400 mt-1">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              className="w-full px-3 py-2 rounded border border-[hsl(217,32%,25%)] bg-[hsl(222,84%,5%)]"
              type="tel"
              placeholder="+41 44 123 45 67"
              {...register('phone')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full px-3 py-2 rounded border border-[hsl(217,32%,25%)] bg-[hsl(222,84%,5%)]"
              type="email"
              placeholder="customer@example.com"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              className="w-full px-3 py-2 rounded border border-[hsl(217,32%,25%)] bg-[hsl(222,84%,5%)] min-h-[80px]"
              placeholder="Hauptstrasse 123, 8330 Pfäffikon"
              {...register('address')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-[hsl(217,32%,25%)] hover:bg-[hsl(217,32%,22%)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded bg-[hsl(217,91%,60%)] text-[hsl(222,47%,11%)] font-medium disabled:opacity-60"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
