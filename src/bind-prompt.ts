import { Modal, Notice, type App } from "obsidian";
import type { VaultStat } from "../shared/src/protocol";
import { DuplicateVaultError, SyncClient, resolveSyncHost } from "./client";
import { t } from "./i18n";
import type InkwellPlugin from "./main";

export function promptBind(plugin: InkwellPlugin): void {
  new BindPrompt(plugin.app, plugin).open();
}

class BindPrompt extends Modal {
  private choice = "";
  private nameInput: HTMLInputElement | null = null;
  private busy = false;

  constructor(app: App, private readonly plugin: InkwellPlugin) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText(t("bindPromptTitle"));
    this.contentEl.setText(t("loadingVaults"));
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const token = this.plugin.settings.apiToken.trim();
      if (!token) throw new Error(t("needLogin"));
      const host = resolveSyncHost(this.plugin.settings.host);
      const { vaults } = await new SyncClient(host, token).vaults();
      this.render(vaults.filter((vault) => vault.name));
    } catch (error) {
      this.contentEl.empty();
      this.contentEl.createEl("p", { text: error instanceof Error ? error.message : t("readFailed") });
    }
  }

  private render(vaults: VaultStat[]): void {
    const localName = this.plugin.app.vault.getName().trim();
    const match = vaults.find((vault) => vault.name === localName);
    this.choice = match?.id ?? "";
    this.contentEl.empty();
    this.contentEl.createEl("p", { text: t("bindPromptHelp") });
    const list = this.contentEl.createDiv({ cls: "inkwell-vaults" });
    for (const vault of vaults) {
      const row = list.createDiv({ cls: "inkwell-vault" });
      if (vault.id === this.choice) row.addClass("is-selected");
      const label = row.createEl("label", { cls: "inkwell-check" });
      const input = label.createEl("input", { type: "radio" });
      input.name = "inkwell-bind-vault";
      input.checked = vault.id === this.choice;
      input.onchange = () => {
        this.choice = vault.id;
        this.mark(list, row);
      };
      const text = label.createDiv();
      text.createDiv({ text: vault.name });
      text.createDiv({
        text: t("vaultMeta", { files: vault.files, bytes: formatBytes(vault.bytes), time: formatStamp(vault.lastSyncAt) }),
        cls: "inkwell-status-line",
      });
      row.onclick = () => {
        input.checked = true;
        this.choice = vault.id;
        this.mark(list, row);
      };
    }

    const create = list.createDiv({ cls: "inkwell-vault" });
    if (!this.choice) create.addClass("is-selected");
    const createLabel = create.createEl("label", { cls: "inkwell-check" });
    const createInput = createLabel.createEl("input", { type: "radio" });
    createInput.name = "inkwell-bind-vault";
    createInput.checked = !this.choice;
    createInput.onchange = () => {
      this.choice = "";
      this.mark(list, create);
    };
    createLabel.createDiv({ text: t("bindCreate") });
    const nameRow = create.createDiv({ cls: "inkwell-name" });
    this.nameInput = nameRow.createEl("input", { type: "text" });
    this.nameInput.value = localName;
    this.nameInput.placeholder = localName;
    create.onclick = (event) => {
      if (event.target === this.nameInput) return;
      createInput.checked = true;
      this.choice = "";
      this.mark(list, create);
    };

    const actions = this.contentEl.createDiv({ cls: "inkwell-actions" });
    const ok = actions.createEl("button", { text: t("bindConfirm"), cls: "mod-cta" });
    ok.onclick = () => { void this.confirm(vaults); };
    const cancel = actions.createEl("button", { text: t("cancel") });
    cancel.onclick = () => this.close();
  }

  private mark(list: HTMLElement, selected: HTMLElement): void {
    for (const row of Array.from(list.children)) row.removeClass("is-selected");
    selected.addClass("is-selected");
  }

  private async confirm(vaults: VaultStat[]): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const token = this.plugin.settings.apiToken.trim();
      if (!token) throw new Error(t("needLogin"));
      if (this.choice) {
        const vault = vaults.find((item) => item.id === this.choice);
        if (!vault?.id) throw new Error(t("needBind"));
        await this.plugin.bindVault(vault.name, vault.encrypted, vault.id);
      } else {
        const name = (this.nameInput?.value ?? "").trim();
        if (!name || /[\u0000-\u001f\u007f\\/]/.test(name) || name.length > 120) throw new Error(t("badVaultName"));
        const remote = await new SyncClient(resolveSyncHost(this.plugin.settings.host), token).ensureVault(name, false, true);
        if (!remote.id) throw new Error(t("needBind"));
        await this.plugin.bindVault(remote.name, remote.encrypted, remote.id);
      }
      this.close();
      this.plugin.onAccountFilled?.(this.plugin.settings.accountId);
      void this.plugin.syncNow(true);
    } catch (error) {
      this.busy = false;
      new Notice(error instanceof DuplicateVaultError ? t("duplicateVault") : error instanceof Error ? error.message : t("needBind"));
    }
  }
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value < 1024) return `${Math.max(0, Math.round(value))} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatStamp(ms: number): string {
  if (!ms) return t("notSynced");
  const date = new Date(ms);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
