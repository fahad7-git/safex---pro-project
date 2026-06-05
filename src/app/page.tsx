"use client";

import { motion } from 'framer-motion';
import { ShieldAlert, Search, Activity, Lock, Globe, Server, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      router.push(`/scanner?url=${encodeURIComponent(url)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden flex-grow flex items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />
        
        <div className="container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                <ShieldAlert className="w-4 h-4" />
                <span>Enterprise-Grade Phishing Intelligence</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                Detect Phishing Before It <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 neon-text-green">
                  Detects You.
                </span>
              </h1>
              <p className="text-lg text-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                Safex-7 Pro utilizes an advanced multi-layer verification engine, cross-referencing industry-leading threat databases and behavioral AI to identify malicious URLs instantly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-3xl mx-auto relative"
            >
              <form onSubmit={handleScan} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-card border border-border rounded-xl shadow-2xl overflow-hidden p-2">
                  <div className="pl-4 text-foreground/50">
                    <Globe className="w-6 h-6" />
                  </div>
                  <input
                    type="url"
                    placeholder="https://suspicious-website.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full bg-transparent border-none text-foreground px-4 py-4 focus:outline-none text-lg"
                  />
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-4 rounded-lg flex items-center gap-2 transition-all neon-border whitespace-nowrap"
                  >
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Deep Scan</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 bg-card/50 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "URLs Scanned", value: "2M+" },
              { label: "Threats Blocked", value: "850K+" },
              { label: "Data Sources", value: "15+" },
              { label: "Uptime", value: "99.99%" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6"
              >
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500 mb-2">{stat.value}</div>
                <div className="text-foreground/60 font-medium uppercase tracking-wider text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="relative py-24 container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Multi-Layer Verification Engine</h2>
          <p className="text-foreground/60">
            We don&apos;t rely on a single source. Our engine aggregates data from top-tier threat intelligence providers and performs deep behavioral analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <ShieldAlert className="w-8 h-8 text-primary" />, title: "Reputation Intelligence", desc: "Cross-checks against Google Safe Browsing, VirusTotal, PhishTank, and Cisco Talos." },
            { icon: <Lock className="w-8 h-8 text-blue-500" />, title: "SSL/TLS Security", desc: "Deep inspection of certificate validity, issuer trust, and HTTPS enforcement." },
            { icon: <Server className="w-8 h-8 text-purple-500" />, title: "Domain Intelligence", desc: "Real-time WHOIS lookups, domain age verification, and DNSSEC validation." },
            { icon: <Activity className="w-8 h-8 text-red-500" />, title: "Behavioral Analysis", desc: "Detects hidden iframes, redirect chains, and fake login page indicators." },
            { icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />, title: "URL Pattern Matching", desc: "Advanced heuristics to catch typosquatting and homograph attacks." },
            { icon: <CheckCircle2 className="w-8 h-8 text-green-500" />, title: "Consensus Scoring", desc: "Weighted risk score algorithm aggregating multiple engine verdicts to reduce false positives." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-8 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="bg-background/80 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-border">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-foreground/60 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
