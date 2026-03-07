/**
 * RBAC Utilities
 * Role-Based Access Control helpers
 */

export interface Permission {
  resource: string;
  action: string;
  scope: 'own' | 'department' | 'company' | 'all';
}

export interface UserPermissions {
  userId: string;
  companyId: string;
  roles: string[];
  permissions: Permission[];
}

export class RBACService {
  /**
   * Check if user has permission for a specific action
   */
  hasPermission(
    userPermissions: UserPermissions,
    resource: string,
    action: string,
    scope?: 'own' | 'department' | 'company' | 'all'
  ): boolean {
    return userPermissions.permissions.some(
      (permission) =>
        permission.resource === resource &&
        permission.action === action &&
        (!scope || this.isScopeSufficient(permission.scope, scope))
    );
  }

  /**
   * Check if permission scope is sufficient
   */
  private isScopeSufficient(
    permissionScope: string,
    requiredScope: string
  ): boolean {
    const scopeHierarchy = ['own', 'department', 'company', 'all'];
    const permissionLevel = scopeHierarchy.indexOf(permissionScope);
    const requiredLevel = scopeHierarchy.indexOf(requiredScope);

    return permissionLevel >= requiredLevel;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(userPermissions: UserPermissions, roles: string[]): boolean {
    return roles.some((role) => userPermissions.roles.includes(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(userPermissions: UserPermissions, roles: string[]): boolean {
    return roles.every((role) => userPermissions.roles.includes(role));
  }

  /**
   * Check if user is Super Admin
   */
  isSuperAdmin(userPermissions: UserPermissions): boolean {
    return userPermissions.roles.includes('SUPER_ADMIN');
  }

  /**
   * Check if user is HR Admin
   */
  isHRAdmin(userPermissions: UserPermissions): boolean {
    return userPermissions.roles.includes('HR_ADMIN');
  }

  /**
   * Check if user is GM
   */
  isGM(userPermissions: UserPermissions): boolean {
    return userPermissions.roles.includes('GM');
  }

  /**
   * Check if user is Manager
   */
  isManager(userPermissions: UserPermissions): boolean {
    return userPermissions.roles.includes('MANAGER');
  }

  /**
   * Filter permissions by resource
   */
  getPermissionsForResource(
    userPermissions: UserPermissions,
    resource: string
  ): Permission[] {
    return userPermissions.permissions.filter(
      (permission) => permission.resource === resource
    );
  }
}
