import Link from 'next/link';

const sections = [
  {
    title: 'Public / Marketing',
    color: 'blue',
    pages: [
      { label: 'Home', href: '/' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
      { label: 'Enterprise', href: '/enterprise' },
      { label: 'Demos', href: '/demos' },
      { label: 'Examples', href: '/examples' },
      { label: 'Sales Guide', href: '/sales-guide' },
      { label: 'Maintenance', href: '/maintenance' }
    ]
  },
  {
    title: 'Docs & Developer',
    color: 'purple',
    pages: [
      { label: 'Documentation', href: '/docs' },
      { label: 'API Reference', href: '/api-reference' },
      { label: 'Developers', href: '/developers' },
      { label: 'Playground', href: '/playground' },
      { label: 'Examples', href: '/examples' },
      { label: 'LangChain Integration', href: '/integrations/langchain' },
      { label: 'MCP Integration', href: '/integrations/mcp' },
      { label: 'OpenClaw Integration', href: '/integrations/openclaw' }
    ]
  },
  {
    title: 'Cloud',
    color: 'cyan',
    pages: [
      { label: 'Cloud Overview', href: '/cloud' },
      { label: 'Analytics', href: '/cloud/analytics' },
      { label: 'Services', href: '/cloud/services' },
      { label: 'Tenants', href: '/cloud/tenants' },
      { label: 'Monitoring', href: '/monitoring' }
    ]
  },
  {
    title: 'Policies / Legal',
    color: 'gray',
    pages: [
      { label: 'Policies', href: '/policies' },
      { label: 'Policy Editor', href: '/policy-editor' },
      { label: 'Policy Testing', href: '/policy-testing' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' }
    ]
  },
  {
    title: 'Auth',
    color: 'orange',
    pages: [
      { label: 'Login', href: '/login' },
      { label: 'Sign Up', href: '/signup' },
      { label: 'Reset Password', href: '/reset-password' },
      { label: 'Verify Email', href: '/verify-email' },
      { label: 'Request Access', href: '/request-access' }
    ]
  },
  {
    title: 'Dashboard',
    color: 'green',
    pages: [
      { label: 'Dashboard Home', href: '/dashboard' },
      { label: 'Agents', href: '/dashboard/agents' },
      { label: 'New Agent', href: '/dashboard/agents/new' },
      { label: 'Workflows', href: '/dashboard/workflows' },
      { label: 'Workflow Designer', href: '/dashboard/workflows/designer' },
      { label: 'Executions', href: '/dashboard/workflows/executions' },
      { label: 'Workflow Health', href: '/dashboard/workflows/health' },
      { label: 'Nodes', href: '/dashboard/workflows/nodes' }
    ]
  },
  {
    title: 'Onboarding',
    color: 'pink',
    pages: [
      { label: 'Onboarding Home', href: '/onboard' },
      { label: 'New Account', href: '/onboard/new' },
      { label: 'Existing Account', href: '/onboard/existing' },
      { label: 'Agent Setup', href: '/onboard/agent' },
      { label: 'Dashboard Only', href: '/onboard/dashboard-only' }
    ]
  },
  {
    title: 'Portal',
    color: 'yellow',
    pages: [
      { label: 'Developer Portal', href: '/portal' }
    ]
  }
];

const colorMap: Record<string, string> = {
  blue:   'border-blue-500/30 bg-blue-500/5',
  purple: 'border-purple-500/30 bg-purple-500/5',
  cyan:   'border-cyan-500/30 bg-cyan-500/5',
  gray:   'border-gray-500/30 bg-gray-500/5',
  orange: 'border-orange-500/30 bg-orange-500/5',
  green:  'border-green-500/30 bg-green-500/5',
  pink:   'border-pink-500/30 bg-pink-500/5',
  yellow: 'border-yellow-500/30 bg-yellow-500/5'
};

const labelColorMap: Record<string, string> = {
  blue:   'text-blue-400',
  purple: 'text-purple-400',
  cyan:   'text-cyan-400',
  gray:   'text-gray-400',
  orange: 'text-orange-400',
  green:  'text-green-400',
  pink:   'text-pink-400',
  yellow: 'text-yellow-400'
};

export const metadata = { title: 'Founder Testing Hub — ATP' };

export default function AdminPage() {
  const totalPages = sections.reduce((acc, s) => acc + s.pages.length, 0);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Founder Testing Hub</h1>
          <p className="text-gray-500">
            All {totalPages} pages across {sections.length} sections. Click any link to test it.
          </p>
        </div>

        {/* Grid of sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <div
              key={section.title}
              className={`rounded-xl border p-5 ${colorMap[section.color]}`}
            >
              <h2 className={`font-semibold text-sm uppercase tracking-wider mb-4 ${labelColorMap[section.color]}`}>
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.pages.map((page) => (
                  <li key={page.href}>
                    <Link
                      href={page.href}
                      className="flex items-center justify-between group text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      <span>{page.label}</span>
                      <span className="text-gray-700 group-hover:text-gray-400 font-mono text-xs">
                        {page.href}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mt-10 pt-8 border-t border-gray-800">
          <h2 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/portal"
              className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Open Portal
            </Link>
            <Link
              href="/dashboard"
              className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Open Dashboard
            </Link>
            <Link
              href="/api/health"
              target="_blank"
              className="bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Health Check
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
