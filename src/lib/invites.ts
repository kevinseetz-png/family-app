export interface Invite {
  code: string;
  createdBy: string;
  used: boolean;
}

const invites: Invite[] = [];

export function createInvite(createdBy: string): Invite {
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const invite: Invite = { code, createdBy, used: false };
  invites.push(invite);
  return invite;
}

export function validateInvite(code: string): boolean {
  const invite = invites.find((i) => i.code === code);
  return invite !== undefined && !invite.used;
}

export function redeemInvite(code: string): boolean {
  const invite = invites.find((i) => i.code === code);
  if (!invite || invite.used) return false;
  invite.used = true;
  return true;
}
