import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Single-row table holding site-wide CMS content.
const CmsSettings = sequelize.define(
  'CmsSettings',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, defaultValue: 1 },
    aboutEn: { type: DataTypes.TEXT },
    aboutTe: { type: DataTypes.TEXT },
    disclaimerEn: { type: DataTypes.TEXT },
    disclaimerTe: { type: DataTypes.TEXT },
    contactPhone: { type: DataTypes.STRING },
    contactWhatsapp: { type: DataTypes.STRING },
    propertyContactPhone: { type: DataTypes.STRING },
    propertyContactWhatsapp: { type: DataTypes.STRING },
    contactEmail: { type: DataTypes.STRING },
    contactAddressEn: { type: DataTypes.TEXT },
    contactAddressTe: { type: DataTypes.TEXT },
    contactLandmarkEn: { type: DataTypes.STRING },
    contactLandmarkTe: { type: DataTypes.STRING },
    contactMapUrl: { type: DataTypes.TEXT },
    businessHoursWeekdayEn: { type: DataTypes.STRING },
    businessHoursWeekdayTe: { type: DataTypes.STRING },
    businessHoursSundayEn: { type: DataTypes.STRING },
    businessHoursSundayTe: { type: DataTypes.STRING },
    socialFacebook: { type: DataTypes.STRING },
    socialInstagram: { type: DataTypes.STRING },
    socialTwitter: { type: DataTypes.STRING },
    socialYoutube: { type: DataTypes.STRING },
  },
  { tableName: 'cms_settings' }
);

export default CmsSettings;
