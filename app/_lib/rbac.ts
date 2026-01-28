import { JWTPayload } from './auth';

/**
 * Role-based permission definitions
 */
const PERMISSIONS: Record<string, string[]> = {
  'ADMIN': [
    'create_survey',
    'edit_survey',
    'delete_survey',
    'view_all_surveys',
    'view_all_responses',
    'manage_users',
    'manage_roles',
    'export_data',
    'view_audit_logs',
    'create_tasks',
    'manage_tasks',
    'access_analytics',
    'access_dashboard',
    'configure_system',
  ],
  'CONSULTANT': [
    'create_survey',
    'edit_survey',
    'view_survey',
    'view_responses',
    'export_data',
    'view_department_data',
    'create_tasks',
    'manage_own_tasks',
    'access_analytics',
    'access_dashboard',
  ],
  'HR': [
    'create_survey',
    'edit_survey',
    'view_survey',
    'view_responses',
    'export_data',
    'view_department_data',
    'create_tasks',
    'manage_own_tasks',
    'access_analytics',
    'access_dashboard',
  ],
  'EMPLOYEE': [
    'view_survey',
    'submit_response',
    'view_own_data',
    'view_own_tasks',
    'complete_task',
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: string, permission: string): boolean {
  return PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userRole: string, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(userRole, p));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(userRole: string, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(userRole, p));
}

/**
 * Response formatter for API errors with role-based visibility
 */
export function formatApiResponse<T>(
  success: boolean,
  data: T | null = null,
  error: string | null = null,
  metadata?: Record<string, any>
) {
  return {
    success,
    data,
    error,
    ...(metadata && { metadata }),
  };
}

/**
 * Check if user can access resource based on role and department
 */
export function canAccessResource(
  userRole: string,
  userDepartment: string | undefined,
  resourceDepartment: string | null,
  resourceUserId?: string,
  currentUserId?: string
): boolean {
  // Admin can access everything
  if (userRole === 'ADMIN') return true;

  // Employee can only access their own data
  if (userRole === 'EMPLOYEE') {
    return currentUserId === resourceUserId;
  }

  // HR (legacy consultant) can access their department or if assigned
  if (userRole === 'CONSULTANT' || userRole === 'HR') {
    if (currentUserId === resourceUserId) return true;
    if (!resourceDepartment) return true; // Organization-wide resource
    return userDepartment === resourceDepartment;
  }

  return false;
}

/**
 * Extract and validate user claims from JWT payload
 */
export function validateUserContext(payload: JWTPayload | null) {
  if (!payload || !payload.userId) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: (payload.role as string) || 'EMPLOYEE',
    department: payload.department,
  };
}
