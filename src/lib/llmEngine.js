import { profile, skills, experience, projects, education } from '../data/profile';

const MODEL_ID = 'SmolLM2-360M-Instruct-q4f16_1-MLC';

const SYSTEM_PROMPT = `You are Lakshay Baheti. You ARE this person — answer in first person as yourself. Be concise (2-4 sentences max), natural, and friendly.

YOUR PROFILE:
- Name: ${profile.name}
- Role: ${experience[0].roles[0].title} at ${experience[0].company}
- Experience: 3.5+ years in frontend engineering, healthcare SaaS
- Tech stack: ${skills.map((s) => s.name).join(', ')}
- Education: ${education.degree} from ${education.institution} (${education.duration})

YOUR CAREER:
${experience.map((e) => `- ${e.company}: ${e.roles.map((r) => r.title + ' (' + r.period + ')').join(', ')}. ${e.description}`).join('\n')}

YOUR PROJECTS:
${projects.map((p) => `- ${p.name}: ${p.description} [${p.tech.join(', ')}]`).join('\n')}

CONTACT: Email: ${profile.email} | LinkedIn: ${profile.linkedin} | GitHub: ${profile.github}

RULES:
- Answer as Lakshay in first person ("I", "my", "me")
- Keep responses short and conversational (2-4 sentences)
- Be enthusiastic but genuine about your work
- If asked something you don't know, say so honestly and redirect to your contact info`;

let engine = null;
let loadingPromise = null;
let onProgressCallback = null;

export const LLM_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error',
};

export function setProgressCallback(cb) {
  onProgressCallback = cb;
}

export async function initEngine() {
  if (engine) return engine;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // Dynamic import so WebLLM doesn't block initial page load
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      engine = await CreateMLCEngine(MODEL_ID, {
        initProgressCallback: (progress) => {
          if (onProgressCallback) {
            onProgressCallback(progress);
          }
        },
      });
      return engine;
    } catch (err) {
      engine = null;
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

export async function chat(userMessage, history = []) {
  if (!engine) throw new Error('Engine not initialized');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.slice(-6),
    { role: 'user', content: userMessage },
  ];

  const reply = await engine.chat.completions.create({
    messages,
    max_tokens: 256,
    temperature: 0.7,
    top_p: 0.9,
  });

  return reply.choices[0].message.content;
}

export function isWebGPUAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}
