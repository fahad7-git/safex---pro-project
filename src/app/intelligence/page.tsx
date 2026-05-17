"use client";

import { Activity, ShieldAlert, Target, TrendingUp, AlertOctagon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockChartData = [
  { time: '00:00', threats: 120 },
  { time: '04:00', threats: 210 },
  { time: '08:00', threats: 450 },
  { time: '12:00', threats: 380 },
  { time: '16:00', threats: 620 },
  { time: '20:00', threats: 410 },
  { time: '24:00', threats: 290 },
];

const topImpersonated = [
  { brand: 'Microsoft', percentage: 28 },
  { brand: 'PayPal', percentage: 18 },
  { brand: 'Facebook', percentage: 15 },
  { brand: 'Netflix', percentage: 11 },
  { brand: 'Apple', percentage: 9 },
];

export default function ThreatIntelligencePage() {
  return (
    <div className="container mx-auto px-4 py-12 flex-grow">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="text-blue-500 w-8 h-8" />
            Global Threat Intelligence
          </h1>
          <p className="text-foreground/60 mt-2">Live telemetry and phishing campaign tracking.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">Live Feeds Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Phishing Attacks Detected (Last 24h)
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="threats" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-destructive" />
            Top Impersonated Brands
          </h2>
          <div className="space-y-4">
            {topImpersonated.map((brand, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{brand.brand}</span>
                  <span className="font-mono text-primary">{brand.percentage}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-primary h-2 rounded-full" style={{ width: `${brand.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 border-destructive/20">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-destructive animate-pulse" />
          Latest Detected Campaigns
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/50 text-foreground/70 uppercase">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Threat Type</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Detected Origin</th>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3 rounded-tr-lg">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'Credential Harvesting', target: 'Office 365', origin: 'AS13335 Cloudflare', risk: 'Critical', time: '2 mins ago' },
                { type: 'Typosquatting', target: 'Netflix', origin: 'AS16276 OVH', risk: 'High', time: '14 mins ago' },
                { type: 'Fake Invoice', target: 'PayPal', origin: 'AS14061 DigitalOcean', risk: 'High', time: '45 mins ago' },
                { type: 'Spear Phishing', target: 'Bank of America', origin: 'AS396982 Google Cloud', risk: 'Critical', time: '1 hr ago' },
              ].map((campaign, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4 font-medium flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-destructive" />
                    {campaign.type}
                  </td>
                  <td className="px-4 py-4">{campaign.target}</td>
                  <td className="px-4 py-4 font-mono text-xs text-foreground/60">{campaign.origin}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold uppercase">
                      {campaign.risk}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-foreground/50">{campaign.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
