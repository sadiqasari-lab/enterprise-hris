"use strict";
/**
 * RBAC Utilities
 * Role-Based Access Control helpers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RBACService = void 0;
class RBACService {
    /**
     * Check if user has permission for a specific action
     */
    hasPermission(userPermissions, resource, action, scope) {
        return userPermissions.permissions.some((permission) => permission.resource === resource &&
            permission.action === action &&
            (!scope || this.isScopeSufficient(permission.scope, scope)));
    }
    /**
     * Check if permission scope is sufficient
     */
    isScopeSufficient(permissionScope, requiredScope) {
        const scopeHierarchy = ['own', 'department', 'company', 'all'];
        const permissionLevel = scopeHierarchy.indexOf(permissionScope);
        const requiredLevel = scopeHierarchy.indexOf(requiredScope);
        return permissionLevel >= requiredLevel;
    }
    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(userPermissions, roles) {
        return roles.some((role) => userPermissions.roles.includes(role));
    }
    /**
     * Check if user has all of the specified roles
     */
    hasAllRoles(userPermissions, roles) {
        return roles.every((role) => userPermissions.roles.includes(role));
    }
    /**
     * Check if user is Super Admin
     */
    isSuperAdmin(userPermissions) {
        return userPermissions.roles.includes('SUPER_ADMIN');
    }
    /**
     * Check if user is HR Admin
     */
    isHRAdmin(userPermissions) {
        return userPermissions.roles.includes('HR_ADMIN');
    }
    /**
     * Check if user is GM
     */
    isGM(userPermissions) {
        return userPermissions.roles.includes('GM');
    }
    /**
     * Check if user is Manager
     */
    isManager(userPermissions) {
        return userPermissions.roles.includes('MANAGER');
    }
    /**
     * Filter permissions by resource
     */
    getPermissionsForResource(userPermissions, resource) {
        return userPermissions.permissions.filter((permission) => permission.resource === resource);
    }
}
exports.RBACService = RBACService;
