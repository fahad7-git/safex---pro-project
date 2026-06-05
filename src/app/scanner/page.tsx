"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, ShieldCheck, ShieldAlert, Shield, Download, Activity, Server, Lock, Globe, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScanResult } from '@/lib/engine';

export default function ScannerPage() {
  const searchParams = useSearchParams();
  const urlParam = searchParams?.get('url');

  // Avoid Next prerender errors in production builds.
  const [inputUrl, setInputUrl] = useState('');

  useEffect(() => {
    if (urlParam) setInputUrl(urlParam);
  }, [urlParam]);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDeepLog, setShowDeepLog] = useState(false);

  useEffect(() => {
    if (urlParam) {
      handleScan(urlParam);
    }
  }, [urlParam]);

  const handleScan = async (urlToScan: string) => {
    if (!urlToScan) return;
    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan URL');
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsScanning(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(inputUrl);
  };

  // Helper for color based on risk
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-12 flex-grow">
      
      {/* Search Header */}
      <div className="max-w-4xl mx-auto mb-12 relative">
        <h1 className="text-3xl font-bold mb-6 text-center">Threat Intelligence Scanner</h1>
        <form onSubmit={onSubmit} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-blue-500/50 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative flex items-center bg-card border border-border rounded-xl shadow-xl overflow-hidden p-2">
            <Globe className="w-6 h-6 ml-4 text-foreground/50" />
            <input
              type="url"
              placeholder="Enter URL, Domain, or IP Address"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              required
              className="w-full bg-transparent border-none text-foreground px-4 py-4 focus:outline-none text-lg"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="bg-secondary hover:bg-secondary/90 text-white font-bold px-8 py-4 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? <Activity className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span className="hidden sm:inline">{isScanning ? 'Analyzing...' : 'Scan Now'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isScanning && (
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
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
            <Shield className="w-16 h-16 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold animate-pulse text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
            Running Multi-Layer Verification...
          </h2>
          <p className="text-foreground/50 mt-4 max-w-md text-center">
            Querying threat databases, analyzing DNS records, inspecting SSL certificates, and evaluating behavioral patterns.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isScanning && (
        <div className="max-w-4xl mx-auto p-6 bg-destructive/10 border border-destructive/50 rounded-xl text-center">
          <AlertOctagon className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-bold text-destructive mb-2">Scan Failed</h3>
          <p className="text-foreground/70">{error}</p>
        </div>
      )}

      {/* Results Dashboard */}
      {result && !isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Score Card (Left Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className={cn("glass-panel p-8 text-center border-2", getRiskBorder(result.score))}>
              <h2 className="text-xl font-bold mb-6 text-foreground/80">Risk Score</h2>
              
              <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                {/* SVG Gauge */}
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

            <div className="glass-panel p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Actions
              </h3>
              <button 
                onClick={() => {
                  // Include both text sections and raw telemetry in the PDF export.
                  setShowDeepLog(true);
                  setTimeout(() => window.print(), 0);
                }}
                className="w-full bg-secondary hover:bg-secondary/90 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3 no-print"
              >
                Export PDF Report
              </button>

              <button 
                onClick={handleShare}
                className="w-full bg-card hover:bg-card/80 border border-border text-foreground font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <ShieldCheck className="w-5 h-5 text-green-500" /> : null}
                {copied ? "Link Copied!" : "Share Result"}
              </button>
            </div>
            
            {result.isFalsePositiveLikely && (
              <div className="glass-panel p-6 bg-yellow-500/5 border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-yellow-500">Potential False Positive</h4>
                    <p className="text-sm text-foreground/70 mt-1">
                      Our heuristics flagged this URL, but it is not listed in any major threat database. Manual review is recommended.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Column (Right) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Executive Deep Summary */}
            <div className={cn("glass-panel p-6 border-l-4", 
              result.score > 75 ? "border-l-destructive bg-destructive/5" : 
              result.score > 50 ? "border-l-yellow-500 bg-yellow-500/5" : 
              result.score > 20 ? "border-l-blue-500 bg-blue-500/5" : 
              "border-l-primary bg-primary/5"
            )}>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Safex-7 AI Deep Summary
              </h3>
              <p className="text-foreground/80 leading-relaxed font-medium">
                {result.deepSummary}
              </p>
            </div>

            {/* URL Information */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-500" />
                URL Information
              </h3>

              <div className="bg-background rounded-lg p-4 font-mono text-sm break-all mb-4 text-primary">
                {result.url}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Hostname</div>
                  <div className="font-bold truncate">{result.urlInformation.hostname}</div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Protocol</div>
                  <div className="font-bold">{result.urlInformation.protocol}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50 md:col-span-2">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Path</div>
                  <div className="font-bold truncate">{result.urlInformation.path || '/'}</div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Query</div>
                  <div className="font-bold flex items-center gap-2">
                    {result.urlInformation.queryPresent ? <ShieldCheck className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-foreground/60" />}
                    {result.urlInformation.queryPresent ? 'Present' : 'No'}
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Information */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                Domain Information
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Domain Age</div>
                  <div className="font-bold">{result.domainInformation.domainAgeDays} days</div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Typosquatting</div>
                  <div className={cn("font-bold flex items-center gap-1", result.domainInformation.typosquatting ? "text-destructive" : "text-primary")}>
                    {result.domainInformation.typosquatting ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {result.domainInformation.typosquatting ? 'Detected' : 'No'}
                  </div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Suspicious TLD</div>
                  <div className={cn("font-bold flex items-center gap-1", result.domainInformation.suspiciousTld ? "text-destructive" : "text-primary")}>
                    {result.domainInformation.suspiciousTld ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {result.domainInformation.suspiciousTld ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50 md:col-span-1">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Email Routing</div>
                  <div className={cn("font-bold flex items-center gap-1", result.domainInformation.emailRoutingDetected ? "text-primary" : "text-destructive")}>
                    {result.domainInformation.emailRoutingDetected ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.domainInformation.emailRoutingDetected ? 'Detected' : 'Not found' }
                  </div>
                </div>
              </div>
            </div>

            {/* SSL Certificate Analysis */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-500" />
                SSL Certificate Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50 md:col-span-1">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">SSL Status</div>
                  <div className={cn("font-bold flex items-center gap-2", result.sslCertificateAnalysis.valid ? "text-primary" : "text-destructive")}>
                    {result.sslCertificateAnalysis.valid ? <Lock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.sslCertificateAnalysis.valid ? 'Valid' : 'Missing / Invalid'}
                  </div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50 md:col-span-2">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Issuer</div>
                  <div className="font-bold truncate">{result.sslCertificateAnalysis.issuer || 'N/A'}</div>
                </div>
              </div>

              {!result.sslCertificateAnalysis.valid && result.sslCertificateAnalysis.error && (
                <div className="mt-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4">
                  <div className="font-bold">SSL Error</div>
                  <div className="text-sm">{result.sslCertificateAnalysis.error}</div>
                </div>
              )}
            </div>

            {/* URL Structure Analysis */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                URL Structure Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Has Query</div>
                  <div className={cn("font-bold flex items-center gap-2", result.urlStructureAnalysis.hasQuery ? "text-primary" : "text-foreground/60")}>
                    {result.urlStructureAnalysis.hasQuery ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.urlStructureAnalysis.hasQuery ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50 md:col-span-2">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Query Keys</div>
                  <div className="font-bold truncate">
                    {result.urlStructureAnalysis.queryKeys.length > 0 ? result.urlStructureAnalysis.queryKeys.join(', ') : 'None'}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-card/50 p-3 rounded-lg border border-border/50">
                <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Typosquatting Signals</div>
                <div className={cn("font-bold flex items-center gap-2", result.urlStructureAnalysis.looksLikeTyposquatting ? "text-destructive" : "text-primary")}>
                  {result.urlStructureAnalysis.looksLikeTyposquatting ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  {result.urlStructureAnalysis.looksLikeTyposquatting ? 'Potentially suspicious' : 'No strong signal'}
                </div>
              </div>
            </div>

            {/* Security Indicators */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-blue-500" />
                Security Indicators
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Blacklisted</div>
                  <div className={cn("font-bold flex items-center gap-1", result.securityIndicators.blacklisted ? "text-destructive" : "text-primary")}>
                    {result.securityIndicators.blacklisted ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {result.securityIndicators.blacklisted ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50 md:col-span-2">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Vulnerability Findings</div>
                  <div className="font-bold">{result.securityIndicators.vulnerabilityFindingsCount} items</div>
                </div>
              </div>
            </div>

            {/* Content Analysis */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-500" />
                Content Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Content Fetched</div>
                  <div className={cn("font-bold flex items-center gap-2", result.contentAnalysis.fetchedContent ? "text-primary" : "text-foreground/60")}>
                    {result.contentAnalysis.fetchedContent ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.contentAnalysis.fetchedContent ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Notes</div>
                  <div className="text-sm text-foreground/80 leading-relaxed">{result.contentAnalysis.notes}</div>
                </div>
              </div>
            </div>


            {/* Reputation Engines Consensus */}
            <div className="glass-panel p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Server className="w-5 h-5 text-purple-500" />
                    Reputation Consensus
                  </h3>
                  <p className="text-sm text-foreground/60 mt-1">{result.consensus}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(result.sources).map(([engine, data]) => (
                  <div key={engine} className="bg-background/50 rounded-lg p-4 border border-border flex items-center justify-between">
                    <span className="font-medium capitalize">{engine.replace(/([A-Z])/g, ' $1').trim()}</span>
                    {data.status === 'safe' && <ShieldCheck className="w-5 h-5 text-primary" />}
                    {data.status === 'malicious' && <ShieldAlert className="w-5 h-5 text-destructive animate-pulse" />}
                    {data.status === 'unavailable' && <AlertOctagon className="w-5 h-5 text-foreground/40" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Vulnerabilities (simple language) */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-destructive" />
                Vulnerability Findings (Simple Explanation)
              </h3>
              <p className="text-sm text-foreground/60 mb-4">
                These are security misconfigurations or risky patterns we noticed while scanning the URL.
              </p>

              {result.vulnerabilities.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <ShieldCheck className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                  <p className="font-medium">No notable vulnerability patterns detected.</p>
                  <p className="text-sm mt-1">
                    This doesn’t guarantee safety, but it means we didn’t find obvious missing-security-header style issues.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {result.vulnerabilities.map((v, idx) => (
                    <div
                      key={`${v.name}-${idx}`}
                      className="bg-card/50 border border-border/50 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                                v.severity === 'High' && 'bg-destructive/10 text-destructive border-destructive/30',
                                v.severity === 'Medium' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
                                v.severity === 'Low' && 'bg-primary/10 text-primary border-primary/30'
                              )}
                            >
                              {v.severity} severity
                            </span>
                            <span className="font-bold truncate">{v.name}</span>
                          </div>
                          <p className="text-sm text-foreground/70 leading-relaxed">{v.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* What we checked (quick scan details) */}
            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                What we checked
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Domain Age</div>
                  <div className="font-bold">{result.checks.domainAge} days</div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">SSL Certificate</div>
                  <div className={cn("font-bold flex items-center gap-2", result.checks.ssl.valid ? "text-primary" : "text-destructive")}>
                    {result.checks.ssl.valid ? <Lock className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {result.checks.ssl.valid ? 'Valid' : 'Missing / Invalid'}
                  </div>
                </div>
                <div className="bg-card/50 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-foreground/50 uppercase tracking-wider mb-1">Known Risk Signals</div>
                  <div className="text-sm font-bold">
                    {result.checks.typosquatting ? 'Typosquatting signals found' : 'No typosquatting signals'}
                  </div>
                </div>
              </div>

              {result.checks.blacklisted && (
                <div className="mt-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-4">
                  <div className="font-bold">High concern:</div>
                  <div className="text-sm">Flagged by global threat databases (VirusTotal / Google Safe Browsing).</div>
                </div>
              )}
            </div>

            {/* Risk Breakdown */}
            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Risk Factor Breakdown
              </h3>
              
              {result.breakdown.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <ShieldCheck className="w-12 h-12 text-primary/30 mx-auto mb-3" />
                  <p>No significant risk factors detected.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.breakdown.map((item, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between bg-card/40 p-4 rounded-lg border border-destructive/20"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <span className="font-medium">{item.factor}</span>
                      </div>
                      <div className="text-destructive font-bold bg-destructive/10 px-3 py-1 rounded-full">
                        +{item.scoreImpact} pts
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Deep Technical Inspection (Terminal View) */}
          <div className="lg:col-span-3 mt-4">
            <div className="glass-panel overflow-hidden border border-primary/20">
              <button 
                onClick={() => setShowDeepLog(!showDeepLog)}
                className="w-full p-4 flex items-center justify-between bg-card/30 hover:bg-card/60 transition-colors no-print"
              >

                <div className="flex items-center gap-2 font-mono text-sm">
                  <Server className="w-4 h-4 text-primary" />
                  <span className="text-primary font-bold">safex-7-cli --dump-telemetry</span>
                </div>
                <span className="text-xs font-bold text-foreground/50 uppercase tracking-wider">{showDeepLog ? "Collapse" : "Expand Raw Telemetry"}</span>
              </button>
              
              {showDeepLog && (
                <div className="p-6 bg-black/80 border-t border-primary/20 font-mono text-xs md:text-sm overflow-x-auto text-green-400">
                  <div className="mb-4 text-green-500/50">
                    {`> Initializing deep scan telemetry...`}
                    <br/>
                    {`> Parsing heuristics tree...`}
                    <br/>
                    {`> Output:`}
                  </div>
                  <pre className="whitespace-pre-wrap">
{JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
