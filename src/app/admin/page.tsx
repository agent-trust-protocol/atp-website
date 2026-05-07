'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface PageLink {
  name: string;
  path: string;
  description?: string;
}

interface PageCategory {
  title: string;
  icon: string;
  color: string;
  pages: PageLink[];
}

const categories: PageCategory[] = [
  {
    title: 'Public & Marketing',
    icon: '🌍',
    color: 'bg-blue-50 border-blue-200',
    pages: [
      { name: 'Home', path: '/', description: 'Landing page' },
      { name: 'Pricing', path: '/pricing', description: 'Pricing plans' },
      { name: 'Contact', path: '/contact', description: 'Contact form' },
      { name: 'Privacy Policy', path: '/privacy', description: 'Privacy policy' },
      { name: 'Terms of Service', path: '/terms', description: 'Terms & conditions' },
    ],
  },
  {
    title: 'Documentation & Developers',
    icon: '📚',
    color: 'bg-purple-50 border-purple-200',
    pages: [
      { name: 'Docs', path: '/docs', description: 'Documentation home' },
      { name: 'Developers', path: '/developers', description: 'Developer portal' },
      { name: 'API Reference', path: '/api-reference', description: 'API docs' },
      { name: 'Examples', path: '/examples', description: 'Code examples' },
      { name: 'Playground', path: '/playground', description: 'Interactive playground' },
    ],
  },
  {
    title: 'Cloud Platform',
    icon: '☁️',
    color: 'bg-cyan-50 border-cyan-200',
    pages: [
      { name: 'Cloud Home', path: '/cloud', description: 'Cloud platform' },
      { name: 'Monitoring', path: '/monitoring', description: 'Monitoring dashboard' },
      { name: 'Integrations', path: '/integrations', description: 'Third-party integrations' },
      { name: 'Policy Editor', path: '/policy-editor', description: 'Policy creation tool' },
      { name: 'Policy Testing', path: '/policy-testing', description: 'Test policies' },
    ],
  },
  {
    title: 'Legal & Policies',
    icon: '⚖️',
    color: 'bg-gray-50 border-gray-200',
    pages: [
      { name: 'Policies', path: '/policies', description: 'Policy library' },
      { name: 'Sales Guide', path: '/sales-guide', description: 'Sales information' },
    ],
  },
  {
    title: 'Authentication',
    icon: '🔐',
    color: 'bg-green-50 border-green-200',
    pages: [
      { name: 'Login (Magic Link)', path: '/login', description: 'User login' },
      { name: 'Sign Up', path: '/signup', description: 'User registration' },
      { name: 'Verify Email', path: '/verify-email', description: 'Email verification' },
      { name: 'Reset Password', path: '/reset-password', description: 'Password reset' },
      { name: 'Request Access', path: '/request-access', description: 'Access request form' },
    ],
  },
  {
    title: 'Dashboard & Portal',
    icon: '📊',
    color: 'bg-orange-50 border-orange-200',
    pages: [
      { name: 'Dashboard', path: '/dashboard', description: 'User dashboard' },
      { name: 'Enterprise Portal', path: '/portal', description: 'Enterprise portal' },
    ],
  },
  {
    title: 'Onboarding & Demo',
    icon: '🚀',
    color: 'bg-pink-50 border-pink-200',
    pages: [
      { name: 'Onboarding', path: '/onboard', description: 'Onboarding wizard' },
      { name: 'Demos', path: '/demos', description: 'Demo scenarios' },
    ],
  },
  {
    title: 'Maintenance',
    icon: '🔧',
    color: 'bg-red-50 border-red-200',
    pages: [
      { name: 'Maintenance', path: '/maintenance', description: 'Maintenance page' },
    ],
  },
];

export default function AdminHubPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Founder Testing Hub</h1>
        <p className="text-gray-600">
          Quick access to all {categories.reduce((sum, cat) => sum + cat.pages.length, 0)} site pages for testing
        </p>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => (
          <div key={category.title} className={`border rounded-lg p-6 ${category.color}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{category.icon}</span>
              <h2 className="text-xl font-semibold text-gray-900">{category.title}</h2>
              <span className="ml-auto text-sm text-gray-500">
                {category.pages.length} pages
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {category.pages.map((page) => (
                <Link
                  key={page.path}
                  href={page.path}
                  className="group p-3 rounded border border-current border-opacity-20 hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 group-hover:text-blue-600 truncate">
                        {page.name}
                      </div>
                      {page.description && (
                        <div className="text-sm text-gray-600 truncate">{page.description}</div>
                      )}
                      <div className="text-xs text-gray-500 font-mono mt-1">{page.path}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Test Information</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>✓ All pages are accessible via the links above</li>
          <li>✓ Click any page link to test its functionality</li>
          <li>✓ Use the Sign Out button in the yellow bar to return to login</li>
          <li>✓ Foundation account email: <code className="bg-white px-2 py-1 rounded">llewis@sovrlabs.com</code></li>
        </ul>
      </div>
    </div>
  );
}
