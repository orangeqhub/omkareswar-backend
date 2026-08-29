const BUILDING_RULE_KEYS = ['apartment', 'independentHouse', 'gatedCommunity'];

export function isBuildingType(ruleKey) {
  return BUILDING_RULE_KEYS.includes(ruleKey);
}

const BUILDING_STRUCTURE_FIELDS = [
  'bedrooms',
  'bathrooms',
  'halls',
  'kitchens',
  'balconies',
  'floors',
  'propertyFloor',
  'furnishing',
  'parking',
  'ageOfProperty',
];

const PLOT_STRUCTURE_FIELDS = [
  'plotLength',
  'plotWidth',
  'roadWidth',
  'boundary',
  'soilType',
  'waterSource',
  'electricity',
  'irrigation',
  'existingStructures',
  'approvals',
];

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !Number.isNaN(value) && value > 0;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return false;
    return keys.some((k) => isFilled(value[k]));
  }
  return Boolean(value);
}

function countFilled(source, keys) {
  let filled = 0;
  for (const key of keys) {
    if (isFilled(source[key])) filled += 1;
  }
  return filled;
}

function hasDocument(documents, kind) {
  if (Array.isArray(documents)) {
    return documents.some((d) => String(d.type || d.kind || '').toLowerCase() === kind.toLowerCase());
  }
  if (documents && typeof documents === 'object') {
    return isFilled(documents[kind]);
  }
  return false;
}

function pct(filled, total) {
  if (!total) return 0;
  return Math.round((filled / total) * 100);
}

/**
 * Computes a "completion score" for a property based on how many of the
 * expected wizard fields have been filled in by the person who posted it.
 *
 * Accepts either a Sequelize Property instance (with images/documents loaded)
 * or a plain object (e.g. the front-end wizard form data).
 *
 * Returns { overall, sections } where each section is
 * { key, label, filled, total, percentage }.
 */
export function computePropertyScore(data) {
  const source = data && typeof data.toJSON === 'function' ? data.toJSON() : data || {};
  const building = isBuildingType(source.ruleKey);

  const sections = [];

  // 1. Basic details
  const basicKeys = ['titleEn', 'descriptionEn', 'ventureName'];
  const basicFilled = countFilled(source, basicKeys);
  sections.push({
    key: 'basic',
    label: 'Basic Details',
    filled: basicFilled,
    total: basicKeys.length,
    percentage: pct(basicFilled, basicKeys.length),
  });

  // 2. Location
  const city = isFilled(source.city) ? source.city : source.cityVillage;
  const hasMap =
    (isFilled(source.mapLat) && isFilled(source.mapLng)) || isFilled(source.mapLocation);
  const locationFields = [
    { key: 'state', value: source.state },
    { key: 'district', value: source.district },
    { key: 'mandal', value: source.mandal },
    { key: 'city', value: city },
    { key: 'locality', value: source.locality },
    { key: 'pincode', value: source.pincode },
    { key: 'address', value: source.address },
    { key: 'map', value: hasMap },
  ];
  const locationFilled = locationFields.filter((f) => isFilled(f.value)).length;
  sections.push({
    key: 'location',
    label: 'Location',
    filled: locationFilled,
    total: locationFields.length,
    percentage: pct(locationFilled, locationFields.length),
  });

  // 3. Price & size
  const priceKeys = ['price', 'area', 'areaUnit'];
  const priceFilled = countFilled(source, priceKeys);
  sections.push({
    key: 'price_size',
    label: 'Price & Size',
    filled: priceFilled,
    total: priceKeys.length,
    percentage: pct(priceFilled, priceKeys.length),
  });

  // 4. Structure / plot details (+ dynamic fields)
  const structureSource = building
    ? source.structure || {}
    : source.plotDetails || {};
  const structureKeys = building ? BUILDING_STRUCTURE_FIELDS : PLOT_STRUCTURE_FIELDS;
  let structureFilled = countFilled(structureSource, structureKeys);
  let structureTotal = structureKeys.length;

  const dynamic = source.dynamicFields || {};
  const dynamicKeys = Object.keys(dynamic);
  for (const key of dynamicKeys) {
    structureTotal += 1;
    if (isFilled(dynamic[key])) structureFilled += 1;
  }

  sections.push({
    key: building ? 'structure' : 'plot',
    label: building ? 'Structure' : 'Land / Plot Details',
    filled: structureFilled,
    total: structureTotal,
    percentage: pct(structureFilled, structureTotal),
  });

  // 5. Amenities
  const amenitiesFilled = Array.isArray(source.amenities) && source.amenities.length > 0 ? 1 : 0;
  sections.push({
    key: 'amenities',
    label: 'Amenities',
    filled: amenitiesFilled,
    total: 1,
    percentage: amenitiesFilled ? 100 : 0,
  });

  // 6. Images & documents
  const images = Array.isArray(source.images) ? source.images : [];
  const hasImages = images.length > 0;
  const hasPrimary = images.some((image) => image.isPrimary);
  const documents = source.documents;
  const hasSite = hasDocument(documents, 'site');
  const hasLink = hasDocument(documents, 'link');
  const hasIdentityProof = hasDocument(documents, 'identityProof');
  const mediaValues = [hasImages, hasPrimary, hasSite, hasLink, hasIdentityProof];
  const mediaFilled = mediaValues.filter(Boolean).length;
  sections.push({
    key: 'media',
    label: 'Images & Documents',
    filled: mediaFilled,
    total: mediaValues.length,
    percentage: pct(mediaFilled, mediaValues.length),
  });

  // 7. Contact details
  const contactKeys = ['contactName', 'contactPhone'];
  const contactFilled = countFilled(source, contactKeys);
  sections.push({
    key: 'contact',
    label: 'Contact Details',
    filled: contactFilled,
    total: contactKeys.length,
    percentage: pct(contactFilled, contactKeys.length),
  });

  const overall = sections.length
    ? Math.round(sections.reduce((sum, s) => sum + s.percentage, 0) / sections.length)
    : 0;

  return { overall, sections };
}