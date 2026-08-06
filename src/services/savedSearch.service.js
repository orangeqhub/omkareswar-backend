import { SavedSearch } from '../models/index.js';
import AppError from '../utils/AppError.js';

export async function list(userId) {
  return SavedSearch.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
}

export async function create(userId, data) {
  return SavedSearch.create({
    userId,
    name: data.name,
    city: data.city,
    categorySlug: data.categorySlug,
    minPrice: data.minPrice,
    maxPrice: data.maxPrice,
  });
}

export async function remove(id, userId) {
  const search = await SavedSearch.findOne({ where: { id, userId } });
  if (!search) throw new AppError('Saved search not found', 404, 'NOT_FOUND');
  await search.destroy();
  return true;
}
