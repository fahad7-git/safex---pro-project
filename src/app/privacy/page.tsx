import { ShieldCheck, Lock, EyeOff, Server } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex-grow">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy & Data Security</h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          At Safex-7 Pro, your security is our product. We operate on a strict zero-retention policy for sensitive analysis data.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-12">
        <section className="glass-panel p-8 border-l-4 border-l-primary">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <EyeOff className="w-6 h-6 text-primary" />
            1. Zero Data Retention
          </h2>
          <p className="text-foreground/70 leading-relaxed mb-4">
            When you submit a URL or email content for analysis, it is processed entirely in memory. We do not store, log, or persist user-submitted threat data to disk after the analysis session completes.
          </p>
          <ul className="list-disc list-inside text-foreground/70 space-y-2 ml-4">
            <li>URLs are passed to analysis engines and immediately purged.</li>
            <li>Email headers and content are analyzed via stream and discarded.</li>
            <li>No Personally Identifiable Information (PII) is extracted or retained.</li>
          </ul>
        </section>

        <section className="glass-panel p-8 border-l-4 border-l-blue-500">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-500" />
            2. End-to-End Encryption
          </h2>
          <p className="text-foreground/70 leading-relaxed">
            All data in transit between your browser or application and our API endpoints is secured using TLS 1.3 encryption. We strictly enforce HTTPS and utilize HTTP Strict Transport Security (HSTS) headers.
          </p>
        </section>

        <section className="glass-panel p-8 border-l-4 border-l-purple-500">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Server className="w-6 h-6 text-purple-500" />
            3. Third-Party Integrations
          </h2>
          <p className="text-foreground/70 leading-relaxed">
            To provide accurate risk scores, URLs (but never emails or PII) may be queried against third-party threat intelligence databases (e.g., Google Safe Browsing, VirusTotal). These queries are anonymized and stripped of any session identifiers before transmission.
          </p>
        </section>

        <section className="glass-panel p-8 border-l-4 border-l-green-500">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-green-500" />
            4. Compliance
          </h2>
          <p className="text-foreground/70 leading-relaxed">
            Our infrastructure and processes are designed in alignment with SOC 2, GDPR, and CCPA principles. As we do not store user data, the risk of data breach concerning user submissions is inherently minimized by design.
          </p>
        </section>

        <div className="text-center text-sm text-foreground/50 pt-8 border-t border-border/50">
          Last Updated: May 2026 • For privacy inquiries, please contact privacy@safex7.pro
        </div>
      </div>
    </div>
  );
}
