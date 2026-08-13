import { createInterface } from "node:readline";
import { MessageLane, DryRunProvider } from "./index.js";

const lane = new MessageLane(process.env.MESSAGELANE_DATA_FILE);
const tools = [
  { name: "messagelane_import_contacts", description: "Import consented SMS contacts.", inputSchema: { type: "object", properties: { contacts: { type: "array" } }, required: ["contacts"] } },
  { name: "messagelane_create_campaign", description: "Create an SMS campaign.", inputSchema: { type: "object", properties: { name: { type: "string" }, message: { type: "string" }, sender: { type: "string" } }, required: ["name", "message", "sender"] } },
  { name: "messagelane_send_dry_run", description: "Run a consent-protected campaign delivery simulation.", inputSchema: { type: "object", properties: { campaignId: { type: "string" }, tag: { type: "string" } }, required: ["campaignId"] } },
  { name: "messagelane_delivery_report", description: "Read campaign delivery records.", inputSchema: { type: "object", properties: { campaignId: { type: "string" } } } }
];
const reader = createInterface({ input: process.stdin, crlfDelay: Infinity });
reader.on("line", async (line) => {
  try {
    const request = JSON.parse(line) as { id?: string | number; method: string; params?: { name?: string; arguments?: Record<string, unknown> } };
    let result: unknown;
    if (request.method === "initialize") result = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "messagelane", version: "0.1.0" } };
    else if (request.method === "tools/list") result = { tools };
    else if (request.method === "tools/call") result = { content: [{ type: "text", text: JSON.stringify(await invoke(request.params?.name ?? "", request.params?.arguments ?? {}), null, 2) }] };
    else throw new Error("Method not found");
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\n");
  } catch (error) { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: error instanceof Error ? error.message : "Unknown error" } }) + "\n"); }
});
async function invoke(name: string, input: Record<string, unknown>) {
  if (name === "messagelane_import_contacts") return lane.importContacts(input.contacts as Array<{ name?: string; phone: string; consent?: boolean; tags?: string[] }>);
  if (name === "messagelane_create_campaign") return lane.createCampaign(input as { name: string; message: string; sender: string });
  if (name === "messagelane_send_dry_run") return lane.sendCampaign(input.campaignId as string, new DryRunProvider(), { tag: input.tag as string | undefined });
  if (name === "messagelane_delivery_report") return lane.report(input.campaignId as string | undefined);
  throw new Error("Unknown tool");
}
