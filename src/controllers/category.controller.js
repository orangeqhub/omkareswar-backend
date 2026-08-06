import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import * as categoryService from '../services/category.service.js';

export const listPublic = asyncHandler(async (req, res) => {
  const data = await categoryService.listPublicCategories();
  sendSuccess(res, { message: 'Categories fetched', data });
});

export const listAll = asyncHandler(async (req, res) => {
  const data = await categoryService.listAllCategories();
  sendSuccess(res, { message: 'Categories fetched', data });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await categoryService.getCategory(req.params.slug);
  sendSuccess(res, { message: 'Category fetched', data });
});

export const create = asyncHandler(async (req, res) => {
  const data = await categoryService.createCategory(req.body, req.user);
  sendSuccess(res, { message: 'Category created', data, statusCode: 201 });
});

export const update = asyncHandler(async (req, res) => {
  const data = await categoryService.updateCategory(req.params.slug, req.body, req.user);
  sendSuccess(res, { message: 'Category updated', data });
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.slug, req.user);
  sendSuccess(res, { message: 'Category deleted', data: null });
});

export const reorder = asyncHandler(async (req, res) => {
  const data = await categoryService.reorderCategory(req.params.slug, req.body.direction, req.user);
  sendSuccess(res, { message: 'Category reordered', data });
});

export const inUse = asyncHandler(async (req, res) => {
  const used = await categoryService.isCategoryInUse(req.params.slug);
  sendSuccess(res, { message: 'Checked', data: { inUse: used } });
});
