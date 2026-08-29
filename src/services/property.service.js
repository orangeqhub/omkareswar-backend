import { Op } from 'sequelize';
import {
  sequelize,
  Property,
  PropertyImage,
  PropertyDocument,
  Favourite,
  RecentlyViewedProperty,
  User,
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import AppError from '../utils/AppError.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { getPagination } from '../utils/pagination.js';
import { buildRecordScope } from '../utils/recordAccess.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';
import { getSettings } from './appSettings.service.js';

const INCLUDE = [
  { model: PropertyImage, as: 'images' },
  { model: PropertyDocument, as: 'documents' },
];

// Staff-facing lists include the poster's brief details so admins/employees
// can see who added each property together with its completion score.
const SELLER_INCLUDE = {
  model: User,
  as: 'seller',
  attributes: ['id', 'name', 'mobile', 'email', 'role', 'status'],
};
const STAFF_INCLUDE = [...INCLUDE, SELLER_INCLUDE];

/**
 * Document images/files must stay private: visible only to the property
 * poster, admins, and staff assigned to the property. Everyone else (e.g.
 * any visitor on the public detail page) gets an empty documents list.
 */
export function canViewDocuments(property, user) {
  if (!user || !property) return false;
  if (user.role === ROLES.ADMIN) return true;
  if (user.id === property.sellerId) return true;
  const assignedId =
    property.assignedEmployeeId ||
    property.assignedEmployee?.id ||
    property.assignedMediatorId ||
    property.assignedMediator?.id;
  return Boolean(assignedId && user.id === assignedId);
}

/**
 * Mutates Sequelize instances so serialized responses drop the private
 * `documents` array when the requester is not privileged.
 */
export function stripDocumentsForAccess(value, user) {
  const apply = (item) => {
    if (item && !canViewDocuments(item, user)) {
      item.documents = [];
    }
  };
  if (Array.isArray(value)) value.forEach(apply);
  else apply(value);
  return value;
}

/**
 * Location-alert notifications: when a property goes live, any user who has
 * already viewed 3+ listings in the same location (city, district or
 * locality) gets an immediate notification, so they hear about new supply
 * in the area they are actively searching.
 */
async function notifyLocationInterestedUsers(property, transaction) {
  if (!property || !property.id) return;

  // Case-insensitive location keys (DB has mixed casing: Guntur/guntur/GUNTUR).
  // One notification per user regardless of how many location fields match.
  const locations = [...new Set([property.city, property.district, property.locality].filter(Boolean))];
  if (locations.length === 0) return;

  const interestedUserIds = new Set();

  for (const location of locations) {
    const [rows] = await sequelize.query(
      `SELECT rvp.user_id AS "userId"
         FROM recently_viewed_properties rvp
         JOIN properties p ON p.id = rvp.property_id
        WHERE rvp.user_id <> :sellerId
          AND (LOWER(p.city) = LOWER(:location)
            OR LOWER(p.district) = LOWER(:location)
            OR LOWER(p.locality) = LOWER(:location))
        GROUP BY rvp.user_id
       HAVING SUM(rvp.view_count) >= :minViews`,
      {
        replacements: {
          location,
          sellerId: property.sellerId || '__none__',
          minViews: 3,
        },
        transaction,
      }
    );

    for (const row of rows) interestedUserIds.add(row.userId);
  }

  for (const userId of interestedUserIds) {
    await createNotification(
      {
        audienceUserId: userId,
        type: 'property.newInLocation',
        relatedType: 'property',
        relatedId: property.id,
        titleEn: `New property available in ${property.city || property.district || property.locality}: ${property.titleEn || property.propertyCode}`,
        titleTe: `${property.city || property.district || property.locality}లో కొత్త ఆస్తి అందుబాటులో ఉంది: ${property.titleEn || property.propertyCode}`,
      },
      transaction
    );
  }
}

function buildSort(sort) {
  switch (sort) {
    case 'price-asc':
      return [['price', 'ASC']];
    case 'price-desc':
      return [['price', 'DESC']];
    case 'most-viewed':
      return [['views', 'DESC']];
    case 'featured':
      return [['featured', 'DESC'], ['createdAt', 'DESC']];
    case 'newest':
    default:
      return [['createdAt', 'DESC']];
  }
}

function applyLocationFilter(where, locationQuery) {
  if (!locationQuery) return;
  const parts = locationQuery.split(',').map(s => s.trim().replace(/\s+District$/i, '')).filter(Boolean);
  if (parts.length > 1) {
    where[Op.and] = parts.map(part => ({
      [Op.or]: [
        { city: { [Op.iLike]: `%${part}%` } },
        { district: { [Op.iLike]: `%${part}%` } },
        { mandal: { [Op.iLike]: `%${part}%` } },
        { village: { [Op.iLike]: `%${part}%` } },
        { locality: { [Op.iLike]: `%${part}%` } },
      ]
    }));
  } else if (parts.length === 1) {
    const part = parts[0];
    where[Op.or] = [
      { city: { [Op.iLike]: `%${part}%` } },
      { district: { [Op.iLike]: `%${part}%` } },
      { mandal: { [Op.iLike]: `%${part}%` } },
      { village: { [Op.iLike]: `%${part}%` } },
      { locality: { [Op.iLike]: `%${part}%` } },
    ];
  }
}

export async function listProperties(query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};

  if (query.categorySlug) {
    if (query.categorySlug === 'apartments') {
      where.categorySlug = { [Op.in]: ['apartments', 'flats', 'gated-communities'] };
    } else if (query.categorySlug === 'commercial-properties') {
      where.categorySlug = { [Op.in]: ['commercial-properties', 'offices', 'shops', 'commercial-buildings'] };
    } else {
      where.categorySlug = query.categorySlug;
    }
  }
  if (query.city) {
    applyLocationFilter(where, query.city);
  }
  if (query.state) {
    where.state = { [Op.iLike]: `%${query.state}%` };
  }
  if (query.district) {
    where.district = { [Op.iLike]: `%${query.district}%` };
  }
  if (query.transactionType) where.transactionType = query.transactionType;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.status) where.status = query.status;
  else where.status = 'active'; // default public listing shows only active properties
  if (query.featured !== undefined) where.featured = query.featured === 'true';
  if (query.verified !== undefined) where.verified = query.verified === 'true';
  const structureFilters = {};
  if (query.bedrooms) structureFilters.bedrooms = query.bedrooms;
  if (query.bathrooms) structureFilters.bathrooms = query.bathrooms;
  if (query.facing) structureFilters.facing = query.facing;
  if (query.furnishing) structureFilters.furnishing = query.furnishing;

  // Admin-created custom filters (managed under Listing Filters in Property
  // Fields). Each custom filter is matched against the property field key
  // (dynamic field, structure key, or built-in column) it was bound to.
  const settings = await getSettings();
  const customFilterDefs = Array.isArray(settings.filterConfig && settings.filterConfig.custom)
    ? settings.filterConfig.custom
    : [];
  for (const cf of customFilterDefs) {
    const val = query[cf.id];
    if (val === undefined || val === null || val === '') continue;
    const key = cf.fieldKey || cf.id;
    const textMatch = cf.type === 'text';
    if (cf.source === 'structure') {
      structureFilters[key] = val;
    } else if (cf.source === 'dynamicFields') {
      where.dynamicFields = {
        ...(where.dynamicFields || {}),
        [key]: textMatch ? { [Op.iLike]: `%${val}%` } : val,
      };
    } else {
      where[key] = textMatch ? { [Op.iLike]: `%${val}%` } : val;
    }
  }
  if (Object.keys(structureFilters).length) {
    where.structure = { [Op.contains]: structureFilters };
  }

  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price[Op.gte] = query.minPrice;
    if (query.maxPrice) where.price[Op.lte] = query.maxPrice;
  }
  if (query.minArea || query.maxArea) {
    where.area = {};
    if (query.minArea) where.area[Op.gte] = query.minArea;
    if (query.maxArea) where.area[Op.lte] = query.maxArea;
  }
  if (query.search) {
    where[Op.or] = [
      { titleEn: { [Op.iLike]: `%${query.search}%` } },
      { titleTe: { [Op.iLike]: `%${query.search}%` } },
      { locality: { [Op.iLike]: `%${query.search}%` } },
      { propertyCode: { [Op.iLike]: `%${query.search}%` } },
    ];
  }

  const { rows, count } = await Property.findAndCountAll({
    where,
    include: INCLUDE,
    order: buildSort(query.sort),
    limit,
    offset,
    distinct: true,
  });

  return { items: rows, total: count, page, pageSize };
}

export async function getPropertyById(id, transaction) {
  const property = await Property.findByPk(id, { include: INCLUDE, transaction });
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  return property;
}

export async function getFeatured(limit = 8, city) {
  const where = { featured: true, status: 'active' };
  if (city) applyLocationFilter(where, city);
  return Property.findAll({ where, include: INCLUDE, order: [['createdAt', 'DESC']], limit: Number(limit) });
}

export async function getLatest(limit = 8, city) {
  const where = { status: 'active' };
  if (city) applyLocationFilter(where, city);
  return Property.findAll({ where, include: INCLUDE, order: [['createdAt', 'DESC']], limit: Number(limit) });
}

export async function getRelated(id, limit = 4) {
  const property = await getPropertyById(id);
  return Property.findAll({
    where: {
      id: { [Op.ne]: id },
      categorySlug: property.categorySlug,
      status: 'active',
    },
    include: INCLUDE,
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
  });
}

export async function recordView(id, userId) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');

  property.views += 1;
  await property.save();

  if (userId) {
    let [row] = await RecentlyViewedProperty.findOrCreate({
      where: { userId, propertyId: id },
      defaults: { viewCount: 1, viewedAt: new Date() },
    }).catch(async (err) => {
      if (err.name !== 'SequelizeUniqueConstraintError') throw err;
      return [await RecentlyViewedProperty.findOne({ where: { userId, propertyId: id } }), false];
    });
    if (!row) row = await RecentlyViewedProperty.create({ userId, propertyId: id, viewCount: 1, viewedAt: new Date() });
    row.viewCount = (Number(row.viewCount) || 0) + 1;
    row.viewedAt = new Date();
    await row.save();
  }
  return { views: property.views };
}

export async function toggleFavourite(userId, propertyId) {
  const existing = await Favourite.findOne({ where: { userId, propertyId } });
  if (existing) {
    await existing.destroy();
    return { favourited: false };
  }
  await Favourite.create({ userId, propertyId });
  return { favourited: true };
}

export async function listFavourites(userId) {
  const favourites = await Favourite.findAll({
    where: { userId },
    include: [{ model: Property, as: 'property', include: INCLUDE }],
    order: [['createdAt', 'DESC']],
  });
  return favourites.map((f) => f.property);
}

export async function listFavouriteIds(userId) {
  const favourites = await Favourite.findAll({ where: { userId }, attributes: ['propertyId'] });
  return favourites.map((f) => f.propertyId);
}

async function syncImages(propertyId, images, transaction) {
  if (!images) return;
  await PropertyImage.destroy({ where: { propertyId }, transaction });
  for (const img of images) {
    await PropertyImage.create(
      { propertyId, slotId: img.slotId, url: img.url, caption: img.caption, isPrimary: !!img.isPrimary },
      { transaction }
    );
  }
}

async function syncDocuments(propertyId, documents, transaction) {
  if (!documents) return;
  await PropertyDocument.destroy({ where: { propertyId }, transaction });

  let docsArray = [];
  if (Array.isArray(documents)) {
    docsArray = documents;
  } else if (typeof documents === 'object') {
    docsArray = Object.entries(documents)
      .filter(([_, doc]) => doc && doc.url)
      .map(([key, doc]) => ({
        type: key,
        url: doc.url,
        originalName: doc.fileName || doc.originalName,
      }));
  }

  for (const doc of docsArray) {
    await PropertyDocument.create(
      { propertyId, type: doc.type, url: doc.url, originalName: doc.originalName },
      { transaction }
    );
  }
}

const DRAFT_FIELDS = [
  'categorySlug', 'ruleKey', 'titleEn', 'titleTe', 'descriptionEn', 'descriptionTe', 'transactionType',
  'price', 'priceNegotiable', 'area', 'areaUnit', 'state', 'district', 'city', 'mandal', 'village',
  'locality', 'landmark', 'pincode', 'address', 'locationEn', 'locationTe', 'mapLat', 'mapLng',
  'ventureName', 'structure', 'plotDetails', 'amenities', 'contactName', 'contactPhone',
  'preferWhatsapp', 'preferCall', 'hidePhone',
  'villageName', 'surveyNumber', 'acres', 'acreValuation', 'totalSaleValue', 'conversion',
  'passbook', 'adangal', 'rsrCopy', 'documentationNumber', 'landDocumentHistory', 'ownerName',
  'town', 'street', 'roadFacing', 'plotFacing', 'liftFacility', 'builtUpArea', 'groundSquareYards', 'facing',
  'dynamicFields',
];

export async function createDraft(sellerId, data) {
  return sequelize.transaction(async (t) => {
    const propertyCode = await generateSequentialId('PROP', t, 4);

    const payload = { sellerId, status: 'draft', propertyCode, postedDate: new Date(), updatedDate: new Date() };
    DRAFT_FIELDS.forEach((f) => {
      if (data[f] !== undefined) payload[f] = data[f];
    });

    if (data.cityVillage !== undefined) payload.city = data.cityVillage;

    const cityVal = payload.city || '';
    const localityVal = payload.locality || '';
    payload.locationEn = localityVal ? `${localityVal}, ${cityVal}` : cityVal;
    payload.locationTe = localityVal ? `${localityVal}, ${cityVal}` : cityVal;

    const property = await Property.create(payload, { transaction: t });
    await syncImages(property.id, data.images, t);
    await syncDocuments(property.id, data.documents, t);

    return getPropertyById(property.id, t);
  });
}

function assertOwnerOrStaff(property, user) {
  const isOwner = property.sellerId === user.id;
  const isAdmin = user.role === ROLES.ADMIN;
  const isAssignedMediator = property.assignedMediatorId === user.id;
  if (user.role === ROLES.EMPLOYEE) {
    const assigned = property.assignedEmployeeId === user.id;
    if (assigned) return;
    throw new AppError('You are not allowed to access this property', 403, 'FORBIDDEN');
  }
  if (!isOwner && !isAdmin && !isAssignedMediator) {
    throw new AppError('You are not allowed to access this property', 403, 'FORBIDDEN');
  }
}

export async function updateProperty(id, data, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  assertOwnerOrStaff(property, actor);

  return sequelize.transaction(async (t) => {
    if (data.cityVillage !== undefined) data.city = data.cityVillage;

    DRAFT_FIELDS.forEach((f) => {
      if (data[f] !== undefined) property[f] = data[f];
    });

    const cityVal = property.city || '';
    const localityVal = property.locality || '';
    property.locationEn = localityVal ? `${localityVal}, ${cityVal}` : cityVal;
    property.locationTe = localityVal ? `${localityVal}, ${cityVal}` : cityVal;

    property.updatedDate = new Date();
    await property.save({ transaction: t });

    await auditLog('property.update', actor, { propertyId: property.id }, t);

    await syncImages(property.id, data.images, t);
    await syncDocuments(property.id, data.documents, t);

    return getPropertyById(property.id, t);
  });
}

export async function submitProperty(id, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  assertOwnerOrStaff(property, actor);

  return sequelize.transaction(async (t) => {
    const isAdmin = actor.role === ROLES.ADMIN;

    property.status = isAdmin ? 'active' : 'pending';
    property.moderationStatus = isAdmin ? 'completed' : 'submitted';
    property.moderationNote = isAdmin ? 'Auto-approved by Admin' : null;
    property.postedDate = property.postedDate || new Date();
    await property.save({ transaction: t });

    if (isAdmin) {
      await notifyLocationInterestedUsers(property, t);
    }

    if (!isAdmin) {
      await createNotification(
        {
          audienceRole: ROLES.ADMIN,
          type: 'property.submitted',
          relatedType: 'property',
          relatedId: property.id,
          titleEn: `Property submitted for review: ${property.titleEn || property.propertyCode}`,
          titleTe: `సమీక్ష కోసం ఆస్తి సమర్పించబడింది: ${property.titleEn || property.propertyCode}`,
        },
        t
      );
    }

    await auditLog('property.submit', actor, { propertyId: id }, t);
    return getPropertyById(id, t);
  });
}

export async function listSellerProperties(sellerId, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = { sellerId };
  if (query.status) where.status = query.status;

  const { rows, count } = await Property.findAndCountAll({
    where,
    include: STAFF_INCLUDE,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

export async function listForMediator(mediatorId, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const { rows, count } = await Property.findAndCountAll({
    where: { assignedMediatorId: mediatorId },
    include: STAFF_INCLUDE,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

export async function listForEmployee(employee, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  Object.assign(where, await buildRecordScope(employee, ['sellerId']));
  if (query.status) where.status = query.status;

  const { rows, count } = await Property.findAndCountAll({
    where,
    include: STAFF_INCLUDE,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

export async function listForAdmin(query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (query.categorySlug) {
    if (query.categorySlug === 'apartments') {
      where.categorySlug = { [Op.in]: ['apartments', 'flats', 'gated-communities'] };
    } else if (query.categorySlug === 'commercial-properties') {
      where.categorySlug = { [Op.in]: ['commercial-properties', 'offices', 'shops', 'commercial-buildings'] };
    } else {
      where.categorySlug = query.categorySlug;
    }
  }
  if (query.location || query.city) {
    applyLocationFilter(where, query.location || query.city);
  }

  const { rows, count } = await Property.findAndCountAll({
    where,
    include: STAFF_INCLUDE,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

export async function moderateProperty(id, action, note, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');

  return sequelize.transaction(async (t) => {
    let titleEn;
    let titleTe;

    if (action === 'approve') {
      property.status = 'active';
      property.moderationStatus = 'completed';
      property.moderationNote = note || null;
      titleEn = `Your property has been approved: ${property.titleEn || property.propertyCode}`;
      titleTe = `మీ ఆస్తి ఆమోదించబడింది: ${property.titleEn || property.propertyCode}`;
    } else if (action === 'reject') {
      property.status = 'rejected';
      property.moderationStatus = 'completed';
      property.moderationNote = note || null;
      titleEn = `Your property was rejected: ${note || ''}`;
      titleTe = `మీ ఆస్తి తిరస్కరించబడింది: ${note || ''}`;
    } else if (action === 'requestChanges') {
      property.status = 'changes_requested';
      property.moderationStatus = 'changes_requested';
      property.moderationNote = note || null;
      titleEn = `Changes requested on your property: ${note || ''}`;
      titleTe = `మీ ఆస్తిపై మార్పులు అభ్యర్థించబడ్డాయి: ${note || ''}`;
    } else {
      throw new AppError('Invalid moderation action', 400, 'INVALID_ACTION');
    }

    await property.save({ transaction: t });

    if (action === 'approve') {
      await notifyLocationInterestedUsers(property, t);
    }

    await createNotification(
      {
        audienceUserId: property.sellerId,
        type: `property.${action}`,
        relatedType: 'property',
        relatedId: property.id,
        titleEn,
        titleTe,
      },
      t
    );

    await auditLog(`property.${action}`, actor, { propertyId: id, note }, t);
    return getPropertyById(id, t);
  });
}

export async function deleteProperty(id, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  assertOwnerOrStaff(property, actor);

  await property.destroy();
  await auditLog('property.delete', actor, { propertyId: id });
  return true;
}

export async function assignProperty(id, { assignedEmployeeId, assignedMediatorId }, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');

  return sequelize.transaction(async (t) => {
    if (assignedEmployeeId !== undefined) property.assignedEmployeeId = assignedEmployeeId;
    if (assignedMediatorId !== undefined) property.assignedMediatorId = assignedMediatorId;
    property.assignedBy = actor.id;
    property.assignedAt = new Date();
    await property.save({ transaction: t });

    if (assignedEmployeeId) {
      await createNotification(
        {
          audienceUserId: assignedEmployeeId,
          type: 'property.assigned',
          relatedType: 'property',
          relatedId: property.id,
          titleEn: `Property assigned to you: ${property.titleEn || property.propertyCode}`,
          titleTe: `మీకు ఆస్తి కేటాయించబడింది: ${property.titleEn || property.propertyCode}`,
        },
        t
      );
    }
    if (assignedMediatorId) {
      await createNotification(
        {
          audienceUserId: assignedMediatorId,
          type: 'property.assigned',
          relatedType: 'property',
          relatedId: property.id,
          titleEn: `Property assigned to you: ${property.titleEn || property.propertyCode}`,
          titleTe: `మీకు ఆస్తి కేటాయించబడింది: ${property.titleEn || property.propertyCode}`,
        },
        t
      );
    }

    await auditLog('property.assign', actor, { propertyId: id, assignedEmployeeId, assignedMediatorId }, t);
    return getPropertyById(id, t);
  });
}

export async function setFeatured(id, featured, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  property.featured = featured;
  await property.save();
  await auditLog('property.feature', actor, { propertyId: id, featured });
  return getPropertyById(id);
}

export async function setVerified(id, verified, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  property.verified = verified;
  await property.save();
  await auditLog('property.verify', actor, { propertyId: id, verified });
  return getPropertyById(id);
}

export async function markSold(id, actor) {
  const property = await Property.findByPk(id);
  if (!property) throw new AppError('Property not found', 404, 'NOT_FOUND');
  property.status = 'sold';
  await property.save();
  await auditLog('property.markSold', actor, { propertyId: id });
  return getPropertyById(id);
}

const LOCATION_IMAGES = {
  guntur: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=600&q=60',
  vijayawada: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=600&q=60',
  hyderabad: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=60',
  mangalagiri: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=600&q=60',
  tenali: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=600&q=60',
  ongole: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=600&q=60',
  visakhapatnam: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=60',
  warangal: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=60',
};
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=600&q=60';

export async function getPopularLocations(limit = 6) {
  const { fn, col } = await import('sequelize');
  const results = await Property.findAll({
    attributes: ['city', [fn('COUNT', col('id')), 'count']],
    where: { status: 'active', city: { [Op.ne]: null } },
    group: ['city'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit,
    raw: true,
  });

  return results
    .filter((r) => r.city && r.city.trim())
    .map((r) => ({
      city: r.city,
      count: Number(r.count),
      image: LOCATION_IMAGES[r.city.toLowerCase()] || DEFAULT_IMAGE,
    }));
}
