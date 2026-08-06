import asyncHandler from '../utils/asyncHandler.js';
import * as reportService from '../services/report.service.js';

async function sendWorkbook(res, workbook, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

export const users = asyncHandler(async (req, res) => {
  const workbook = await reportService.usersReport(req.query);
  await sendWorkbook(res, workbook, 'users.xlsx');
});

export const properties = asyncHandler(async (req, res) => {
  const workbook = await reportService.propertiesReport(req.query);
  await sendWorkbook(res, workbook, 'properties.xlsx');
});

export const enquiries = asyncHandler(async (req, res) => {
  const workbook = await reportService.enquiriesReport(req.query);
  await sendWorkbook(res, workbook, 'enquiries.xlsx');
});

export const visits = asyncHandler(async (req, res) => {
  const workbook = await reportService.visitsReport(req.query);
  await sendWorkbook(res, workbook, 'visits.xlsx');
});

export const followUps = asyncHandler(async (req, res) => {
  const workbook = await reportService.followUpsReport(req.query);
  await sendWorkbook(res, workbook, 'follow-ups.xlsx');
});

export const commissions = asyncHandler(async (req, res) => {
  const workbook = await reportService.commissionsReport(req.query);
  await sendWorkbook(res, workbook, 'commissions.xlsx');
});
