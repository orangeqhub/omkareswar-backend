import ExcelJS from 'exceljs';
import { User, Property, Enquiry, Visit, FollowUp, Commission } from '../models/index.js';

async function buildWorkbook(sheetName, columns, rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns;
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  return workbook;
}

export async function usersReport(query) {
  const where = {};
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;

  const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
  return buildWorkbook(
    'Users',
    [
      { header: 'Member ID', key: 'memberId', width: 18 },
      { header: 'Name', key: 'name', width: 24 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Mobile', key: 'mobile', width: 14 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ],
    users.map((u) => u.toJSON())
  );
}

export async function propertiesReport(query) {
  const where = {};
  if (query.status) where.status = query.status;
  if (query.categorySlug) where.categorySlug = query.categorySlug;

  const properties = await Property.findAll({ where, order: [['createdAt', 'DESC']] });
  return buildWorkbook(
    'Properties',
    [
      { header: 'Property Code', key: 'propertyCode', width: 18 },
      { header: 'Title', key: 'titleEn', width: 30 },
      { header: 'Category', key: 'categorySlug', width: 18 },
      { header: 'City', key: 'city', width: 16 },
      { header: 'Price', key: 'price', width: 14 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Views', key: 'views', width: 10 },
      { header: 'Seller Id', key: 'sellerId', width: 36 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ],
    properties.map((p) => p.toJSON())
  );
}

export async function enquiriesReport(query) {
  const where = {};
  if (query.status) where.status = query.status;

  const enquiries = await Enquiry.findAll({ where, order: [['createdAt', 'DESC']] });
  return buildWorkbook(
    'Enquiries',
    [
      { header: 'Enquiry Code', key: 'enquiryCode', width: 18 },
      { header: 'Buyer Name', key: 'buyerName', width: 22 },
      { header: 'Buyer Phone', key: 'buyerPhone', width: 16 },
      { header: 'Property Id', key: 'propertyId', width: 36 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 20 },
    ],
    enquiries.map((e) => e.toJSON())
  );
}

export async function visitsReport(query) {
  const where = {};
  if (query.status) where.status = query.status;

  const visits = await Visit.findAll({ where, order: [['scheduledFor', 'DESC']] });
  return buildWorkbook(
    'Visits',
    [
      { header: 'Visit Code', key: 'visitCode', width: 18 },
      { header: 'Buyer Name', key: 'buyerName', width: 22 },
      { header: 'Property Id', key: 'propertyId', width: 36 },
      { header: 'Scheduled For', key: 'scheduledFor', width: 20 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Outcome', key: 'outcome', width: 18 },
    ],
    visits.map((v) => v.toJSON())
  );
}

export async function followUpsReport(query) {
  const where = {};
  if (query.status) where.status = query.status;

  const followUps = await FollowUp.findAll({ where, order: [['dueDate', 'DESC']] });
  return buildWorkbook(
    'Follow Ups',
    [
      { header: 'Record Type', key: 'recordType', width: 16 },
      { header: 'Record Id', key: 'recordId', width: 36 },
      { header: 'Assigned Employee Id', key: 'assignedEmployeeId', width: 36 },
      { header: 'Due Date', key: 'dueDate', width: 14 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 14 },
    ],
    followUps.map((f) => f.toJSON())
  );
}

export async function commissionsReport(query) {
  const where = {};
  if (query.status) where.status = query.status;

  const commissions = await Commission.findAll({ where, order: [['createdAt', 'DESC']] });
  return buildWorkbook(
    'Commissions',
    [
      { header: 'Property Id', key: 'propertyId', width: 36 },
      { header: 'Mediator Id', key: 'mediatorId', width: 36 },
      { header: 'Employee Id', key: 'employeeId', width: 36 },
      { header: 'Amount', key: 'amount', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
    ],
    commissions.map((c) => c.toJSON())
  );
}
