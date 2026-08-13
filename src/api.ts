import { createServer } from "node:http";
import { MessageLane, DryRunProvider, WebhookProvider } from "./index.js";

export function startApi(port = 3030, lane = new MessageLane()) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
      const body = request.method === "GET" ? undefined : await jsonBody(request);
      let result: unknown;
      if (request.method === "GET" && url.pathname === "/health") result = { ok: true };
      else if (request.method === "GET" && url.pathname === "/v1/messagelane/contacts") result = await lane.listContacts();
      else if (request.method === "POST" && url.pathname === "/v1/messagelane/contacts/import") result = await lane.importContacts((body as { contacts: Array<{ name?: string; phone: string; consent?: boolean; tags?: string[] }> }).contacts);
      else if (request.method === "POST" && url.pathname === "/v1/messagelane/campaigns") result = await lane.createCampaign(body as { name: string; message: string; sender: string });
      else if (request.method === "POST" && /^\/v1\/messagelane\/campaigns\/[^/]+\/send$/.test(url.pathname)) {
        const campaignId = url.pathname.split("/")[4]; const input = body as { dryRun?: boolean; providerUrl?: string; providerToken?: string; tag?: string; ratePerSecond?: number };
        const provider = input.dryRun === false && input.providerUrl ? new WebhookProvider(input.providerUrl, input.providerToken) : new DryRunProvider();
        result = await lane.sendCampaign(campaignId, provider, input);
      } else if (request.method === "GET" && url.pathname === "/v1/messagelane/deliveries") result = await lane.report(url.searchParams.get("campaignId") ?? undefined);
      else { response.writeHead(404); response.end(JSON.stringify({ error: "Not found" })); return; }
      response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify(result));
    } catch (error) { response.writeHead(400, { "content-type": "application/json" }); response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" })); }
  });
  server.listen(port); return server;
}
async function jsonBody(request: import("node:http").IncomingMessage) { const chunks: Buffer[] = []; for await (const chunk of request) chunks.push(Buffer.from(chunk)); return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
