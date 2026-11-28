import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_OBSIDIAN_CONFIG,
  normalizeObsidianConfig,
  obsidianConfigCategory,
  obsidianConfigEnabled,
} from "./src/obsidian-config";

test("classifies the built-in Obsidian setting files", () => {
  assert.equal(obsidianConfigCategory(".obsidian/app.json"), "app");
  assert.equal(obsidianConfigCategory(".obsidian/appearance.json"), "app");
  assert.equal(obsidianConfigCategory(".obsidian/core-plugins.json"), "pluginSwitches");
  assert.equal(obsidianConfigCategory(".obsidian/community-plugins.json"), "pluginSwitches");
  assert.equal(obsidianConfigCategory(".obsidian/hotkeys.json"), "hotkeys");
  assert.equal(obsidianConfigCategory(".obsidian/workspace-mobile.json"), "workspace");
  assert.equal(obsidianConfigCategory(".obsidian/bookmarks.json"), "other");
  assert.equal(obsidianConfigCategory(".obsidian/themes/Things/theme.css"), "themes");
  assert.equal(obsidianConfigCategory(".obsidian/snippets/wide.css"), "themes");
  assert.equal(obsidianConfigCategory(".obsidian/plugins/dataview/data.json"), "pluginData");
});

test("rejects plugin code, caches, and the plugin's own login data", () => {
  assert.equal(obsidianConfigCategory(".obsidian/plugins/dataview/main.js"), null);
  assert.equal(obsidianConfigCategory(".obsidian/plugins/dataview/styles.css"), null);
  assert.equal(obsidianConfigCategory(".obsidian/plugins/dataview/manifest.json"), null);
  assert.equal(obsidianConfigCategory(".obsidian/plugins/inkwell/data.json"), null);
  assert.equal(obsidianConfigCategory(".obsidian/cache/app.json"), null);
  assert.equal(obsidianConfigCategory(".obsidian/sync.json"), null);
  assert.equal(obsidianConfigCategory("notes/app.json"), null);
});

test("defaults keep safe, portable settings on and private or per-device files off", () => {
  assert.equal(DEFAULT_OBSIDIAN_CONFIG.app, true);
  assert.equal(DEFAULT_OBSIDIAN_CONFIG.pluginSwitches, true);
  assert.equal(DEFAULT_OBSIDIAN_CONFIG.themes, true);
  assert.equal(DEFAULT_OBSIDIAN_CONFIG.other, true);
  assert.equal(DEFAULT_OBSIDIAN_CONFIG.pluginData, false);
  assert.equal(DEFAULT_OBSIDIAN_CONFIG.hotkeys, false);
  assert.equal(DEFAULT_OBSIDIAN_CONFIG.workspace, false);
});

test("enabled categories gate each path", () => {
  const off = normalizeObsidianConfig({ pluginData: false, workspace: true });
  assert.equal(obsidianConfigEnabled(".obsidian/plugins/dataview/data.json", off), false);
  assert.equal(obsidianConfigEnabled(".obsidian/workspace.json", off), true);
  assert.equal(obsidianConfigEnabled(".obsidian/app.json", off), true);
  assert.equal(obsidianConfigEnabled(".obsidian/app.json", undefined), false);
});

test("normalizes stored settings and ignores invalid values", () => {
  const settings = normalizeObsidianConfig({
    app: false,
    workspace: true,
    pluginData: "yes",
    unknown: true,
  });
  assert.equal(settings.app, false);
  assert.equal(settings.workspace, true);
  assert.equal(settings.pluginData, false);
  assert.equal(settings.hotkeys, false);
  assert.equal("unknown" in settings, false);
});
