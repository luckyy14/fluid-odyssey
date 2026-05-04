import { z } from 'zod';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLinkedin, FaGithub, FaPhone } from 'react-icons/fa';
import { BlockShell, Shimmer } from './_shared';

const contactSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().max(40).optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  message: z.string().max(200).optional(),
});

// contact_card_centered
export function ContactCardCentered({ email, phone, linkedin, github, message }) {
  return (
    <BlockShell>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {message && <p style={{ fontSize: '1rem', color: 'var(--fg)', lineHeight: 'var(--leading)' }}>{message}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {email && <a href={`mailto:${email}`} style={btnStyle()}><FaEnvelope size={13} /> {email}</a>}
          {phone && <a href={`tel:${phone}`} style={btnStyle()}><FaPhone size={13} /> {phone}</a>}
          {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" style={btnStyle()}><FaLinkedin size={13} /> LinkedIn</a>}
          {github && <a href={github} target="_blank" rel="noopener noreferrer" style={btnStyle()}><FaGithub size={13} /> GitHub</a>}
        </div>
      </div>
    </BlockShell>
  );
}
export const contactCardCenteredPropsSchema = contactSchema;
export function ContactCardCenteredSkeleton() {
  return (
    <BlockShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
        <Shimmer style={{ height: 16, width: '70%' }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[0,1,2].map(i => <Shimmer key={i} style={{ height: 36, width: 120, borderRadius: 'var(--radius-pill)' }} />)}
        </div>
      </div>
    </BlockShell>
  );
}

// contact_terminal_prompt
export function ContactTerminalPrompt({ email, phone, linkedin, github, message }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-md)', fontFamily: 'ui-monospace, monospace', fontSize: '0.875rem' }}
    >
      <p style={{ color: 'var(--fg-muted)' }}>$ contact --info</p>
      {message && <p style={{ color: 'var(--fg-muted)', marginTop: 6 }}># {message}</p>}
      {email && <p style={{ color: 'var(--fg)' }}>email   <span style={{ color: 'var(--accent)' }}>{email}</span></p>}
      {phone && <p style={{ color: 'var(--fg)' }}>phone   <span style={{ color: 'var(--accent)' }}>{phone}</span></p>}
      {linkedin && <p style={{ color: 'var(--fg)' }}>linkedin <span style={{ color: 'var(--accent)' }}>{linkedin}</span></p>}
      {github && <p style={{ color: 'var(--fg)' }}>github  <span style={{ color: 'var(--accent)' }}>{github}</span></p>}
      <p style={{ color: 'var(--fg-muted)', marginTop: 6 }}>$ <span style={{ animation: 'pulse 1s infinite' }}>▍</span></p>
    </motion.div>
  );
}
export const contactTerminalPromptPropsSchema = contactSchema;
export function ContactTerminalPromptSkeleton() {
  return <Shimmer style={{ height: 180 }} />;
}

function btnStyle() {
  return {
    padding: '8px 14px',
    borderRadius: 'var(--radius-pill)',
    backgroundColor: 'var(--surface-2)',
    color: 'var(--accent)',
    fontSize: '0.8125rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
  };
}
