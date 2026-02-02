import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

/**
 * Derives notifications based on role and current data state.
 * Notifications are not stored in the database; they are computed from existing data.
 */
export function useNotifications() {
  const { role, user } = useAuth();
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(`notifications-read-${user?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user?.id) {
      try {
        const stored = localStorage.getItem(`notifications-read-${user?.id}`);
        setReadNotifications(stored ? JSON.parse(stored) : []);
      } catch {
        setReadNotifications([]);
      }
    }
  }, [user?.id]);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', role, user?.employee?.id],
    queryFn: async () => {
      const notifs = [];

      if (role === 'WORKER' && user?.employee?.id != null) {
        const eid = Number(user.employee.id);
        if (!Number.isNaN(eid)) {
          // New ASSIGNED tasks for this employee
          const { data: assignedTasks } = await supabase
            .from('task')
            .select('id, description, created_at')
            .eq('employee_id', eid)
            .eq('status', 'ASSIGNED')
            .order('created_at', { ascending: false })
            .limit(10);

          if (assignedTasks) {
            assignedTasks.forEach((task) => {
              notifs.push({
                id: `task-assigned-${task.id}`,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `Task: ${task.description ?? `Task #${task.id}`}`,
                link: '/tasks',
                timestamp: task.created_at,
              });
            });
          }
        }
      }

      if (role === 'MANAGER') {
        // Tasks completed and awaiting approval
        const { data: completedTasks } = await supabase
          .from('task')
          .select('id, description, completed_at')
          .eq('status', 'COMPLETED')
          .order('completed_at', { ascending: false })
          .limit(10);

        if (completedTasks) {
          completedTasks.forEach((task) => {
            notifs.push({
              id: `task-completed-${task.id}`,
              type: 'task_completed',
              title: 'Task Completed',
              message: `Task "${task.description ?? `Task #${task.id}`}" is awaiting approval`,
              link: '/reports',
              timestamp: task.completed_at,
            });
          });
        }

        // Unassigned tasks
        const { data: unassignedTasks } = await supabase
          .from('task')
          .select('id, description, created_at')
          .is('employee_id', null)
          .eq('status', 'CREATED')
          .order('created_at', { ascending: false })
          .limit(5);

        if (unassignedTasks) {
          unassignedTasks.forEach((task) => {
            notifs.push({
              id: `task-unassigned-${task.id}`,
              type: 'task_unassigned',
              title: 'Unassigned Task',
              message: `Task "${task.description ?? `Task #${task.id}`}" needs to be assigned`,
              link: '/tasks',
              timestamp: task.created_at,
            });
          });
        }
      }

      if (role === 'ADMIN') {
        // Tasks approved and ready for invoicing
        const { data: approvedTasks } = await supabase
          .from('task')
          .select('id, description, approved_at')
          .eq('status', 'APPROVED')
          .order('approved_at', { ascending: false })
          .limit(10);

        if (approvedTasks) {
          approvedTasks.forEach((task) => {
            notifs.push({
              id: `task-approved-${task.id}`,
              type: 'task_approved',
              title: 'Task Approved',
              message: `Task "${task.description ?? `Task #${task.id}`}" is ready for invoicing`,
              link: '/tasks',
              timestamp: task.approved_at,
            });
          });
        }
      }

      return notifs.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const unreadNotifications = notifications.filter(
    (notif) => !readNotifications.includes(notif.id)
  );

  const markAsRead = (notificationId) => {
    const newRead = [...readNotifications, notificationId];
    setReadNotifications(newRead);
    if (user?.id) {
      try {
        localStorage.setItem(`notifications-read-${user?.id}`, JSON.stringify(newRead));
      } catch {
        // ignore
      }
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifications(allIds);
    if (user?.id) {
      try {
        localStorage.setItem(`notifications-read-${user?.id}`, JSON.stringify(allIds));
      } catch {
        // ignore
      }
    }
  };

  return {
    notifications,
    unreadNotifications,
    unreadCount: unreadNotifications.length,
    markAsRead,
    markAllAsRead,
  };
}
