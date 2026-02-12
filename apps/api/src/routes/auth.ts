import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { hashPassword } from "../lib/auth";
import { prisma } from "../lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/api/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: "invalid_body", issues: parsed.error.issues });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user) {
      return reply.code(401).send({ message: "invalid_credentials" });
    }

    const passwordHash = hashPassword(parsed.data.password);
    if (passwordHash !== user.passwordHash) {
      return reply.code(401).send({ message: "invalid_credentials" });
    }

    const token = await reply.jwtSign({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  });

  fastify.get("/api/auth/me", async (request, reply) => {
    try {
      await request.jwtVerify();
      return {
        user: request.user
      };
    } catch {
      return reply.code(401).send({ message: "unauthorized" });
    }
  });
};
