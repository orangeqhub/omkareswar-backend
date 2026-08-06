import { InternalNote } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { log as auditLog } from './auditLog.service.js';

export async function list(recordType, recordId) {
  return InternalNote.findAll({ where: { recordType, recordId }, order: [['createdAt', 'DESC']] });
}

export async function create(data, actor) {
  const note = await InternalNote.create({
    recordType: data.recordType,
    recordId: data.recordId,
    authorId: actor.id,
    text: data.text,
    visibility: data.visibility || 'employee_admin',
  });
  await auditLog('internalNote.create', actor, { recordType: data.recordType, recordId: data.recordId });
  return note;
}

export async function update(id, text, actor) {
  const note = await InternalNote.findByPk(id);
  if (!note) throw new AppError('Note not found', 404, 'NOT_FOUND');
  if (note.authorId !== actor.id && actor.role !== 'admin') {
    throw new AppError('You can only edit your own notes', 403, 'FORBIDDEN');
  }
  note.text = text;
  await note.save();
  await auditLog('internalNote.update', actor, { noteId: id });
  return note;
}

export async function remove(id, actor) {
  const note = await InternalNote.findByPk(id);
  if (!note) throw new AppError('Note not found', 404, 'NOT_FOUND');
  if (note.authorId !== actor.id && actor.role !== 'admin') {
    throw new AppError('You can only delete your own notes', 403, 'FORBIDDEN');
  }
  await note.destroy();
  await auditLog('internalNote.delete', actor, { noteId: id });
  return true;
}
