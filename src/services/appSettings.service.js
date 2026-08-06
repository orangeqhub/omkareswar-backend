import { AppSettings } from '../models/index.js';
import { log as auditLog } from './auditLog.service.js';

export async function getSettings() {
  let settings = await AppSettings.findByPk(1);
  if (!settings) settings = await AppSettings.create({ id: 1 });
  return settings;
}

export async function updateSettings(data, actor) {
  const settings = await getSettings();
  Object.assign(settings, data);
  await settings.save();
  await auditLog('settings.update', actor, {});
  return settings;
}
