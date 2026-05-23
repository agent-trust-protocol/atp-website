# atp-website

Source code for [agenttrustprotocol.com](https://agenttrustprotocol.com) — the official website and developer portal for Agent Trust Protocol™.

**Private repository — Sovr INC**

---

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

---

## Local Development

```bash
git clone https://github.com/agent-trust-protocol/atp-website.git
cd atp-website
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## Related

- Core protocol SDK: [`agent-trust-protocol/atp-core`](https://github.com/agent-trust-protocol/atp-core)
- Live site: [agenttrustprotocol.com](https://agenttrustprotocol.com)

## Scheduled workflows (cron)

Workflow `schedule` triggers fire when something pings
`/api/workflows/cron` with the `CRON_SECRET` bearer token. Vercel Hobby
caps native crons at once per day, so we run the scheduler in GitHub
Actions instead — `.github/workflows/workflow-cron.yml` ticks every 5
minutes (Actions' minimum) and POSTs to the cron endpoint on whichever
URL is configured.

To enable on a fresh deployment:

1. **Repo → Settings → Secrets and variables → Actions → New repository secret**
   `CRON_SECRET` — the same value set on the Vercel project.
2. **Repo → Settings → Secrets and variables → Actions → Variables → New repository variable**
   `SITE_URL` — e.g. `https://agenttrustprotocol.com`.
3. The job no-ops cleanly until both are set; the **Actions → workflow-cron** tab shows the most recent ticks. Manual dispatch is available from the same tab.
