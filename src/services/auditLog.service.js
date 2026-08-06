import { AuditLog } from '../models/index.js';

/**
 * Writes an audit trail row. `action` is a dotted string such as
 * 'registration.approve', 'property.assign', 'employee.permissionsUpdated'.
 * Called from inside mutating service functions, usually within the same
 * transaction as the mutation itself.
 */
export async function log(action, actor, details = {}, transaction) {
  return AuditLog.create(
    {
      action,
      actorId: actor?.id || null,
      actorRole: actor?.role || null,
      details,
    },
    { transaction }
  );
}
