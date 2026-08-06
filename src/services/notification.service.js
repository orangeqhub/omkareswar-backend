import { Op } from 'sequelize';
import { Notification } from '../models/index.js';
import { emitToUser, emitToRole } from '../sockets/index.js';

/**
 * Creates a notification row and emits `notification:new` over Socket.IO
 * once the surrounding transaction (if any) has committed. This must be
 * called from inside the same transaction as the mutation that triggered it,
 * so that a rolled-back mutation never produces a stray notification.
 */
export async function createNotification(
  { audienceRole = null, audienceUserId = null, type, relatedType, relatedId, titleEn, titleTe },
  transaction
) {
  const notification = await Notification.create(
    { audienceRole, audienceUserId, type, relatedType, relatedId, titleEn, titleTe },
    { transaction }
  );

  const emit = () => {
    if (audienceUserId) emitToUser(audienceUserId, 'notification:new', notification.toJSON());
    if (audienceRole) emitToRole(audienceRole, 'notification:new', notification.toJSON());
  };

  if (transaction) {
    transaction.afterCommit(emit);
  } else {
    emit();
  }

  return notification;
}

export async function listForUser(user, { limit, offset }) {
  // A user sees notifications addressed directly to them OR broadcast to their role.
  const where = { [Op.or]: [{ audienceUserId: user.id }, { audienceRole: user.role }] };

  const { rows, count } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { items: rows, total: count };
}

export async function markRead(notificationId, user) {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) return null;
  const isMine = notification.audienceUserId === user.id || notification.audienceRole === user.role;
  if (!isMine) return null;
  notification.read = true;
  await notification.save();
  emitToUser(user.id, 'notification:read', { id: notification.id });
  return notification;
}

export async function markAllRead(user) {
  await Notification.update(
    { read: true },
    { where: { [Op.or]: [{ audienceUserId: user.id }, { audienceRole: user.role }] } }
  );
  emitToUser(user.id, 'notification:read', { all: true });
}
