import { Shield, Server, Users, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex-grow">
      <div className="relative max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">About Safex-7 Pro</h1>
        <p className="text-lg text-foreground/70 leading-relaxed">
          We are a team of cybersecurity researchers and engineers dedicated to building the most advanced, enterprise-grade phishing detection platform available.
        </p>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-20">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="text-foreground/70 leading-relaxed">
            Phishing remains the number one attack vector for both enterprise data breaches and consumer financial loss. Our mission is to democratize access to elite threat intelligence and behavioral analysis tools, ensuring that organizations of all sizes can detect threats before they strike.
          </p>
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-primary font-medium italic">
            &quot;Detect phishing before it detects you.&quot;
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-6 text-center">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <div className="font-bold text-2xl mb-1">15+</div>
            <div className="text-xs text-foreground/60 uppercase">Data Engines</div>
          </div>
          <div className="glass-panel p-6 text-center">
            <Server className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <div className="font-bold text-2xl mb-1">99.9%</div>
            <div className="text-xs text-foreground/60 uppercase">Uptime</div>
          </div>
          <div className="glass-panel p-6 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <div className="font-bold text-2xl mb-1">2M+</div>
            <div className="text-xs text-foreground/60 uppercase">Users Protected</div>
          </div>
          <div className="glass-panel p-6 text-center">
            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <div className="font-bold text-2xl mb-1">Top 10</div>
            <div className="text-xs text-foreground/60 uppercase">Security Tools</div>
          </div>
        </div>
      </div>

      <div className="relative max-w-3xl mx-auto text-center glass-panel p-12">
        <h2 className="text-2xl font-bold mb-4">Enterprise Trust Commitment</h2>
        <p className="text-foreground/70 mb-6">
          We do not store PII or user-submitted URLs beyond the required analysis window. All data transmissions are secured via TLS 1.3, and our infrastructure is SOC 2 compliant.
        </p>
        <button className="bg-white text-black font-bold px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors">
          View Privacy Policy
        </button>
      </div>
    </div>
  );
}
