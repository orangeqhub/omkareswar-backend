import { CmsSettings } from '../models/index.js';
import { log as auditLog } from './auditLog.service.js';

export async function getCms() {
  let cms = await CmsSettings.findByPk(1);
  if (!cms) cms = await CmsSettings.create({ id: 1 });
  return cms;
}

export async function updateCms(data, actor) {
  const cms = await getCms();
  Object.assign(cms, data);
  await cms.save();
  await auditLog('cms.update', actor, {});
  return cms;
}
