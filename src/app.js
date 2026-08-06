import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';

import sequelize from './config/database.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

import authRoutes from './routes/auth.routes.js';
import registrationRoutes, { adminRouter as adminRegistrationRoutes } from './routes/registration.routes.js';
import userRoutes, { adminRouter as adminUserRoutes } from './routes/user.routes.js';
import categoryRoutes, { adminRouter as adminCategoryRoutes } from './routes/category.routes.js';
import mediaRuleRoutes, { adminRouter as adminMediaRuleRoutes } from './routes/mediaRule.routes.js';
import propertyRoutes, {
  sellerRouter as propertySellerRouter,
  favouriteRouter,
  meRouter as propertyMeRouter,
  mediatorRouter as propertyMediatorRouter,
  employeeRouter as propertyEmployeeRouter,
  adminRouter as adminPropertyRoutes,
} from './routes/property.routes.js';
import propertyModerationRoutes from './routes/propertyModeration.routes.js';
import userVerificationRoutes from './routes/userVerification.routes.js';
import enquiryRoutes, {
  callNoteRouter,
  sellerRouter as enquirySellerRouter,
  buyerRouter as enquiryBuyerRouter,
  employeeRouter as enquiryEmployeeRouter,
  adminRouter as adminEnquiryRoutes,
} from './routes/enquiry.routes.js';
import visitRoutes, {
  meRouter as visitMeRouter,
  sellerRouter as visitSellerRouter,
  mediatorRouter as visitMediatorRouter,
  employeeRouter as visitEmployeeRouter,
  adminRouter as adminVisitRoutes,
} from './routes/visit.routes.js';
import followUpRoutes, { employeeRouter as followUpEmployeeRouter, adminRouter as adminFollowUpRoutes } from './routes/followUp.routes.js';
import favouriteRoutes from './routes/favourite.routes.js';
import savedSearchRoutes from './routes/savedSearch.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import internalNoteRoutes from './routes/internalNote.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';
import cmsRoutes, { adminRouter as adminCmsRoutes } from './routes/cms.routes.js';
import appSettingsRoutes from './routes/appSettings.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import reportRoutes from './routes/report.routes.js';
import {
  adminRouter as adminDashboardRoutes,
  employeeRouter as employeeDashboardRoutes,
  buyerRouter as buyerDashboardRoutes,
  sellerRouter as sellerDashboardRoutes,
  mediatorRouter as mediatorDashboardRoutes,
} from './routes/dashboard.routes.js';

dotenv.config();

const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '70mb' }));
app.use(express.urlencoded({ limit: '70mb', extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      data: {
        db: 'connected',
        time: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      data: {
        db: 'disconnected',
        time: new Date().toISOString(),
      },
    });
  }
});

// ---- Auth & registration ----
app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admin/registrations', adminRegistrationRoutes);

// ---- Users & employees ----
app.use('/api/users', userRoutes);
app.use('/api/users', favouriteRouter); // /api/users/:userId/favourites...
app.use('/api/admin', adminUserRoutes); // /api/admin/employees, /api/admin/users/:id/assign-mediator

// ---- Categories & media rules ----
app.use('/api/categories', categoryRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/media-rules', mediaRuleRoutes);
app.use('/api/admin/media-rules', adminMediaRuleRoutes);

// ---- Properties ----
app.use('/api/properties', propertyRoutes);
app.use('/api/sellers', propertySellerRouter); // /api/sellers/:sellerId/properties
app.use('/api/sellers', enquirySellerRouter); // /api/sellers/:sellerId/enquiries
app.use('/api/me', propertyMeRouter); // /api/me/properties
app.use('/api/me', visitMeRouter); // /api/me/visits
app.use('/api/mediator', propertyMediatorRouter); // /api/mediator/properties
app.use('/api/mediator', visitMediatorRouter); // /api/mediator/visits
app.use('/api/mediator/dashboard', mediatorDashboardRoutes);
app.use('/api/employee', propertyEmployeeRouter); // /api/employee/properties
app.use('/api/employee', visitEmployeeRouter); // /api/employee/visits
app.use('/api/employee', enquiryEmployeeRouter); // /api/employee/enquiries
app.use('/api/employee', followUpEmployeeRouter); // /api/employee/follow-ups
app.use('/api/employee/dashboard', employeeDashboardRoutes);
app.use('/api/employee/property-moderation', propertyModerationRoutes);
app.use('/api/employee/user-verification', userVerificationRoutes);
app.use('/api/admin/properties', adminPropertyRoutes);

// ---- Enquiries & call notes ----
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/call-notes', callNoteRouter);
app.use('/api/buyers', enquiryBuyerRouter);
app.use('/api/admin/enquiries', adminEnquiryRoutes);

// ---- Visits ----
app.use('/api/visits', visitRoutes);
app.use('/api/seller', visitSellerRouter); // /api/seller/visits
app.use('/api/seller/dashboard', sellerDashboardRoutes);
app.use('/api/buyer/dashboard', buyerDashboardRoutes);
app.use('/api/admin/visits', adminVisitRoutes);

// ---- Follow ups ----
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/admin/follow-ups', adminFollowUpRoutes);

// ---- Favourites & saved searches ----
app.use('/api/favourites', favouriteRoutes);
app.use('/api/saved-searches', savedSearchRoutes);

// ---- Notifications, internal notes, audit logs ----
app.use('/api/notifications', notificationRoutes);
app.use('/api/internal-notes', internalNoteRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);

// ---- CMS & settings ----
app.use('/api/cms', cmsRoutes);
app.use('/api/admin/cms', adminCmsRoutes);
app.use('/api/admin/settings', appSettingsRoutes);

// ---- Uploads & reports ----
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin/reports', reportRoutes);

// ---- Dashboards ----
app.use('/api/admin/dashboard', adminDashboardRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
