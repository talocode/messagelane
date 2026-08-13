# MessageLane Python SDK

MessageLane is an open-source SMS campaign service for consent-aware contact imports, rate-limited sends, delivery records, a command-line interface, HTTP API, and MCP tools. This Python SDK talks to a local or hosted MessageLane API.

It exists so businesses can keep campaign operations portable while connecting approved delivery gateways only where they are needed. MessageLane itself does not provide carrier delivery. You are responsible for consent, sender-ID approval, DND requirements, and applicable messaging rules.

## Install

```bash
pip install talocode-messagelane
```

## Quickstart

Start the JavaScript service first:

```bash
messagelane serve --port 3030
```

Then create a consented contact and a dry-run campaign:

```python
from talocode_messagelane import MessageLaneClient

client = MessageLaneClient()
client.import_contacts([
    {"name": "Customer", "phone": "+2349033335487", "consent": True, "tags": ["customers"]}
])
campaign = client.create_campaign(
    name="Customer update",
    sender="YOURBRAND",
    message="Your customer update goes here."
)
print(client.send_campaign(campaign["id"], dry_run=True, tag="customers"))
```

## Auth and environment

For local MessageLane, the default base URL is `http://localhost:3030`. For a hosted Talocode deployment, configure:

```bash
export TALOCODE_BASE_URL=https://api.talocode.site
export TALOCODE_API_KEY=your_api_key
```

Pass the deployed MessageLane URL and API key to the client:

```python
import os
from talocode_messagelane import MessageLaneClient

client = MessageLaneClient(
    base_url=os.environ["TALOCODE_BASE_URL"],
    api_key=os.environ["TALOCODE_API_KEY"],
)
```

## API surface

| Client method | Route |
|---|---|
| `import_contacts(contacts)` | `POST /v1/messagelane/contacts/import` |
| `list_contacts()` | `GET /v1/messagelane/contacts` |
| `pricing()` | `GET /v1/messagelane/pricing` |
| `create_campaign(name, message, sender)` | `POST /v1/messagelane/campaigns` |
| `send_campaign(id, dry_run=True)` | `POST /v1/messagelane/campaigns/:id/send` |
| `delivery_report(campaign_id)` | `GET /v1/messagelane/deliveries` |

MessageLane does not meter local use. Hosted pricing: contact import 2 credits, campaign creation 2 credits, campaign dispatch 5 credits, and a delivery report 1 credit. Carrier and gateway charges are separate.

## Related packages

| Package | Install |
|---|---|
| MessageLane | `pip install talocode-messagelane` |
| Tera | `pip install talocode-tera` |
| Codra | `pip install talocode-codra` |
| SearchLane | `pip install talocode-searchlane` |

## Talocode ecosystem

| Product | Package |
|---|---|
| [MessageLane](https://github.com/talocode/messagelane) (this package) | `pip install talocode-messagelane` |
| [Tera](https://github.com/talocode/tera) | `pip install talocode-tera` |
| [Codra](https://github.com/talocode/codra) | `pip install talocode-codra` |
| [SearchLane](https://github.com/talocode/searchlane) | `pip install talocode-searchlane` |
| [StackLane](https://github.com/talocode/stacklane) | `pip install talocode` |
| [Agent Browser](https://github.com/talocode/agent-browser) | - |
| [ClipLoop](https://github.com/talocode/cliploop) | - |
| [InvoiceLane](https://github.com/talocode/invoicelane) | - |

More: [github.com/talocode](https://github.com/talocode) · [talocode.site](https://talocode.site) · [docs.talocode.site](https://docs.talocode.site)

## License

MIT © Talocode
