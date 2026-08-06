import { sequelize, Enquiry, Property, CallNote } from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { getPagination } from '../utils/pagination.js';
import { createNotification } from './notification.service.js';
import { log as auditLog } from './auditLog.service.js';

const INCLUDE = [{ model: Property, as: 'property' }, { model: CallNote, as: 'callNotes' }];
export async function createEnquiry(data) {
  let property = null;

  /*
   * Property ID unte property-related enquiry.
   * Property ID lekapothe generic Contact page enquiry.
   */
  if (data.propertyId) {
    property = await Property.findByPk(data.propertyId);

    if (!property) {
      throw new AppError(
        'Property not found',
        404,
        'NOT_FOUND'
      );
    }
  }

  /*
   * Property enquiry ayithe seller property nundi derive avutadu.
   * Contact enquiry ayithe sellerId null ga untundi.
   */
  const sellerId =
    data.sellerId ||
    property?.sellerId ||
    null;

  return sequelize.transaction(async (t) => {
    const enquiryCode =
      await generateSequentialId('ENQ', t);

    const enquiry = await Enquiry.create(
      {
        enquiryCode,

        propertyId:
          data.propertyId || null,

        sellerId,

        buyerId:
          data.buyerId || null,

        buyerName:
          data.buyerName,

        buyerPhone:
          data.buyerPhone,

        message:
          data.message || null,

        channel:
          data.channel || 'contact',

        status: 'new',

        priority:
          data.priority || 'medium',
      },
      {
        transaction: t,
      }
    );

    /*
     * Seller unte mātrame seller notification create cheyyali.
     * Generic Contact enquiry lo sellerId undadu.
     */
    if (sellerId) {
      const propertyName =
        property?.titleEn ||
        property?.propertyCode ||
        'property';

      await createNotification(
        {
          audienceUserId: sellerId,
          type: 'enquiry.new',
          relatedType: 'enquiry',
          relatedId: enquiry.id,
          titleEn:
            `A buyer showed interest for your property: ${propertyName}`,
          titleTe:
            `మీ ఆస్తి పై ఒక కొనుగోలుదారు ఆసక్తి చూపారు`,
        },
        t
      );
    }

    /*
     * Contact enquiry aina, property enquiry aina
     * Admin ki notification compulsory.
     */
    await createNotification(
      {
        audienceRole: ROLES.ADMIN,
        type: 'enquiry.new',
        relatedType: 'enquiry',
        relatedId: enquiry.id,
        titleEn:
          `New enquiry: ${enquiry.enquiryCode}`,
        titleTe:
          `కొత్త విచారణ: ${enquiry.enquiryCode}`,
      },
      t
    );

    await auditLog(
      'enquiry.create',
      {
        id: data.buyerId || null,
        role: data.buyerId
          ? ROLES.BUYER
          : null,
      },
      {
        enquiryId: enquiry.id,
        source: data.propertyId
          ? 'property'
          : 'contact',
      },
      t
    );

    return Enquiry.findByPk(enquiry.id, {
      include: INCLUDE,
      transaction: t,
    });
  });
}

export async function listSellerEnquiries(sellerId, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = { sellerId };
  if (query.status) where.status = query.status;

  const { rows, count } = await Enquiry.findAndCountAll({ where, include: INCLUDE, order: [['createdAt', 'DESC']], limit, offset });
  const sanitized = rows.map((r) => {
    const data = r.toJSON();
    data.buyerName = 'enquiries.buyerShowedInterest';
    data.buyerPhone = '••••••••••';
    data.message = 'enquiries.interestMessage';
    return data;
  });
  return { items: sanitized, total: count, page, pageSize };
}

export async function listAdminEnquiries(viewer, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  if (query.status) where.status = query.status;
  if (viewer.role === ROLES.MEDIATOR) where.assignedMediatorId = viewer.id;

  const { rows, count } = await Enquiry.findAndCountAll({ where, include: INCLUDE, order: [['createdAt', 'DESC']], limit, offset });
  return { items: rows, total: count, page, pageSize };
}

export async function listEmployeeEnquiries(employee, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const where = {};
  if (!(employee.permissions || []).includes(PERMISSIONS.VIEW_UNASSIGNED_RECORDS)) {
    where.assignedEmployeeId = employee.id;
  }
  if (query.status) where.status = query.status;

  const { rows, count } = await Enquiry.findAndCountAll({ where, include: INCLUDE, order: [['createdAt', 'DESC']], limit, offset });
  return { items: rows, total: count, page, pageSize };
}

export async function listBuyerEnquiries(phone, query) {
  const { page, pageSize, limit, offset } = getPagination(query);
  const { rows, count } = await Enquiry.findAndCountAll({
    where: { buyerPhone: phone },
    include: INCLUDE,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}

export async function getOne(id, transaction) {
  const enquiry = await Enquiry.findByPk(id, { include: INCLUDE, transaction });
  if (!enquiry) throw new AppError('Enquiry not found', 404, 'NOT_FOUND');
  return enquiry;
}

async function getOrThrow(id) {
  const enquiry = await Enquiry.findByPk(id);
  if (!enquiry) throw new AppError('Enquiry not found', 404, 'NOT_FOUND');
  return enquiry;
}

export async function updateStatus(id, status, actor) {
  const enquiry = await getOrThrow(id);
  enquiry.status = status;
  await enquiry.save();
  await auditLog('enquiry.statusUpdate', actor, { enquiryId: id, status });
  return getOne(id);
}

export async function updatePriority(id, priority, actor) {
  const enquiry = await getOrThrow(id);
  enquiry.priority = priority;
  await enquiry.save();
  await auditLog('enquiry.priorityUpdate', actor, { enquiryId: id, priority });
  return getOne(id);
}

export async function updateNextFollowUp(id, nextFollowUpAt, actor) {
  const enquiry = await getOrThrow(id);
  enquiry.nextFollowUpAt = nextFollowUpAt;
  await enquiry.save();
  await auditLog('enquiry.nextFollowUpUpdate', actor, { enquiryId: id, nextFollowUpAt });
  return getOne(id);
}

export async function complete(id, actor) {
  const enquiry = await getOrThrow(id);
  enquiry.status = 'closed';
  enquiry.completedAt = new Date();
  await enquiry.save();
  await auditLog('enquiry.complete', actor, { enquiryId: id });
  return getOne(id);
}

export async function assignEmployee(id, employeeId, actor) {
  const enquiry = await getOrThrow(id);
  return sequelize.transaction(async (t) => {
    enquiry.assignedEmployeeId = employeeId;
    enquiry.assignedBy = actor.id;
    await enquiry.save({ transaction: t });

    await createNotification(
      {
        audienceUserId: employeeId,
        type: 'enquiry.assigned',
        relatedType: 'enquiry',
        relatedId: enquiry.id,
        titleEn: `Enquiry assigned to you: ${enquiry.enquiryCode}`,
        titleTe: `మీకు విచారణ కేటాయించబడింది: ${enquiry.enquiryCode}`,
      },
      t
    );
    await auditLog('enquiry.assignEmployee', actor, { enquiryId: id, employeeId }, t);
    return getOne(id, t);
  });
}

export async function assignMediator(id, mediatorId, actor) {
  const enquiry = await getOrThrow(id);
  return sequelize.transaction(async (t) => {
    enquiry.assignedMediatorId = mediatorId;
    enquiry.assignedBy = actor.id;
    await enquiry.save({ transaction: t });

    await createNotification(
      {
        audienceUserId: mediatorId,
        type: 'enquiry.assigned',
        relatedType: 'enquiry',
        relatedId: enquiry.id,
        titleEn: `Enquiry assigned to you: ${enquiry.enquiryCode}`,
        titleTe: `మీకు విచారణ కేటాయించబడింది: ${enquiry.enquiryCode}`,
      },
      t
    );
    await auditLog('enquiry.assignMediator', actor, { enquiryId: id, mediatorId }, t);
    return getOne(id, t);
  });
}
