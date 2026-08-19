import sequelize from '../config/database.js';

import User from './user.model.js';
import OtpCode from './otpCode.model.js';
import Counter from './counter.model.js';
import Category from './category.model.js';
import MediaRule from './mediaRule.model.js';
import MediaRuleCommonSlot from './mediaRuleCommonSlot.model.js';
import MediaRuleExtraSpace from './mediaRuleExtraSpace.model.js';
import Property from './property.model.js';
import PropertyImage from './propertyImage.model.js';
import PropertyDocument from './propertyDocument.model.js';
import PropertyModerationHistory from './propertyModerationHistory.model.js';
import UserCorrectionHistory from './userCorrectionHistory.model.js';
import Enquiry from './enquiry.model.js';
import CallNote from './callNote.model.js';
import Visit from './visit.model.js';
import VisitHistory from './visitHistory.model.js';
import FollowUp from './followUp.model.js';
import FollowUpHistory from './followUpHistory.model.js';
import Favourite from './favourite.model.js';
import SavedSearch from './savedSearch.model.js';
import Notification from './notification.model.js';
import InternalNote from './internalNote.model.js';
import AuditLog from './auditLog.model.js';
import CmsSettings from './cmsSettings.model.js';
import AppSettings from './appSettings.model.js';
import Commission from './commission.model.js';
import RecentlyViewedProperty from './recentlyViewedProperty.model.js';
import RegistrationForm from './registrationForm.model.js';
import RegistrationField from './registrationField.model.js';

// ---- Associations ----
MediaRule.hasMany(MediaRuleCommonSlot, { foreignKey: 'mediaRuleId', as: 'commonSlots' });
MediaRuleCommonSlot.belongsTo(MediaRule, { foreignKey: 'mediaRuleId' });

MediaRule.hasMany(MediaRuleExtraSpace, { foreignKey: 'mediaRuleId', as: 'extraSpaces' });
MediaRuleExtraSpace.belongsTo(MediaRule, { foreignKey: 'mediaRuleId' });

Property.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Property.hasMany(PropertyImage, { foreignKey: 'propertyId', as: 'images' });
PropertyImage.belongsTo(Property, { foreignKey: 'propertyId' });

Property.hasMany(PropertyDocument, { foreignKey: 'propertyId', as: 'documents' });
PropertyDocument.belongsTo(Property, { foreignKey: 'propertyId' });

Property.hasMany(PropertyModerationHistory, { foreignKey: 'propertyId', as: 'moderationHistory' });
PropertyModerationHistory.belongsTo(Property, { foreignKey: 'propertyId' });

User.hasMany(UserCorrectionHistory, { foreignKey: 'userId', as: 'correctionHistory' });
UserCorrectionHistory.belongsTo(User, { foreignKey: 'userId' });

Enquiry.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Enquiry.hasMany(CallNote, { foreignKey: 'enquiryId', as: 'callNotes' });
CallNote.belongsTo(Enquiry, { foreignKey: 'enquiryId' });

Visit.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Visit.hasMany(VisitHistory, { foreignKey: 'visitId', as: 'history' });
VisitHistory.belongsTo(Visit, { foreignKey: 'visitId' });

FollowUp.hasMany(FollowUpHistory, { foreignKey: 'followUpId', as: 'history' });
FollowUpHistory.belongsTo(FollowUp, { foreignKey: 'followUpId' });

Favourite.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });
Favourite.belongsTo(User, { foreignKey: 'userId', as: 'user' });

RecentlyViewedProperty.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

Commission.belongsTo(Property, { foreignKey: 'propertyId', as: 'property' });

RegistrationForm.hasMany(RegistrationField, { foreignKey: 'registrationFormId', as: 'fields' });
RegistrationField.belongsTo(RegistrationForm, { foreignKey: 'registrationFormId' });

export {
  sequelize,
  User,
  OtpCode,
  Counter,
  Category,
  MediaRule,
  MediaRuleCommonSlot,
  MediaRuleExtraSpace,
  Property,
  PropertyImage,
  PropertyDocument,
  PropertyModerationHistory,
  UserCorrectionHistory,
  Enquiry,
  CallNote,
  Visit,
  VisitHistory,
  FollowUp,
  FollowUpHistory,
  Favourite,
  SavedSearch,
  Notification,
  InternalNote,
  AuditLog,
  CmsSettings,
  AppSettings,
  Commission,
  RecentlyViewedProperty,
  RegistrationForm,
  RegistrationField,
};
