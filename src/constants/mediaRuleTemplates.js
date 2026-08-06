// Default media rule templates seeded per ruleKey. Admins can customize per
// ruleKey afterwards; "restore defaults" resets back to these templates.

const buildingStructureRules = {
  commonSlots: [
    { slotKey: 'buildingExterior', labelEn: 'Building Exterior', labelTe: 'భవన బాహ్య దృశ్యం', required: true, order: 1, captionRequired: false, primaryEligible: true },
    { slotKey: 'floorPlan', labelEn: 'Floor Plan', labelTe: 'ఫ్లోర్ ప్లాన్', required: true, order: 2, captionRequired: true, primaryEligible: false },
    { slotKey: 'amenities', labelEn: 'Amenities', labelTe: 'సౌకర్యాలు', required: false, order: 3, captionRequired: false, primaryEligible: true },
    { slotKey: 'locationExterior', labelEn: 'Location / Exterior View', labelTe: 'ప్రదేశం / బాహ్య దృశ్యం', required: false, order: 4, captionRequired: false, primaryEligible: true },
  ],
  countBasedSlots: [
    { key: 'bedrooms', labelEn: 'Bedroom', labelTe: 'పడకగది', required: true },
    { key: 'bathrooms', labelEn: 'Bathroom', labelTe: 'బాత్రూమ్', required: true },
    { key: 'halls', labelEn: 'Hall', labelTe: 'హాల్', required: true },
    { key: 'balconies', labelEn: 'Balcony', labelTe: 'బాల్కనీ', required: false },
    { key: 'kitchens', labelEn: 'Kitchen', labelTe: 'వంటగది', required: true },
  ],
  allowedExtraSpaces: [
    { key: 'poojaRoom', labelEn: 'Pooja Room', labelTe: 'పూజ గది' },
    { key: 'utilityRoom', labelEn: 'Utility Room', labelTe: 'యుటిలిటీ గది' },
    { key: 'storeRoom', labelEn: 'Store Room', labelTe: 'స్టోర్ గది' },
    { key: 'officeRoom', labelEn: 'Office Room', labelTe: 'ఆఫీసు గది' },
    { key: 'servantRoom', labelEn: 'Servant Room', labelTe: 'సర్వెంట్ గది' },
    { key: 'terrace', labelEn: 'Terrace', labelTe: 'డాబా' },
  ],
};

const landStructureRules = {
  commonSlots: [
    { slotKey: 'frontView', labelEn: 'Front View', labelTe: 'ముందు దృశ్యం', required: true, order: 1, captionRequired: false, primaryEligible: true },
    { slotKey: 'fullLandView', labelEn: 'Full Land View', labelTe: 'పూర్తి భూమి దృశ్యం', required: true, order: 2, captionRequired: false, primaryEligible: true },
    { slotKey: 'roadAccess', labelEn: 'Road Access', labelTe: 'రోడ్డు యాక్సెస్', required: true, order: 3, captionRequired: false, primaryEligible: true },
    { slotKey: 'boundaryView', labelEn: 'Boundary View', labelTe: 'సరిహద్దు దృశ్యం', required: false, order: 4, captionRequired: false, primaryEligible: true },
    { slotKey: 'layoutPlan', labelEn: 'Layout Plan', labelTe: 'లేఅవుట్ ప్లాన్', required: true, order: 5, captionRequired: true, primaryEligible: false },
    { slotKey: 'locationMap', labelEn: 'Location Map', labelTe: 'లొకేషన్ మ్యాప్', required: false, order: 6, captionRequired: false, primaryEligible: false },
    { slotKey: 'nearbyLandmark', labelEn: 'Nearby Landmark', labelTe: 'సమీప ప్రదేశం', required: false, order: 7, captionRequired: false, primaryEligible: false },
    { slotKey: 'approvalDocument', labelEn: 'Approval Document', labelTe: 'ఆమోద పత్రం', required: true, order: 8, captionRequired: false, primaryEligible: false, allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'] },
  ],
  countBasedSlots: [],
  allowedExtraSpaces: [
    { key: 'borewell', labelEn: 'Borewell', labelTe: 'బోరుబావి' },
    { key: 'fencing', labelEn: 'Fencing', labelTe: 'కంచె' },
    { key: 'shed', labelEn: 'Shed', labelTe: 'షెడ్' },
    { key: 'farmhouse', labelEn: 'Farmhouse', labelTe: 'ఫార్మ్‌హౌస్' },
    { key: 'irrigationArea', labelEn: 'Irrigation Area', labelTe: 'నీటిపారుదల ప్రాంతం' },
    { key: 'cropArea', labelEn: 'Crop Area', labelTe: 'పంట ప్రాంతం' },
  ],
};

const agriculturalLandRules = {
  ...landStructureRules,
  commonSlots: [
    ...landStructureRules.commonSlots,
    { slotKey: 'waterSource', labelEn: 'Water Source', labelTe: 'నీటి వనరు', required: false, order: 9, captionRequired: false, primaryEligible: false },
    { slotKey: 'electricityAccess', labelEn: 'Electricity Access', labelTe: 'విద్యుత్ యాక్సెస్', required: false, order: 10, captionRequired: false, primaryEligible: false },
  ],
};

export const BASE_MEDIA_RULE_TEMPLATES = {
  buildingStructureRules,
  landStructureRules,
  agriculturalLandRules,
};

// Maps ruleKey -> base template
const RULE_KEY_TEMPLATE_MAP = {
  apartment: buildingStructureRules,
  independentHouse: buildingStructureRules,
  gatedCommunity: buildingStructureRules,
  residentialPlot: landStructureRules,
  openPlot: landStructureRules,
  commercialPlot: landStructureRules,
  venture: landStructureRules,
  agriculturalLand: agriculturalLandRules,
};

export function ruleKeyToTemplate(ruleKey) {
  return RULE_KEY_TEMPLATE_MAP[ruleKey] || null;
}

export function allRuleKeys() {
  return Object.keys(RULE_KEY_TEMPLATE_MAP);
}
