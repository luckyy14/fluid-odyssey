import { profile, skills, experience, projects, awards } from './profile';

const flatExp = experience[0].roles.map((r) => ({
  title: r.title,
  company: experience[0].company,
  period: r.period,
  current: !!r.current,
  description: r.title === 'Software Development Engineer II' ? experience[0].description : undefined,
}));

const topProjects = projects.slice(0, 4);

// Each prebaked spec showcases one intent with a curated theme + content.
// They render through the same SceneRenderer; no orchestrator call.
export const PREBAKED = {
  skills: {
    request_id: 'prebaked_skills',
    seed: 4001,
    intent: 'skills',
    mood: 'technical',
    theme: {
      palette_name: 'tide', type_family: 'mono', density: 'normal',
      radius: 'soft', motion: 'subtle',
      background: { kind: 'pattern', hint: 'grid' },
    },
    layout: 'skills_centered',
    blocks: [
      { id: 'h', type: 'hero_terminal', props_preview: {}, props: { title: 'whoami → engineer', kicker: 'whoami' } },
      { id: 'b', type: 'skill_tag_cloud', props_preview: { tile_count: skills.length }, props: { skills } },
    ],
  },

  experience: {
    request_id: 'prebaked_experience',
    seed: 4002,
    intent: 'experience',
    mood: 'reflective',
    theme: {
      palette_name: 'ink', type_family: 'serif', density: 'airy',
      radius: 'soft', motion: 'subtle',
      background: { kind: 'gradient', hint: 'editorial' },
    },
    layout: 'exp_vertical_flow',
    blocks: [
      { id: 'h', type: 'hero', props_preview: {}, props: { title: 'A growth path, not a job', kicker: 'experience' } },
      { id: 'b', type: 'exp_timeline_vertical', props_preview: { event_count: flatExp.length }, props: { events: flatExp } },
    ],
  },

  contact: {
    request_id: 'prebaked_contact',
    seed: 4003,
    intent: 'contact',
    mood: 'warm',
    theme: {
      palette_name: 'paper', type_family: 'sans', density: 'normal',
      radius: 'pill', motion: 'subtle',
      background: { kind: 'noise', hint: 'paper' },
    },
    layout: 'contact_centered',
    blocks: [
      { id: 'h', type: 'hero', props_preview: {}, props: { title: 'Talk to me', kicker: 'contact' } },
      {
        id: 'b', type: 'contact_card_centered', props_preview: {},
        props: {
          email: profile.email, phone: profile.phone,
          linkedin: profile.linkedin, github: profile.github,
          message: 'Quickest reply over email. Open to roles, collabs, and side projects.',
        },
      },
    ],
  },

  projects: {
    request_id: 'prebaked_projects',
    seed: 4004,
    intent: 'projects',
    mood: 'playful',
    theme: {
      palette_name: 'citrus', type_family: 'display', density: 'normal',
      radius: 'soft', motion: 'lively',
      background: { kind: 'gradient', hint: 'sun' },
    },
    layout: 'proj_grid_flow',
    blocks: [
      { id: 'h', type: 'hero', props_preview: {}, props: { title: 'Things I made on purpose', kicker: 'projects' } },
      { id: 'b', type: 'proj_grid', props_preview: { tile_count: topProjects.length }, props: { projects: topProjects } },
    ],
  },

  technical: {
    request_id: 'prebaked_technical',
    seed: 4005,
    intent: 'technical',
    mood: 'technical',
    theme: {
      palette_name: 'noir', type_family: 'mono', density: 'dense',
      radius: 'sharp', motion: 'subtle',
      background: { kind: 'code_rain', hint: 'matrix' },
    },
    layout: 'tech_centered',
    blocks: [
      { id: 'h', type: 'hero_terminal', props_preview: {}, props: { title: 'Migrating 500k LOC, the safe way', kicker: 'cat /architecture' } },
      {
        id: 'b', type: 'tech_stack_layered',
        props_preview: { bullet_count: 5 },
        props: {
          layers: [
            { name: 'Edge', description: 'Cloudflare Images + Azure Blob CDN — 80% lower cost' },
            { name: 'Frontend', description: 'Nx monorepo, Next.js + React, micro-frontends across 6 apps' },
            { name: 'Glue', description: 'Strangler-pattern rewrite from Struts → React + SpringBoot' },
            { name: 'Backend', description: 'Spring Boot + Nest.js, 80+ APIs migrated' },
            { name: 'Pipeline', description: 'Azure DevOps + GitLab CI — 60% faster deploys' },
          ],
        },
      },
    ],
  },

  outcomes: {
    request_id: 'prebaked_outcomes',
    seed: 4006,
    intent: 'outcomes',
    mood: 'direct',
    theme: {
      palette_name: 'ember', type_family: 'sans', density: 'normal',
      radius: 'soft', motion: 'subtle',
      background: { kind: 'gradient', hint: 'warmth' },
    },
    layout: 'out_centered',
    blocks: [
      { id: 'h', type: 'hero', props_preview: {}, props: { title: 'Numbers, not vibes', kicker: 'outcomes' } },
      {
        id: 'b', type: 'out_stat_grid',
        props_preview: { tile_count: 4 },
        props: {
          stats: [
            { label: 'Faster deploys', value: '60%', context: 'Azure DevOps + GitLab CI rollout' },
            { label: 'Procedure execution', value: '90%↓', context: 'Strangler migration of 500k LOC' },
            { label: 'CDN cost', value: '80%↓', context: 'Azure Blob + Cloudflare Images hybrid' },
            { label: 'Traffic growth', value: '12×', context: 'Across partner hospital network' },
          ],
        },
      },
    ],
  },

  philosophy: {
    request_id: 'prebaked_philosophy',
    seed: 4007,
    intent: 'philosophy',
    mood: 'reflective',
    theme: {
      palette_name: 'dusk', type_family: 'serif', density: 'airy',
      radius: 'soft', motion: 'subtle',
      background: { kind: 'noise', hint: 'paper' },
    },
    layout: 'phil_centered_long_form',
    blocks: [
      { id: 'h', type: 'hero_typewriter', props_preview: {}, props: { title: 'Build for the user, ship for the team', kicker: 'how I work' } },
      {
        id: 'b', type: 'phil_manifesto',
        props_preview: { bullet_count: 4 },
        props: {
          title: 'Things I keep coming back to',
          beliefs: [
            'Boring tools, weird products. The novelty belongs in what users see.',
            'A migration is a series of safe, reversible moves — never a flag day.',
            'Performance is a feature; Core Web Vitals deserve a budget, not a wish.',
            'A senior engineer ships their team, not just their own PRs.',
          ],
        },
      },
    ],
  },

  personal: {
    request_id: 'prebaked_personal',
    seed: 4008,
    intent: 'personal',
    mood: 'warm',
    theme: {
      palette_name: 'sage', type_family: 'serif', density: 'normal',
      radius: 'soft', motion: 'subtle',
      background: { kind: 'gradient', hint: 'soft' },
    },
    layout: 'me_centered',
    blocks: [
      { id: 'h', type: 'hero', props_preview: {}, props: { title: `Hey, I'm ${profile.firstName}`, kicker: 'about me' } },
      {
        id: 'b', type: 'me_about_card', props_preview: {},
        props: {
          name: profile.name,
          role: `${profile.role} at ${profile.company}`,
          bio: profile.intro + ' ' + (awards[0] ? `Most recently: ${awards[0].name} (${awards[0].period}).` : ''),
          location: profile.location,
        },
      },
    ],
  },
};

export function getPrebaked(intent) {
  return PREBAKED[intent] || PREBAKED.personal;
}
