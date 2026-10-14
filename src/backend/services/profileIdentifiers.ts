import { randomInt } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { getPrisma } from '../config/db';
import { nextProfileCodeChange, normalizeProfileCode, PROFILE_CODE_ALPHABET, PROFILE_CODE_PATTERN } from '@/src/lib/profileIdentifier';

export class ProfileCodeError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function reserveGeneratedProfileCode(tx: Prisma.TransactionClient) {
  for (let attempt = 0; attempt < 128; attempt++) {
    const code = Array.from({ length: 4 }, () => PROFILE_CODE_ALPHABET[randomInt(36)]).join('');
    // ON CONFLICT prevents a collision from aborting the enclosing signup transaction.
    const result = await tx.profileIdentifier.createMany({ data: [{ code }], skipDuplicates: true });
    if (result.count === 1) return code;
  }
  throw new ProfileCodeError('Unable to allocate a profile ID. Please try again.', 503);
}

export async function changeProfileCode(userId: string, rawCode: string) {
  const code = normalizeProfileCode(rawCode);
  if (!PROFILE_CODE_PATTERN.test(code)) throw new ProfileCodeError('Use exactly four letters or numbers.', 400);
  return getPrisma().$transaction(async (tx) => {
    // Serialize changes for this user, including concurrent requests from two tabs.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new ProfileCodeError('User not found.', 404);
    const nextChangeAt = nextProfileCodeChange(user.profile_code_changed_at);
    if (code === user.profile_code) return { profileCode: code, nextChangeAt };
    if (nextChangeAt && nextChangeAt > new Date()) {
      throw new ProfileCodeError(`Your ID can next be changed on ${nextChangeAt.toISOString().slice(0, 10)}.`, 409);
    }
    const reserved = await tx.profileIdentifier.createMany({ data: [{ code, user_id: userId }], skipDuplicates: true });
    if (!reserved.count) throw new ProfileCodeError('This ID is already taken or reserved. Choose another.', 409);
    const updated = await tx.user.update({
      where: { id: userId }, data: { profile_code: code, profile_code_changed_at: new Date() },
    });
    return { profileCode: updated.profile_code, nextChangeAt: nextProfileCodeChange(updated.profile_code_changed_at) };
  });
}
