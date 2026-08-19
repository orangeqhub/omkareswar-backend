import { AppSettings } from '../models/index.js';
import { log as auditLog } from './auditLog.service.js';

const DEFAULT_FIELDS = [
  { id: 'f_village', label: 'Village Name', type: 'text', category: 'land', required: false },
  { id: 'f_owner', label: 'Owner Name', type: 'text', category: 'land', required: false },
  { id: 'f_survey', label: 'Survey Number', type: 'text', category: 'both', required: false },
  { id: 'f_facing', label: 'Facing', type: 'select', category: 'both', options: ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'], required: false },
  { id: 'f_acres', label: 'Number of Acres', type: 'number', category: 'land', required: false },
  { id: 'f_valuation', label: 'Acre Valuation', type: 'number', category: 'land', required: false },
  { id: 'f_total_value', label: 'Total Sale Value', type: 'number', category: 'land', required: false },
  { id: 'f_conversion', label: 'Land Conversion Done (Yes/No)', type: 'checkbox', category: 'land', required: false },
  { id: 'f_passbook', label: 'Passbook', type: 'document', category: 'land', required: false },
  { id: 'f_adangal', label: 'Adangal', type: 'document', category: 'land', required: false },
  { id: 'f_rsr', label: 'RSR Copy', type: 'document', category: 'land', required: false },
  { id: 'f_town', label: 'Town', type: 'text', category: 'residential', required: false },
  { id: 'f_street', label: 'Street', type: 'text', category: 'residential', required: false },
  { id: 'f_road_facing', label: 'Road Facing', type: 'text', category: 'residential', required: false },
  { id: 'f_lift', label: 'Lift Facility Available', type: 'checkbox', category: 'residential', required: false },
  { id: 'f_built_up', label: 'Built-up Area (Sq Ft / Sq Yd)', type: 'number', category: 'residential', required: false },
  { id: 'f_ground_yards', label: 'Ground Square Yards', type: 'number', category: 'residential', required: false },
];

export async function getSettings() {
  let settings = await AppSettings.findByPk(1);
  if (!settings) {
    settings = await AppSettings.create({ id: 1, propertyFields: DEFAULT_FIELDS });
  } else if (!settings.propertyFields || settings.propertyFields.length === 0) {
    settings.propertyFields = DEFAULT_FIELDS;
    await settings.save();
  }
  return settings;
}

export async function updateSettings(data, actor) {
  const settings = await getSettings();
  Object.assign(settings, data);
  await settings.save();
  await auditLog('settings.update', actor, {});
  return settings;
}
