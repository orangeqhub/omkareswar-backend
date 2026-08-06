import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendList } from '../utils/response.js';
import * as propertyService from '../services/property.service.js';
import * as categoryService from '../services/category.service.js';

export const list = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await propertyService.listProperties(req.query);
  sendList(res, { items, total, page, pageSize });
});

export const getOne = asyncHandler(async (req, res) => {
  const data = await propertyService.getPropertyById(req.params.id);
  sendSuccess(res, { message: 'Property fetched', data });
});

export const featured = asyncHandler(async (req, res) => {
  const data = await propertyService.getFeatured(req.query.limit, req.query.city);
  sendSuccess(res, { message: 'Featured properties fetched', data });
});

export const latest = asyncHandler(async (req, res) => {
  const data = await propertyService.getLatest(req.query.limit, req.query.city);
  sendSuccess(res, { message: 'Latest properties fetched', data });
});

export const related = asyncHandler(async (req, res) => {
  const data = await propertyService.getRelated(req.params.id, req.query.limit);
  sendSuccess(res, { message: 'Related properties fetched', data });
});

export const recordView = asyncHandler(async (req, res) => {
  const data = await propertyService.recordView(req.params.id, req.user?.id);
  sendSuccess(res, { message: 'View recorded', data });
});

export const toggleFavourite = asyncHandler(async (req, res) => {
  const data = await propertyService.toggleFavourite(req.params.userId, req.params.propertyId);
  sendSuccess(res, { message: 'Favourite toggled', data });
});

export const listFavourites = asyncHandler(async (req, res) => {
  const data = await propertyService.listFavourites(req.params.userId);
  sendSuccess(res, { message: 'Favourites fetched', data });
});

export const listFavouriteIds = asyncHandler(async (req, res) => {
  const data = await propertyService.listFavouriteIds(req.params.userId);
  sendSuccess(res, { message: 'Favourite ids fetched', data });
});

export const createDraft = asyncHandler(async (req, res) => {
  const sellerId = req.body.sellerId || req.user.id;
  const data = await propertyService.createDraft(sellerId, req.body);
  sendSuccess(res, { message: 'Draft created', data, statusCode: 201 });
});

export const update = asyncHandler(async (req, res) => {
  const data = await propertyService.updateProperty(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Property updated', data });
});

export const submit = asyncHandler(async (req, res) => {
  const data = await propertyService.submitProperty(req.params.id, req.user);
  sendSuccess(res, { message: 'Property submitted for review', data });
});

export const sellerProperties = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await propertyService.listSellerProperties(req.params.sellerId, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const myProperties = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await propertyService.listSellerProperties(req.user.id, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const mediatorProperties = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await propertyService.listForMediator(req.user.id, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const employeeProperties = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await propertyService.listForEmployee(req.user, req.query);
  sendList(res, { items, total, page, pageSize });
});

export const adminProperties = asyncHandler(async (req, res) => {
  const { items, total, page, pageSize } = await propertyService.listForAdmin(req.query);
  sendList(res, { items, total, page, pageSize });
});

export const moderate = asyncHandler(async (req, res) => {
  const data = await propertyService.moderateProperty(req.params.id, req.body.action, req.body.note, req.user);
  sendSuccess(res, { message: 'Property moderated', data });
});

export const approve = asyncHandler(async (req, res) => {
  const data = await propertyService.moderateProperty(req.params.id, 'approve', req.body.note, req.user);
  sendSuccess(res, { message: 'Property approved', data });
});

export const reject = asyncHandler(async (req, res) => {
  const data = await propertyService.moderateProperty(req.params.id, 'reject', req.body.note, req.user);
  sendSuccess(res, { message: 'Property rejected', data });
});

export const requestChanges = asyncHandler(async (req, res) => {
  const data = await propertyService.moderateProperty(req.params.id, 'requestChanges', req.body.note, req.user);
  sendSuccess(res, { message: 'Changes requested', data });
});

export const remove = asyncHandler(async (req, res) => {
  await propertyService.deleteProperty(req.params.id, req.user);
  sendSuccess(res, { message: 'Property deleted', data: null });
});

export const assign = asyncHandler(async (req, res) => {
  const data = await propertyService.assignProperty(req.params.id, req.body, req.user);
  sendSuccess(res, { message: 'Property assigned', data });
});

export const assignEmployee = asyncHandler(async (req, res) => {
  const data = await propertyService.assignProperty(req.params.id, { assignedEmployeeId: req.body.assignedEmployeeId }, req.user);
  sendSuccess(res, { message: 'Employee assigned', data });
});

export const assignMediator = asyncHandler(async (req, res) => {
  const data = await propertyService.assignProperty(req.params.id, { assignedMediatorId: req.body.assignedMediatorId }, req.user);
  sendSuccess(res, { message: 'Mediator assigned', data });
});

export const feature = asyncHandler(async (req, res) => {
  const data = await propertyService.setFeatured(req.params.id, req.body.featured !== false, req.user);
  sendSuccess(res, { message: 'Property featured status updated', data });
});

export const verify = asyncHandler(async (req, res) => {
  const data = await propertyService.setVerified(req.params.id, req.body.verified !== false, req.user);
  sendSuccess(res, { message: 'Property verified status updated', data });
});

export const markSold = asyncHandler(async (req, res) => {
  const data = await propertyService.markSold(req.params.id, req.user);
  sendSuccess(res, { message: 'Property marked as sold', data });
});

export const categoryInUse = asyncHandler(async (req, res) => {
  const used = await categoryService.isCategoryInUse(req.params.slug);
  sendSuccess(res, { message: 'Checked', data: { inUse: used } });
});
