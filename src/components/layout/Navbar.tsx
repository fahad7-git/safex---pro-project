"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'URL Scanner', path: '/scanner' },
  { name: 'Email Analyzer', path: '/email' },
  { name: 'Threat Intelligence', path: '/intelligence' },
  { name: 'Phishing Education', path: '/education' },
  { name: 'About', path: '/about' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary animate-pulse" />
          <span className="text-xl font-bold tracking-tighter text-foreground">
            Safex-7 <span className="text-primary neon-text-green">Pro</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary",
                  isActive ? "text-primary" : "text-foreground/70"
                )}
              >
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

        </div>

        {/* Mobile Nav Toggle */}
        <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border/50 flex flex-col p-4 shadow-xl"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "py-3 px-4 text-sm font-medium rounded-md mb-1",
                pathname === item.path ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-card hover:text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}

        </motion.div>
      )}
    </nav>
  );
}
