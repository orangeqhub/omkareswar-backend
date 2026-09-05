import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { computePropertyScore } from '../utils/propertyScore.js';

const Property = sequelize.define(
  'Property',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    propertyCode: { type: DataTypes.STRING, unique: true }, // PROP-YYYY-000001
    categorySlug: { type: DataTypes.STRING, allowNull: false },
    ruleKey: { type: DataTypes.STRING },
    titleEn: { type: DataTypes.STRING },
    titleTe: { type: DataTypes.STRING },
    descriptionEn: { type: DataTypes.TEXT },
    descriptionTe: { type: DataTypes.TEXT },
    transactionType: { type: DataTypes.STRING },
    price: { type: DataTypes.DECIMAL(14, 2) },
    priceNegotiable: { type: DataTypes.BOOLEAN, defaultValue: false },
    govtValue: { type: DataTypes.DECIMAL(14, 2) },
    totalAmount: { type: DataTypes.DECIMAL(14, 2) },
    area: { type: DataTypes.DECIMAL(14, 2) },
    areaUnit: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    district: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    mandal: { type: DataTypes.STRING },
    village: { type: DataTypes.STRING },
    locality: { type: DataTypes.STRING },
    landmark: { type: DataTypes.STRING },
    pincode: { type: DataTypes.STRING },
    address: { type: DataTypes.TEXT },
    locationEn: { type: DataTypes.STRING },
    locationTe: { type: DataTypes.STRING },
    mapLat: { type: DataTypes.DECIMAL(10, 6) },
    mapLng: { type: DataTypes.DECIMAL(10, 6) },
    ventureName: { type: DataTypes.STRING },
    villageName: { type: DataTypes.STRING },
    surveyNumber: { type: DataTypes.STRING },
    acres: { type: DataTypes.DECIMAL(10, 2) },
    acreValuation: { type: DataTypes.DECIMAL(14, 2) },
    totalSaleValue: { type: DataTypes.DECIMAL(14, 2) },
    conversion: { type: DataTypes.BOOLEAN, defaultValue: false },
    passbook: { type: DataTypes.STRING },
    adangal: { type: DataTypes.STRING },
    rsrCopy: { type: DataTypes.STRING },
    documentationNumber: { type: DataTypes.STRING },
    documentationYear: { type: DataTypes.STRING },
    landDocumentHistory: { type: DataTypes.TEXT },
    ownerName: { type: DataTypes.STRING },
    town: { type: DataTypes.STRING },
    street: { type: DataTypes.STRING },
    roadFacing: { type: DataTypes.STRING },
    plotFacing: { type: DataTypes.STRING },
    liftFacility: { type: DataTypes.BOOLEAN, defaultValue: false },
    builtUpArea: { type: DataTypes.DECIMAL(12, 2) },
    groundSquareYards: { type: DataTypes.DECIMAL(12, 2) },
    facing: { type: DataTypes.STRING },

    structure: { type: DataTypes.JSONB, defaultValue: {} },
    plotDetails: { type: DataTypes.JSONB, defaultValue: {} },
    amenities: { type: DataTypes.JSONB, defaultValue: [] },

    contactName: { type: DataTypes.STRING },
    contactPhone: { type: DataTypes.STRING },
    preferWhatsapp: { type: DataTypes.BOOLEAN, defaultValue: true },
    preferCall: { type: DataTypes.BOOLEAN, defaultValue: true },
    hidePhone: { type: DataTypes.BOOLEAN, defaultValue: false },

    status: {
      type: DataTypes.ENUM('draft', 'pending', 'active', 'rejected', 'changes_requested', 'sold', 'inactive'),
      allowNull: false,
      defaultValue: 'draft',
    },
    moderationStatus: {
      type: DataTypes.ENUM(
        'submitted',
        'in_review',
        'changes_requested',
        'recommended_approval',
        'recommended_rejection',
        'completed'
      ),
      allowNull: true,
    },
    moderationNote: { type: DataTypes.TEXT },
    verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    featured: { type: DataTypes.BOOLEAN, defaultValue: false },
    views: { type: DataTypes.INTEGER, defaultValue: 0 },

    sellerId: { type: DataTypes.UUID, allowNull: false },
    assignedEmployeeId: { type: DataTypes.UUID, allowNull: true },
    assignedMediatorId: { type: DataTypes.UUID, allowNull: true },
    assignedBy: { type: DataTypes.UUID, allowNull: true },
    assignedAt: { type: DataTypes.DATE },
    priority: { type: DataTypes.STRING, defaultValue: 'medium' },
    dueDate: { type: DataTypes.DATE },

    postedDate: { type: DataTypes.DATE },
    updatedDate: { type: DataTypes.DATE },
    dynamicFields: { type: DataTypes.JSON, defaultValue: {} },
  },
  {
    tableName: 'properties',
    indexes: [
      { fields: ['category_slug'] },
      { fields: ['status'] },
      { fields: ['seller_id'] },
      { fields: ['city'] },
      { fields: ['transaction_type'] },
    ],
  }
);

// Every property must always carry its upload date/time. These are set on
// create/update in the service layer, and this hook guarantees the columns are
// never null even if a property is created through another code path.
Property.beforeCreate((property) => {
  if (!property.postedDate) property.postedDate = new Date();
  if (!property.updatedDate) property.updatedDate = new Date();
});

// Attach the live completion scorecard whenever a property is serialized so the
// score is available to the seller, admin and the assigned employee everywhere
// the property is returned (list, detail, reports, user/employee details, etc).
Property.prototype.toJSON = function toJSON() {
  const base = this.dataValues ? { ...this.dataValues } : { ...this };
  for (const key of ['images', 'documents', 'seller']) {
    const rel = this[key];
    if (rel === undefined || rel === null) continue;
    if (Array.isArray(rel)) {
      base[key] = rel.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r));
    } else if (typeof rel.toJSON === 'function') {
      base[key] = rel.toJSON();
    } else {
      base[key] = rel;
    }
  }
  // Legacy rows predating the postedDate column fall back to their raw createdAt.
  base.postedDate = base.postedDate || base.createdAt;
  base.updatedDate = base.updatedDate || base.postedDate;
  const score = computePropertyScore(base);
  return {
    ...base,
    completionScore: score.overall,
    completionSections: score.sections,
  };
};

export default Property;
