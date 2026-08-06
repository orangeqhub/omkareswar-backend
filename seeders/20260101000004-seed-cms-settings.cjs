'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [existingCms] = await queryInterface.sequelize.query('SELECT id FROM cms_settings WHERE id = 1');
    if (!existingCms.length) {
      await queryInterface.bulkInsert('cms_settings', [
        {
          id: 1,
          about_en:
            'OMKARESWAR REALTORS is a trusted real estate platform connecting buyers, sellers and mediators across Telangana and Andhra Pradesh.',
          about_te: 'ఓంకారేశ్వర రియల్టర్స్ తెలంగాణ మరియు ఆంధ్రప్రదేశ్‌లో కొనుగోలుదారులు, విక్రేతలను కలిపే విశ్వసనీయ రియల్ ఎస్టేట్ వేదిక.',
          disclaimer_en: 'All property information is provided by sellers and verified by our team wherever possible.',
          disclaimer_te: 'అన్ని ఆస్తి సమాచారం విక్రేతలు అందించినది మరియు వీలైనంతవరకు మా బృందం ధృవీకరించింది.',
          contact_phone: '+91 9000000001',
          contact_whatsapp: '+91 9000000001',
          contact_email: 'support@omkareswarrealtors.com',
          contact_address_en: '3rd Floor, Realty Towers, Jubilee Hills, Hyderabad, Telangana',
          contact_address_te: '3వ అంతస్తు, రియల్టీ టవర్స్, జూబ్లీ హిల్స్, హైదరాబాద్',
          contact_landmark_en: 'Near Road No. 36',
          contact_landmark_te: 'రోడ్ నం. 36 సమీపంలో',
          contact_map_url: 'https://maps.google.com/?q=Jubilee+Hills+Hyderabad',
          business_hours_weekday_en: 'Mon - Sat: 9:30 AM - 7:00 PM',
          business_hours_weekday_te: 'సోమ - శని: ఉదయం 9:30 - సాయంత్రం 7:00',
          business_hours_sunday_en: 'Sunday: 10:00 AM - 2:00 PM',
          business_hours_sunday_te: 'ఆదివారం: ఉదయం 10:00 - మధ్యాహ్నం 2:00',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const [existingSettings] = await queryInterface.sequelize.query('SELECT id FROM app_settings WHERE id = 1');
    if (!existingSettings.length) {
      await queryInterface.bulkInsert('app_settings', [
        {
          id: 1,
          auto_approve_registrations: false,
          auto_approve_properties: false,
          max_image_size_mb: 5,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('app_settings', { id: 1 });
    await queryInterface.bulkDelete('cms_settings', { id: 1 });
  },
};
