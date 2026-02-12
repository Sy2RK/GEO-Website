import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@guru/shared";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

const roleRank: Record<UserRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3
};

export function hashPassword(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleRank[userRole] >= roleRank[requiredRole];
}

export async function requireRole(
  request: FastifyRequest,
  reply: FastifyReply,
  requiredRole: UserRole
): Promise<AuthUser | null> {
  try {
    await request.jwtVerify();
    const user = request.user as AuthUser;
    if (!user || !hasRole(user.role, requiredRole)) {
      reply.code(403).send({ message: "forbidden" });
      return null;
    }
    return user;
  } catch {
    reply.code(401).send({ message: "unauthorized" });
    return null;
  }
}

export async function getOptionalUser(request: FastifyRequest): Promise<AuthUser | null> {
  const header = request.headers.authorization;
  if (!header) {
    return null;
  }

  try {
    const payload = await request.jwtVerify<AuthUser>();
    return payload;
  } catch {
    return null;
  }
}
