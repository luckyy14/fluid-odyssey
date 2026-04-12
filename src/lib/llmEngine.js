import { profile, skills, experience, projects, education, awards, patent } from '../data/profile';

const MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

const SYSTEM_PROMPT = `You are Lakshay Baheti answering questions about yourself. Use ONLY these facts. Do NOT invent anything.

IDENTITY: ${profile.name}, ${experience[0].roles[0].title} at ${experience[0].company}, ${profile.location}. Email: ${profile.email}. LinkedIn: ${profile.linkedin}. GitHub: ${profile.github} (luckyy14). Phone: ${profile.phone}.

EDUCATION: ${education.degree}, ${education.institution}, ${education.duration}, CGPA ${education.cgpa}.

CAREER: ${experience[0].roles.map((r) => r.title + ' (' + r.period + ')').join(' → ')} at ${experience[0].company}.

ACHIEVEMENTS: Led team of 4 FE + 2 BE devs. Migrated 2 modules (500k+ LOC) from Struts to React+SpringBoot using Strangler pattern, 90% faster. Built DLS for 6 apps (Builder+Factory patterns). CI/CD via Azure DevOps+GitLab CI, 60% faster deploys. 12x traffic growth. OCR reduced shortfalls 26%→11%. Core Web Vitals +30%. Migrated 80+ APIs to NestJS+SpringBoot. CDN costs -80% via Azure Blob+Cloudflare Images. SEO page 10→page 1.

TECH: ${skills.map((s) => s.name).join(', ')}.

AWARDS: ${awards.map((a) => a.name + ' (' + a.period + ')').join(', ')}. Patent: ${patent.name} (${patent.applicationNo}).

PROJECTS: ${projects.map((p) => p.name + ': ' + p.description).join('. ')}.

RULES: First person only. 2-3 sentences max. If unsure say "reach me at ${profile.email}".`;

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

/**
 * Parse download progress from WebLLM's text-based progress.
 * Returns 0-1 float.
 */
export function parseProgress(progressObj) {
  if (!progressObj) return 0;
  if (typeof progressObj.progress === 'number') return progressObj.progress;
  const text = progressObj.text || '';
  const match = text.match(/([\d.]+)\s*(?:MB|GB)\s*\/\s*([\d.]+)\s*(?:MB|GB)/i);
  if (match) return parseFloat(match[1]) / parseFloat(match[2]);
  if (text.toLowerCase().includes('finish')) return 1;
  return 0;
}

export async function initEngine() {
  if (engine) return engine;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
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
    ...history.slice(-4),
    { role: 'user', content: userMessage },
  ];

  const reply = await engine.chat.completions.create({
    messages,
    max_tokens: 200,
    temperature: 0.1,
    top_p: 0.8,
    frequency_penalty: 1.5,
    presence_penalty: 1.0,
    stop: ['<|im_end|>', '</s>', '<|endoftext|>'],
  });

  let text = reply.choices[0].message.content || '';
  text = cleanResponse(text);
  return text;
}

/**
 * Clean model output: trim to complete sentences and cut repetition loops.
 */
function cleanResponse(raw) {
  let text = raw.trim();
  if (!text) return text;

  // Detect sentence-level repetition
  const sentences = text.split(/(?<=[.!?])\s+/);
  const seen = new Set();
  const unique = [];
  for (const s of sentences) {
    const key = s.trim().toLowerCase().replace(/\s+/g, ' ');
    if (key.length < 5) continue;
    if (seen.has(key)) break;
    seen.add(key);
    unique.push(s.trim());
  }
  text = unique.join(' ');

  // Trim to last complete sentence
  text = text.trim();
  if (text && !'.!?:)"'.includes(text[text.length - 1])) {
    const lastEnd = Math.max(
      text.lastIndexOf('. '), text.lastIndexOf('! '), text.lastIndexOf('? '),
      text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'),
    );
    if (lastEnd > text.length * 0.3) {
      text = text.slice(0, lastEnd + 1);
    }
  }

  return text;
}

export function isWebGPUAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}
