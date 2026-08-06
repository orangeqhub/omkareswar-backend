export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CORRECTION_REQUESTED: 'correction_requested',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const PROPERTY_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  CHANGES_REQUESTED: 'changes_requested',
  SOLD: 'sold',
  INACTIVE: 'inactive',
};

export const PROPERTY_MODERATION_STATUS = {
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  CHANGES_REQUESTED: 'changes_requested',
  RECOMMENDED_APPROVAL: 'recommended_approval',
  RECOMMENDED_REJECTION: 'recommended_rejection',
  COMPLETED: 'completed',
};

export const USER_VERIFICATION_STATUS = {
  PENDING_REVIEW: 'pending_review',
  IN_REVIEW: 'in_review',
  CORRECTION_REQUESTED: 'correction_requested',
  RECOMMENDED_APPROVAL: 'recommended_approval',
  RECOMMENDED_REJECTION: 'recommended_rejection',
  COMPLETED: 'completed',
};

export const ENQUIRY_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  FOLLOWUP_REQUIRED: 'followup_required',
  VISIT_REQUESTED: 'visit_requested',
  CLOSED: 'closed',
};

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const VISIT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  RESCHEDULED: 'rescheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export const FOLLOW_UP_STATUS = {
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const FOLLOW_UP_RECORD_TYPES = ['enquiry', 'userVerification', 'property', 'visit'];

export const TRANSACTION_TYPES = ['sale', 'resale', 'lease', 'rent'];

export const AREA_UNITS = ['sqft', 'sqyd', 'acre', 'cent'];

export const FURNISHING_TYPES = ['unfurnished', 'semi', 'furnished'];

export const FACING_OPTIONS = [
  'East',
  'West',
  'North',
  'South',
  'North-East',
  'South-East',
  'South-West',
  'North-West',
];
