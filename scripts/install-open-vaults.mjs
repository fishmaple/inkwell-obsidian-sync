import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = dirname(dirname(fileURLToPath(import.meta.url)));
const configPath = join(process.env.APPDATA ?? "", "obsidian", "obsidian.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
for (const vault of Object.values(config.vaults ?? {})) {
  const root = vault.path;
  const dest = join(root, ".obsidian", "plugins", "inkwell");
  mkdirSync(dest, { recursive: true });
  for (const file of ["manifest.json", "main.js", "styles.css"]) {
    copyFileSync(join(source, file), join(dest, file));
  }
  const listPath = join(root, ".obsidian", "community-plugins.json");
  let list = [];
  if (existsSync(listPath)) {
    const parsed = JSON.parse(readFileSync(listPath, "utf8"));
    if (Array.isArray(parsed)) list = parsed;
  }
  if (!list.includes("inkwell")) list.push("inkwell");
  writeFileSync(listPath, JSON.stringify(list, null, 2));
  console.log(root);
}
