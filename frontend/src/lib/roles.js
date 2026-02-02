/**
 * Map backend employee_role (GL, ADMIN, BL, MA) to spec roles (ADMIN, MANAGER, WORKER).
 * Backend schema is unchanged; UI and permissions use spec roles only.
 */
const BACKEND_TO_SPEC = {
  GL: 'ADMIN',
  ADMIN: 'ADMIN',
  BL: 'MANAGER',
  MA: 'WORKER',
};

export function toSpecRole(backendRole) {
  if (!backendRole) return 'WORKER';
  return BACKEND_TO_SPEC[backendRole] ?? 'WORKER';
}

export const SPEC_ROLES = ['ADMIN', 'MANAGER', 'WORKER'];
