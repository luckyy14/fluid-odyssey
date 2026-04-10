import { profile, skills, experience, projects, education } from '../data/profile';

const patterns = [
  {
    keywords: ['hello', 'hi', 'hey', 'howdy', 'sup', 'yo'],
    responses: [
      `Hey! Thanks for saying hi. I'm ${profile.firstName}, a ${profile.role} at ${profile.company}. What would you like to know?`,
      `Hello! Nice to meet you. I'm always happy to chat about tech, my work, or anything really. Fire away!`,
      `Hi there! Welcome to my little corner of the internet. What brings you here today?`,
    ],
  },
  {
    keywords: ['tech', 'stack', 'technology', 'technologies', 'use', 'tools'],
    responses: [
      `My go-to stack is React.js with TypeScript. I work with Nx monorepos for enterprise-scale apps, and I've got experience with Next.js, React Native, Spring Boot, and NestJS. On the DevOps side, I handle CI/CD pipelines too.`,
      `I'm all about the modern web! React.js, TypeScript, Next.js are my daily drivers. I also work with Nx monorepos and micro-frontend architectures. Backend-wise, I've dabbled in Spring Boot and NestJS.`,
    ],
  },
  {
    keywords: ['experience', 'work', 'career', 'job', 'company'],
    responses: [
      `I've been at ${experience[0].company} for over 3.5 years now, growing from an intern to a Senior Software Developer. ${experience[0].description} Before that, I interned at Primera Dental Hub building their web presence.`,
      `My journey started as an intern at ${experience[0].company} in Jan 2022, and I've worked my way up to Senior Software Developer. I also did a stint at Primera Dental Hub and was a cybersecurity TA at VIT. It's been quite a ride!`,
    ],
  },
  {
    keywords: ['project', 'projects', 'built', 'build', 'portfolio'],
    responses: [
      `I've got some fun projects! "${projects[0].name}" showcases advanced React patterns. I also built a "${projects[1].name}" for creating LoRA model adapters, a "${projects[2].name}" with Three.js, and "${projects[3].name}" which turns human gestures into keyboard inputs using computer vision. Check them out in the Projects section!`,
      `My favorite projects include a React Design Patterns showcase (live at codex.lakshaybaheti.com), a LoRA model trainer, a 3D web demo with Three.js, and a Human Keyboard using OpenCV. Each one taught me something different!`,
    ],
  },
  {
    keywords: ['skill', 'skills', 'good', 'best', 'strong', 'strength'],
    responses: [
      `My strongest skills are ${skills.filter((s) => s.level >= 90).map((s) => s.name).join(', ')}. I'm also solid with ${skills.filter((s) => s.level >= 80 && s.level < 90).map((s) => s.name).join(', ')}. Always learning new things too!`,
      `React.js and JavaScript are where I shine brightest (95%), closely followed by TypeScript and Next.js (90%). I pride myself on being a versatile developer who can work across the stack.`,
    ],
  },
  {
    keywords: ['contact', 'reach', 'email', 'hire', 'connect'],
    responses: [
      `You can reach me at ${profile.email}, find me on LinkedIn (linkedin.com/in/lakshay-baheti), or check out my code on GitHub (github.com/luckyy14). I'm always open to interesting conversations!`,
      `The best way to reach me is via email at ${profile.email}. You can also connect with me on LinkedIn or GitHub. I'd love to hear from you!`,
    ],
  },
  {
    keywords: ['education', 'college', 'university', 'degree', 'study'],
    responses: [
      `I studied at ${education.institution}, where I earned my ${education.degree} (${education.duration}). VIT is where I first caught the coding bug and even served as a cybersecurity TA!`,
      `I'm a VIT grad with a BTech degree (2018-2022). That's where I started my journey into software development and cybersecurity. Great times!`,
    ],
  },
  {
    keywords: ['frontend', 'react', 'next', 'ui'],
    responses: [
      `Frontend is my sweet spot! I work primarily with React.js and have deep experience with Next.js for SSR/SSG. I'm big on component architecture, design patterns, and building smooth user experiences. Micro-frontends are my thing at work.`,
      `I live and breathe frontend! React.js is my weapon of choice, but I also love Next.js for full-stack React apps. At ${profile.company}, I architect micro-frontend solutions using Nx monorepos.`,
    ],
  },
  {
    keywords: ['backend', 'server', 'api', 'spring', 'nest', 'node'],
    responses: [
      `While I'm primarily a frontend dev, I've got solid backend chops too. I've worked with Spring Boot (Java), NestJS, and Node.js for building APIs and backend services. Full-stack capability comes in handy!`,
    ],
  },
  {
    keywords: ['hobby', 'hobbies', 'fun', 'free time', 'outside'],
    responses: [
      `When I'm not coding, I'm probably still thinking about coding! But seriously, I love exploring new tech, building side projects, and diving into creative experiments like my Human Keyboard project. I believe the best ideas come from playing around.`,
    ],
  },
  {
    keywords: ['current', 'now', 'working on', 'doing', 'present'],
    responses: [
      `Right now I'm a Senior Software Developer at ${profile.company}, building scalable healthcare SaaS applications. I'm working with React.js, Nx monorepos, and micro-frontend architecture. Also tinkering with AI/ML on the side!`,
    ],
  },
  {
    keywords: ['cybersecurity', 'security', 'owasp', 'hack'],
    responses: [
      `I've got a background in cybersecurity! I was a TA for a cybersecurity program at VIT where I helped set up 150 systems for an ethical hacking workshop. I'm also familiar with OWASP security practices. Security isn't just a feature, it's a mindset!`,
    ],
  },
  {
    keywords: ['micro frontend', 'microfrontend', 'mfe', 'monorepo', 'nx'],
    responses: [
      `Micro-frontends and Nx monorepos are a big part of my daily work at ${profile.company}! We use this architecture to build scalable healthcare applications that multiple teams can work on independently. It's complex but incredibly powerful for enterprise-scale apps.`,
    ],
  },
  {
    keywords: ['thank', 'thanks', 'awesome', 'great', 'cool', 'nice'],
    responses: [
      `You're welcome! Glad I could help. Feel free to ask anything else, or reach out to the real Lakshay at ${profile.email}!`,
      `Aw, thanks! That means a lot, even if I am just a pattern-matching bot. The real Lakshay would love to hear from you too!`,
    ],
  },
  {
    keywords: ['bye', 'goodbye', 'later', 'see you', 'cya'],
    responses: [
      `See you later! Don't be a stranger. You know where to find me. Happy coding!`,
      `Bye! It was fun chatting. Come back anytime you want to talk tech!`,
    ],
  },
];

const fallbackResponses = [
  `Interesting question! I'm just a pattern-matching bot for now, so I might not have the perfect answer. You can ask me about my tech stack, experience, projects, skills, or how to contact me!`,
  `Hmm, I'm not sure about that one. Try asking about my work experience, projects, skills, or tech stack. Or you can always reach the real Lakshay at ${profile.email}!`,
  `Good question! I don't have a pre-programmed response for that, but feel free to ask about my projects, skills, experience, or how to get in touch. I'm better at those topics!`,
  `I wish I could answer that, but I'm running on pattern matching, not actual AI... yet! Try asking about what I build, my tech stack, or my career journey.`,
];

export const getResponse = (input) => {
  const lower = input.toLowerCase().trim();

  for (const pattern of patterns) {
    const matched = pattern.keywords.some((keyword) => lower.includes(keyword));
    if (matched) {
      const randomIndex = Math.floor(Math.random() * pattern.responses.length);
      return pattern.responses[randomIndex];
    }
  }

  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[randomIndex];
};
