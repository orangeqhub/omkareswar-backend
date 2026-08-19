import { Op } from 'sequelize';
import {
  User,
  Property,
  Enquiry,
  Visit,
  FollowUp,
  Notification,
  Favourite,
  AuditLog,
  CallNote,
} from '../models/index.js';
import { ROLES } from '../constants/roles.js';
import { buildRecordScope, buildFollowUpScope } from '../utils/recordAccess.js';

export async function adminDashboard() {
  const [totalUsers, pendingRegistrations, totalProperties, pendingProperties, activeProperties, totalEnquiries, newEnquiries, totalVisits, upcomingVisits] =
    await Promise.all([
      User.count({ where: { role: { [Op.in]: [ROLES.BUYER, ROLES.SELLER, ROLES.MEDIATOR] } } }),
      User.count({ where: { role: { [Op.in]: [ROLES.BUYER, ROLES.SELLER, ROLES.MEDIATOR] }, status: 'pending' } }),
      Property.count(),
      Property.count({ where: { status: 'pending' } }),
      Property.count({ where: { status: 'active' } }),
      Enquiry.count(),
      Enquiry.count({ where: { status: 'new' } }),
      Visit.count(),
      Visit.count({ where: { status: { [Op.in]: ['scheduled', 'confirmed'] }, scheduledFor: { [Op.gte]: new Date() } } }),
    ]);

  return {
    counts: {
      totalUsers,
      pendingRegistrations,
      totalProperties,
      pendingProperties,
      activeProperties,
      totalEnquiries,
      newEnquiries,
      totalVisits,
      upcomingVisits,
    },
  };
}

export async function employeeDashboard(employee) {
  const [followUpWhere, enquiryWhere, visitWhere] = await Promise.all([
    buildFollowUpScope(employee),
    buildRecordScope(employee, ['buyerId', 'sellerId']),
    buildRecordScope(employee, ['buyerId', 'sellerId']),
  ]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [totalAssigned, pending, inProgress, completed, allFollowUps, assignedEnquiries, upcomingVisitsCount, recentNotifications] =
    await Promise.all([
      FollowUp.count({ where: followUpWhere }),
      FollowUp.count({ where: { ...followUpWhere, status: 'assigned' } }),
      FollowUp.count({ where: { ...followUpWhere, status: 'in_progress' } }),
      FollowUp.count({ where: { ...followUpWhere, status: 'completed' } }),
      FollowUp.findAll({ where: followUpWhere }),
      Enquiry.count({ where: enquiryWhere }),
      Visit.count({ where: { ...visitWhere, status: { [Op.in]: ['scheduled', 'confirmed'] }, scheduledFor: { [Op.gte]: now } } }),
      Notification.findAll({
        where: { [Op.or]: [{ audienceUserId: employee.id }, { audienceRole: ROLES.EMPLOYEE }] },
        order: [['createdAt', 'DESC']],
        limit: 10,
      }),
    ]);

  const overdue = allFollowUps.filter((f) => {
    const due = new Date(`${f.dueDate}T${f.dueTime || '23:59'}`);
    return due < now && !['completed', 'cancelled'].includes(f.status);
  }).length;

  const todaysFollowUps = allFollowUps.filter((f) => {
    const due = new Date(f.dueDate);
    return due >= startOfToday && due < endOfToday;
  });

  const todaysTasks = todaysFollowUps.filter((f) => !['completed', 'cancelled'].includes(f.status));
  const overdueTasks = allFollowUps.filter((f) => {
    const due = new Date(`${f.dueDate}T${f.dueTime || '23:59'}`);
    return due < now && !['completed', 'cancelled'].includes(f.status);
  });

  const recentAssignments = [...allFollowUps]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  const upcomingFollowUps = allFollowUps
    .filter((f) => new Date(f.dueDate) >= startOfToday && !['completed', 'cancelled'].includes(f.status))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 10);

  const upcomingVisits = await Visit.findAll({
    where: { ...visitWhere, status: { [Op.in]: ['scheduled', 'confirmed'] }, scheduledFor: { [Op.gte]: now } },
    order: [['scheduledFor', 'ASC']],
    limit: 10,
  });

  return {
    counts: {
      totalAssigned,
      pending,
      inProgress,
      completed,
      overdue,
      assignedEnquiries,
      todaysFollowUps: todaysFollowUps.length,
      upcomingVisits: upcomingVisitsCount,
    },
    sections: {
      todaysTasks,
      overdueTasks,
      recentAssignments,
      upcomingFollowUps,
      upcomingVisits,
      recentNotifications,
    },
    workCompletion: {
      total: totalAssigned,
      completed,
      rate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0,
    },
  };
}

export async function buyerDashboard(buyerId) {
  const [favouritesCount, enquiriesCount, upcomingVisits, recentNotifications] = await Promise.all([
    Favourite.count({ where: { userId: buyerId } }),
    Enquiry.count({ where: { buyerId } }),
    Visit.findAll({ where: { buyerId, status: { [Op.in]: ['scheduled', 'confirmed'] }, scheduledFor: { [Op.gte]: new Date() } }, order: [['scheduledFor', 'ASC']], limit: 5 }),
    Notification.findAll({ where: { audienceUserId: buyerId }, order: [['createdAt', 'DESC']], limit: 10 }),
  ]);

  return {
    counts: { favouritesCount, enquiriesCount, upcomingVisitsCount: upcomingVisits.length },
    sections: { upcomingVisits, recentNotifications },
  };
}

export async function sellerDashboard(sellerId) {
  const [totalProperties, activeProperties, pendingProperties, totalEnquiries, newEnquiries, upcomingVisits] = await Promise.all([
    Property.count({ where: { sellerId } }),
    Property.count({ where: { sellerId, status: 'active' } }),
    Property.count({ where: { sellerId, status: 'pending' } }),
    Enquiry.count({ where: { sellerId } }),
    Enquiry.count({ where: { sellerId, status: 'new' } }),
    Visit.findAll({ where: { sellerId, status: { [Op.in]: ['scheduled', 'confirmed'] }, scheduledFor: { [Op.gte]: new Date() } }, order: [['scheduledFor', 'ASC']], limit: 5 }),
  ]);

  return {
    counts: { totalProperties, activeProperties, pendingProperties, totalEnquiries, newEnquiries, upcomingVisitsCount: upcomingVisits.length },
    sections: { upcomingVisits },
  };
}

export async function mediatorDashboard(mediatorId) {
  const [assignedBuyers, assignedSellers, assignedEnquiries, assignedVisits, assignedProperties] = await Promise.all([
    User.count({ where: { assignedMediatorId: mediatorId, role: ROLES.BUYER } }),
    User.count({ where: { assignedMediatorId: mediatorId, role: ROLES.SELLER } }),
    Enquiry.count({ where: { assignedMediatorId: mediatorId } }),
    Visit.count({ where: { assignedMediatorId: mediatorId } }),
    Property.count({ where: { assignedMediatorId: mediatorId } }),
  ]);

  return {
    counts: { assignedBuyers, assignedSellers, assignedEnquiries, assignedVisits, assignedProperties },
  };
}

export async function adminEmployeePerformance(query) {
  const { employeeId, startDate, endDate } = query;
  const dateFilter = {};
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date('1970-01-01');
    const end = endDate ? new Date(endDate) : new Date('2100-01-01');
    if (endDate && !endDate.includes('T')) {
      end.setHours(23, 59, 59, 999);
    }
    dateFilter[Op.between] = [start, end];
  }

  const employeeWhere = { role: ROLES.EMPLOYEE };
  if (employeeId) {
    employeeWhere.id = employeeId;
  }
  const employees = await User.findAll({ where: employeeWhere, attributes: ['id', 'name', 'memberId', 'status'] });

  const performanceList = [];

  for (const emp of employees) {
    const empWhere = { assignedEmployeeId: emp.id };
    const empActorWhere = { actorId: emp.id };
    const empCreatedWhere = { createdBy: emp.id };

    if (startDate || endDate) {
      empWhere.createdAt = dateFilter;
      empActorWhere.createdAt = dateFilter;
      empCreatedWhere.createdAt = dateFilter;
    }

    const [
      totalAssigned,
      completedFollowUps,
      pendingFollowUps,
      completedActivities,
      callsCount,
      meetingsCount,
      siteVisitsCount,
      interestedCount,
      notInterestedCount
    ] = await Promise.all([
      FollowUp.count({ where: empWhere }),
      FollowUp.count({ where: { ...empWhere, status: 'completed' } }),
      FollowUp.count({ where: { ...empWhere, status: { [Op.in]: ['assigned', 'in_progress'] } } }),
      AuditLog.count({ where: empActorWhere }),
      CallNote.count({ where: empCreatedWhere }),
      AuditLog.count({ where: { ...empActorWhere, action: 'followup.meeting' } }),
      Visit.count({ where: { ...empWhere, status: 'completed' } }),
      Enquiry.count({ where: { ...empWhere, status: { [Op.in]: ['contacted', 'followup_required', 'visit_requested'] } } }),
      Enquiry.count({ where: { ...empWhere, status: 'closed' } })
    ]);

    // Calculate Overdue Follow-ups
    const now = new Date();
    const allFollowUps = await FollowUp.findAll({ where: { assignedEmployeeId: emp.id } });
    const overdueFollowUps = allFollowUps.filter((f) => {
      const due = new Date(`${f.dueDate}T${f.dueTime || '23:59'}`);
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-01-01');
        if (endDate && !endDate.includes('T')) end.setHours(23, 59, 59, 999);
        if (due < start || due > end) return false;
      }
      return due < now && !['completed', 'cancelled'].includes(f.status);
    }).length;

    performanceList.push({
      employeeId: emp.id,
      name: emp.name,
      memberId: emp.memberId,
      status: emp.status,
      metrics: {
        totalAssigned,
        completedFollowUps,
        pendingFollowUps,
        overdueFollowUps,
        completedActivities,
        calls: callsCount,
        meetings: meetingsCount,
        siteVisits: siteVisitsCount,
        interestedCustomers: interestedCount,
        notInterestedCustomers: notInterestedCount,
        bookingsGenerated: 0
      }
    });
  }

  return performanceList;
}
