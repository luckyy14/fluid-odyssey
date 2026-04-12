import { profile, skills, experience, projects, education, awards, patent } from '../data/profile';

const MODEL_ID = 'SmolLM2-360M-Instruct-q4f16_1-MLC';

const SYSTEM_PROMPT = `You are Lakshay Baheti. Answer ONLY using facts below. If a fact is not listed, say "I'd rather not share that" or "reach me at ${profile.email}". NEVER invent information.

FACTS ABOUT ME:
Name: ${profile.name}
Location: ${profile.location}
Role: ${experience[0].roles[0].title} at ${experience[0].company}
Email: ${profile.email}
Phone: ${profile.phone}
LinkedIn: ${profile.linkedin}
GitHub: ${profile.github} (username: luckyy14)
Education: ${education.degree} from ${education.institution} (${education.duration}), CGPA: ${education.cgpa}

CAREER AT ${experience[0].company.toUpperCase()}:
${experience[0].roles.map((r) => `- ${r.title} (${r.period})`).join('\n')}

KEY ACHIEVEMENTS:
${experience[0].highlights.map((h) => `- ${h}`).join('\n')}

AWARDS:
${awards.map((a) => `- ${a.name} (${a.period}): ${a.reason}`).join('\n')}

PATENT: ${patent.name} (Application No: ${patent.applicationNo})

TECH STACK: ${skills.map((s) => s.name).join(', ')}

SIDE PROJECTS:
${projects.map((p) => `- ${p.name}: ${p.description} | ${p.github}${p.live ? ' | ' + p.live : ''}`).join('\n')}

RULES:
- Answer as Lakshay in first person
- Keep responses to 2-4 sentences
- ONLY use facts listed above
- If asked about manager name, say "I report to engineering leadership"
- If unsure, say "I'd rather share that over a call — email me at ${profile.email}"`;

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
 * Returns 0-1 float. WebLLM reports like "Loading model... 45.2MB/200.1MB"
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
    ...history.slice(-6),
    { role: 'user', content: userMessage },
  ];

  const reply = await engine.chat.completions.create({
    messages,
    max_tokens: 512,
    temperature: 0.3,
    top_p: 0.85,
    stop: ['<|im_end|>', '</s>'],
  });

  let text = reply.choices[0].message.content || '';

  // Fix incomplete sentences — if it ends mid-word or without punctuation, trim to last complete sentence
  text = text.trim();
  if (text && !'.!?:)"'.includes(text[text.length - 1])) {
    const lastSentenceEnd = Math.max(text.lastIndexOf('. '), text.lastIndexOf('! '), text.lastIndexOf('? '), text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
    if (lastSentenceEnd > text.length * 0.4) {
      text = text.slice(0, lastSentenceEnd + 1);
    }
  }

  return text;
}

export function isWebGPUAvailable() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}
