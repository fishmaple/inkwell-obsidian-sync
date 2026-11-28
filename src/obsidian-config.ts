/**
 * Obsidian keeps its settings under the vault's config folder. The vault index
 * hides that folder, so these files never show up in `Vault.getFiles()`; they
 * are read and written through the adapter instead.
 *
 * Only well-known, small configuration files are listed here. Plugin code,
 * caches, and Obsidian's own sync credentials stay out of the selection.
 */

export type ObsidianConfigCategory =
  | "app"
  | "pluginSwitches"
  | "themes"
  | "other"
  | "pluginData"
  | "hotkeys"
  | "workspace";

export interface ObsidianConfigSettings {
  /** app.json and appearance.json. */
  app: boolean;
  /** core-plugins.json and community-plugins.json. */
  pluginSwitches: boolean;
  /** themes/**\/*.css and snippets/**\/*.css. */
  themes: boolean;
  /** Bookmarks, graph, templates, and the other small top-level JSON files. */
  other: boolean;
  /** plugins/<id>/data.json. Off by default: plugin data often holds tokens. */
  pluginData: boolean;
  /** hotkeys.json. Off by default: key bindings differ per keyboard. */
  hotkeys: boolean;
  /** workspace.json and workspace-mobile.json. Off by default: layout is per device. */
  workspace: boolean;
}

export const DEFAULT_OBSIDIAN_CONFIG: ObsidianConfigSettings = {
  app: true,
  pluginSwitches: true,
  themes: true,
  other: true,
  pluginData: false,
  hotkeys: false,
  workspace: false,
};

const CATEGORY_KEYS = Object.keys(DEFAULT_OBSIDIAN_CONFIG) as ObsidianConfigCategory[];

const TOP_LEVEL: Record<string, ObsidianConfigCategory> = {
  "app.json": "app",
  "appearance.json": "app",
  "core-plugins.json": "pluginSwitches",
  "core-plugins-migration.json": "pluginSwitches",
  "community-plugins.json": "pluginSwitches",
  "hotkeys.json": "hotkeys",
  "workspace.json": "workspace",
  "workspace-mobile.json": "workspace",
  "bookmarks.json": "other",
  "graph.json": "other",
  "types.json": "other",
  "templates.json": "other",
  "canvas.json": "other",
  "daily-notes.json": "other",
  "zk-prefixer.json": "other",
  "page-preview.json": "other",
  "backlink.json": "other",
  "global-search.json": "other",
  "outgoing-link.json": "other",
  "file-recovery.json": "other",
  "command-palette.json": "other",
  "switcher.json": "other",
};

/** The plugin's own settings hold the login token and vault key. Never sync them. */
const PRIVATE_PLUGIN_IDS = new Set(["inkwell"]);

export function normalizeObsidianConfig(value: unknown): ObsidianConfigSettings {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const next = { ...DEFAULT_OBSIDIAN_CONFIG };
  for (const key of CATEGORY_KEYS) {
    if (typeof raw[key] === "boolean") next[key] = raw[key];
  }
  return next;
}

/**
 * Classify a config-folder path, or return null when it is not a syncable
 * setting. `configDir` defaults to Obsidian's usual ".obsidian".
 */
export function obsidianConfigCategory(
  path: string,
  configDir = ".obsidian",
): ObsidianConfigCategory | null {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  const root = configDir.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  const prefix = `${root}/`;
  if (!root || !normalized.toLowerCase().startsWith(prefix.toLowerCase())) return null;
  const rest = normalized.slice(prefix.length);
  if (!rest || rest.endsWith("/")) return null;

  const top = TOP_LEVEL[rest.toLowerCase()];
  if (top) return top;

  const lower = rest.toLowerCase();
  if ((lower.startsWith("themes/") || lower.startsWith("snippets/")) && lower.endsWith(".css")) {
    return "themes";
  }

  const plugin = /^plugins\/([^/]+)\/data\.json$/i.exec(rest);
  if (plugin) {
    const id = (plugin[1] ?? "").toLowerCase();
    return PRIVATE_PLUGIN_IDS.has(id) ? null : "pluginData";
  }
  return null;
}

export function obsidianConfigEnabled(
  path: string,
  settings: ObsidianConfigSettings | undefined,
  configDir = ".obsidian",
): boolean {
  if (!settings) return false;
  const category = obsidianConfigCategory(path, configDir);
  return category !== null && settings[category] === true;
}

/** True when the path is any known config item, whether enabled or not. */
export function isObsidianConfigPath(path: string, configDir = ".obsidian"): boolean {
  return obsidianConfigCategory(path, configDir) !== null;
}

/** True for anything under the config folder, including conflict copies. */
export function isConfigDirPath(path: string, configDir = ".obsidian"): boolean {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  const root = configDir.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
  return Boolean(root) && (normalized === root || normalized.toLowerCase().startsWith(`${root.toLowerCase()}/`));
}
