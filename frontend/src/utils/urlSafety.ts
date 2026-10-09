import { URLSafetyDetails, URLSafetyStatus } from '../types/qr';
import { getFastestReachableBaseUrl } from '../api/client';

// Blocked / Dangerous Schemes
const DANGEROUS_SCHEMES = new Set([
  'javascript',
  'data',
  'file',
  'content',
  'intent',
  'vbscript',
  'blob',
]);

// Known URL shorteners
const URL_SHORTENERS = new Set([
  'bit.ly',
  'tinyurl.com',
  'is.gd',
  't.co',
  'ow.ly',
  'buff.ly',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'tiny.cc',
  'goo.gl',
  'qr.ae',
  'v.gd',
  'clck.ru',
]);

// High-abuse TLDs
const HIGH_RISK_TLDS = [
  '.tk',
  '.ml',
  '.ga',
  '.cf',
  '.gq',
  '.top',
  '.xyz',
  '.click',
  '.buzz',
  '.work',
  '.loan',
  '.country',
];

// Phishing keywords
const PHISHING_KEYWORDS = [
  'paypal-security',
  'paypal-verify',
  'apple-id-verify',
  'appleid-login',
  'microsoft-online-verify',
  'account-recovery-login',
  'bank-secure-auth',
  'wallet-connect-claim',
  'metamask-airdrop',
  'free-gift-card-win',
  'chase-verify-login',
  'wellsfargo-secure',
  'binance-security-update',
  'coinbase-auth-claim',
  'netflix-billing-update',
  'amazon-security-alert',
  'secure-banking-login',
  'verify-your-account',
  'update-payment-info',
  'urgent-action-required',
  'claim-reward-now',
  'free-crypto-giveaway',
];

// Malicious / Executable extensions
const MALICIOUS_EXTENSIONS = [
  '.apk',
  '.exe',
  '.scr',
  '.bat',
  '.vbs',
  '.ps1',
  '.msi',
  '.jar',
  '.cmd',
  '.pif',
  '.hta',
];

// Known test malicious domains
const KNOWN_MALICIOUS_DOMAINS = [
  'malware.wicar.org',
  'testsafebrowsing.appspot.com',
  'bad-example.com',
  'dangerous-example.com',
  'phishing-test.org',
  'evil-phishing.com',
  'malicious-site.test',
  'eicar.org',
];

// Major brands for brand-impersonation heuristics
const TARGET_BRANDS = [
  'google',
  'apple',
  'microsoft',
  'paypal',
  'amazon',
  'facebook',
  'instagram',
  'netflix',
  'bankofamerica',
  'chase',
  'wellsfargo',
  'binance',
  'coinbase',
  'whatsapp',
  'telegram',
];

// 5-minute In-memory cache
interface CacheEntry {
  result: URLSafetyDetails;
  timestamp: number;
}
const safetyCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Normalize and parse a raw input into URL parts
 */
export function normalizeURL(rawInput: string): {
  normalizedUrl: string;
  scheme: string;
  hostname: string;
  isHttps: boolean;
  port?: string;
  pathname?: string;
  isBlockedScheme: boolean;
} {
  const raw = (rawInput || '').trim();
  const lower = raw.toLowerCase();

  // Extract scheme
  const schemeMatch = lower.match(/^([a-z0-9+.-]+):/);
  const scheme = schemeMatch ? schemeMatch[1] : '';

  if (scheme && DANGEROUS_SCHEMES.has(scheme)) {
    return {
      normalizedUrl: raw,
      scheme,
      hostname: 'blocked',
      isHttps: false,
      isBlockedScheme: true,
    };
  }

  let normalizedUrl = raw;
  if (!scheme) {
    normalizedUrl = `https://${raw}`;
  }

  let hostname = '';
  let isHttps = false;
  let port: string | undefined;
  let pathname = '';

  try {
    const parsed = new URL(normalizedUrl);
    hostname = (parsed.hostname || '').toLowerCase();
    isHttps = parsed.protocol === 'https:';
    port = parsed.port || undefined;
    pathname = parsed.pathname || '';
  } catch (e) {
    // Fallback extraction
    const noProto = normalizedUrl.replace(/^[a-zA-Z0-9+.-]+:\/\//, '');
    const parts = noProto.split(/[\/?#]/);
    const hostPort = parts[0].split(':');
    hostname = hostPort[0].toLowerCase();
    port = hostPort[1];
    pathname = parts.length > 1 ? `/${parts.slice(1).join('/')}` : '';
    isHttps = normalizedUrl.startsWith('https://');
  }

  return {
    normalizedUrl,
    scheme: scheme || 'https',
    hostname,
    isHttps,
    port,
    pathname,
    isBlockedScheme: false,
  };
}

/**
 * Local heuristic URL safety analyzer (instantaneous, offline-capable)
 */
export function analyzeURLLocal(rawInput: string): URLSafetyDetails {
  const raw = (rawInput || '').trim();
  const checkedAt = new Date().toISOString();
  const reasons: string[] = [];
  let riskScore = 0;

  if (!raw) {
    return {
      status: 'unknown',
      riskScore: 50,
      domain: 'unknown',
      normalizedUrl: raw,
      scheme: 'unknown',
      isHttps: false,
      reasons: ['Empty or invalid URL'],
      checkedAt,
    };
  }

  const norm = normalizeURL(raw);

  if (norm.isBlockedScheme) {
    return {
      status: 'unsafe',
      riskScore: 100,
      domain: 'blocked',
      normalizedUrl: raw,
      scheme: norm.scheme,
      isHttps: false,
      reasons: [`Unsupported / dangerous URI scheme '${norm.scheme}:' blocked`],
      checkedAt,
    };
  }

  if (!norm.hostname) {
    return {
      status: 'unsafe',
      riskScore: 90,
      domain: 'invalid',
      normalizedUrl: norm.normalizedUrl,
      scheme: norm.scheme,
      isHttps: norm.isHttps,
      reasons: ['Missing or invalid hostname'],
      checkedAt,
    };
  }

  // 1. Deceptive '@' in authority
  if (norm.normalizedUrl.includes('@')) {
    riskScore += 90;
    reasons.push("Deceptive '@' symbol or embedded credentials in URL authority");
  }

  // 2. Known Malicious Test Domains
  for (const mal of KNOWN_MALICIOUS_DOMAINS) {
    if (norm.hostname.includes(mal)) {
      riskScore += 95;
      reasons.push(`Flagged by threat reputation database (${mal})`);
      break;
    }
  }

  // 3. Punycode / Homograph Attack detection (xn--)
  if (norm.hostname.includes('xn--')) {
    riskScore += 70;
    reasons.push('Internationalized/Punycode domain (potential homograph impersonation)');
  } else if (/[^\u0000-\u007F]/.test(norm.hostname)) {
    riskScore += 65;
    reasons.push('Non-ASCII characters detected in domain (potential homoglyph attack)');
  }

  // 4. Typo-squatting / Brand Impersonation
  for (const brand of TARGET_BRANDS) {
    if (norm.hostname.includes(brand)) {
      const parts = norm.hostname.split('.');
      if (parts.length >= 2) {
        const rootDomain = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
        if (!rootDomain.includes(brand)) {
          riskScore += 60;
          reasons.push(`Deceptive brand name '${brand}' in subdomain of '${rootDomain}'`);
          break;
        }
      }
    }
  }

  // 5. Raw IP Address
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(norm.hostname);
  const isIPv6 = norm.hostname.includes(':');
  if (isIPv4 || isIPv6) {
    riskScore += 45;
    reasons.push('URL uses raw IP address instead of registered domain name');
  }

  // 6. Suspicious Ports
  if (norm.port && !['80', '443', '8000', '8080'].includes(norm.port)) {
    if (['1337', '6667', '3128', '4444', '5555', '9001', '2222'].includes(norm.port)) {
      riskScore += 50;
      reasons.push(`Suspicious high-risk port :${norm.port}`);
    } else {
      riskScore += 25;
      reasons.push(`Non-standard web port :${norm.port}`);
    }
  }

  // 7. Phishing keywords
  const fullLower = norm.normalizedUrl.toLowerCase();
  for (const kw of PHISHING_KEYWORDS) {
    if (fullLower.includes(kw)) {
      riskScore += 55;
      reasons.push(`Suspicious phishing keyword detected: '${kw}'`);
      break;
    }
  }

  // 8. Malicious executable extensions
  const pathname = (norm.pathname || '').toLowerCase();
  for (const ext of MALICIOUS_EXTENSIONS) {
    if (pathname.endsWith(ext)) {
      riskScore += 65;
      reasons.push(`Direct executable/application download link (${ext})`);
      break;
    }
  }

  // 9. Excessive subdomains
  const domainParts = norm.hostname.split('.').filter(Boolean);
  if (domainParts.length > 4 && !isIPv4) {
    riskScore += 35;
    reasons.push(`Excessive subdomain depth (${domainParts.length - 2} levels)`);
  }

  // 10. URL Shorteners
  if (URL_SHORTENERS.has(norm.hostname) || Array.from(URL_SHORTENERS).some((s) => norm.hostname.endsWith('.' + s))) {
    riskScore += 30;
    reasons.push('URL shortener detected (destination is hidden)');
  }

  // 11. High-risk TLD
  for (const tld of HIGH_RISK_TLDS) {
    if (norm.hostname.endsWith(tld)) {
      riskScore += 25;
      reasons.push(`Unusual high-abuse top level domain (${tld})`);
      break;
    }
  }

  // 12. Obfuscation & length
  if (norm.normalizedUrl.length > 500) {
    riskScore += 20;
    reasons.push('Excessively long URL (> 500 characters)');
  }
  if (norm.normalizedUrl.includes('%25') || norm.normalizedUrl.includes('%00')) {
    riskScore += 45;
    reasons.push('Obfuscated / double-encoded URL characters');
  }

  // 13. Insecure HTTP
  if (!norm.isHttps) {
    riskScore += 20;
    reasons.push('Connection is not encrypted (HTTP instead of HTTPS)');
  }

  riskScore = Math.min(100, riskScore);
  let status: URLSafetyStatus = 'safe';
  if (riskScore >= 60) {
    status = 'unsafe';
  } else if (riskScore >= 30) {
    status = 'suspicious';
  } else {
    status = 'safe';
  }

  return {
    status,
    riskScore,
    domain: norm.hostname,
    normalizedUrl: norm.normalizedUrl,
    scheme: norm.scheme,
    isHttps: norm.isHttps,
    reasons,
    checkedAt,
  };
}

/**
 * Main URL Safety Checking Engine
 * Integrates local heuristic checking + backend threat reputation with 3.5s timeout & cache
 */
export async function checkURLSafety(
  rawInput: string,
  options?: { timeoutMs?: number; skipCache?: boolean }
): Promise<URLSafetyDetails> {
  const raw = (rawInput || '').trim();
  const timeoutMs = options?.timeoutMs || 3500;

  if (!raw) {
    return analyzeURLLocal(raw);
  }

  // 1. Check cache
  if (!options?.skipCache) {
    const cached = safetyCache.get(raw);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  // 2. Immediate check for blocked schemes
  const localResult = analyzeURLLocal(raw);
  if (localResult.status === 'unsafe' && localResult.scheme && DANGEROUS_SCHEMES.has(localResult.scheme)) {
    safetyCache.set(raw, { result: localResult, timestamp: Date.now() });
    return localResult;
  }

  // 3. Online Backend Check with 3.5s Timeout
  try {
    const baseUrl = await getFastestReachableBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(`${baseUrl}/security/check-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: raw }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const result: URLSafetyDetails = {
        status: (data.status as URLSafetyStatus) || localResult.status,
        riskScore: typeof data.risk_score === 'number' ? data.risk_score : localResult.riskScore,
        domain: data.domain || localResult.domain,
        normalizedUrl: data.normalized_url || localResult.normalizedUrl,
        scheme: data.scheme || localResult.scheme,
        isHttps: typeof data.is_https === 'boolean' ? data.is_https : localResult.isHttps,
        reasons: Array.isArray(data.reasons) ? data.reasons : localResult.reasons,
        checkedAt: data.checked_at || new Date().toISOString(),
      };

      safetyCache.set(raw, { result, timestamp: Date.now() });
      return result;
    }
  } catch (error) {
    // Network error / timeout / offline
    console.log('[URL Safety Check] Online verification unavailable, falling back to local heuristic', error);
  }

  // Fallback Handling:
  // If local analysis found positive threat heuristics (unsafe or suspicious), preserve that warning
  if (localResult.status === 'unsafe' || localResult.status === 'suspicious') {
    safetyCache.set(raw, { result: localResult, timestamp: Date.now() });
    return localResult;
  }

  // If online check was unreachable and local analysis is clean, return safe local result
  const cleanResult: URLSafetyDetails = {
    ...localResult,
    status: localResult.isHttps ? 'safe' : 'unknown',
    reasons: localResult.isHttps ? [] : ['HTTP unencrypted connection'],
  };

  safetyCache.set(raw, { result: cleanResult, timestamp: Date.now() });
  return cleanResult;
}
