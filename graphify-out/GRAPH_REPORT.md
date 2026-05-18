# Graph Report - atp-website  (2026-05-18)

## Corpus Check
- 229 files · ~431,046 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1667 nodes · 3326 edges · 117 communities (101 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `014f457c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 102|Community 102]]

## God Nodes (most connected - your core abstractions)
1. `Card` - 74 edges
2. `CardContent` - 73 edges
3. `Button` - 73 edges
4. `CardHeader` - 72 edges
5. `CardTitle` - 72 edges
6. `CardDescription` - 68 edges
7. `Badge()` - 59 edges
8. `cn()` - 44 edges
9. `checkApiAuth()` - 31 edges
10. `NodeRegistry` - 29 edges

## Surprising Connections (you probably didn't know these)
- `cn()` --calls--> `clsx`  [INFERRED]
  src/lib/utils.ts → package.json
- `GET()` --calls--> `checkApiAuth()`  [INFERRED]
  src/app/api/sdk/health/route.ts → src/lib/api-auth.ts
- `GET()` --calls--> `createDemoResponse()`  [INFERRED]
  src/app/api/sdk/health/route.ts → src/lib/api-auth.ts
- `DropdownMenuShortcut()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/dropdown-menu.tsx → src/lib/utils.ts
- `GET()` --calls--> `getPool()`  [EXTRACTED]
  src/app/api/auth/verify-email/route.ts → src/lib/db.ts

## Communities (117 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (45): dependencies, axios, bcryptjs, better-auth, class-variance-authority, clsx, did-jwt, ioredis (+37 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (24): GatedAPIReference(), GatedAPIReferenceProps, metadata, CodePlaygroundProps, MetricData, PerformanceMetricsPreview(), SystemStatus, QuantumSafeSignatureDemoGated() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (22): CONTROL_DETAILS, Environment, ENVIRONMENTS, PackageJsonModuleHint, PROFILES, ProfileSummary, RUNTIMES, RuntimeTarget (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (21): CodePlayground(), DashboardStats(), Policy, PolicyTestingFramework(), PolicyTestingFrameworkProps, TestResult, TestScenario, CloudAccessGateProps (+13 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (15): generateDemoData(), SimpleDemoDashboard(), PolicyManagement(), VisualPolicyEditor(), WorkflowDashboard(), WorkflowDesigner(), WorkflowExecutionHistory(), WorkflowNodesCatalog() (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (25): AdvancedMetrics(), MetricTrend, Props, RealTimeData, SystemMetrics, StatCardProps, RealTimeData, SecurityAlert (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (13): DemoDashboard(), generateDemoData(), ExecutionSummary, WorkflowSummary, RequireAuthProps, DashboardStats, metadata, integrations (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (33): analyzeRequestPattern(), analyzeSessionRisk(), analyzeToolAccessPattern(), ATPVisualPolicy, calculateAdvancedTrustScore(), calculateBehavioralRiskScore(), calculateContextualRisk(), calculateCredentialTrustScore() (+25 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (3): BaseQuantumSafeMCPServer, ImprovedQuantumSafeMCPServer, server

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (19): Agent, DEMO_AGENTS, sha256(), sha512(), SignatureResult, toHex(), SignatureResult, Agent (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (7): ATPDemo, EXAMPLES, executeCode(), generateDID(), generateKeyPair(), generateSignature(), LogEntry

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (11): createConfigurationError(), createDatabaseError(), createExecutionError(), createNetworkError(), createValidationError(), ErrorCategory, ErrorHandlerConfig, ErrorSeverity (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (20): buildCommand(), ExistingProjectPage(), SECURITY_PROFILES, SecurityProfile, STEPS, buildCommand(), Language, NewProjectPage() (+12 more)

### Community 13 - "Community 13"
Cohesion: 0.08
Nodes (3): ConfigManager, WorkflowConfig, workflowConfigSchema

### Community 14 - "Community 14"
Cohesion: 0.07
Nodes (27): 1. Generate `BETTER_AUTH_SECRET`, 2. Set up PostgreSQL database, 3. Set up email, 4. Set required auth URLs, 5. (Optional) Connect ATP backend services, "BETTER_AUTH_SECRET is required", Build fails: "Cannot find module 'package-x'", Build Settings (+19 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (21): GET(), mockActiveExecutions, GET(), POST(), AVAILABLE_PERMISSIONS, CreateKeyRequest, DEFAULT_RATE_LIMITS, DELETE() (+13 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (19): AuditEvent, MonitoringMetrics, NODE_TYPES, PolicyNode, PolicyRule, VisualPolicyEditorDemo(), WorkflowExecution, nodeIcons (+11 more)

### Community 17 - "Community 17"
Cohesion: 0.09
Nodes (8): AuthEvent, CloudWatchLogsProvider, ElasticsearchProvider, FileStorageProvider, LogQueryFilters, logStorage, LogStorageManager, LogStorageProvider

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (13): ActionNodeData, BaseNodeData, ConditionNodeData, nodeTypes, TransformNodeData, TriggerNodeData, initialEdges, initialNodes (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (25): actionCategory, actionNodes, allNodes, categories, definition, executor, fallbackExecutor, invalidConfig (+17 more)

### Community 20 - "Community 20"
Cohesion: 0.14
Nodes (25): analyzePolicy(), ATPVisualPolicy, calculatePolicySecurityScore(), calculateSecurityScoreSecure(), detectCircularDependencies(), findAllPathsToNode(), PolicyAnalysisResult, PolicyNode (+17 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (8): MonitoringDashboard(), useCachedFetch(), usePerformance(), batchFetch(), cachedFetch(), ClientCache, PerformanceMonitor, RequestCache

### Community 22 - "Community 22"
Cohesion: 0.12
Nodes (19): ExecutionHistoryItem, NodeTemplate, nodeTemplates, WorkflowVariable, AccordionContent, AccordionItem, AccordionTrigger, DialogFooter() (+11 more)

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (22): useActiveExecutions(), useExecutionHistory(), useWorkflow(), useWorkflows(), useWorkflowStatistics(), useWorkflowStore, WorkflowStoreState, ExecutionResult (+14 more)

### Community 24 - "Community 24"
Cohesion: 0.08
Nodes (23): auditLogs, NewNodeStat, NewPolicyWorkflow, NewTrustWorkflow, NewWorkflowStat, nodeExecutions, nodeExecutionsRelations, nodeStats (+15 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (22): createPolicyExecutor, deployPolicyExecutor, policyChangeExecutor, policyCompliantConditionExecutor, policyNodeDefinitions, policyValidConditionExecutor, policyViolationExecutor, updatePolicyExecutor (+14 more)

### Community 26 - "Community 26"
Cohesion: 0.13
Nodes (9): CloudAccessRequest, calculateLeadScore(), EnterpriseContactForm, GET(), getLeadPriority(), POST(), EmailOptions, EmailService (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.12
Nodes (19): complianceStatusConditionExecutor, generateReportExecutor, metricThresholdExecutor, monitoringNodeDefinitions, performanceMetricsConditionExecutor, securityAlertExecutor, sendAlertExecutor, adjustTrustExecutor (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.12
Nodes (6): { GET, POST }, auth, authClient, getSafeReturnTo(), signInWithMagicLink(), metadata

### Community 31 - "Community 31"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (14): AuthResult, AuthEventSeverity, AuthEventType, logApiAuthFailure(), logApiAuthSuccess(), logLoginFailure(), logLoginSuccess(), logRateLimitExceeded() (+6 more)

### Community 36 - "Community 36"
Cohesion: 0.14
Nodes (13): fontStyles, metadata, viewport, initialState, Theme, ThemeProvider(), ThemeProviderContext, ThemeProviderProps (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (18): ensureDatabaseInitialized(), getWorkflowRepositoryInstance(), AuditLog, NewAuditLog, NewNodeExecution, NewWorkflow, NewWorkflowExecution, NewWorkflowTrigger (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.19
Nodes (13): AnimatedCounter(), AnimatedCounterProps, StatCard(), EnhancedDashboard(), metadata, cn(), IconProps, PolicyFlowIcon() (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.23
Nodes (9): isValidAdminToken(), POST(), POST(), execute(), getPool(), initializeAppTables(), query(), queryOne() (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.14
Nodes (7): COMMON_BLOCKED_COUNTRIES, GDPR_COUNTRIES, geoBlocking, GeoBlockingConfig, GeoBlockingService, GeoLocation, HIGH_RISK_COUNTRIES

### Community 42 - "Community 42"
Cohesion: 0.15
Nodes (5): DatabaseConfig, DatabaseConnection, db, getDb(), healthCheck()

### Community 43 - "Community 43"
Cohesion: 0.12
Nodes (16): activeExecutions, activeExecutionsAfter, context, cyclicWorkflow, errorNodeDefinition, errorNodeExecutor, errorWorkflow, events (+8 more)

### Community 44 - "Community 44"
Cohesion: 0.16
Nodes (10): port, server, dbConnection, ATPAgent, ATPPolicy, ATPTrustMetrics, EventHandler, WorkflowEvent (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.17
Nodes (11): QuantumSafeSignatureDemoLite(), TrustLevelManagementDemo(), AnimatedIcon(), AnimatedIconProps, FloatingIcon(), FloatingIconProps, IconWithBadge(), IconWithBadgeProps (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.13
Nodes (12): activeExecutions, categories, createWorkflowSchema, executeWorkflowSchema, execution, importedIds, nodeRegistry, nodes (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.14
Nodes (13): duplicateId, edge, executionId, executionResult, exported, importedId, node, originalId (+5 more)

### Community 48 - "Community 48"
Cohesion: 0.15
Nodes (12): aliases, components, utils, rsc, $schema, style, tailwind, baseColor (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (13): devDependencies, autoprefixer, better-sqlite3, eslint, eslint-config-next, @playwright/test, postcss, tailwindcss (+5 more)

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (6): applyRateLimit(), createRateLimitResponse(), generateRateLimitKey(), RateLimitConfigs, RateLimitEntry, RateLimitStore

### Community 52 - "Community 52"
Cohesion: 0.19
Nodes (11): useTheme(), DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut() (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (11): 🛡️ Agent Trust Protocol™ - Demo Deployment Guide, 🛡️ Agent Trust Protocol™ Demo Environment, Demo Effectiveness KPIs, Demo Support, ✅ Demo Validation Results, 🎉 Deployment Validation, Escalation Path, Executive Summary (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.17
Nodes (8): APIKey, HistoryPoint, SDKHealthStatus, SDKMetrics, SDKMetricsResponse, TimeRange, UseSDKMetricsOptions, UseSDKMetricsReturn

### Community 55 - "Community 55"
Cohesion: 0.24
Nodes (4): args, DemoServer, __dirname, __filename

### Community 56 - "Community 56"
Cohesion: 0.18
Nodes (11): scripts, build, dev, dev:turbo, format:check, lint, lint:fix, start (+3 more)

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (10): generateDemoMetrics(), generateHistoryData(), GET(), getHistoryPointCount(), getIntervalMs(), getSDKMetricsForUser(), hashCode(), POST() (+2 more)

### Community 58 - "Community 58"
Cohesion: 0.18
Nodes (7): ClawStatePolicy, DEFAULT_POLICY, SessionState, STATE_COLORS, STATE_ORDER, StatePermissions, LiveAgentDashboard()

### Community 59 - "Community 59"
Cohesion: 0.18
Nodes (6): generateMockSignature(), getTrustLevelColor(), getTrustScore(), Checkbox, CheckboxProps, TooltipContent

### Community 60 - "Community 60"
Cohesion: 0.20
Nodes (9): author, email, name, url, description, engines, node, name (+1 more)

### Community 61 - "Community 61"
Cohesion: 0.31
Nodes (8): createHybridSignature(), generateHybridKeyPair(), simulateDilithiumKeyPair(), simulateDilithiumSign(), simulateDilithiumVerify(), simulateResolvePublicKeysFromDID(), verifyHybridSignature(), verifySignatureWithDID()

### Community 64 - "Community 64"
Cohesion: 0.22
Nodes (9): code:bash (# Find process using port), code:bash (# Make scripts executable), code:bash (# Verify Node.js installation), code:bash (# Check system resources), code:bash (# Quick restart), code:bash (# Test connectivity), Common Issues, Emergency Procedures (+1 more)

### Community 65 - "Community 65"
Cohesion: 0.28
Nodes (6): checkEndpoint(), checkServiceHealth(), GET(), mockActiveExecutions, mockWorkflows, SDKHealthStatus

### Community 67 - "Community 67"
Cohesion: 0.25
Nodes (7): atp-website, code:bash (git clone https://github.com/agent-trust-protocol/atp-websit), code:bash (npm run dev       # Start dev server), Local Development, Related, Scripts, Stack

### Community 68 - "Community 68"
Cohesion: 0.29
Nodes (7): code:bash (# Start demo on standard port), code:bash (# Start demo with full logging), code:bash (# Start demo for security demonstration), 🏢 Enterprise Deployment Scenarios, Scenario 1: Executive Boardroom Demo, Scenario 2: Technical Architecture Review, Scenario 3: Security & Compliance Focus

### Community 69 - "Community 69"
Cohesion: 0.29
Nodes (7): AWS Deployment, Azure Deployment, Cloud Deployment, code:bash (# EC2 Instance), code:bash (# App Service), code:bash (# Cloud Run), Google Cloud Platform

### Community 70 - "Community 70"
Cohesion: 0.29
Nodes (7): code:bash (cd demo), code:bash (cd demo), code:bash (cd demo), Option 1: Local Development (Recommended for Testing), Option 2: Custom Port, Option 3: Automated Launcher, 🚀 Quick Deployment Options

### Community 71 - "Community 71"
Cohesion: 0.29
Nodes (7): Cloud Deployment, code:bash (# Start demo server), code:bash (# Build demo container), Deployment Options, Docker Deployment, Enterprise Hosting, Local Development

### Community 72 - "Community 72"
Cohesion: 0.29
Nodes (7): 🔌 API Integration, Demo Features, 🏢 Enterprise Features, ⚡ Performance Benchmarks, 🔐 Quantum-Safe Signatures, 📊 Real-time Monitoring, 🛡️ Trust Level System

### Community 73 - "Community 73"
Cohesion: 0.33
Nodes (5): btn, navigateNewWizardToReview(), nextBtn, spinner, waitForPreflight()

### Community 74 - "Community 74"
Cohesion: 0.33
Nodes (6): code:bash (# Internal server deployment), code:bash (# Build and run container), Corporate Network, Docker Deployment, On-Premises Deployment, 🌐 Production Deployment Options

### Community 75 - "Community 75"
Cohesion: 0.33
Nodes (6): code:bash (# Demo server configuration), code:bash (# For high-traffic demonstrations), 🔧 Configuration Options, Custom Branding, Environment Variables, Performance Tuning

### Community 76 - "Community 76"
Cohesion: 0.33
Nodes (6): Access Control, code:bash (# Run as non-root user), code:bash (# With reverse proxy (nginx)), Production Security, 🛡️ Security Considerations, SSL/TLS Configuration

### Community 77 - "Community 77"
Cohesion: 0.33
Nodes (6): code:bash (cd demo), code:bash (node server.js --port 3010), Demo Server Features, Prerequisites, Quick Start, Running the Demo

### Community 78 - "Community 78"
Cohesion: 0.33
Nodes (6): code:bash (# Use different port), code:bash (# Make server executable), code:bash (# Ensure Node.js is installed), Common Issues, Performance Optimization, Troubleshooting

### Community 79 - "Community 79"
Cohesion: 0.67
Nodes (5): checkNodeVersion(), checkNpm(), checkPort(), execAsync, GET()

### Community 80 - "Community 80"
Cohesion: 0.40
Nodes (4): GET(), handleWorkflowRequest(), mockActiveExecutions, mockWorkflows

### Community 81 - "Community 81"
Cohesion: 0.33
Nodes (4): colorMap, labelColorMap, metadata, sections

### Community 82 - "Community 82"
Cohesion: 0.47
Nodes (5): config, isMaintenanceModeEnabled(), isPublicRoute(), middleware(), publicRoutes

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (4): buildCommand, framework, installCommand, regions

### Community 84 - "Community 84"
Cohesion: 0.60
Nodes (4): CloudAccessGate(), checkSubscriptionTier(), CloudLayout(), verifyToken()

### Community 86 - "Community 86"
Cohesion: 0.40
Nodes (5): code:bash (# Automated health checks), Demo Analytics, Health Monitoring, 📊 Monitoring & Analytics, Performance Monitoring

### Community 87 - "Community 87"
Cohesion: 0.40
Nodes (5): Demo Scenarios, Scenario 1: Executive Overview (5 minutes), Scenario 2: Technical Deep Dive (15 minutes), Scenario 3: Security Focus (10 minutes), Scenario 4: Developer Experience (12 minutes)

### Community 88 - "Community 88"
Cohesion: 0.40
Nodes (3): GET(), GitHubStats, NPMStats

### Community 89 - "Community 89"
Cohesion: 0.50
Nodes (4): 🎯 Demo Best Practices, During Demonstration, Post-Demo Follow-up, Pre-Demo Checklist

### Community 90 - "Community 90"
Cohesion: 0.50
Nodes (4): Additional Features, Branding, Customization, Demo Data

### Community 91 - "Community 91"
Cohesion: 0.50
Nodes (3): 🛡️ Agent Trust Protocol™ Demo Environment, 🛡️ Agent Trust Protocol™ - Interactive Demo Environment, Overview

### Community 92 - "Community 92"
Cohesion: 0.50
Nodes (4): Demo Best Practices, Follow-up Actions, Preparation, Presentation Tips

### Community 93 - "Community 93"
Cohesion: 0.50
Nodes (4): Demo Support, Feedback, Sales Support, Support and Feedback

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (4): Backend Components, Frontend Components, Security Features, Technical Architecture

### Community 95 - "Community 95"
Cohesion: 0.67
Nodes (3): CryptoUtils, GET(), POST()

## Knowledge Gaps
- **583 isolated node(s):** `framework`, `buildCommand`, `installCommand`, `regions`, `nextConfig` (+578 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 38` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 9`, `Community 45`, `Community 16`, `Community 18`, `Community 52`, `Community 22`, `Community 59`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 0` to `Community 60`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `clsx` connect `Community 0` to `Community 38`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **What connects `framework`, `buildCommand`, `installCommand` to the rest of the system?**
  _583 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10909090909090909 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06236786469344609 - nodes in this community are weakly interconnected._