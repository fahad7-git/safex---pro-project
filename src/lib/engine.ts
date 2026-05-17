import dns from 'dns/promises';
import tls from 'tls';

// Note: this engine is backend-only logic used by `src/app/api/scan/route.ts`.
// Keep UI intact; avoid active HTML fetching to reduce SSRF risk.


export type FindingSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface EvidenceFinding {
  title: string;
  severity: FindingSeverity;
  confidence: number; // 0-100
  evidence: string[]; // what was detected
  whyItMatters: string;
  recommendedFix: string;
  scoreImpact: number;
}

export interface ScanResult {
  url: string;
  score: number;
  verdict: 'Safe' | 'Low Risk' | 'Suspicious' | 'Dangerous';
  confidence: number;
  sources: {
    googleSafeBrowsing: { status: 'safe' | 'malicious' | 'unavailable'; detail?: string };
    virusTotal: { status: 'safe' | 'malicious' | 'unavailable'; detail?: string };
    safexAI: { status: 'safe' | 'malicious' | 'unavailable'; detail?: string };
  };
  checks: {
    domainAge: number; // days (best-effort; may be 0 when unavailable)
    ssl: { valid: boolean; issuer?: string; error?: string };
    typosquatting: boolean;
    suspiciousRedirects: boolean;
    fakeLoginIndicators: boolean;
    blacklisted: boolean;
  };

  // NEW: structured sections for UI
  urlInformation: {
    targetUrl: string;
    hostname: string;
    protocol: string;
    path: string;
    queryPresent: boolean;
  };
  domainInformation: {
    domainAgeDays: number; // 0 when unavailable
    typosquatting: boolean;
    suspiciousTld: boolean;
    emailRoutingDetected: boolean;
  };
  sslCertificateAnalysis: {
    valid: boolean;
    issuer: string | null;
    error: string | null;
  };
  urlStructureAnalysis: {
    hasQuery: boolean;
    queryKeys: string[];
    looksLikeTyposquatting: boolean;
  };
  securityIndicators: {
    blacklisted: boolean;
    vulnerabilityFindingsCount: number;
  };
  contentAnalysis: {
    fetchedContent: boolean;
    notes: string;
  };

  breakdown: { factor: string; scoreImpact: number }[];
  riskFactors: EvidenceFinding[];
  consensus: string;
  isFalsePositiveLikely: boolean;
  deepSummary: string;
  vulnerabilities: {
    name: string;
    severity: 'Low' | 'Medium' | 'High';
    description: string;
    evidence?: string[];
    confidence?: number;
  }[];
}


async function checkVirusTotal(url: string) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return { status: 'unavailable' as const, detail: 'API Key missing' };

  try {
    const encodedUrl = Buffer.from(url).toString('base64').replace(/=/g, '');
    // VT API expects the base64-url-encoded URL without padding.
    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${encodedUrl}`, {
      headers: { 'x-apikey': apiKey }
    });

    if (res.ok) {
      const data = await res.json();
      const stats = data.data.attributes.last_analysis_stats;
      const maliciousCount = stats.malicious + stats.suspicious;
      return {
        status: maliciousCount > 0 ? 'malicious' as const : 'safe' as const,
        detail: `${maliciousCount} engines flagged this URL`
      };
    } else {
      if (res.status === 404) {
        // No report exists yet; treat as "not known".
        return { status: 'safe' as const, detail: 'No previous VT reports found.' };
      }
      return { status: 'unavailable' as const, detail: `API Error: ${res.status}` };
    }
  } catch {
    return { status: 'unavailable' as const, detail: 'Network error reaching VT.' };
  }
}



async function checkGoogleSafeBrowsing(url: string) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey) return { status: 'unavailable' as const, detail: 'API Key missing' };

  try {
    const payload = {
      client: { clientId: "safex-7", clientVersion: "1.0.0" },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }]
      }
    };

    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });


    if (res.ok) {
      const data = await res.json();
      if (data.matches && data.matches.length > 0) {
        const threatType = Array.isArray(data.matches[0]?.threatType)
          ? data.matches[0].threatType[0]
          : data.matches[0]?.threatType;
        return {
          status: 'malicious' as const,
          detail: `Flagged as ${threatType || 'malware/threat'}`
        };
      }
      return { status: 'safe' as const, detail: 'Not found in Safe Browsing list' };
    } else {
      return { status: 'unavailable' as const, detail: `API Error: ${res.status}` };
    }
  } catch {
    return { status: 'unavailable' as const, detail: 'Network error reaching Google.' };
  }
}


async function checkSSL(hostname: string): Promise<{ valid: boolean; issuer?: string; error?: string }> {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
    }, () => {
      const cert = socket.getPeerCertificate();
      const authorized = socket.authorized;
      socket.end();
      if (!authorized) {
         resolve({ valid: false, error: socket.authorizationError?.toString() || 'Invalid cert' });
      } else {
         resolve({ valid: true, issuer: (Array.isArray(cert.issuer?.O) ? cert.issuer?.O[0] : cert.issuer?.O) || (Array.isArray(cert.issuer?.CN) ? cert.issuer?.CN[0] : cert.issuer?.CN) || 'Unknown Issuer' });
      }
    });

    socket.on('error', (err) => {
      resolve({ valid: false, error: err.message });
    });
    
    setTimeout(() => {
      if (!socket.destroyed) socket.destroy();
      resolve({ valid: false, error: 'Connection timeout' });
    }, 5000);
  });
}

// Disabled: live HTML/headers fetching increases SSRF/timeout risk for a URL-scanning backend.
// Kept commented out to preserve earlier code intent.
/* async function checkVulnerabilities(urlStr: string) { 
  const vulnerabilities: ScanResult['vulnerabilities'] = [];
  
  // --- 1. Parameter Attack Surface Analysis ---
  try {
    const parsed = new URL(urlStr);
    const params = Array.from(parsed.searchParams.keys()).map(p => p.toLowerCase());
    
    const sqliParams = ['id', 'user', 'query', 'search', 'uid', 'cat', 'item'];
    const lfiParams = ['file', 'page', 'path', 'dir', 'include', 'template', 'doc', 'folder'];
    const ssrfParams = ['url', 'redirect', 'next', 'return', 'uri', 'continue', 'window'];

    if (params.some(p => sqliParams.includes(p))) {
      vulnerabilities.push({ name: 'Potential SQLi Vector', severity: 'Medium', description: `URL contains parameters (${params.filter(p => sqliParams.includes(p)).join(', ')}) often targeted for SQL Injection.` });
    }
    if (params.some(p => lfiParams.includes(p))) {
      vulnerabilities.push({ name: 'Potential LFI/Path Traversal Vector', severity: 'Medium', description: `URL contains file-path parameters often targeted for Local File Inclusion.` });
    }
    if (params.some(p => ssrfParams.includes(p))) {
      vulnerabilities.push({ name: 'Potential SSRF / Open Redirect Vector', severity: 'Medium', description: `URL contains routing parameters that could be exploited for Server-Side Request Forgery or Open Redirects.` });
    }
  } catch {
    // Ignore URL parse errors here
  }


  // --- 2. Live Header & Config Analysis ---
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // We keep this request “passive”: no POST, small timeout.
    const res = await fetch(urlStr, { method: 'GET', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeoutId);

    const headers = res.headers;

    const csp = headers.get('content-security-policy');
    // const cspStr: string | null = Array.isArray(csp) ? csp[0] ?? null : csp;
    if (!csp) {
      vulnerabilities.push({ name: 'Missing CSP', severity: 'Medium', description: 'No Content-Security-Policy header. This can make XSS easier to exploit.' });
    } else {
      // Basic weak-CSP heuristic.
      const cspValue = Array.isArray(csp) ? csp[0] ?? '' : csp ?? '';
      if (cspValue.toLowerCase().includes("'unsafe-inline'") || cspValue.toLowerCase().includes('unsafe-inline')) {

        vulnerabilities.push({ name: 'Weak CSP (allows inline scripts)', severity: 'Medium', description: 'CSP appears to allow inline scripts (unsafe-inline). This reduces protection against XSS.' });
      }
    }

    if (urlStr.startsWith('https') && !headers.has('strict-transport-security')) {
      vulnerabilities.push({ name: 'Missing HSTS', severity: 'Medium', description: 'Strict-Transport-Security not enforced. Vulnerable to SSL stripping (MitM).' });
    }


    const xfo = headers.get('x-frame-options') as string | null;

    const frameAncestorsAllowed = csp?.toLowerCase().includes('frame-ancestors');
    if (!xfo && !frameAncestorsAllowed) {
      vulnerabilities.push({ name: 'Missing Clickjacking Protection', severity: 'Low', description: 'No X-Frame-Options and no frame-ancestors in CSP. Can be vulnerable to clickjacking.' });
    } else if (xfo && xfo.toLowerCase().includes('allow-from')) {
      vulnerabilities.push({ name: 'Weak X-Frame-Options mode', severity: 'Low', description: 'X-Frame-Options is set to an older/less reliable mode (allow-from). Prefer DENY or SAMEORIGIN.' });
    }

    const xContentTypeOptions = headers.get('x-content-type-options');
    const xContentTypeOptionsStr = Array.isArray(xContentTypeOptions)
      ? xContentTypeOptions[0]
      : xContentTypeOptions;

    if ((xContentTypeOptionsStr ?? '').toLowerCase() !== 'nosniff') {
      vulnerabilities.push({ name: 'MIME-Sniffing Vulnerability', severity: 'Low', description: 'Missing or incorrect X-Content-Type-Options: nosniff header.' });
    }


    const allowOrigin = headers.get('access-control-allow-origin');
    const allowCredentials = headers.get('access-control-allow-credentials');


    // In Node/undici, get() should return string | null, but TS can still infer string|string[].
    const allowOriginStr: string = Array.isArray(allowOrigin)
      ? allowOrigin[0] ?? ''
      : (allowOrigin ?? '');
    const allowCredentialsStr: string = Array.isArray(allowCredentials)
      ? allowCredentials[0] ?? ''
      : (allowCredentials ?? '');





    if (allowOriginStr === '*') {
      vulnerabilities.push({ name: 'Insecure CORS Policy', severity: 'High', description: 'Wildcard CORS policy (Access-Control-Allow-Origin: *) allows any website to read responses.' });
    }
    if (allowOriginStr !== '*' && allowCredentialsStr.toLowerCase() === 'true' && allowOriginStr && !allowOriginStr.includes('://')) {

      vulnerabilities.push({ name: 'Potential Risky CORS + Credentials', severity: 'Medium', description: 'CORS allows credentials and may be overly permissive. Review Access-Control-Allow-Origin carefully.' });
    }




    // Additional security headers
    if (!headers.has('referrer-policy')) {
      vulnerabilities.push({ name: 'Missing Referrer-Policy', severity: 'Low', description: 'Referrer-Policy header is missing. This can leak URLs via the Referer header.' });
    }

    if (!headers.has('permissions-policy')) {
      vulnerabilities.push({ name: 'Missing Permissions-Policy', severity: 'Low', description: 'Permissions-Policy header is missing. Browser feature access is less controlled.' });
    }

    // Information disclosure
    const serverHeader = headers.get('server') as string | null;

    if (serverHeader && serverHeader.length > 5) {
      vulnerabilities.push({ name: 'Exposed Server Info', severity: 'Low', description: `Server header exposes details: ${serverHeader}` });
    }
    const poweredBy = headers.get('x-powered-by') as string | null;

    if (poweredBy) {
      vulnerabilities.push({ name: 'Exposed Tech Stack', severity: 'Low', description: `X-Powered-By header exposes backend: ${poweredBy}` });
    }

    // Basic download/unsafe content heuristics.
    const contentType = headers.get('content-type') as string | null;

    if (contentType && contentType.toLowerCase().includes('text/html') && (headers.get('content-disposition') || '').toLowerCase().includes('attachment')) {
      vulnerabilities.push({ name: 'Potential Unsafe Download Behavior', severity: 'Low', description: 'HTML content is being sent as an attachment (Content-Disposition: attachment). Review download handling.' });
    }

  } catch {
    // Network error or timeout, ignore for passive scans
  }

  return vulnerabilities;
}
*/

export async function analyzeUrl(urlStr: string): Promise<ScanResult> {
  const normalizeAndValidateUrl = (input: string): URL => {
    const trimmed = input.trim();
    if (!trimmed) throw new Error('Invalid URL format');

    // Prevent obviously unsafe schemes.
    // (We only support http/https for scanning.)
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
    const candidate = hasScheme ? trimmed : `https://${trimmed}`;

    let u: URL;
    try {
      u = new URL(candidate);
    } catch {
      throw new Error('Invalid URL format');
    }

    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error('Only http/https URLs are allowed');
    }

    return u;
  };

  const urlToScan = normalizeAndValidateUrl(urlStr);

  const suspiciousTld = ['.xyz', '.top', '.club', '.online', '.site', '.click', '.gq', '.work', '.loan']
    .some(tld => urlToScan.hostname.toLowerCase().endsWith(tld));


  const hostname = urlToScan.hostname.toLowerCase();
  const scoreParts: { factor: string; scoreImpact: number }[] = [];

  // --------- URL Structure Analysis (multi-signal) ---------
  const hostnameParts = hostname.split('.').filter(Boolean);
  const subdomainCount = Math.max(0, hostnameParts.length - 2);

  const ipBased = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':');

  const suspiciousCharHits = [
    { re: /@/g, label: 'Userinfo (@) present (common in phishing links)', w: 18 },

    { re: /--/g, label: 'Multiple hyphens (obfuscation)', w: 10 },
    { re: /\.\./g, label: 'Path traversal-like sequences', w: 15 },
    { re: /\/{2,}/g, label: 'Multiple slashes in URL path', w: 10 },
    { re: /%2f|%5c/i, label: 'Encoded slash/backslash characters', w: 18 },
  ];

  const suspiciousKeywords = [
    'login', 'verify', 'bank', 'update', 'secure', 'free', 'crypto', 'account', 'recovery',
    'wallet', 'payment', 'invoice', 'urgent', 'suspend', 'review'
  ];

  const pathAndQuery = `${urlToScan.pathname}${urlToScan.search}`.toLowerCase();

  const shortenerDomainsPrimary = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly', 'adf.ly',
    'is.gd', 'cutt.ly', 'rebrand.ly', 'rb.gy', 't.ly', 'tiny.cc'
  ];

  const isShortenerPrimary = shortenerDomainsPrimary.some(d => hostname === d || hostname.endsWith(`.${d}`));


  const keywordHits = suspiciousKeywords.filter(k => pathAndQuery.includes(k));

  // Homoglyph heuristic (very light, no external libs): Cyrillic/Greek lookalikes.
  const hasNonLatin = /[\u0370-\u03FF\u0400-\u04FF]/.test(hostname);

  const urlStructureScore = [
    ipBased ? { factor: 'IP-based URL (direct IP use often seen in phishing)', scoreImpact: 30 } : null,
    subdomainCount >= 5 ? { factor: 'Excessive subdomains (obfuscation)', scoreImpact: 18 } : null,
    isShortenerPrimary ? { factor: 'URL shortener domain (hides destination)', scoreImpact: 22 } : null,

    hasNonLatin ? { factor: 'Non-Latin / homoglyph risk in domain', scoreImpact: 22 } : null,
    keywordHits.length > 0 ? { factor: `Suspicious keywords in path/query: ${keywordHits.slice(0, 4).join(', ')}`, scoreImpact: Math.min(25, 6 * keywordHits.length) } : null,
  ].filter(Boolean) as { factor: string; scoreImpact: number }[];

  for (const hit of urlStructureScore) scoreParts.push(hit);

  for (const s of suspiciousCharHits) {
    if (s.re.test(urlToScan.href)) {
      scoreParts.push({ factor: s.label, scoreImpact: s.w });
    }
  }

  const looksLikeTyposquatting = hostname.includes('g00gle') || hostname.includes('paypa1') || hostname.includes('faceb00k') || hostname.includes('netflix');

  if (looksLikeTyposquatting) {
    scoreParts.push({ factor: 'Brand impersonation / simple typosquatting indicators', scoreImpact: 60 });
  }

  // --------- Security checks: HTTPS/TLS + Certificate expiry (best-effort) ---------
  const ssl = await checkSSL(hostname);

  let sslRisk = 0;
  if (!ssl.valid) {
    sslRisk = 35;
    scoreParts.push({ factor: 'TLS/SSL not valid or unsupported', scoreImpact: 35 });
  }

  // --------- DNS validation + domain intelligence (best-effort) ---------
  const domainAgeDays = 3650; // fallback
  let dnsOk = true;

  try {
    await dns.resolveMx(hostname);
  } catch {
    dnsOk = false;
    scoreParts.push({ factor: 'DNS/MX resolution failed (domain likely risky or not configured)', scoreImpact: 25 });
  }

  // --------- Threat database integration (graceful fallback) ---------
  // Note: these require env keys; when missing we report unavailable.
  const [vtResult, gsbResult] = await Promise.all([
    checkVirusTotal(urlToScan.toString()),
    checkGoogleSafeBrowsing(urlToScan.toString())
  ]);

  const isBlacklisted = vtResult.status === 'malicious' || gsbResult.status === 'malicious';
  if (isBlacklisted) {
    scoreParts.push({ factor: 'Flagged by external threat feeds (VirusTotal / Safe Browsing)', scoreImpact: 45 });
  }



  // --------- Redirect + destination analysis (no active fetching => conservative) ---------
  // We avoid SSRF/long fetches here; we instead flag risky patterns from the URL itself.
  // (If you want full redirect-chain following, we can add it with strict SSRF guards + caps.)
  const redirectRisk = /%2f%2f|\/\//i.test(urlToScan.search + urlToScan.pathname) || /redirect|url=|next=|return=|continue=/i.test(urlToScan.search);
  if (redirectRisk) scoreParts.push({ factor: 'Redirect-like parameters suggest obfuscated destination', scoreImpact: 20 });

  // --------- Content heuristics (only structural/passive, avoid full HTML fetch) ---------
  // We infer from URL keywords to reduce false positives.
  const fakeLoginIndicators = /login|signin|verify|account\s*|secure/i.test(pathAndQuery);
  if (fakeLoginIndicators) scoreParts.push({ factor: 'Login/verification language detected in URL', scoreImpact: 18 });

  // --------- Risk scoring engine (0–100) ---------
  // Weighted sum, then clamp.
  const rawScore = scoreParts.reduce((sum, p) => sum + p.scoreImpact, 0) + (isBlacklisted ? 25 : 0) + sslRisk;
  const score = Math.max(0, Math.min(100, rawScore));

  let verdict: ScanResult['verdict'] = 'Safe';
  if (score > 75) verdict = 'Dangerous';
  else if (score > 50) verdict = 'Suspicious';
  else if (score > 20) verdict = 'Low Risk';

  const sources = {
    googleSafeBrowsing: gsbResult,
    virusTotal: vtResult,
    safexAI: {
      status: score > 50 ? 'malicious' as const : 'safe' as const,
      detail: score > 50 ? 'High-risk URL structure signals detected' : 'Low-risk URL structure signals'
    }
  };

  const activeSources = Object.values(sources).filter(s => s.status !== 'unavailable').length;
  const maliciousSourceCount = Object.values(sources).filter(s => s.status === 'malicious').length;
  const consensus = activeSources > 0
    ? `${maliciousSourceCount}/${activeSources} engines flagged this URL`
    : 'No active external engines';

  // Confidence: deterministic-ish; scale with number of active signals.
  const confidenceBase = 45;
  const confidenceBoost = Math.min(35, scoreParts.length * 4);
  const threatBoost = isBlacklisted ? 20 : 0;
  const confidence = Math.max(40, Math.min(99, confidenceBase + confidenceBoost + threatBoost));

  const breakdown = scoreParts;

  // Evidence-gated Risk Factors: only emit factors that were actually detected.
  // (We keep this aligned with the existing scoreParts signals, but we provide richer evidence.)
  // NOTE: domain risk signals (TLD) computed once above as `domainInformation.suspiciousTld`.
  // Only build evidence-gated riskFactors here.

  const riskFactors: EvidenceFinding[] = [];

  // False-positive suppression: if hostname is whitelisted AND not blacklisted, suppress risk factors.
  const whitelistEnv = process.env.SAFEX_WHITELISTED_DOMAINS || '';
  const whitelist = whitelistEnv
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
  const isWhitelisted = whitelist.some(d => {
    if (!d) return false;
    return hostname === d || hostname.endsWith(`.${d}`);
  });

  const pushFactor = (f: EvidenceFinding | null) => {
    if (!f) return;
    if (isWhitelisted && !isBlacklisted) return;
    riskFactors.push(f);
  };

  const evidence: string[] = [];

  if (ipBased) {
    pushFactor({
      title: 'IP Address in URL (Direct Destination)',
      severity: 'Medium',
      confidence: 78,
      evidence: ['The scanned URL hostname is an IP address (or contains colon ":" characters suggesting an IP/port pattern).'],
      whyItMatters: 'Phishing infrastructure often uses direct IP targets to bypass domain-based reputation and brand checks.',
      recommendedFix: 'Use a stable, reputable domain (and avoid direct IP URLs).',
      scoreImpact: 30
    });
  }

  // Suspicious TLD (derived from URL hostname suffix)
  if (suspiciousTld) {
    pushFactor({
      title: 'Suspicious / Disposable TLD',
      severity: 'Medium',
      confidence: 72,
      evidence: [`TLD suffix matched: ${hostname.split('.').slice(-1)[0]}`],
      whyItMatters: 'Many phishing campaigns use newer or less common TLDs to reduce takedown risk.',
      recommendedFix: 'Use an established TLD and keep consistent domain registration details.',
      scoreImpact: 18
    });
  }

  const encodedHit = /%2f|%5c|%25[0-9a-f]{2}/i.test(urlToScan.href);
  if (encodedHit) {
    pushFactor({
      title: 'Encoded / Obfuscated URL Characters',
      severity: 'Medium',
      confidence: 80,
      evidence: ['Encoded characters detected in URL (e.g., %2F / %5C).'],
      whyItMatters: 'Attackers often obfuscate destinations to evade URL filtering and user scrutiny.',
      recommendedFix: 'Remove obfuscation/encoding from URLs and use clear, direct paths.',
      scoreImpact: 18
    });
  }

  if (suspiciousCharHits.some(s => s.re.test(urlToScan.href) && s.label.includes('Userinfo'))) {
    pushFactor({
      title: 'Userinfo (@) Abuse',
      severity: 'High',
      confidence: 84,
      evidence: ['The URL contains @ in the authority/userinfo component.'],
      whyItMatters: 'Userinfo in URLs can mislead users about the real destination during browser rendering.',
      recommendedFix: 'Remove userinfo-style components; use a proper domain/host only.',
      scoreImpact: 18
    });
  }

  const doubleSlash = /\/{2,}/.test(urlToScan.pathname) || /%2f%2f|\/\//i.test(urlToScan.search + urlToScan.pathname);
  if (doubleSlash) {
    pushFactor({
      title: 'Double-Slash / Redirect-Style Path Patterns',
      severity: 'Medium',
      confidence: 76,
      evidence: ['URL structure suggests double slashes or redirect-like separators.'],
      whyItMatters: 'This pattern is common in phishing links that attempt to hide the true redirect destination.',
      recommendedFix: 'Avoid double slashes and redirect-like patterns in URLs; use explicit, validated redirect endpoints.',
      scoreImpact: 20
    });
  }

  const shortenerDomains = [
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'buff.ly', 'adf.ly',
    'is.gd', 'cutt.ly', 'rebrand.ly', 'rb.gy', 't.ly', 'tiny.cc'
  ];
  const isShortener = shortenerDomains.some(d => hostname === d || hostname.endsWith(`.${d}`));
  if (isShortener) {
    pushFactor({
      title: 'URL Shortener Usage',
      severity: 'Medium',
      confidence: 74,
      evidence: [`Hostname matches known shortener list: ${hostname}`],
      whyItMatters: 'Shorteners hide final destinations and are frequently used in phishing campaigns.',
      recommendedFix: 'Provide a direct URL or clearly disclose the final destination.',
      scoreImpact: 22
    });
  }

  if (keywordHits.length > 0) {
    pushFactor({
      title: 'Suspicious Keywords in URL Path/Query',
      severity: 'Low',
      confidence: 60,
      evidence: [`Matched keywords: ${keywordHits.slice(0, 6).join(', ')}`],
      whyItMatters: 'Phishing URLs commonly include urgency/login/payment keywords to increase click-through rates.',
      recommendedFix: 'Avoid using misleading keywords; ensure the URL matches the true business action.',
      scoreImpact: Math.min(18, Math.max(6, 6 * keywordHits.length))
    });
  }

  if (looksLikeTyposquatting) {
    pushFactor({
      title: 'Brand Impersonation / Typosquatting (Heuristic)',
      severity: 'High',
      confidence: 70,
      evidence: ['Domain matched known common typosquatting strings (e.g., g00gle, paypa1).'],
      whyItMatters: 'Typosquatted brands aim to trick users into trusting a fraudulent destination.',
      recommendedFix: 'Use the legitimate brand domain; avoid lookalike spellings.',
      scoreImpact: 60
    });
  }

  if (!ssl.valid) {
    pushFactor({
      title: 'Invalid / Untrusted TLS Certificate',
      severity: 'High',
      confidence: 82,
      evidence: [ssl.error ? `TLS check error: ${ssl.error}` : 'TLS certificate not authorized/validated.'],
      whyItMatters: 'Invalid TLS can indicate misconfiguration or allow man-in-the-middle interception.',
      recommendedFix: 'Use a valid certificate chain from a trusted CA; ensure correct hostname binding.',
      scoreImpact: 35
    });
  }

  if (isBlacklisted) {
    pushFactor({
      title: 'Blacklisted by Threat Intelligence Feeds',
      severity: 'High',
      confidence: 95,
      evidence: [
        ...(vtResult.status === 'malicious' ? ['VirusTotal: malicious'] : []),
        ...(gsbResult.status === 'malicious' ? ['Google Safe Browsing: malicious'] : [])
      ],
      whyItMatters: 'Multiple threat feeds flag the destination as malicious/phishing/abusive.',
      recommendedFix: 'Do not load or interact with this URL; investigate via incident response.',
      scoreImpact: 45
    });
  }

  const deepSummary = isBlacklisted
    ? 'Threat databases flagged this URL as malicious.'
    : riskFactors.length > 0
      ? `Evidence-based risk indicators were detected: ${riskFactors.map(r => r.title).slice(0, 3).join('; ')}${riskFactors.length > 3 ? '…' : ''}.`
      : 'No evidence-backed phishing indicators were detected from the available signals.';

  // Evidence-based Vulnerability Findings:
  // IMPORTANT: We only return findings we can verify from our passive signals.
  // No live HTML analysis => vulnerabilities list is limited to TLS + threat feeds + redirect-like parameters.
  const vulnerabilities: ScanResult['vulnerabilities'] = [];

  const addVuln = (v: ScanResult['vulnerabilities'][number] | null) => {
    if (!v) return;
    vulnerabilities.push(v);
  };

  if (isBlacklisted) {
    addVuln({
      name: 'Malicious / Phishing Destination (Threat-Feed Verified)',
      severity: 'High',

      description: 'External threat feeds flagged this URL/domain as malicious.',
      evidence: [
        ...(vtResult.status === 'malicious' ? ['VirusTotal: malicious'] : []),
        ...(gsbResult.status === 'malicious' ? ['Google Safe Browsing: malicious'] : [])
      ],
      confidence: 95
    });
  }

  if (!ssl.valid) {
    addVuln({
      name: 'SSL/TLS Invalid or Untrusted',
      severity: 'High',
      description: 'TLS validation failed during best-effort certificate inspection.',
      evidence: [ssl.error ? `TLS check error: ${ssl.error}` : 'Certificate not authorized/validated.'],
      confidence: 82
    });
  }

  if (redirectRisk) {
    addVuln({
      name: 'Suspicious Redirect/Obfuscated Destination Pattern',
      severity: 'Medium',
      description: 'URL contains redirect-like parameters that can hide the true destination.',
      evidence: ['URL contains redirect/next/return style query markers or double-slash separators.'],
      confidence: 70
    });
  }

  const verdictConfidence = vulnerabilities.length > 0 ? Math.min(99, confidence + 5) : confidence;

  return {
    url: urlToScan.toString(),
    score,
    verdict,
    confidence: verdictConfidence,
    sources,
    checks: {
      domainAge: domainAgeDays,
      ssl,
      typosquatting: looksLikeTyposquatting,
      suspiciousRedirects: redirectRisk,
      fakeLoginIndicators,
      blacklisted: isBlacklisted
    },
    urlInformation: {
      targetUrl: urlToScan.toString(),
      hostname,
      protocol: urlToScan.protocol.replace(':', ''),
      path: urlToScan.pathname,
      queryPresent: urlToScan.search.length > 0,
    },
    domainInformation: {
      domainAgeDays,
      typosquatting: looksLikeTyposquatting,
      suspiciousTld,
      emailRoutingDetected: dnsOk
    },
    sslCertificateAnalysis: {
      valid: ssl.valid,
      issuer: Array.isArray(ssl.issuer) ? (ssl.issuer[0] ?? null) : (ssl.issuer ?? null),
      error: Array.isArray(ssl.error) ? (ssl.error[0] ?? null) : (ssl.error ?? null),
    },
    urlStructureAnalysis: {
      hasQuery: urlToScan.search.length > 0,
      queryKeys: Array.from(urlToScan.searchParams.keys()),
      looksLikeTyposquatting: looksLikeTyposquatting,
    },
    securityIndicators: {
      blacklisted: isBlacklisted,
      vulnerabilityFindingsCount: vulnerabilities.length,
    },
    contentAnalysis: {
      fetchedContent: false,
      notes: 'No full HTML fetch performed. Detection uses URL structure signals + TLS/DNS + threat feeds.'
    },
    breakdown,
    riskFactors,
    consensus,
    isFalsePositiveLikely: score <= 40 && !isBlacklisted,
    deepSummary,
    vulnerabilities,
  };
}

