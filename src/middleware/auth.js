import { verifyAccessToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import User from '../models/user.model.js';

// Verifies the JWT on the Authorization header and attaches the current
// user (fresh from DB, so status/permission changes take effect immediately)
// to req.user.
export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new AppError('Authentication required', 401, 'NO_TOKEN');
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    const user = await User.findByPk(payload.id);
    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    next(err);
  }
}
