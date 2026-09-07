'use strict';

// Adds the 'manager' role to the users.role enum. The manager is a dedicated
// CMS-management actor created by the admin, with per-tab permissions granted
// from ASSIGNABLE_MANAGER_PERMISSIONS.
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'manager';"
    );
  },
  down: async (_queryInterface) => {
    // PostgreSQL cannot drop a value from an enum without recreating the whole
    // type. The value is harmless (no data references it) so rollback is a no-op.
  },
};