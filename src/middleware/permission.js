import AppError from '../utils/AppError.js';
import { ROLES } from '../constants/roles.js';

// Restricts a route to one or more roles. Must run after auth().
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401, 'NO_TOKEN'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are not allowed to perform this action', 403, 'ROLE_NOT_ALLOWED'));
    }
    next();
  };
}

// Restricts a route to employees holding a specific permission. Admin always
// bypasses this check. Must run after auth().
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401, 'NO_TOKEN'));
    if (req.user.role === ROLES.ADMIN) return next();
    if (req.user.role !== ROLES.EMPLOYEE) {
      return next(new AppError('You are not allowed to perform this action', 403, 'ROLE_NOT_ALLOWED'));
    }
    const permissions = req.user.permissions || [];
    if (!permissions.includes(permission)) {
      return next(new AppError(`Missing required permission: ${permission}`, 403, 'PERMISSION_DENIED'));
    }
    next();
  };
}
