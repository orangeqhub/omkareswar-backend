import { CallNote, Enquiry } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { assertRecordAccess } from '../utils/recordAccess.js';
import { log as auditLog } from './auditLog.service.js';

export async function list(enquiryId, actor) {
  const enquiry = await Enquiry.findByPk(enquiryId);
  if (!enquiry) throw new AppError('Enquiry not found', 404, 'NOT_FOUND');
  await assertRecordAccess(actor, enquiry, ['buyerId', 'sellerId']);
  return CallNote.findAll({ where: { enquiryId }, order: [['callDateTime', 'DESC']] });
}

export async function create(enquiryId, data, actor) {
  const enquiry = await Enquiry.findByPk(enquiryId);
  if (!enquiry) throw new AppError('Enquiry not found', 404, 'NOT_FOUND');
  await assertRecordAccess(actor, enquiry, ['buyerId', 'sellerId']);

  const note = await CallNote.create({
    enquiryId,
    createdBy: actor.id,
    callDateTime: data.callDateTime,
    direction: data.direction,
    result: data.result,
    summary: data.summary,
    interestLevel: data.interestLevel,
    nextAction: data.nextAction,
    nextFollowUpAt: data.nextFollowUpAt,
  });

  if (data.nextFollowUpAt) {
    enquiry.nextFollowUpAt = data.nextFollowUpAt;
    await enquiry.save();
  }

  await auditLog('callNote.create', actor, { enquiryId, callNoteId: note.id });
  return note;
}

export async function update(id, data, actor) {
  const note = await CallNote.findByPk(id);
  if (!note) throw new AppError('Call note not found', 404, 'NOT_FOUND');
  await assertEnquiryAccess(note.enquiryId, actor);

  const editable = ['callDateTime', 'direction', 'result', 'summary', 'interestLevel', 'nextAction', 'nextFollowUpAt'];
  editable.forEach((f) => {
    if (data[f] !== undefined) note[f] = data[f];
  });
  await note.save();
  await auditLog('callNote.update', actor, { callNoteId: id });
  return note;
}

export async function remove(id, actor) {
  const note = await CallNote.findByPk(id);
  if (!note) throw new AppError('Call note not found', 404, 'NOT_FOUND');
  await assertEnquiryAccess(note.enquiryId, actor);

  await note.destroy();
  await auditLog('callNote.delete', actor, { callNoteId: id });
  return true;
}

async function assertEnquiryAccess(enquiryId, actor) {
  const enquiry = await Enquiry.findByPk(enquiryId);
  if (!enquiry) throw new AppError('Enquiry not found', 404, 'NOT_FOUND');
  await assertRecordAccess(actor, enquiry, ['buyerId', 'sellerId']);
}
