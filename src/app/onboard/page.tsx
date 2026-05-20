'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Rocket, FolderOpen, LayoutDashboard, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PATHS = [
  {
    href: '/onboard/new',
    icon: Rocket,
    title: 'New ATP Project',
    description: 'Start from scratch with a scaffolded agent. We\'ll walk you through each choice and show you the exact command that runs.',
    cta: 'Get Started',
    color: 'text-green-400',
    bg: 'from-green-500/10 to-emerald-500/10',
    border: 'hover:border-green-500/40'
  },
  {
    href: '/onboard/existing',
    icon: FolderOpen,
    title: 'Connect Existing Project',
    description: 'Add ATP to a project you already have. Pick a security profile and we\'ll generate the right install command.',
    cta: 'Connect',
    color: 'text-blue-400',
    bg: 'from-blue-500/10 to-cyan-500/10',
    border: 'hover:border-blue-500/40'
  },
  {
    href: '/onboard/dashboard-only',
    icon: LayoutDashboard,
    title: 'Explore the Dashboard',
    description: 'Open the local dashboard without a project. Great for evaluating ATP before committing to a setup.',
    cta: 'Open Dashboard',
    color: 'text-purple-400',
    bg: 'from-purple-500/10 to-indigo-500/10',
    border: 'hover:border-purple-500/40'
  }
];

export default function OnboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/brand/atp-favicon-logo-agent-new.png"
              alt="Agent Trust Protocol"
              width={56}
              height={56}
              className="h-14 w-14 object-contain"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Get started with ATP</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Choose your setup path. We'll guide you through the rest — no terminal knowledge required.
          </p>
        </div>

        {/* Path cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PATHS.map(({ href, icon: Icon, title, description, cta, color, bg, border }) => (
            <Card
              key={href}
              className={`glass border-border/60 transition-all duration-200 ${border} group`}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-2`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href={href} className="flex items-center justify-center gap-2">
                    {cta}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CLI escape hatch */}
        <p className="text-center text-sm text-muted-foreground">
          Prefer the terminal?{' '}
          <a
            href="https://github.com/agent-trust-protocol/atp-core"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-4 hover:text-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Read the CLI docs →
          </a>
        </p>
      </div>
    </div>
  );
}
