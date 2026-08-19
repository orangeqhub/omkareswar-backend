// Strips sensitive fields before a user record is ever sent in a response.
// tempPassword is the plaintext self-set password stored ONLY for the admin
// panel; it is attached back by services exclusively for admin callers.
export function toSafeUser(user) {
  if (!user) return null;
  const plain = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  delete plain.passwordHash;
  delete plain.tempPassword;
  return plain;
}
