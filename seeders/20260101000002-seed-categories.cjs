'use strict';
const crypto = require('crypto');

const CATEGORIES = [
  { slug: 'open-plots', ruleKey: 'openPlot', nameEn: 'Open Plots', nameTe: 'ఖాళీ స్థలాలు' },
  { slug: 'apartments', ruleKey: 'apartment', nameEn: 'Apartments', nameTe: 'అపార్ట్‌మెంట్లు' },
  { slug: 'independent-houses', ruleKey: 'independentHouse', nameEn: 'Independent Houses', nameTe: 'స్వతంత్ర గృహాలు' },
  { slug: 'gated-communities', ruleKey: 'gatedCommunity', nameEn: 'Gated Communities', nameTe: 'గేటెడ్ కమ్యూనిటీలు' },
  { slug: 'agricultural-lands', ruleKey: 'agriculturalLand', nameEn: 'Agricultural Lands', nameTe: 'వ్యవసాయ భూములు' },
  { slug: 'flats', ruleKey: 'apartment', nameEn: 'Independent Apartments', nameTe: 'ఇండిపెండెంట్ అపార్ట్‌మెంట్లు' },
  { slug: 'villas', ruleKey: 'independentHouse', nameEn: 'Villas', nameTe: 'విల్లాలు' },
  { slug: 'commercial-properties', ruleKey: 'commercialPlot', nameEn: 'Commercial Properties', nameTe: 'వాణిజ్య ఆస్తులు' },
];

module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query('SELECT slug FROM categories');
    const existingSlugs = new Set(existing.map((r) => r.slug));

    const rows = CATEGORIES.filter((c) => !existingSlugs.has(c.slug)).map((c, index) => ({
      id: crypto.randomUUID(),
      slug: c.slug,
      rule_key: c.ruleKey,
      name_en: c.nameEn,
      name_te: c.nameTe,
      description_en: `Browse ${c.nameEn.toLowerCase()} listed on OMKARESWAR REALTORS.`,
      transaction_types: JSON.stringify(['sale', 'resale', 'lease', 'rent']),
      area_units: JSON.stringify(['sqft', 'sqyd', 'acre', 'cent']),
      property_fields: JSON.stringify({}),
      active: true,
      visible: true,
      order: index + 1,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    if (rows.length) await queryInterface.bulkInsert('categories', rows);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('categories', { slug: CATEGORIES.map((c) => c.slug) });
  },
};
