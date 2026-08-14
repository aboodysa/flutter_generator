import * as crypto from "crypto";

/**
 * Region detection (DESIGN §11.1) — content-hash based, not header-comment based.
 * Files carry stable region markers at declaration level. Before overwrite the
 * generator hashes the current user region and writes only if it matches the
 * last-known-generated hash; drift → conflict queue, never silent clobber.
 *
 * Thin slice (PHASE_PLAN Phase 1): detect-and-block only, no 3-way merge.
 */

export const USER_MARKER_START = "// [user] region:user";
export const USER_MARKER_END = "// [end] region:user";

export interface RegionConflict {
  file: string;
  reason: string;
  preserved: boolean;
}

export function sha256(s: string): string {
  return crypto.createHash("sha256").update(s).digest("hex");
}

/** Extract the text of the user-owned region between the markers (null if no user region). */
export function extractUserRegion(content: string): string | null {
  const start = content.indexOf(USER_MARKER_START);
  if (start === -1) return null;
  const bodyStart = start + USER_MARKER_START.length;
  const end = content.indexOf(USER_MARKER_END, bodyStart);
  const body = content.slice(bodyStart, end === -1 ? content.length : end);
  return body.replace(/\r\n/g, "\n").trim();
}

export function userRegionHash(content: string): string | null {
  const region = extractUserRegion(content);
  return region === null ? null : sha256(region);
}

/**
 * Guard before overwrite: if the existing file has a user region whose hash
 * differs from the last-known generated hash, the user has edited it → conflict.
 * Returns null when it is safe to overwrite.
 */
export function checkOverwrite(existingContent: string, lastKnownHash: string | null, file: string): RegionConflict | null {
  const currentHash = userRegionHash(existingContent);
  if (currentHash === null) return null; // pure generated — overwrite freely
  if (lastKnownHash !== currentHash) {
    return { file, reason: "user region drifted from last-generated hash", preserved: true };
  }
  return null;
}
