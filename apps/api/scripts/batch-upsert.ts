import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { parse as parseCsv } from "csv-parse/sync";
import { prisma } from "../src/lib/prisma";
import { batchUpsert, validateBatchInput } from "../src/services/admin-service";

function parseArgs(argv: string[]) {
  const result: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[index + 1] : "true";
    result[key] = value;
    if (value !== "true") {
      index += 1;
    }
  }
  return result;
}

function maybeJson(value: string): unknown {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

function loadItems(filePath: string): Array<Record<string, unknown>> {
  const raw = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".json") {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.items ?? [];
  }

  if (ext === ".yaml" || ext === ".yml") {
    const parsed = yaml.load(raw);
    if (Array.isArray(parsed)) {
      return parsed as Array<Record<string, unknown>>;
    }
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).items)) {
      return (parsed as any).items;
    }
    return [];
  }

  if (ext === ".csv") {
    const records = parseCsv(raw, {
      columns: true,
      skip_empty_lines: true
    }) as Array<Record<string, string>>;

    return records.map((record) => {
      const output: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(record)) {
        output[key] = maybeJson(value);
      }
      return output;
    });
  }

  throw new Error(`unsupported_file_type:${ext}`);
}

function printUsage() {
  // eslint-disable-next-line no-console
  console.log(
    "Usage: npm run batch -w @guru/api -- --file ./data.json --entityType productDoc --locale zh-CN --mode dry-run|apply --role editor|admin --actor script"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file || !args.entityType) {
    printUsage();
    process.exit(1);
  }

  const mode = args.mode ?? "dry-run";
  const role = (args.role ?? "editor") as "viewer" | "editor" | "admin";
  const actor = args.actor ?? "cli-batch";

  const items = loadItems(path.resolve(process.cwd(), args.file));

  const validation = await validateBatchInput({
    entityType: args.entityType,
    locale: args.locale,
    items
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ step: "validate", ...validation }, null, 2));

  if (mode === "dry-run") {
    await prisma.$disconnect();
    return;
  }

  if (!validation.valid) {
    // eslint-disable-next-line no-console
    console.error("validation failed; apply skipped");
    await prisma.$disconnect();
    process.exit(1);
  }

  const result = await batchUpsert({
    entityType: args.entityType,
    locale: args.locale,
    items,
    role,
    actorId: actor
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ step: "apply", result }, null, 2));
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        step: "diff",
        before: validation.stats,
        after: {
          ...validation.stats,
          applied: result.applied
        }
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
