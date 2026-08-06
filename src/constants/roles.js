export const ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
  BUYER: 'buyer',
  SELLER: 'seller',
  MEDIATOR: 'mediator',
};

export const ALL_ROLES = Object.values(ROLES);

export const PUBLIC_OTP_ROLES = [ROLES.BUYER, ROLES.SELLER, ROLES.MEDIATOR];
