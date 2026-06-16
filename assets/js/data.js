/**
 * PORTFOLIO DATA — All skills, projects, experience, testimonials, process steps.
 * Imported by app.js and section modules.
 */

export const portfolioData = {
  skills: [
    { name: '.NET Core / C#', level: 0.95, cat: 'backend' },
    { name: 'Angular', level: 0.92, cat: 'frontend' },
    { name: 'React.js', level: 0.87, cat: 'frontend' },
    { name: 'TypeScript', level: 0.90, cat: 'frontend' },
    { name: 'Azure / Docker / K8s', level: 0.82, cat: 'cloud' },
    { name: 'SQL & Data Modeling', level: 0.85, cat: 'data' },
    { name: 'REST / SignalR APIs', level: 0.93, cat: 'backend' },
    { name: 'Clean Architecture', level: 0.88, cat: 'backend' }
  ],
  projects: [
    { id: 0, title: 'AIRIS Enterprise ERP', client: 'Aether Industries', impact: '70% faster deployments • Modernized from .NET 4.5 legacy', tech: '.NET Core • Angular • Docker • Kubernetes', desc: 'Full platform modernization. PRM module, real-time dashboards, container orchestration. 100k+ daily transactions now stable.', texture: 0 },
    { id: 1, title: 'Insurance Portal Platform', client: 'Major Insurer', impact: '40k monthly users • 100% test coverage', tech: 'ASP.NET • MSSQL • HelloSign • Stripe', desc: 'High-traffic customer portal. E-signature flows, payments, policy management. Zero downtime releases for 3 years.', texture: 1 },
    { id: 2, title: 'Twitter Intelligence Engine', client: 'Internal Platform', impact: 'Executive dashboards • Real-time sentiment', tech: '.NET Core • React • OpenAI • SignalR', desc: 'Chrome extension + backend that turns Twitter into actionable intelligence. Featured for C-level reporting.', texture: 2 },
    { id: 3, title: 'Real-time Trading Platform', client: 'Fintech Scale-up', impact: '<50ms latency @ 10k concurrent', tech: 'Angular • .NET Core • Azure • Redis • SignalR', desc: 'Low-latency trading terminal and matching engine. Sub-50ms roundtrips with full audit trail.', texture: 3 },
    { id: 4, title: 'Legacy → Cloud Migration', client: 'Manufacturing Enterprise', impact: '40% infra cost reduction • 99.99% uptime', tech: 'ASP.NET • Docker • Kubernetes • Terraform', desc: 'Moved 12-year-old monolith to cloud-native. Zero-downtime cutover with feature flags and canary deploys.', texture: 0 }
  ],
  experience: [
    { year: '2025 — PRESENT', role: 'Senior Developer', company: 'Aether Industries', focus: 'Architecture modernization, team leadership, high-scale cloud delivery.' },
    { year: '2019 — 2024', role: 'Senior Developer', company: 'Engross Infotech', focus: 'Enterprise platforms, performance, testability, developer experience.' },
    { year: '2017 — 2019', role: 'Jr. Engineer', company: 'Skyzone Software', focus: 'Strong foundations in .NET and full-stack web development.' }
  ],
  testimonials: [
    { quote: "Avinash delivered a complex ERP modernization that reduced our deployment time by 70%. His architecture thinking is world-class.", author: "CTO", company: "Aether Industries" },
    { quote: "The real-time intelligence engine is still the backbone of our executive dashboards. Exceptional, reliable work.", author: "Head of Product", company: "Tech Platform" }
  ],
  process: [
    { step: "01", title: "Deep Discovery", desc: "Business goals, user research, technical audit." },
    { step: "02", title: "Robust Architecture", desc: "Clean .NET backends, modern frontends, cloud-native patterns." },
    { step: "03", title: "Iterative Delivery", desc: "Ship early, test relentlessly, refine with real data." },
    { step: "04", title: "Long-term Evolution", desc: "Production ready with monitoring, docs, and roadmap." }
  ]
};

export const SECTION_PROGRESS = [0, 0.175, 0.36, 0.55, 0.76, 0.95];
export const SECTION_NAMES = ['ABOUT', 'SKILLS', 'PROJECTS', 'EXPERIENCE', 'LAB', 'CONTACT'];