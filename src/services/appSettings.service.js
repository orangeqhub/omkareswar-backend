import { AppSettings } from '../models/index.js';
import { log as auditLog } from './auditLog.service.js';

const DEFAULT_FIELDS = [
  { id: 'f_village', label: 'Village Name', type: 'text', category: 'land', required: false },
  { id: 'f_owner', label: 'Owner Name', type: 'text', category: 'land', required: false },
  { id: 'f_conversion', label: 'Land Conversion Done (Yes/No)', type: 'checkbox', category: 'land', required: false },
  { id: 'f_passbook', label: 'Passbook', type: 'document', category: 'land', required: false },
  { id: 'f_adangal', label: 'Adangal', type: 'document', category: 'land', required: false },
  { id: 'f_rsr', label: 'RSR Copy', type: 'document', category: 'land', required: false },
  { id: 'f_town', label: 'Town', type: 'text', category: 'residential', required: false },
  { id: 'f_street', label: 'Street', type: 'text', category: 'residential', required: false },
];

const PROPERTY_FIELD_ROLES = ['buyer', 'seller', 'employee', 'mediator'];

function ensureRoleFieldConfig(settings) {
  const storedFields = settings.propertyFieldsByRole && typeof settings.propertyFieldsByRole === 'object'
    ? settings.propertyFieldsByRole
    : {};
  const storedConfig = settings.fieldConfigByRole && typeof settings.fieldConfigByRole === 'object'
    ? settings.fieldConfigByRole
    : {};
  const propertyFieldsByRole = { ...storedFields };
  const fieldConfigByRole = { ...storedConfig };
  let changed = false;

  for (const role of PROPERTY_FIELD_ROLES) {
    if (!Array.isArray(propertyFieldsByRole[role])) {
      propertyFieldsByRole[role] = Array.isArray(settings.propertyFields) && settings.propertyFields.length
        ? settings.propertyFields
        : DEFAULT_FIELDS;
      changed = true;
    }
    if (!fieldConfigByRole[role] || typeof fieldConfigByRole[role] !== 'object' || Array.isArray(fieldConfigByRole[role])) {
      fieldConfigByRole[role] = settings.fieldConfig && typeof settings.fieldConfig === 'object'
        ? settings.fieldConfig
        : {};
      changed = true;
    }
  }

  if (changed) {
    settings.propertyFieldsByRole = propertyFieldsByRole;
    settings.fieldConfigByRole = fieldConfigByRole;
    return true;
  }
  return false;
}

// Default filters shown on the public property listing page. Admins can
// enable/disable and reorder these; the order value drives the display order.
const DEFAULT_FILTER_CONFIG = {
  state: { enabled: true, order: 10 },
  district: { enabled: true, order: 20 },
  city: { enabled: true, order: 30 },
  category: { enabled: true, order: 40 },
  price: { enabled: true, order: 50 },
  area: { enabled: true, order: 60 },
  bedrooms: { enabled: true, order: 70 },
  bathrooms: { enabled: true, order: 80 },
  facing: { enabled: true, order: 90 },
  furnishing: { enabled: true, order: 100 },
  quality: { enabled: true, order: 110 },
};

function mergeFilterConfig(stored) {
  const merged = {};
  for (const [id, def] of Object.entries(DEFAULT_FILTER_CONFIG)) {
    const storedCfg = stored && stored[id];
    merged[id] = {
      enabled: storedCfg ? storedCfg.enabled !== false : def.enabled,
      order: storedCfg && typeof storedCfg.order === 'number' ? storedCfg.order : def.order,
    };
  }
  // Keep admin-created custom filters untouched.
  if (Array.isArray(stored && stored.custom)) {
    merged.custom = stored.custom;
  }
  return merged;
}

// Legacy seeded/adhoc custom fields that duplicate the modern category fields
// (e.g. Facing, Survey Number, Built-up Area, Schedule directions). They are
// stripped from stored settings on load so they stop repeating on property forms.
const LEGACY_DUPLICATE_FIELD_IDS = new Set([
  'f_survey',
  'f_facing',
  'f_acres',
  'f_valuation',
  'f_total_value',
  'f_road_facing',
  'f_lift',
  'f_built_up',
  'f_ground_yards',
]);

function isLegacyDuplicateField(field) {
  if (!field) return true;
  if (LEGACY_DUPLICATE_FIELD_IDS.has(field.id)) return true;
  const label = String(field.label || '').trim();
  if (/^sch(?:edule|udle) /i.test(label)) return true;
  return false;
}

function pruneDuplicateFields(propertyFields) {
  if (!Array.isArray(propertyFields)) return propertyFields;
  const cleaned = propertyFields.filter((f) => !isLegacyDuplicateField(f));
  return cleaned.length === propertyFields.length ? propertyFields : cleaned;
}

export async function getSettings() {
  let settings = await AppSettings.findByPk(1);
  if (!settings) {
    settings = await AppSettings.create({ id: 1, propertyFields: DEFAULT_FIELDS });
  } else if (!settings.propertyFields || settings.propertyFields.length === 0) {
    settings.propertyFields = DEFAULT_FIELDS;
    await settings.save();
  }

  if (ensureRoleFieldConfig(settings)) {
    await settings.save();
  }

  // Strip legacy custom fields that duplicate modern per-category fields
  const pruned = pruneDuplicateFields(settings.propertyFields);
  if (pruned !== settings.propertyFields) {
    settings.propertyFields = pruned;
    await settings.save();
  }

// Ensure customLocations is in the new hierarchical format
    if (settings.customLocations && Array.isArray(settings.customLocations)) {
      // Migrate old flat array format to new structure
      settings.customLocations = { states: [], districts: {}, cities: settings.customLocations };
      await settings.save();
    } else if (settings.customLocations && typeof settings.customLocations === 'object' && !Array.isArray(settings.customLocations)) {
      // Already in object format – ensure all keys exist
      const cl = settings.customLocations;
      if (!cl.states) cl.states = [];
      if (!cl.districts) cl.districts = {};
      if (!cl.cities) cl.cities = [];
      if (!cl.mandals) cl.mandals = {};
    }

    // Ensure listing filter config is seeded with defaults so the frontend
    // always has a complete reference list of available filters.
    const mergedFilters = mergeFilterConfig(settings.filterConfig || {});
    if (JSON.stringify(mergedFilters) !== JSON.stringify(settings.filterConfig || {})) {
      settings.filterConfig = mergedFilters;
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
