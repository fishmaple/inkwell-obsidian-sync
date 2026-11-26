import { normalizeHost } from "../shared/src/protocol";

/** Product website. */
export const OFFICIAL_WEBSITE = "https://fishmaple.cn";

/** Open-source server repository linked from the settings page. */
export const OPEN_SOURCE_REPO = "https://github.com/fishmaple/inkwell-sync-server";

/** Hosted Inkwell Business server. Change this constant if the business login domain moves. */
export const BUSINESS_SERVER_HOST = "https://inkwell.fishmaple.cn";

/** The old implicit default. Only used to migrate installs that logged in before hosts were required. */
export const LEGACY_DEFAULT_HOST = "https://e2e.fishmaple.cn";

export type ServerKind = "business" | "self_hosted" | "";

export function serverKindForHost(host: string): ServerKind {
  const trimmed = host.trim();
  if (!trimmed) return "";
  try {
    return normalizeHost(trimmed) === normalizeHost(BUSINESS_SERVER_HOST) ? "business" : "self_hosted";
  } catch {
    return "self_hosted";
  }
}

export function hostForServerKind(kind: Exclude<ServerKind, "">, selfHostedHost: string): string {
  return kind === "business" ? BUSINESS_SERVER_HOST : selfHostedHost.trim();
}

export function migrateLegacyHost(host: string, hasLogin: boolean): string {
  if (host.trim()) return host;
  return hasLogin ? LEGACY_DEFAULT_HOST : "";
}

export interface StoredServerChoice {
  host: string;
  serverKind?: unknown;
  selfHostedHost?: unknown;
  hasLogin: boolean;
}

export function resolveStoredServerChoice(input: StoredServerChoice): {
  host: string;
  serverKind: ServerKind;
  selfHostedHost: string;
} {
  const host = migrateLegacyHost(input.host, input.hasLogin);
  const kindFromHost = serverKindForHost(host);
  let serverKind: ServerKind = input.serverKind === "business" || input.serverKind === "self_hosted"
    ? input.serverKind
    : kindFromHost;
  if (kindFromHost === "business") serverKind = "business";
  if (!serverKind) serverKind = "business";
  const resolvedHost = serverKind === "business" ? BUSINESS_SERVER_HOST : host;
  const storedSelf = typeof input.selfHostedHost === "string" ? input.selfHostedHost.trim() : "";
  return {
    host: resolvedHost,
    serverKind,
    selfHostedHost: storedSelf || (serverKind === "self_hosted" ? resolvedHost : ""),
  };
}
