import { z } from 'zod';
import { Shimmer } from './_shared';

// markdown_prose — universal fallback. We don't render markdown; we render text
// with paragraph breaks. Keeps the surface safe (no HTML injection).
export function MarkdownProse({ text }) {
  const paragraphs = String(text || '').split(/\n\n+/);
  return (
    <div style={{
      padding: '1.5rem', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-lg)',
      color: 'var(--fg)', fontFamily: 'var(--font-family)', lineHeight: 'var(--leading)',
    }}>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ fontSize: '0.9375rem', marginBottom: i < paragraphs.length - 1 ? '0.75rem' : 0 }}>{p}</p>
      ))}
    </div>
  );
}
export const markdownProsePropsSchema = z.object({ text: z.string().min(1).max(2000) });
export function MarkdownProseSkeleton() {
  return (
    <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-lg)' }}>
      <Shimmer style={{ height: 14, marginBottom: 8 }} />
      <Shimmer style={{ height: 14, marginBottom: 8, width: '90%' }} />
      <Shimmer style={{ height: 14, width: '60%' }} />
    </div>
  );
}
