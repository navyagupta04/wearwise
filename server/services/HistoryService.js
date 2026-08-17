export const memory = { users: new Map(), uploads: new Map(), sessions: new Map(), skin: new Map() };
export function userFor(token) { if (!memory.users.has(token)) memory.users.set(token, { id: token, guest_token: token }); return memory.users.get(token); }
