// Strips sensitive fields before a user record is ever sent in a response.
export function toSafeUser(user) {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete plain.passwordHash;
  return plain;
}
