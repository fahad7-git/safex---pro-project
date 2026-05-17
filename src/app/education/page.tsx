import { BookOpen, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export default function EducationPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex-grow">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4">Phishing Education Hub</h1>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          Learn how to identify social engineering attacks, understand different types of phishing, and protect your personal and corporate assets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {[
          {
            title: "Types of Phishing",
            icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
            items: ["Spear Phishing", "Whaling", "Smishing (SMS)", "Vishing (Voice)"]
          },
          {
            title: "Common Red Flags",
            icon: <HelpCircle className="w-6 h-6 text-destructive" />,
            items: ["Urgent or threatening language", "Generic greetings", "Mismatched URLs", "Unexpected attachments"]
          },
          {
            title: "Prevention Strategies",
            icon: <ShieldCheck className="w-6 h-6 text-primary" />,
            items: ["Enable Multi-Factor Auth (MFA)", "Verify sender addresses", "Use a password manager", "Regular security training"]
          },
          {
            title: "Advanced Topics",
            icon: <BookOpen className="w-6 h-6 text-blue-500" />,
            items: ["Understanding Typosquatting", "How homograph attacks work", "Analyzing email headers", "Bypassing SPF/DKIM"]
          }
        ].map((section, i) => (
          <div key={i} className="glass-panel p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-background rounded-lg border border-border">{section.icon}</div>
              <h2 className="text-xl font-bold">{section.title}</h2>
            </div>
            <ul className="space-y-3">
              {section.items.map((item, j) => (
                <li key={j} className="flex items-center gap-2 text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
