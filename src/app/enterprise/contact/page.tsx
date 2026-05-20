import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  CheckCircle,
  ArrowLeft,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { EnterpriseContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Enterprise Contact — Agent Trust Protocol™',
  description: 'Get in touch with our enterprise sales team for quantum-safe AI security solutions.'
};

export default function EnterpriseContactPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-atp-midnight via-atp-navy to-slate-900" />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link href="/enterprise" className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm">Back to Enterprise</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="mb-8">
                <h1 className="font-display text-4xl sm:text-5xl font-extralight mb-4 animate-fade-in-up">
                  <span className="atp-gradient-text">Let's Talk Enterprise</span>
                </h1>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  Schedule a personalized demo and discover how ATP Enterprise can secure your AI agent infrastructure.
                </p>
              </div>

              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Request Enterprise Demo
                  </CardTitle>
                  <CardDescription>
                    Our enterprise specialists will contact you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnterpriseContactForm />
                </CardContent>
              </Card>
            </div>

            {/* Contact Information & Benefits */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                  <CardDescription>
                    Multiple ways to connect with our enterprise team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Mail size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-foreground/70">llewis@agenttrustprotocol.com</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <Phone size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Phone</div>
                      <div className="text-sm text-foreground/70">+1 (555) ATP-SAFE</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Globe size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="font-medium">Business Hours</div>
                      <div className="text-sm text-foreground/70">Mon-Fri 9AM-6PM EST</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* What to Expect */}
              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>What to Expect</CardTitle>
                  <CardDescription>
                    Your path to quantum-safe AI security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold text-blue-500">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Initial Consultation</h4>
                      <p className="text-sm text-foreground/70">
                        15-minute call to understand your security requirements and use cases
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold text-green-500">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Personalized Demo</h4>
                      <p className="text-sm text-foreground/70">
                        45-minute technical demonstration tailored to your specific industry and needs
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-sm font-semibold text-purple-500">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Proof of Concept</h4>
                      <p className="text-sm text-foreground/70">
                        30-day enterprise trial with dedicated support and custom configuration
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enterprise Benefits */}
              <Card className="glass border border-border/50 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle>Enterprise Benefits</CardTitle>
                  <CardDescription>
                    Why leading organizations choose ATP
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">Quantum-safe security future-proofing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">SOC 2 Type II compliance certification</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">24/7 enterprise support with 99.9% SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">Custom integrations and professional services</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">High availability multi-region deployment</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
