import { readFile } from "node:fs/promises";
import { MessageLane, DryRunProvider, WebhookProvider } from "./index.js";
import { startApi } from "./api.js";

const [command, ...args] = process.argv.slice(2);
const lane = new MessageLane(process.env.MESSAGELANE_DATA_FILE);

if (command === "serve") {
  const port = Number(arg("--port") ?? 3030); startApi(port, lane); console.log(`MessageLane API listening on http://localhost:${port}`);
} else if (command === "contacts:import") {
  const file = required("--file"); const consent = args.includes("--consent");
  const rows = parseCsv(await readFile(file, "utf8")).map((row) => ({ name: row.name || row.Name || row["Given Name"], phone: row.phone || row.Phone || row["Phone E.164"] || row["Phone 1 - Value"], consent, tags: splitTags(arg("--tags")) }));
  console.log(JSON.stringify(await lane.importContacts(rows), null, 2));
} else if (command === "contacts:list") {
  console.log(JSON.stringify(await lane.listContacts(), null, 2));
} else if (command === "campaign:create") {
  console.log(JSON.stringify(await lane.createCampaign({ name: required("--name"), message: required("--message"), sender: required("--sender") }), null, 2));
} else if (command === "campaign:send") {
  const providerUrl = arg("--provider-url"); const provider = providerUrl ? new WebhookProvider(providerUrl, process.env.MESSAGELANE_PROVIDER_TOKEN) : new DryRunProvider();
  console.log(JSON.stringify(await lane.sendCampaign(required("--id"), provider, { tag: arg("--tag"), ratePerSecond: Number(arg("--rate") ?? 2) }), null, 2));
} else if (command === "deliveries") {
  console.log(JSON.stringify(await lane.report(arg("--campaign-id")), null, 2));
} else {
  console.log(`MessageLane\n\nCommands:\n  serve [--port 3030]\n  contacts:import --file customers.csv --consent [--tags customer]\n  contacts:list\n  campaign:create --name NAME --message TEXT --sender SENDER\n  campaign:send --id CAMPAIGN_ID [--provider-url URL] [--tag TAG] [--rate 2]\n  deliveries [--campaign-id ID]\n\nWithout --provider-url, campaign:send is a safe dry run.`);
}

function arg(name: string) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; }
function required(name: string) { const value = arg(name); if (!value) throw new Error(`${name} is required`); return value; }
function splitTags(value?: string) { return value ? value.split(",").map((tag) => tag.trim()).filter(Boolean) : []; }
function parseCsv(source: string) { const [header, ...lines] = source.trim().split(/\r?\n/); const keys = header.split(",").map((key) => key.trim()); return lines.filter(Boolean).map((line) => Object.fromEntries(keys.map((key, index) => [key, line.split(",")[index]?.trim() ?? ""]))); }
