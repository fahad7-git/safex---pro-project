import { Code, Terminal, FileJson, Shield, Key } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex-grow">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">API Documentation</h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          Integrate Safex-7 Pro's enterprise-grade threat intelligence engine directly into your applications, SIEMs, or automated workflows.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="col-span-1 space-y-2">
          <h3 className="font-bold text-lg mb-4 text-primary">Overview</h3>
          <ul className="space-y-2 text-foreground/70">
            <li><a href="#getting-started" className="hover:text-primary transition-colors">Getting Started</a></li>
            <li><a href="#authentication" className="hover:text-primary transition-colors">Authentication</a></li>
            <li><a href="#rate-limits" className="hover:text-primary transition-colors">Rate Limits</a></li>
          </ul>
          
          <h3 className="font-bold text-lg mb-4 mt-8 text-primary">Endpoints</h3>
          <ul className="space-y-2 text-foreground/70">
            <li><a href="#scan-url" className="hover:text-primary transition-colors">POST /api/v1/scan</a></li>
            <li><a href="#scan-email" className="hover:text-primary transition-colors">POST /api/v1/email</a></li>
            <li><a href="#threat-feed" className="hover:text-primary transition-colors">GET /api/v1/feed</a></li>
          </ul>
        </div>

        {/* Content */}
        <div className="col-span-1 md:col-span-3 space-y-12">
          <section id="getting-started">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Terminal className="w-8 h-8 text-primary" />
              Getting Started
            </h2>
            <div className="glass-panel p-6">
              <p className="text-foreground/70 leading-relaxed mb-4">
                The Safex-7 REST API allows you to programmatically submit URLs and raw emails for analysis, retrieving our weighted consensus score and detailed risk breakdown. All requests must be made over HTTPS.
              </p>
              <div className="bg-background rounded-lg p-4 font-mono text-sm text-green-400 border border-border">
                Base URL: https://api.safex7.pro/v1
              </div>
            </div>
          </section>

          <section id="authentication">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Key className="w-8 h-8 text-blue-500" />
              Authentication
            </h2>
            <div className="glass-panel p-6">
              <p className="text-foreground/70 leading-relaxed mb-4">
                Authenticate your API requests by including your secret API key in the `Authorization` header.
              </p>
              <div className="bg-background rounded-lg p-4 font-mono text-sm border border-border">
                <span className="text-blue-400">Authorization:</span> Bearer YOUR_API_KEY
              </div>
            </div>
          </section>

          <section id="scan-url">
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
              <Code className="w-8 h-8 text-purple-500" />
              Scan URL
            </h2>
            <div className="glass-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-primary/20 text-primary font-bold px-3 py-1 rounded">POST</span>
                <span className="font-mono text-lg">/api/v1/scan</span>
              </div>
              <p className="text-foreground/70 mb-6">Submits a URL for deep analysis across multiple threat engines.</p>
              
              <h4 className="font-bold mb-2">Request Body</h4>
              <div className="bg-background rounded-lg p-4 font-mono text-sm border border-border mb-6">
<pre className="text-blue-300">
{`{
  "url": "https://suspicious-example.com"
}`}
</pre>
              </div>

              <h4 className="font-bold mb-2 flex items-center gap-2"><FileJson className="w-4 h-4 text-green-500"/> Response Example</h4>
              <div className="bg-background rounded-lg p-4 font-mono text-sm border border-border">
<pre className="text-green-300 overflow-x-auto">
{`{
  "score": 85,
  "verdict": "Dangerous",
  "confidence": 94.5,
  "checks": {
    "domainAge": 5,
    "ssl": { "valid": false },
    "typosquatting": true
  },
  "consensus": "3/3 engines flagged this URL"
}`}
</pre>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
