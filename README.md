# MessageLane

MessageLane is an open-source SMS campaign service for consent-aware contact imports, rate-limited sending, provider webhooks, and delivery records. It ships as a TypeScript SDK, CLI, local HTTP API, and MCP server.

It does not provide carrier delivery itself. Connect it to an approved SMS gateway or an internal delivery service. You remain responsible for customer consent, sender-ID approval, DND rules, and applicable messaging regulations.

## Install

```bash
npm install @talocode/messagelane
```

For local development:

```bash
npm install
npm run build
```

## CLI

Import only contacts that have consented to receive messages:

```bash
messagelane contacts:import --file customers.csv --consent --tags taiwo
messagelane campaign:create --name "Customer updates" --sender TAIWOELEC --message "Taiwo Electronics updates: https://example.com/join"
messagelane campaign:send --id CAMPAIGN_ID --tag taiwo
```

`campaign:send` is a dry run unless `--provider-url` is supplied. The webhook receives `{ to, from, message }` and must return `{ "id": "provider-message-id" }`.

## SDK

```ts
import { MessageLane, WebhookProvider } from "@talocode/messagelane";

const lane = new MessageLane();
await lane.importContacts([{ name: "Customer", phone: "+2349033335487", consent: true }]);
const campaign = await lane.createCampaign({ name: "Welcome", sender: "TAIWOELEC", message: "Welcome to Taiwo Electronics." });
await lane.sendCampaign(campaign.id, new WebhookProvider(process.env.SMS_GATEWAY_URL!));
```

## HTTP API

```bash
messagelane serve --port 3030
```

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Service health |
| `GET` | `/v1/messagelane/contacts` | List contacts |
| `POST` | `/v1/messagelane/contacts/import` | Import contacts |
| `POST` | `/v1/messagelane/campaigns` | Create a campaign |
| `POST` | `/v1/messagelane/campaigns/:id/send` | Send or dry run a campaign |
| `GET` | `/v1/messagelane/deliveries?campaignId=:id` | Delivery records |

`POST /v1/messagelane/contacts/import` body:

```json
{"contacts":[{"name":"Customer","phone":"+2349033335487","consent":true,"tags":["taiwo"]}]}
```

## MCP

Add the built MCP server to your MCP client:

```json
{
  "command": "messagelane-mcp",
  "env": { "MESSAGELANE_DATA_FILE": "/absolute/path/messagelane.json" }
}
```

Tools: `messagelane_import_contacts`, `messagelane_create_campaign`, `messagelane_send_dry_run`, and `messagelane_delivery_report`.

## Talocode ecosystem

| Product | Install |
|---|---|
| [MessageLane](https://github.com/talocode/messagelane) (this repo) | `npm i @talocode/messagelane` |
| [StackLane](https://github.com/talocode/stacklane) | `pip install talocode` |
| [Tera](https://github.com/talocode/tera) | `pip install talocode-tera` |
| [XSearchLane](https://github.com/talocode/xsearchlane) | `npm i @talocode/xsearchlane` |
| [ClipLoop](https://github.com/talocode/cliploop) | - |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

## License

MIT © Talocode
