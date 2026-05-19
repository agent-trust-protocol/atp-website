// Resolves a configured ATP backend service URL or null. Centralizes the
// pattern that previously did `process.env.X || 'http://localhost:NNNN'`
// inside ~8 client components, which shipped localhost URLs to production
// browsers when the var was unset.
//
// NEXT_PUBLIC_* are read at build time, so referencing them by literal name
// is required — `process.env[name]` would not be inlined by Next.

type PublicVar =
  | 'NEXT_PUBLIC_ATP_IDENTITY_URL'
  | 'NEXT_PUBLIC_ATP_PERMISSION_URL'
  | 'NEXT_PUBLIC_ATP_AUDIT_URL';

const PUBLIC_URLS: Record<PublicVar, string | undefined> = {
  NEXT_PUBLIC_ATP_IDENTITY_URL: process.env.NEXT_PUBLIC_ATP_IDENTITY_URL,
  NEXT_PUBLIC_ATP_PERMISSION_URL: process.env.NEXT_PUBLIC_ATP_PERMISSION_URL,
  NEXT_PUBLIC_ATP_AUDIT_URL: process.env.NEXT_PUBLIC_ATP_AUDIT_URL
};

export function getAtpServiceUrl(name: PublicVar): string | null {
  const value = PUBLIC_URLS[name];
  return value && value.length > 0 ? value.replace(/\/$/, '') : null;
}
