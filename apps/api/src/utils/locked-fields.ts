import { isAdmin } from "@guru/shared";

function getValueByPath(value: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = value;

  for (const part of parts) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

export function assertLockedFieldsUnchanged(params: {
  role?: "viewer" | "editor" | "admin" | null;
  lockedFields?: Record<string, unknown>;
  previousContent?: Record<string, unknown>;
  nextContent: Record<string, unknown>;
}): void {
  const { role, lockedFields = {}, previousContent = {}, nextContent } = params;
  if (isAdmin(role ?? null)) {
    return;
  }

  for (const [path, isLocked] of Object.entries(lockedFields)) {
    if (!isLocked) {
      continue;
    }

    const prev = getValueByPath(previousContent, path);
    const next = getValueByPath(nextContent, path);
    if (JSON.stringify(prev) !== JSON.stringify(next)) {
      throw new Error(`locked_field_modified:${path}`);
    }
  }
}
