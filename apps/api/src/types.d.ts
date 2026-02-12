import "@fastify/jwt";
import type { AuthUser } from "./lib/auth";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}
