// The only source of facts for the "Ask my agent" assistant.
// Keep it in step with index.html: if the site changes, change this file in the same commit.

export const PROFILE = `# Ankit Parekh: profile

## Headline
Frontend Architect | Principal Forward Deployed Engineer | Enterprise AI Architect.
Based in Mumbai, India. Building enterprise frontends since 2012 and production AI systems more recently.

## Positioning (in his own words, from his site)
- He understands the problem first, then ships the software end to end.
- He builds software people can rely on, and uses AI only where it earns its place.
- He gets AI from a working demo into a business that has to live with it.
- He architects enterprise frontend and AI solutions, working directly with customers from pain-point discovery through implementation, demonstrations, feedback and production support.

## Experience (newest first)

### Principal Forward-Deployed Engineer, Frontend Architect | Enterprise AI Architect. Bluemeteor (formerly Codifyd)
Listed on his site as Sep 2022 to Oct 2026. Remote, US-based company. Enterprise product-content platform (PIM/PXM/DAM), about 10M platform SKUs.
Evidence label for everything in this role: employer work (private; he can walk through it on a call).
- He runs a seven-person team and personally owns the architecture, integrations and production accountability across three products, reporting weekly to a finance-led board.
- He builds with AI coding agents under a three-gate review and evaluation process. A small team ships integrations with Stripe, Firebase and twelve LLM providers. He carries the pager when it breaks.
- AI multi-agent assistant: an in-app agent that plans first and asks before it acts. He led it end to end, from the Angular client to the NestJS service. It answers with citations and runs multi-step workflows only after the user approves. Plan-first design: a deterministic action catalog, separate read and write risk classes, re-planning on failure, an audit ledger per run, and hybrid retrieval. Built evaluation harnesses and release gates for controlled production deployment. Live with 11 customer organizations.
- AI-assisted supplier product mapping and missing-SKU-attribute suggestions, aligned with distributor-defined validation rules. He personally designed and implemented them, demonstrated them to customers, gathered feedback and troubleshot customer-specific issues.
- Worked directly with enterprise customers to discover onboarding bottlenecks, demonstrate the AI workflows, gather feedback and deliver improvements.
- Owned AG Grid Enterprise data screens and multi-environment CDN release pipelines.
- Removed a multi-minute UI freeze by reducing about 551 lookup operations to 40 for visible rows (92.7% fewer lookup operations).
- Stack signals: multi-provider LLM routing, eval-gated releases, Angular, NestJS.

### Senior Frontend Architect. Forto GmbH, Berlin, Germany (Sep 2021 to Sep 2022)
Digital freight forwarding. Relocated to Berlin on a permanent contract and held an EU Blue Card (former holder).
Evidence label: employer work (private; ask for a walkthrough).
- Led frontend architecture for a production Next.js application, working across React, TypeScript and API integration.
- Drove TypeScript adoption across the codebase, introducing strict types and shared interfaces at component and API boundaries. With most of the codebase typed, developer experience and AI coding-agent output improved by an estimated 50%+ (his estimate, not a measured benchmark).
- Worked with client stakeholders to translate product requirements into application flows, then delivered user-facing features from requirements through release.
- Simplified component and interaction patterns while shipping features, so the shared frontend was easier for the team to keep building on.

### Team Lead. Codifyd (2018 to 2021)
Product information management. Led 5 developers and owned frontend architecture across the retailer PIM, the supplier portal and BridgeWeb.
Evidence label: employer work (private; ask for a walkthrough).
- Defined module boundaries for large, multi-module Angular apps.
- Owned technical direction: stack fit, integration contracts and delivery trade-offs.
- Drove reusable UI patterns and consistency across three products.
- Ran release coordination with DevOps and platform teams on CI/CD and build tooling.

### Senior Frontend Engineer. Verdantis (2012 to 2016)
Built data-dense enterprise forms, tables and workflows with strict validation and state handling.
Evidence label: employer work (private; ask for a walkthrough).
- Engineered the platform infrastructure behind an NX monorepo serving 5 brands across 12 locales: multi-locale/brand API configuration, CSRF protection, a GraphQL proxy keeping service credentials server-side, and React Query SSR with HydrationBoundary. Shared foundations consumed by every delivery pod.
- Re-engineered the local-development and release layer so the shared core repository and the per-partner repositories run from a single folder structure under Vite, then rebuilt the CI/CD pipeline to drive both from one place. Deploying a partner repo now triggers the core pipeline automatically, removing manual release sequencing.
- Designed a bidirectional middleware between the React interaction layer and the Three.js engine: a property change in React (object height, for instance) invokes the 3D engine to update the 3D/2D canvas in real time, and engine-side changes propagate back to the UI.

## Open-source projects (evidence label: public repo, plus live demo where a demo link is given)
- ngx-copilot-platform: Angular copilot SDK with a Next.js RAG backend on Supabase pgvector, plus streaming chat and enterprise demos. Repo https://github.com/AnkitParekh007/ngx-copilot-platform. Live demo https://ankitparekh007.github.io/ngx-copilot-platform/
- org-ai-force: Angular 21 AI agent workspace with a NestJS orchestrator, RAG, MCP tools, SSE streaming, Playwright workers and an admin console. An enterprise agent workspace exploring how Angular, policy-governed tools and operator visibility fit into one AI platform. Repo https://github.com/AnkitParekh007/org-ai-force
- ReboundOps: privacy-first, local-first job-search workspace that keeps applicant data local and produces application drafts from facts the user has verified. Local developer preview, not a hosted SaaS. Repo https://github.com/AnkitParekh007/rebound-ops. Site https://rebound-ops.org/
- Job Search Assistant: macOS workspace for AI-assisted job discovery, ranking, application preparation, approvals and pipeline tracking in one UI. Apple Silicon source build, no verified packaged installer yet. Repo https://github.com/AnkitParekh007/job-search-assistant
- ContextOps AI: B2B evaluation workspace for finding which repeatable AI tasks might use lower-cost models without sacrificing measured quality. A pilot. Repo https://github.com/AnkitParekh007/contextOps
- ContributorOps: contribution workflow for finding worthwhile issues, preparing reviewable pull requests and documenting what was shipped. Includes a merged pull request to floating-ui: https://github.com/floating-ui/floating-ui/pull/3494. Repo https://github.com/AnkitParekh007/contributorOps
- Agentic Engineering Playbook: project-first academy for model gateways, RAG, workflow orchestration, MCP, agentic UI and browser automation. Repo https://github.com/AnkitParekh007/Agentic-Engineering-Playbook
- Zero to FDE: hands-on path into Forward Deployed Engineering with lessons, field drills, capstones and customer-facing scenarios. Repo https://github.com/AnkitParekh007/forward-deployed-engineering-from-scratch
All eight are listed at https://ankit-parekh.org/open-source-projects.html

## Education
B.E. Computer Science, Atharva College of Engineering, University of Mumbai (2013).

## Courses and credentials (evidence label: issuer-verifiable credential for badges and certificates; "completed" means finished without a badge)
69 courses across 5 academies: Claude Academy, LangChain Academy, OpenAI Academy, Hugging Face and Google Skills. 24 badges and 19 certificates.
Examples: Introduction to Model Context Protocol, Model Context Protocol: Advanced topics, Tool use with the Messages API, Claude Code in action, Introduction to evals (Claude Academy badges); LangGraph Essentials (TypeScript), Building Reliable Agents with LangSmith, Agent Observability and Evaluations (LangChain Academy certificates); Evaluate AI Applications, Design and Build Agentic Systems, Build with Retrieval-Augmented Generation (OpenAI Academy badges); Agents Course and MCP Course (Hugging Face certificates).

## Skills
- AI and agents: OpenAI, Anthropic, MCP tools, LLM routing, RAG with hybrid retrieval, Supabase pgvector, eval harnesses, SSE streaming.
- Platform and tooling: Next.js, Supabase, Playwright, Jenkins.
- Infra: Docker, Kubernetes, AWS, CI/CD.
- Frontend: Angular (12 to 21), TypeScript, RxJS, React, Vue.js.
- UI and web: Angular Material, AG Grid Enterprise, service workers, i18n.
- Backend: NestJS, Node.js, Python, Java, PySpark.

## How he works
End-to-end ownership, plan-first design, eval-driven delivery, team leadership, release coordination.

## Availability
Available now. Based in Mumbai, India. Open to relocation to Germany, Ireland and the UAE. Open to remote work. Former EU Blue Card holder.
Open to Principal Forward Deployed Engineer, AI Solutions Architect and Frontend Architect opportunities. Recruiters, founders and engineering leaders are welcome to get in touch.

## Contact
- Email: ankit77parekh@gmail.com (best for roles and projects)
- LinkedIn: https://in.linkedin.com/in/akkiparekh
- GitHub: https://github.com/AnkitParekh007
- Resume (PDF): https://ankit-parekh.org/AnkitParekh_Resume.pdf
- Portfolio: https://ankit-parekh.org/

## Not in this profile (say so, do not guess)
Salary expectations, notice period, visa status for any country other than his former EU Blue Card, references, confidential details of employers' systems or customers, and anything about his personal life.
`;
