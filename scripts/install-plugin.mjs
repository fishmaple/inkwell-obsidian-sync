import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const vault = process.argv[2];
if (!vault) {
  console.error("Usage: npm run install-vault -- <obsidian-vault-path>");
  process.exit(1);
}

const source = dirname(dirname(fileURLToPath(import.meta.url)));
if (!existsSync(join(source, "main.js"))) {
  console.error("The plugin is not built. Run npm run build first.");
  process.exit(1);
}

const dest = join(vault, ".obsidian", "plugins", "inkwell");
mkdirSync(dest, { recursive: true });
for (const file of ["manifest.json", "main.js", "styles.css"]) {
  copyFileSync(join(source, file), join(dest, file));
}
console.log(`Copied to ${dest}`);
console.log("Enable Inkwell in Obsidian, or reload the plugin.");
