import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./config";
import { authRoutes } from "./routes/auth";
import { publicRoutes } from "./routes/public";
import { adminRoutes } from "./routes/admin";
import { openApiDocument } from "./openapi";

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors, {
    origin: true,
    credentials: true
  });

  app.register(jwt, {
    secret: config.jwtSecret
  });

  app.register(swagger, {
    openapi: openApiDocument as any
  });

  app.register(swaggerUi, {
    routePrefix: "/docs"
  });

  app.get("/openapi.json", async () => openApiDocument);

  app.register(authRoutes);
  app.register(publicRoutes);
  app.register(adminRoutes);

  return app;
}
