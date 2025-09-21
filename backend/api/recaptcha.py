import os
import requests
from typing import Tuple, List, Optional

# Simple helper for reCAPTCHA Enterprise verification
# Reads config from environment variables:
#   RECAPTCHA_ENTERPRISE_PROJECT_ID
#   RECAPTCHA_ENTERPRISE_SITE_KEY
#   RECAPTCHA_ENTERPRISE_API_KEY (optional if using ADC/OAuth; this helper uses API key)
#   RECAPTCHA_ENFORCE ("true"/"false")

def get_env_bool(name: str, default: bool = False) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return str(val).strip().lower() in ["1", "true", "yes", "on"]


def verify_recaptcha(token: Optional[str], expected_action: str) -> Tuple[bool, float, List[str], Optional[str]]:
    """
    Verify a reCAPTCHA Enterprise token.

    Returns (is_valid, score, reasons, error)
    """
    project_id = os.getenv("RECAPTCHA_ENTERPRISE_PROJECT_ID") or os.getenv("GCP_PROJECT")
    site_key = os.getenv("RECAPTCHA_ENTERPRISE_SITE_KEY")
    api_key = os.getenv("RECAPTCHA_ENTERPRISE_API_KEY")

    if not token:
        return False, 0.0, ["missing-token"], "Missing token"

    if not (project_id and site_key and api_key):
        # If not configured, be permissive in local/dev; enforce with RECAPTCHA_ENFORCE
        enforce = get_env_bool("RECAPTCHA_ENFORCE", False)
        if enforce:
            return False, 0.0, ["missing-config"], "reCAPTCHA configuration missing"
        return True, 0.0, ["not-configured"], None

    endpoint = f"https://recaptchaenterprise.googleapis.com/v1/projects/{project_id}/assessments?key={api_key}"
    payload = {
        "event": {
            "token": token,
            "expectedAction": expected_action,
            "siteKey": site_key,
        }
    }

    try:
        resp = requests.post(endpoint, json=payload, timeout=4)
        data = resp.json() if resp.content else {}
        if resp.status_code >= 400:
            return False, 0.0, [f"http-{resp.status_code}"], data.get("error", {}).get("message") if isinstance(data, dict) else str(data)

        token_props = (data or {}).get("tokenProperties", {})
        risk = (data or {}).get("riskAnalysis", {})
        valid = bool(token_props.get("valid", False))
        action = token_props.get("action")
        score = float(risk.get("score", 0.0) or 0.0)
        reasons = risk.get("reasons", []) or []

        # Validate action and validity
        if not valid:
            return False, score, reasons + ["invalid-token"], "Invalid token"
        if action and action != expected_action:
            return False, score, reasons + ["action-mismatch"], f"Expected action {expected_action}, got {action}"

        return True, score, reasons, None
    except Exception as e:
        return False, 0.0, ["exception"], str(e)
