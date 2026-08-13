"""Minimal standard-library client for a local or hosted MessageLane API."""

import json
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen


class MessageLaneClient:
    """Manage consent-aware MessageLane contacts, campaigns, and delivery reports."""

    def __init__(self, base_url: str = "http://localhost:3030", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def import_contacts(self, contacts: List[Dict[str, Any]]) -> Dict[str, Any]:
        return self._request("POST", "/v1/messagelane/contacts/import", {"contacts": contacts})

    def list_contacts(self) -> List[Dict[str, Any]]:
        return self._request("GET", "/v1/messagelane/contacts")

    def pricing(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/messagelane/pricing")

    def create_campaign(self, name: str, message: str, sender: str) -> Dict[str, Any]:
        return self._request("POST", "/v1/messagelane/campaigns", {"name": name, "message": message, "sender": sender})

    def send_campaign(self, campaign_id: str, *, dry_run: bool = True, tag: Optional[str] = None, rate_per_second: int = 2) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"dryRun": dry_run, "ratePerSecond": rate_per_second}
        if tag:
            payload["tag"] = tag
        return self._request("POST", f"/v1/messagelane/campaigns/{campaign_id}/send", payload)

    def delivery_report(self, campaign_id: Optional[str] = None) -> Dict[str, Any]:
        path = "/v1/messagelane/deliveries"
        if campaign_id:
            path += f"?campaignId={campaign_id}"
        return self._request("GET", path)

    def _request(self, method: str, path: str, body: Optional[Dict[str, Any]] = None) -> Any:
        headers = {"Accept": "application/json"}
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode("utf-8")
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        with urlopen(Request(self.base_url + path, data=data, headers=headers, method=method), timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
