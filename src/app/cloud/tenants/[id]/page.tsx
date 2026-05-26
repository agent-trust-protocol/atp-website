import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building,
  Users,
  Calendar,
  Activity,
  Shield,
  Cloud,
  Hash
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Subnav } from '@/components/ui/subnav';
import { auth } from '@/lib/auth';
import { isFounderSession } from '@/lib/is-founder';
import { getTenantById, getViewerRoleOnTenant } from '@/lib/tenants/db';
import { TenantEditForm } from '@/components/cloud/tenant-edit-form';
import { TenantDeleteButton } from '@/components/cloud/tenant-delete-button';
import { TenantMembersPanel } from '@/components/cloud/tenant-members-panel';
import { TenantInvitationsPanel } from '@/components/cloud/tenant-invitations-panel';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  suspended: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  archived: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

const PLAN_COLOR: Record<string, string> = {
  enterprise: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  premium: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  free: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800'
};

const cloudTabs = [
  { id: 'overview', label: 'Overview', href: '/cloud', icon: <Cloud className="h-4 w-4" /> },
  { id: 'tenants', label: 'Tenants', href: '/cloud/tenants', icon: <Users className="h-4 w-4" /> },
  { id: 'analytics', label: 'Analytics', href: '/cloud/analytics', icon: <Shield className="h-4 w-4" /> },
  { id: 'services', label: 'Services', href: '/cloud/services', icon: <Activity className="h-4 w-4" /> }
];

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const viewer = {
    userId: session?.user?.id ?? null,
    isFounder: isFounderSession(session)
  };

  const tenant = await getTenantById(params.id, viewer);
  if (!tenant) notFound();

  const role = await getViewerRoleOnTenant(tenant.id, viewer);
  const canEdit = role === 'owner' || role === 'admin';

  const breadcrumbs = [
    { label: 'Cloud Dashboard', href: '/cloud' },
    { label: 'Tenants', href: '/cloud/tenants' },
    { label: tenant.name, href: `/cloud/tenants/${tenant.id}` }
  ];

  const createdAt = new Date(tenant.createdAt);
  const updatedAt = new Date(tenant.updatedAt);

  return (
    <div className="min-h-screen bg-background">
      <Subnav tabs={cloudTabs} breadcrumbs={breadcrumbs} variant="both" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/cloud/tenants">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tenants
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building className="h-7 w-7 text-primary" />
                {tenant.name}
              </h1>
              <p className="text-muted-foreground font-mono text-xs mt-1">{tenant.slug}</p>
            </div>
            <Badge variant="outline" className={STATUS_COLOR[tenant.status] ?? STATUS_COLOR.archived}>
              {tenant.status}
            </Badge>
            <Badge variant="outline" className={PLAN_COLOR[tenant.plan.toLowerCase()] ?? PLAN_COLOR.free}>
              {tenant.plan}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
              <CardDescription>
                Your role on this tenant: <strong>{role ?? 'viewer'}</strong>
                {viewer.isFounder && !role && <> (founder view)</>}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <DetailRow icon={<Hash className="h-4 w-4" />} label="Tenant ID" value={<code className="font-mono text-xs">{tenant.id}</code>} />
              <DetailRow icon={<Users className="h-4 w-4" />} label="Slug" value={<code className="font-mono text-xs">{tenant.slug}</code>} />
              <DetailRow icon={<Shield className="h-4 w-4" />} label="Plan" value={tenant.plan} />
              <DetailRow icon={<Activity className="h-4 w-4" />} label="Status" value={tenant.status} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={createdAt.toLocaleString()} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Last updated" value={updatedAt.toLocaleString()} />
            </CardContent>
          </Card>

          <TenantEditForm initialName={tenant.name} canEdit={canEdit} />

          <TenantMembersPanel
            tenantId={tenant.id}
            canManage={role === 'owner' || viewer.isFounder}
            viewerUserId={viewer.userId}
            isOwner={role === 'owner'}
          />

          <TenantInvitationsPanel
            tenantId={tenant.id}
            canManage={role === 'owner' || role === 'admin' || viewer.isFounder}
            origin={origin}
          />

          <TenantDeleteButton
            tenantId={tenant.id}
            tenantName={tenant.name}
            canDelete={role === 'owner' || viewer.isFounder}
          />
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
