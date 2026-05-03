import {
  Hero, HeroSkeleton, heroPropsSchema,
  HeroQuote, HeroQuoteSkeleton, heroQuotePropsSchema,
  HeroTerminal, HeroTerminalSkeleton, heroTerminalPropsSchema,
  HeroTypewriter, HeroTypewriterSkeleton, heroTypewriterPropsSchema,
} from './heros';
import {
  SkillTagCloud, SkillTagCloudSkeleton, skillTagCloudPropsSchema,
  SkillMeterBars, SkillMeterBarsSkeleton, skillMeterBarsPropsSchema,
} from './skills';
import {
  ExpTimelineVertical, ExpTimelineVerticalSkeleton, expTimelineVerticalPropsSchema,
  ExpRoleCardStack, ExpRoleCardStackSkeleton, expRoleCardStackPropsSchema,
} from './experience';
import {
  ContactCardCentered, ContactCardCenteredSkeleton, contactCardCenteredPropsSchema,
  ContactTerminalPrompt, ContactTerminalPromptSkeleton, contactTerminalPromptPropsSchema,
} from './contact';
import {
  ProjGrid, ProjGridSkeleton, projGridPropsSchema,
  ProjSpotlight, ProjSpotlightSkeleton, projSpotlightPropsSchema,
} from './projects';
import {
  TechCodeBlock, TechCodeBlockSkeleton, techCodeBlockPropsSchema,
  TechStackLayered, TechStackLayeredSkeleton, techStackLayeredPropsSchema,
} from './technical';
import {
  OutStatGrid, OutStatGridSkeleton, outStatGridPropsSchema,
  OutKpiHero, OutKpiHeroSkeleton, outKpiHeroPropsSchema,
} from './outcomes';
import {
  PhilPullquote, PhilPullquoteSkeleton, philPullquotePropsSchema,
  PhilManifesto, PhilManifestoSkeleton, philManifestoPropsSchema,
} from './philosophy';
import {
  MeAboutCard, MeAboutCardSkeleton, meAboutCardPropsSchema,
  MePolaroidIntro, MePolaroidIntroSkeleton, mePolaroidIntroPropsSchema,
} from './personal';
import { MarkdownProse, MarkdownProseSkeleton, markdownProsePropsSchema } from './shared';

// Each entry: type → { Component, Skeleton, propsSchema, scenarios }
export const registry = {
  // Heros
  hero:            { Component: Hero,            Skeleton: HeroSkeleton,            propsSchema: heroPropsSchema,            scenarios: ['*'] },
  hero_quote:      { Component: HeroQuote,       Skeleton: HeroQuoteSkeleton,       propsSchema: heroQuotePropsSchema,       scenarios: ['*'] },
  hero_terminal:   { Component: HeroTerminal,    Skeleton: HeroTerminalSkeleton,    propsSchema: heroTerminalPropsSchema,    scenarios: ['*'] },
  hero_typewriter: { Component: HeroTypewriter,  Skeleton: HeroTypewriterSkeleton,  propsSchema: heroTypewriterPropsSchema,  scenarios: ['*'] },

  // Skills
  skill_tag_cloud:  { Component: SkillTagCloud,  Skeleton: SkillTagCloudSkeleton,  propsSchema: skillTagCloudPropsSchema,  scenarios: ['skills'] },
  skill_meter_bars: { Component: SkillMeterBars, Skeleton: SkillMeterBarsSkeleton, propsSchema: skillMeterBarsPropsSchema, scenarios: ['skills'] },

  // Experience
  exp_timeline_vertical: { Component: ExpTimelineVertical, Skeleton: ExpTimelineVerticalSkeleton, propsSchema: expTimelineVerticalPropsSchema, scenarios: ['experience'] },
  exp_role_card_stack:   { Component: ExpRoleCardStack,    Skeleton: ExpRoleCardStackSkeleton,    propsSchema: expRoleCardStackPropsSchema,    scenarios: ['experience'] },

  // Contact
  contact_card_centered:    { Component: ContactCardCentered,    Skeleton: ContactCardCenteredSkeleton,    propsSchema: contactCardCenteredPropsSchema,    scenarios: ['contact'] },
  contact_terminal_prompt:  { Component: ContactTerminalPrompt,  Skeleton: ContactTerminalPromptSkeleton,  propsSchema: contactTerminalPromptPropsSchema,  scenarios: ['contact'] },

  // Projects
  proj_grid:      { Component: ProjGrid,      Skeleton: ProjGridSkeleton,      propsSchema: projGridPropsSchema,      scenarios: ['projects'] },
  proj_spotlight: { Component: ProjSpotlight, Skeleton: ProjSpotlightSkeleton, propsSchema: projSpotlightPropsSchema, scenarios: ['projects'] },

  // Technical
  tech_code_block:    { Component: TechCodeBlock,    Skeleton: TechCodeBlockSkeleton,    propsSchema: techCodeBlockPropsSchema,    scenarios: ['technical'] },
  tech_stack_layered: { Component: TechStackLayered, Skeleton: TechStackLayeredSkeleton, propsSchema: techStackLayeredPropsSchema, scenarios: ['technical'] },

  // Outcomes
  out_stat_grid: { Component: OutStatGrid, Skeleton: OutStatGridSkeleton, propsSchema: outStatGridPropsSchema, scenarios: ['outcomes'] },
  out_kpi_hero:  { Component: OutKpiHero,  Skeleton: OutKpiHeroSkeleton,  propsSchema: outKpiHeroPropsSchema,  scenarios: ['outcomes'] },

  // Philosophy
  phil_pullquote: { Component: PhilPullquote, Skeleton: PhilPullquoteSkeleton, propsSchema: philPullquotePropsSchema, scenarios: ['philosophy'] },
  phil_manifesto: { Component: PhilManifesto, Skeleton: PhilManifestoSkeleton, propsSchema: philManifestoPropsSchema, scenarios: ['philosophy'] },

  // Personal
  me_about_card:     { Component: MeAboutCard,     Skeleton: MeAboutCardSkeleton,     propsSchema: meAboutCardPropsSchema,     scenarios: ['personal'] },
  me_polaroid_intro: { Component: MePolaroidIntro, Skeleton: MePolaroidIntroSkeleton, propsSchema: mePolaroidIntroPropsSchema, scenarios: ['personal'] },

  // Shared fallback
  markdown_prose: { Component: MarkdownProse, Skeleton: MarkdownProseSkeleton, propsSchema: markdownProsePropsSchema, scenarios: ['*'] },
};

export function getBlock(type) {
  return registry[type] || registry.markdown_prose;
}
