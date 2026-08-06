import { MediaRule, MediaRuleCommonSlot, MediaRuleExtraSpace } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { log as auditLog } from './auditLog.service.js';
import { BASE_MEDIA_RULE_TEMPLATES, ruleKeyToTemplate } from '../constants/mediaRuleTemplates.js';

async function withRelations(ruleKey) {
  const rule = await MediaRule.findOne({
    where: { ruleKey },
    include: [
      { model: MediaRuleCommonSlot, as: 'commonSlots' },
      { model: MediaRuleExtraSpace, as: 'extraSpaces' },
    ],
    order: [[{ model: MediaRuleCommonSlot, as: 'commonSlots' }, 'order', 'ASC']],
  });
  if (!rule) throw new AppError('Media rule not found', 404, 'NOT_FOUND');
  return rule;
}

export async function listAll() {
  return MediaRule.findAll({
    include: [
      { model: MediaRuleCommonSlot, as: 'commonSlots' },
      { model: MediaRuleExtraSpace, as: 'extraSpaces' },
    ],
  });
}

export async function getOne(ruleKey) {
  return withRelations(ruleKey);
}

export async function updateRule(ruleKey, data, actor) {
  const rule = await MediaRule.findOne({ where: { ruleKey } });
  if (!rule) throw new AppError('Media rule not found', 404, 'NOT_FOUND');

  if (data.countBasedSlots !== undefined) rule.countBasedSlots = data.countBasedSlots;
  await rule.save();
  await auditLog('mediaRule.update', actor, { ruleKey });
  return withRelations(ruleKey);
}

export async function restoreDefaults(ruleKey, actor) {
  const template = ruleKeyToTemplate(ruleKey);
  if (!template) throw new AppError('No default template for this rule key', 400, 'NO_DEFAULT_TEMPLATE');

  let rule = await MediaRule.findOne({ where: { ruleKey } });
  if (!rule) rule = await MediaRule.create({ ruleKey, countBasedSlots: template.countBasedSlots || [] });
  else rule.countBasedSlots = template.countBasedSlots || [];
  await rule.save();

  await MediaRuleCommonSlot.destroy({ where: { mediaRuleId: rule.id } });
  await MediaRuleExtraSpace.destroy({ where: { mediaRuleId: rule.id } });

  for (const slot of template.commonSlots || []) {
    await MediaRuleCommonSlot.create({ ...slot, mediaRuleId: rule.id });
  }
  for (const space of template.allowedExtraSpaces || []) {
    await MediaRuleExtraSpace.create({ ...space, mediaRuleId: rule.id });
  }

  await auditLog('mediaRule.restoreDefaults', actor, { ruleKey });
  return withRelations(ruleKey);
}

export async function addCommonSlot(ruleKey, data, actor) {
  const rule = await MediaRule.findOne({ where: { ruleKey } });
  if (!rule) throw new AppError('Media rule not found', 404, 'NOT_FOUND');

  const slot = await MediaRuleCommonSlot.create({ ...data, mediaRuleId: rule.id });
  await auditLog('mediaRule.addCommonSlot', actor, { ruleKey, slotKey: data.slotKey });
  return slot;
}

export async function updateCommonSlot(ruleKey, slotId, data, actor) {
  const slot = await MediaRuleCommonSlot.findByPk(slotId);
  if (!slot) throw new AppError('Slot not found', 404, 'NOT_FOUND');

  Object.assign(slot, data);
  await slot.save();
  await auditLog('mediaRule.updateCommonSlot', actor, { ruleKey, slotId });
  return slot;
}

export async function deleteCommonSlot(ruleKey, slotId, actor) {
  const slot = await MediaRuleCommonSlot.findByPk(slotId);
  if (!slot) throw new AppError('Slot not found', 404, 'NOT_FOUND');

  await slot.destroy();
  await auditLog('mediaRule.deleteCommonSlot', actor, { ruleKey, slotId });
  return true;
}

export async function addExtraSpace(ruleKey, data, actor) {
  const rule = await MediaRule.findOne({ where: { ruleKey } });
  if (!rule) throw new AppError('Media rule not found', 404, 'NOT_FOUND');

  const space = await MediaRuleExtraSpace.create({ ...data, mediaRuleId: rule.id });
  await auditLog('mediaRule.addExtraSpace', actor, { ruleKey, key: data.key });
  return space;
}

export async function deleteExtraSpace(ruleKey, key, actor) {
  const rule = await MediaRule.findOne({ where: { ruleKey } });
  if (!rule) throw new AppError('Media rule not found', 404, 'NOT_FOUND');

  const deleted = await MediaRuleExtraSpace.destroy({ where: { mediaRuleId: rule.id, key } });
  if (!deleted) throw new AppError('Extra space not found', 404, 'NOT_FOUND');

  await auditLog('mediaRule.deleteExtraSpace', actor, { ruleKey, key });
  return true;
}

export { BASE_MEDIA_RULE_TEMPLATES };
