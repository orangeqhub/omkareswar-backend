import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/user.model.js';

// Like auth(), but does not fail the request when no/invalid token is present.
// Useful for endpoints that behave slightly differently for logged-in users
// (e.g. recording a property view against a user id) but are otherwise public.
export default async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next();

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.id);
    if (user) req.user = user;
    next();
  } catch {
    next();
  }
}
