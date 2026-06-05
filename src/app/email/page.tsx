"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Search, ShieldCheck, Activity, ShieldAlert, AlertTriangle, AlertOctagon, Link as LinkIcon } from "lucide-react";
import { cn } from '@/lib/utils';

interface EmailScanResult {
  score: number;
  verdict: string;
  checks: {
    spf: { valid: boolean; detail: string };
    dkim: { valid: boolean; detail: string };
    dmarc: { valid: boolean; detail: string };
  };
  breakdown: { factor: string; scoreImpact: number }[];
  extractedLinks: string[];
  isFalsePositiveLikely: boolean;
  confidence: number;
  deepSummary: string;
}

export default function EmailAnalyzerPage() {
  const [content, setContent] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<EmailScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze email');
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 75) return 'text-destructive';
    if (score > 50) return 'text-yellow-500';
    if (score > 20) return 'text-blue-500';
    return 'text-primary';
  };

  const getRiskBorder = (score: number) => {
    if (score > 75) return 'border-destructive shadow-[0_0_15px_rgba(239,68,68,0.3)]';
    if (score > 50) return 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
    if (score > 20) return 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]';
    return 'border-primary shadow-[0_0_15px_rgba(16,185,129,0.3)]';
  };

  const getRiskBg = (score: number) => {
    if (score > 75) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (score > 50) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    if (score > 20) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  return (
    <div className="container mx-auto px-4 py-16 flex-grow">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
          <Mail className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Email Header & Content Analyzer</h1>
        <p className="text-foreground/70">
          Paste raw email headers or suspicious email content below. Our AI engine will extract links, verify SPF/DKIM/DMARC records, and detect sender spoofing.
        </p>
      </div>

      {!result && !isScanning && (
        <div className="max-w-4xl mx-auto glass-panel p-6 mb-12">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-64 bg-background border border-border rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-primary resize-none mb-4 text-foreground"
            placeholder="Paste full email headers or content here..."
          ></textarea>
          <div className="flex justify-between items-center">
            <p className="text-xs text-foreground/50 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-primary" /> Data is processed securely and never stored.
            </p>
            <button 
              onClick={handleAnalyze}
              disabled={!content.trim()}
              className="bg-primary hover:bg-primary/90 text-black font-bold px-8 py-3 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              Analyze Email
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isScanning && (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 mb-12">
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t-2 border-primary border-dashed"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-4 rounded-full border-b-2 border-blue-500 border-dashed"
            />
            <Mail className="w-16 h-16 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Analyzing Email Content...
          </h2>
          <p className="text-foreground/50 mt-4 max-w-md text-center">
            Verifying sender authentication, extracting embedded links, and evaluating scam patterns.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isScanning && (
        <div className="max-w-4xl mx-auto p-6 bg-destructive/10 border border-destructive/50 rounded-xl text-center mb-12">
          <AlertOctagon className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-destructive mb-2">Analysis Failed</h3>
          <p className="text-foreground/70">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-4 px-4 py-2 bg-destructive/20 text-destructive rounded-lg hover:bg-destructive/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {result && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
        >
          {/* Main Score Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className={cn("glass-panel p-8 text-center border-2", getRiskBorder(result.score))}>
              <h2 className="text-xl font-bold mb-6 text-foreground/80">Risk Score</h2>
              <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-card-foreground/10" />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10"
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * result.score) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={getRiskColor(result.score)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn("text-5xl font-black", getRiskColor(result.score))}>{result.score}</span>
                  <span className="text-sm font-medium text-foreground/50 mt-1">out of 100</span>
                </div>
              </div>
              <div className={cn("inline-flex items-center gap-2 px-6 py-2 rounded-full border text-lg font-bold uppercase tracking-wider mb-4", getRiskBg(result.score))}>
                {result.score > 75 ? <ShieldAlert className="w-5 h-5" /> : result.score > 20 ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                {result.verdict}
              </div>
              <div className="text-sm text-foreground/60 flex items-center justify-center gap-2">
                <Activity className="w-4 h-4" /> AI Confidence: <span className="font-bold text-foreground">{result.confidence}%</span>
              </div>
            </div>
            
            <button 
              onClick={() => { setResult(null); setContent(''); }}
              className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Analyze Another Email
            </button>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Executive Deep Summary */}
            <div className={cn("glass-panel p-6 border-l-4", 
              result.score > 75 ? "border-l-destructive bg-destructive/5" : 
              result.score > 50 ? "border-l-yellow-500 bg-yellow-500/5" : 
              result.score > 20 ? "border-l-blue-500 bg-blue-500/5" : 
              "border-l-primary bg-primary/5"
            )}>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Scan Report & Verdict
              </h3>
              <p className="text-foreground/85 leading-relaxed font-semibold text-base">
                {result.deepSummary}
              </p>
            </div>

            {/* Sender Authentication */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Sender Verification Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-2">SPF Record</div>
                  <div className={cn("font-bold flex items-center gap-2", result.checks.spf.valid ? "text-primary" : "text-destructive")}>
                    {result.checks.spf.valid ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.checks.spf.valid ? "Valid (Authorized)" : result.checks.spf.detail}
                  </div>
                </div>
                <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-2">DKIM Signature</div>
                  <div className={cn("font-bold flex items-center gap-2", result.checks.dkim.valid ? "text-primary" : "text-destructive")}>
                    {result.checks.dkim.valid ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.checks.dkim.valid ? "Verified Signature" : "Missing / Failed"}
                  </div>
                </div>
                <div className="bg-card/50 p-4 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-2">DMARC Policy</div>
                  <div className={cn("font-bold flex items-center gap-2", result.checks.dmarc.valid ? "text-primary" : "text-destructive")}>
                    {result.checks.dmarc.valid ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.checks.dmarc.valid ? `Configured: ${result.checks.dmarc.detail}` : "No DMARC Configured"}
                  </div>
                </div>
              </div>
            </div>

            {/* Extracted Links */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-blue-500" />
                Extracted Links ({result.extractedLinks.length})
              </h3>
              {result.extractedLinks.length === 0 ? (
                <p className="text-foreground/50 text-sm">No links found in the email content.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {result.extractedLinks.map((link, i) => (
                    <div key={i} className="bg-background rounded-lg p-3 font-mono text-sm break-all text-blue-400 border border-border">
                      {link}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Features Overview - Only show when not scanning and no results */}
      {!result && !isScanning && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Sender Authentication", desc: "Verifies SPF, DKIM, and DMARC alignments." },
            { title: "Link Extraction", desc: "Automatically extracts and scans all embedded URLs." },
            { title: "AI Scam Classification", desc: "Detects urgency, financial requests, and BEC indicators." },
          ].map((feature, i) => (
            <div key={i} className="bg-card/50 border border-border/50 rounded-xl p-6 text-center">
              <h3 className="font-bold mb-2 text-primary">{feature.title}</h3>
              <p className="text-sm text-foreground/60">{feature.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
