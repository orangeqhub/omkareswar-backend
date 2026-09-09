import { LandingLead } from '../models/index.js';
import { getPagination } from '../utils/pagination.js';

export async function create(data) {
  return LandingLead.create({
    name: data.name,
    contact: data.contact,
    cityVillage: data.cityVillage || null,
    role: data.role || 'buyer',
    source: 'landing_page', // server-forced; a stamped client source is never trusted
  });
}

export async function adminList(query) {
  const { page, pageSize, limit, offset } = getPagination(query, 50, 200);
  const { rows, count } = await LandingLead.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { items: rows, total: count, page, pageSize };
}