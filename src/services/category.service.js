import { Category, Property } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { log as auditLog } from './auditLog.service.js';

export async function listPublicCategories() {
  return Category.findAll({ where: { active: true, visible: true }, order: [['order', 'ASC']] });
}

export async function listAllCategories() {
  return Category.findAll({ order: [['order', 'ASC']] });
}

export async function getCategory(slug) {
  const category = await Category.findOne({ where: { slug } });
  if (!category) throw new AppError('Category not found', 404, 'NOT_FOUND');
  return category;
}

export async function createCategory(data, actor) {
  const existing = await Category.findOne({ where: { slug: data.slug } });
  if (existing) throw new AppError('A category with this slug already exists', 409, 'DUPLICATE');

  const maxOrder = (await Category.max('order')) || 0;
  const category = await Category.create({ ...data, order: data.order ?? maxOrder + 1 });
  await auditLog('category.create', actor, { slug: category.slug });
  return category;
}

export async function updateCategory(slug, data, actor) {
  const category = await getCategory(slug);

  if (data.slug && data.slug !== slug) {
    const inUse = await isCategoryInUse(slug);
    if (inUse) throw new AppError('Cannot rename slug: category is in use by properties', 400, 'CATEGORY_IN_USE');
  }

  Object.assign(category, data);
  await category.save();
  await auditLog('category.update', actor, { slug });
  return category;
}

export async function deleteCategory(slug, actor) {
  const category = await getCategory(slug);
  const inUse = await isCategoryInUse(slug);
  if (inUse) throw new AppError('Cannot delete: category is in use by properties', 400, 'CATEGORY_IN_USE');

  await category.destroy();
  await auditLog('category.delete', actor, { slug });
  return true;
}

export async function reorderCategory(slug, direction, actor) {
  const category = await getCategory(slug);
  const all = await Category.findAll({ order: [['order', 'ASC']] });
  const index = all.findIndex((c) => c.id === category.id);

  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= all.length) return category;

  const other = all[swapIndex];
  const tempOrder = category.order;
  category.order = other.order;
  other.order = tempOrder;

  await category.save();
  await other.save();
  await auditLog('category.reorder', actor, { slug, direction });
  return category;
}

export async function isCategoryInUse(slug) {
  const count = await Property.count({ where: { categorySlug: slug } });
  return count > 0;
}
