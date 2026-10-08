import re
import urllib.parse
from datetime import datetime
from typing import Dict, Any, List

# Blocked / Dangerous Schemes
DANGEROUS_SCHEMES = {"javascript", "data", "file", "content", "intent", "vbscript", "blob"}

# Known URL shorteners
URL_SHORTENERS = {
    "bit.ly", "tinyurl.com", "is.gd", "t.co", "ow.ly", "buff.ly", "cutt.ly",
    "rb.gy", "shorturl.at", "tiny.cc", "goo.gl", "qr.ae", "v.gd", "clck.ru",
}

# Suspicious TLDs with historically high malicious abuse rates
HIGH_RISK_TLDS = {
    ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".xyz", ".click", ".buzz",
    ".work", ".loan", ".country", ".kim", ".stream", ".download", ".racing"
}

# Suspicious keywords in host / path for phishing heuristics
PHISHING_KEYWORDS = [
    "paypal-security", "paypal-verify", "apple-id-verify", "appleid-login",
    "microsoft-online-verify", "account-recovery-login", "bank-secure-auth",
    "wallet-connect-claim", "metamask-airdrop", "free-gift-card-win",
    "chase-verify-login", "wellsfargo-secure", "binance-security-update",
    "coinbase-auth-claim", "netflix-billing-update", "amazon-security-alert",
    "secure-banking-login", "verify-your-account", "update-payment-info",
    "urgent-action-required", "claim-reward-now", "free-crypto-giveaway"
]

# Dangerous executable file extensions
MALICIOUS_EXTENSIONS = {
    ".apk", ".exe", ".scr", ".bat", ".vbs", ".ps1", ".msi", ".jar",
    ".cmd", ".pif", ".hta", ".cpl", ".wsf"
}

# Known test malicious domains and signatures
KNOWN_MALICIOUS_PATTERNS = {
    "malware.wicar.org", "testsafebrowsing.appspot.com", "bad-example.com",
    "dangerous-example.com", "phishing-test.org", "evil-phishing.com",
    "malicious-site.test", "eicar.org"
}

# Major brands commonly impersonated via homograph/punycode or typo-squatting
TARGET_BRANDS = [
    "google", "apple", "microsoft", "paypal", "amazon", "facebook",
    "instagram", "netflix", "bankofamerica", "chase", "wellsfargo",
    "binance", "coinbase", "whatsapp", "telegram", "twitter"
]

class URLSafetyService:
    @staticmethod
    def analyze_url(raw_input: str) -> Dict[str, Any]:
        raw = (raw_input or "").strip()
        checked_at = datetime.utcnow().isoformat()
        reasons: List[str] = []
        risk_score = 0

        if not raw:
            return {
                "status": "unknown",
                "risk_score": 50,
                "domain": "unknown",
                "normalized_url": raw,
                "scheme": "unknown",
                "is_https": False,
                "reasons": ["Empty or invalid URL"],
                "checked_at": checked_at,
            }

        # 1. Scheme Check
        lower_raw = raw.lower()
        scheme_match = re.match(r"^([a-z0-9+.-]+):", lower_raw)
        scheme = scheme_match.group(1) if scheme_match else ""

        if scheme in DANGEROUS_SCHEMES:
            return {
                "status": "unsafe",
                "risk_score": 100,
                "domain": "blocked",
                "normalized_url": raw,
                "scheme": scheme,
                "is_https": False,
                "reasons": [f"Unsupported / dangerous URI scheme '{scheme}:' blocked"],
                "checked_at": checked_at,
            }

        # Normalize prefix if missing scheme
        normalized_url = raw
        if not scheme:
            normalized_url = f"https://{raw}"
            scheme = "https"

        # Parse URL
        try:
            parsed = urllib.parse.urlparse(normalized_url)
        except Exception:
            return {
                "status": "unsafe",
                "risk_score": 85,
                "domain": "malformed",
                "normalized_url": normalized_url,
                "scheme": scheme,
                "is_https": False,
                "reasons": ["Malformed URL structure"],
                "checked_at": checked_at,
            }

        hostname = (parsed.hostname or "").lower()
        netloc = (parsed.netloc or "").lower()
        path = parsed.path or ""
        query = parsed.query or ""
        is_https = (parsed.scheme == "https")

        if not hostname:
            return {
                "status": "unsafe",
                "risk_score": 90,
                "domain": "invalid",
                "normalized_url": normalized_url,
                "scheme": scheme,
                "is_https": is_https,
                "reasons": ["Missing or invalid hostname"],
                "checked_at": checked_at,
            }

        # 2. Deceptive credentials / '@' symbol in authority
        if "@" in netloc:
            risk_score += 90
            reasons.append("Deceptive '@' character or embedded credentials in URL authority")

        # 3. Known Malicious Test Domains
        for mal in KNOWN_MALICIOUS_PATTERNS:
            if mal in hostname:
                risk_score += 95
                reasons.append(f"Flagged by threat reputation database ({mal})")
                break

        # 4. Punycode / Homograph Attack detection (xn--)
        if "xn--" in hostname:
            risk_score += 70
            reasons.append("Internationalized/Punycode domain (potential homograph impersonation)")
        else:
            # Check for non-ASCII characters in raw hostname
            if any(ord(char) > 127 for char in hostname):
                risk_score += 65
                reasons.append("Non-ASCII characters detected in domain (potential homoglyph attack)")

        # Typo-squatting or brand impersonation in subdomains
        for brand in TARGET_BRANDS:
            if brand in hostname:
                # If brand is in hostname but the root domain is NOT that brand's official domain
                parts = hostname.split(".")
                if len(parts) >= 2:
                    root_domain = f"{parts[-2]}.{parts[-1]}"
                    if brand not in root_domain:
                        risk_score += 60
                        reasons.append(f"Deceptive brand name '{brand}' in subdomain of '{root_domain}'")
                        break

        # 5. Raw IP Address as hostname
        # IPv4 regex
        is_ipv4 = bool(re.match(r"^(\d{1,3}\.){3}\d{1,3}$", hostname))
        # IPv6
        is_ipv6 = ":" in hostname
        if is_ipv4 or is_ipv6:
            risk_score += 45
            reasons.append("URL uses raw IP address instead of registered domain name")

        # 6. Non-standard ports
        if parsed.port and parsed.port not in (80, 443, 8000, 8080):
            if parsed.port in (1337, 6667, 3128, 4444, 5555, 9001, 2222):
                risk_score += 50
                reasons.append(f"Suspicious high-risk port :{parsed.port}")
            else:
                risk_score += 25
                reasons.append(f"Non-standard web port :{parsed.port}")

        # 7. Phishing keywords in full URL
        full_lower = normalized_url.lower()
        for kw in PHISHING_KEYWORDS:
            if kw in full_lower:
                risk_score += 55
                reasons.append(f"Suspicious phishing keyword detected: '{kw}'")
                break

        # 8. Malicious file extensions in path
        for ext in MALICIOUS_EXTENSIONS:
            if path.lower().endswith(ext):
                risk_score += 65
                reasons.append(f"Direct executable/application download link ({ext})")
                break

        # 9. Excessive Subdomains (e.g. a.b.c.d.example.com)
        domain_parts = [p for p in hostname.split(".") if p]
        if len(domain_parts) > 4 and not is_ipv4:
            risk_score += 35
            reasons.append(f"Excessive subdomain depth ({len(domain_parts) - 2} levels)")

        # 10. URL Shortener detection
        if hostname in URL_SHORTENERS or any(hostname.endswith("." + s) for s in URL_SHORTENERS):
            risk_score += 30
            reasons.append("URL shortener detected (destination is hidden)")

        # 11. High-risk TLD check
        for tld in HIGH_RISK_TLDS:
            if hostname.endswith(tld):
                risk_score += 25
                reasons.append(f"Unusual high-abuse top level domain ({tld})")
                break

        # 12. Extremely long URL (> 500 chars) or multiple percent encodings
        if len(normalized_url) > 500:
            risk_score += 20
            reasons.append("Excessively long URL (> 500 characters)")

        if "%25" in normalized_url or "%00" in normalized_url:
            risk_score += 45
            reasons.append("Obfuscated / double-encoded URL characters")

        # 13. Insecure HTTP Connection
        if not is_https:
            risk_score += 20
            reasons.append("Connection is not encrypted (HTTP instead of HTTPS)")

        # Determine Classification based on risk score
        risk_score = min(100, risk_score)
        if risk_score >= 60:
            status = "unsafe"
        elif risk_score >= 30:
            status = "suspicious"
        else:
            status = "safe"

        return {
            "status": status,
            "risk_score": risk_score,
            "domain": hostname,
            "normalized_url": normalized_url,
            "scheme": scheme,
            "is_https": is_https,
            "reasons": reasons,
            "checked_at": checked_at,
        }
