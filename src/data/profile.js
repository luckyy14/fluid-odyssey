export const profile = {
  name: 'Lakshay Baheti',
  firstName: 'Lakshay',
  role: 'Software Development Engineer II',
  company: 'Bajaj Finserv Health',
  tagline: 'Building delightful web experiences',
  location: 'Bengaluru, India',
  phone: '+91 9483109935',
  intro:
    'Highly motivated Frontend SDE with 3+ years of experience building and optimising web applications using Next.js, React.js, SpringBoot and Nest.js. Led migration of legacy applications to modern frameworks, resulting in improvements in performance, user experience, and cost efficiency.',
  email: 'lakshayb.work@gmail.com',
  linkedin: 'https://www.linkedin.com/in/lakshay-baheti/',
  github: 'https://github.com/luckyy14',
};

export const skills = [
  { name: 'Next.js', category: 'frontend', level: 95 },
  { name: 'React', category: 'frontend', level: 95 },
  { name: 'Nx Monorepo', category: 'frontend', level: 90 },
  { name: 'Micro Frontends', category: 'frontend', level: 85 },
  { name: 'Spring Boot', category: 'backend', level: 80 },
  { name: 'Nest.js', category: 'backend', level: 80 },
  { name: 'Reactor Core', category: 'backend', level: 70 },
  { name: 'Azure DevOps', category: 'cloud', level: 85 },
  { name: 'Azure Blob Storage', category: 'cloud', level: 80 },
  { name: 'Azure AKS', category: 'cloud', level: 75 },
  { name: 'Cloudflare Images', category: 'cloud', level: 80 },
  { name: 'React Query', category: 'performance', level: 90 },
  { name: 'Core Web Vitals', category: 'performance', level: 90 },
  { name: 'SSR / SSG', category: 'performance', level: 85 },
  { name: 'SWC Bundling', category: 'performance', level: 80 },
];

export const experience = [
  {
    company: 'Bajaj Finserv Health',
    roles: [
      { title: 'Software Development Engineer II', period: 'Aug 2023 - Present', current: true },
      { title: 'Associate SDE', period: 'Jul 2022 - Jul 2023' },
      { title: 'Software Development Intern', period: 'Jan 2022 - Jun 2022' },
    ],
    highlights: [
      'Leading team of 4 frontend + 2 backend developers for SaaS healthcare product',
      'Architected unified Design Language System (DLS) for 6 apps using Builder & Factory patterns',
      'Migrated 2 modules (500k+ LOC each) from Struts to React + Spring Boot using Strangler pattern — 90% reduction in procedure execution time',
      'CI/CD with Azure DevOps + GitLab CI — reduced deployment time by 60%',
      'Achieved 12x increase in traffic and product adoption across partner hospitals',
      'OCR integration reduced client shortfalls from 26% to 11%',
      'Improved Core Web Vitals by 30% (lazy loading, dynamic imports, SWC, SSR)',
      'Migrated 80+ APIs to Nest.js and Spring Boot backends',
      'Reduced CDN expenses by 80% with Azure Blob Storage + Cloudflare Images hybrid',
      'SEO improvements elevated search rankings from page 10 to page 1',
    ],
    description: 'Building scalable healthcare SaaS with React, Nx monorepos, Spring Boot, and Azure.',
  },
];

export const education = {
  institution: 'Vellore Institute of Technology',
  degree: 'B.Tech Computer Science Engineering',
  duration: '2018 - 2022',
  cgpa: '8.73/10',
};

export const awards = [
  { name: 'MVP Award', period: 'Mar 2025', reason: 'Cloud migration and monitoring' },
  { name: 'Sharp Shark Award', period: 'Oct 2024', reason: 'Architecture improvements' },
  { name: 'Sharp Shark Award', period: 'Apr 2024', reason: 'Cross-team collaboration' },
  { name: 'Super Hero Award', period: 'Mar 2023', reason: 'AI/ML innovation' },
  { name: 'Limelight Award', period: 'Sept 2022', reason: 'System optimization' },
  { name: 'Top 5 BYTE Intern', period: '2022', reason: 'Ranked top 5 of 150+ interns' },
];

export const patent = {
  name: 'Smart Wallet',
  applicationNo: '202041035038',
};

export const projects = [
  {
    name: 'React Design Patterns',
    description: 'Showcase of Compound Components, Renderless Components, Prop Getters, State Initializers and more.',
    tech: ['React', 'Vite', 'JavaScript'],
    github: 'https://github.com/luckyy14/react-design-pattern',
    live: 'https://codex.lakshaybaheti.com/',
  },
  {
    name: 'Fluid Portfolio Trainer',
    description: 'Configurable LoRA model trainer for personality adapters with TUI dashboard and multi-format export.',
    tech: ['Python', 'PyTorch', 'Pydantic', 'Textual'],
    github: 'https://github.com/luckyy14/fluid-portfolio-trainer',
  },
  {
    name: '3D Web Demo',
    description: 'Interactive 3D web experience built with Three.js and WebGL.',
    tech: ['Three.js', 'WebGL', 'JavaScript'],
    github: 'https://github.com/luckyy14/3d-web-demo',
  },
  {
    name: 'Human Keyboard',
    description: 'Turning human gestures into keyboard inputs using computer vision.',
    tech: ['Python', 'OpenCV', 'MediaPipe'],
    github: 'https://github.com/luckyy14/Human-Keyboard',
  },
];
