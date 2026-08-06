'use strict';
const crypto = require('crypto');
const path = require('path');
const { pathToFileURL } = require('url');

module.exports = {
  up: async (queryInterface) => {
    const templatesModule = await import(pathToFileURL(path.resolve('src/constants/mediaRuleTemplates.js')).href);
    const { allRuleKeys, ruleKeyToTemplate } = templatesModule;

    for (const ruleKey of allRuleKeys()) {
      const [existing] = await queryInterface.sequelize.query('SELECT id FROM media_rules WHERE rule_key = :ruleKey', {
        replacements: { ruleKey },
      });
      if (existing.length) continue;

      const template = ruleKeyToTemplate(ruleKey);
      const mediaRuleId = crypto.randomUUID();

      await queryInterface.bulkInsert('media_rules', [
        {
          id: mediaRuleId,
          rule_key: ruleKey,
          count_based_slots: JSON.stringify(template.countBasedSlots || []),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      const commonSlots = (template.commonSlots || []).map((slot) => ({
        id: crypto.randomUUID(),
        media_rule_id: mediaRuleId,
        slot_key: slot.slotKey,
        label_en: slot.labelEn,
        label_te: slot.labelTe || null,
        required: !!slot.required,
        order: slot.order || 0,
        max_file_size_mb: 5,
        allowed_extensions: JSON.stringify(slot.allowedExtensions || ['jpg', 'jpeg', 'png', 'webp']),
        caption_required: !!slot.captionRequired,
        primary_eligible: slot.primaryEligible !== false,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (commonSlots.length) await queryInterface.bulkInsert('media_rule_common_slots', commonSlots);

      const extraSpaces = (template.allowedExtraSpaces || []).map((space) => ({
        id: crypto.randomUUID(),
        media_rule_id: mediaRuleId,
        key: space.key,
        label_en: space.labelEn,
        label_te: space.labelTe || null,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      if (extraSpaces.length) await queryInterface.bulkInsert('media_rule_extra_spaces', extraSpaces);
    }
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('media_rules', null, {});
  },
};
