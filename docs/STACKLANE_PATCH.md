# StackLane MessageLane patch

MessageLane's local HTTP API is unmetered. A hosted Talocode deployment must authenticate requests and charge the wallet before forwarding to the service.

## Routes and credits

| Method | Route | Credits |
|---|---|---:|
| `GET` | `/v1/messagelane/health` | 0 |
| `GET` | `/v1/messagelane/pricing` | 0 |
| `GET` | `/v1/messagelane/contacts` | 0 |
| `POST` | `/v1/messagelane/contacts/import` | 2 |
| `POST` | `/v1/messagelane/campaigns` | 2 |
| `POST` | `/v1/messagelane/campaigns/:id/send` | 5 |
| `GET` | `/v1/messagelane/deliveries` | 1 |

Authenticate with `Authorization: Bearer $TALOCODE_API_KEY` or `X-Api-Key`.

Charge credits before calling the MessageLane service. Do not charge carrier or gateway fees through the Talocode wallet: those remain separate charges with the connected SMS provider.
