export const config = {
  port: Number(process.env.PORT ?? 8080),
  host: process.env.HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:3000",
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:8080"
};
