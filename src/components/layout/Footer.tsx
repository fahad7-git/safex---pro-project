import Link from 'next/link';
import { Shield, Globe, Mail, Link as LinkIcon } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tighter text-foreground">
                Safex-7 <span className="text-primary neon-text-green">Pro</span>
              </span>
            </Link>
            <p className="text-foreground/60 text-sm max-w-sm mb-6">
              Enterprise-grade AI-Powered Phishing Detection & URL Intelligence Platform. 
              Detect threats before they detect you with our multi-layer verification engine.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-foreground/60 hover:text-primary transition-colors"><Globe className="h-5 w-5" /></a>
              <a href="#" className="text-foreground/60 hover:text-primary transition-colors"><Mail className="h-5 w-5" /></a>
              <a href="#" className="text-foreground/60 hover:text-primary transition-colors"><LinkIcon className="h-5 w-5" /></a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Features</h3>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><Link href="/scanner" className="hover:text-primary transition-colors">URL Scanner</Link></li>
              <li><Link href="/email" className="hover:text-primary transition-colors">Email Analyzer</Link></li>
              <li><Link href="/intelligence" className="hover:text-primary transition-colors">Threat Intelligence</Link></li>
              <li><Link href="/api-docs" className="hover:text-primary transition-colors">API Integration</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-foreground/60">
              <li><Link href="/education" className="hover:text-primary transition-colors">Phishing Education</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>

              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/30 text-center text-sm text-foreground/50 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; {new Date().getFullYear()} Safex-7 Pro. All rights reserved.</p>
          <p className="mt-2 md:mt-0 text-xs">
            Disclaimer: No scanner guarantees 100% accuracy. Always use multiple security checks for high-risk decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
