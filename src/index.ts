import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type Contact = { id: string; name: string; phone: string; consent: boolean; tags: string[]; createdAt: string };
export type Delivery = { id: string; campaignId: string; contactId: string; phone: string; status: "queued" | "sent" | "failed"; providerId?: string; error?: string; createdAt: string };
export type Campaign = { id: string; name: string; message: string; sender: string; status: "draft" | "sent"; createdAt: string };
type Store = { contacts: Contact[]; campaigns: Campaign[]; deliveries: Delivery[] };

export type SmsProvider = { send(input: { to: string; from: string; message: string }): Promise<{ id: string }> };

export const hostedPricing = {
  currency: "credits",
  routes: {
    "GET /v1/messagelane/health": 0,
    "GET /v1/messagelane/pricing": 0,
    "GET /v1/messagelane/contacts": 0,
    "POST /v1/messagelane/contacts/import": 2,
    "POST /v1/messagelane/campaigns": 2,
    "POST /v1/messagelane/campaigns/:id/send": 5,
    "GET /v1/messagelane/deliveries": 1,
  },
  notes: [
    "Credits cover hosted MessageLane campaign operations.",
    "SMS gateway and carrier charges are separate and paid to the connected provider.",
  ],
} as const;

export class WebhookProvider implements SmsProvider {
  constructor(private endpoint: string, private token?: string) {}
  async send(input: { to: string; from: string; message: string }) {
    const response = await fetch(this.endpoint, { method: "POST", headers: { "content-type": "application/json", ...(this.token ? { authorization: `Bearer ${this.token}` } : {}) }, body: JSON.stringify(input) });
    if (!response.ok) throw new Error(`Provider returned ${response.status}`);
    const body = await response.json() as { id?: string; messageId?: string };
    return { id: body.id ?? body.messageId ?? randomUUID() };
  }
}

export class DryRunProvider implements SmsProvider {
  async send(input: { to: string; from: string; message: string }) {
    return { id: `dry_${createHash("sha256").update(`${input.to}:${input.from}:${input.message}`).digest("hex").slice(0, 16)}` };
  }
}

export class MessageLane {
  constructor(private dataFile = resolve("data/messagelane.json")) {}
  private async load(): Promise<Store> {
    try { return JSON.parse(await readFile(this.dataFile, "utf8")) as Store; }
    catch (error: unknown) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return { contacts: [], campaigns: [], deliveries: [] }; throw error; }
  }
  private async save(store: Store) { await mkdir(dirname(this.dataFile), { recursive: true }); await writeFile(this.dataFile, JSON.stringify(store, null, 2) + "\n", "utf8"); }
  async importContacts(rows: Array<{ name?: string; phone: string; consent?: boolean; tags?: string[] }>) {
    const store = await this.load(); let created = 0; let updated = 0;
    for (const row of rows) {
      const phone = normalizePhone(row.phone); if (!phone) continue;
      const existing = store.contacts.find((contact) => contact.phone === phone);
      if (existing) { existing.name = row.name || existing.name; existing.consent = row.consent ?? existing.consent; existing.tags = row.tags ?? existing.tags; updated++; }
      else { store.contacts.push({ id: randomUUID(), name: row.name || phone, phone, consent: row.consent ?? false, tags: row.tags ?? [], createdAt: new Date().toISOString() }); created++; }
    }
    await this.save(store); return { created, updated, total: store.contacts.length };
  }
  async listContacts() { return (await this.load()).contacts; }
  async createCampaign(input: { name: string; message: string; sender: string }) {
    if (!input.name || !input.message || !input.sender) throw new Error("name, message, and sender are required");
    const store = await this.load(); const campaign: Campaign = { id: randomUUID(), ...input, status: "draft", createdAt: new Date().toISOString() };
    store.campaigns.push(campaign); await this.save(store); return campaign;
  }
  async sendCampaign(campaignId: string, provider: SmsProvider, options: { tag?: string; ratePerSecond?: number } = {}) {
    const store = await this.load(); const campaign = store.campaigns.find((item) => item.id === campaignId);
    if (!campaign) throw new Error("Campaign not found"); if (campaign.status === "sent") throw new Error("Campaign was already sent");
    const targets = store.contacts.filter((contact) => contact.consent && (!options.tag || contact.tags.includes(options.tag)));
    const delay = 1000 / Math.max(1, options.ratePerSecond ?? 2); let sent = 0; let failed = 0;
    for (const contact of targets) {
      const delivery: Delivery = { id: randomUUID(), campaignId, contactId: contact.id, phone: contact.phone, status: "queued", createdAt: new Date().toISOString() };
      try { const result = await provider.send({ to: contact.phone, from: campaign.sender, message: campaign.message }); delivery.status = "sent"; delivery.providerId = result.id; sent++; }
      catch (error) { delivery.status = "failed"; delivery.error = error instanceof Error ? error.message : "Provider failed"; failed++; }
      store.deliveries.push(delivery); if (targets.indexOf(contact) < targets.length - 1) await wait(delay);
    }
    campaign.status = "sent"; await this.save(store); return { campaignId, eligible: targets.length, sent, failed, skippedWithoutConsent: store.contacts.length - targets.length };
  }
  async report(campaignId?: string) { const store = await this.load(); const deliveries = store.deliveries.filter((item) => !campaignId || item.campaignId === campaignId); return { deliveries, sent: deliveries.filter((item) => item.status === "sent").length, failed: deliveries.filter((item) => item.status === "failed").length }; }
}

export function normalizePhone(value: string) { const digits = value.replace(/[^\d+]/g, ""); if (/^\+234\d{10}$/.test(digits)) return digits; if (/^234\d{10}$/.test(digits)) return `+${digits}`; if (/^0\d{10}$/.test(digits)) return `+234${digits.slice(1)}`; return ""; }
const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
