import Counter from '../models/counter.model.js';

/**
 * Generates sequential, human readable IDs like PROP-2026-000001.
 * Safe under concurrent requests: uses SELECT ... FOR UPDATE on a per
 * prefix+year row inside the caller's transaction, so two concurrent
 * requests can never receive the same number.
 *
 * @param {string} prefix e.g. 'PROP', 'ENQ', 'ADM'
 * @param {import('sequelize').Transaction} transaction - required, caller must be inside a transaction
 * @param {number} padLength number of digits to zero-pad the sequence to
 */
export async function generateSequentialId(prefix, transaction, padLength = 6) {
  if (!transaction) {
    throw new Error('generateSequentialId requires a transaction');
  }
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;

  const [counter] = await Counter.findOrCreate({
    where: { key },
    defaults: { key, value: 0 },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  // Re-select with row lock to guarantee atomic increment under concurrency.
  const locked = await Counter.findOne({
    where: { key },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  const nextValue = (locked || counter).value + 1;
  await (locked || counter).update({ value: nextValue }, { transaction });

  const sequence = String(nextValue).padStart(padLength, '0');
  return `${prefix}-${year}-${sequence}`;
}
