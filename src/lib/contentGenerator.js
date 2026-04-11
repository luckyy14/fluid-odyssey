import { profile, skills, experience, projects, education } from '../data/profile';

/**
 * Generates personalized content sections based on visitor type.
 * Used as immediate content while the LLM loads, and as structure
 * for the LLM to enhance.
 */

const topSkills = skills.filter((s) => s.level >= 85).map((s) => s.name);
const currentRole = experience[0].roles[0];

const contentByVisitor = {
  recruiter: {
    greeting: `Thanks for checking out my profile! Here's what I can bring to your team.`,
    sections: [
      {
        id: 'summary',
        title: 'Professional Summary',
        type: 'text',
        content: `${profile.intro} Currently serving as ${currentRole.title} at ${experience[0].company}, I've grown from intern to senior in 3+ years — shipping production code across the entire frontend stack.`,
      },
      {
        id: 'skills',
        title: 'Core Competencies',
        type: 'skills',
        content: skills,
      },
      {
        id: 'experience',
        title: 'Career Trajectory',
        type: 'timeline',
        content: experience,
      },
      {
        id: 'projects',
        title: 'Notable Work',
        type: 'projects',
        content: projects,
      },
    ],
    topics: [
      { label: 'Why should we hire Lakshay?', prompt: 'Make a compelling case for why a company should hire you. Highlight your growth, technical skills, and what makes you stand out.' },
      { label: 'Team & leadership experience', prompt: 'Tell me about your experience leading teams or mentoring developers.' },
      { label: 'Availability & preferences', prompt: 'What kind of roles are you interested in? What are your preferences for work setup, tech stack, and company culture?' },
      { label: 'Technical depth', prompt: 'Describe your deepest technical expertise. Give specific examples of complex problems you solved.' },
    ],
  },
  developer: {
    greeting: `Hey fellow dev! Let's geek out. Here's what I've been building.`,
    sections: [
      {
        id: 'stack',
        title: 'My Stack',
        type: 'skills',
        content: skills,
      },
      {
        id: 'projects',
        title: 'Things I\'ve Built',
        type: 'projects',
        content: projects,
      },
      {
        id: 'experience',
        title: 'Where I\'ve Worked',
        type: 'timeline',
        content: experience,
      },
    ],
    topics: [
      { label: 'React patterns you use', prompt: 'What React design patterns do you use daily? Give specific examples from your work.' },
      { label: 'Micro-frontend architecture', prompt: 'Explain your micro-frontend architecture at Bajaj. What problems did it solve? What tools do you use?' },
      { label: 'Your dev setup & tools', prompt: 'What does your development setup look like? Editor, terminal, tools, workflow?' },
      { label: 'Opinions on frontend trends', prompt: 'What are your thoughts on the current state of frontend development? What trends are overhyped vs underrated?' },
    ],
  },
  collaborator: {
    greeting: `Great to meet you! I love collaborating on interesting projects. Here's what I bring to the table.`,
    sections: [
      {
        id: 'about',
        title: 'About Me',
        type: 'text',
        content: `${profile.intro} I'm always open to interesting collaborations, especially around frontend architecture, developer tools, and creative web experiments.`,
      },
      {
        id: 'projects',
        title: 'Recent Projects',
        type: 'projects',
        content: projects,
      },
      {
        id: 'skills',
        title: 'What I Can Contribute',
        type: 'skills',
        content: skills,
      },
    ],
    topics: [
      { label: 'Open to freelance?', prompt: 'Are you open to freelance or consulting work? What kind of projects interest you?' },
      { label: 'Project ideas', prompt: 'What kind of side projects or collaborations are you most excited about right now?' },
      { label: 'Your working style', prompt: 'How do you like to collaborate? What\'s your communication style and workflow preference?' },
      { label: 'Past collaborations', prompt: 'Tell me about past collaborations or open source contributions you\'ve done.' },
    ],
  },
  curious: {
    greeting: `Welcome! Glad you stopped by. Here's a quick tour of who I am.`,
    sections: [
      {
        id: 'about',
        title: 'Who Am I?',
        type: 'text',
        content: `I'm ${profile.name} — a ${profile.role} at ${profile.company}. ${profile.intro}`,
      },
      {
        id: 'highlights',
        title: 'Quick Highlights',
        type: 'stats',
        content: [
          { label: 'Years of Experience', value: '3.5+' },
          { label: 'Current Role', value: currentRole.title },
          { label: 'Top Skills', value: topSkills.slice(0, 3).join(', ') },
          { label: 'Education', value: `${education.degree}, ${education.institution}` },
        ],
      },
      {
        id: 'projects',
        title: 'Cool Stuff I\'ve Made',
        type: 'projects',
        content: projects,
      },
    ],
    topics: [
      { label: 'What makes you tick?', prompt: 'What motivates you as a developer? What gets you excited about your work?' },
      { label: 'Career journey', prompt: 'Tell me about your career journey from student to senior developer.' },
      { label: 'Fun facts', prompt: 'Share some fun facts about yourself that people might not expect.' },
      { label: 'What\'s next for you?', prompt: 'What are your goals? Where do you see yourself heading next in your career?' },
    ],
  },
  custom: {
    greeting: `Thanks for telling me about yourself! Let me show you what's relevant.`,
    sections: [
      {
        id: 'about',
        title: 'About Me',
        type: 'text',
        content: `I'm ${profile.name}, ${profile.role} at ${profile.company}. ${profile.intro}`,
      },
      {
        id: 'skills',
        title: 'My Skills',
        type: 'skills',
        content: skills,
      },
      {
        id: 'projects',
        title: 'My Projects',
        type: 'projects',
        content: projects,
      },
      {
        id: 'experience',
        title: 'Experience',
        type: 'timeline',
        content: experience,
      },
    ],
    topics: [
      { label: 'Tell me more about yourself', prompt: 'Give a detailed introduction about yourself, your passions, and what drives you.' },
      { label: 'Your best work', prompt: 'What\'s the best piece of work you\'ve done? Walk me through it.' },
      { label: 'How to reach you', prompt: 'What\'s the best way to get in touch with you?' },
    ],
  },
};

export function getContentForVisitor(visitorType) {
  return contentByVisitor[visitorType] || contentByVisitor.curious;
}

export function getTopicsForVisitor(visitorType) {
  const content = contentByVisitor[visitorType] || contentByVisitor.curious;
  return content.topics;
}
