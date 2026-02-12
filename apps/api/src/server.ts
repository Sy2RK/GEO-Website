import { buildApp } from "./app";
import { config } from "./config";

async function main() {
  const app = buildApp();
  try {
    await app.listen({ port: config.port, host: config.host });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();
