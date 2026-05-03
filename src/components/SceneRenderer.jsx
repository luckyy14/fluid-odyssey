import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { themeGenerator, applyTheme } from '../lib/themeGenerator';
import { getBlock } from './blocks/registry';
import HoldingShell, { ThemedHoldingShell } from './HoldingShell';
import SceneBackground from './SceneBackground';
import { devLog } from '../lib/devLog';

/**
 * Render a Scene Spec (either prebaked or streamed).
 *
 * Two modes:
 *   - prebaked: pass `spec` directly. Theme is applied on mount; all blocks render.
 *   - live:    pass an `iterator` (async iterable yielding theme_hint/theme_ready/shell/block_filled events).
 */
export default function SceneRenderer({ spec, iterator, question }) {
  const [theme, setTheme] = useState(null);
  const [shell, setShell] = useState(null);   // {layout, blocks: [{id, type, props_preview}]}
  const [filled, setFilled] = useState({});   // id → props

  // Prebaked path: synthesize theme + render everything immediately.
  useEffect(() => {
    if (!spec) return;
    devLog.debug('ui', 'SceneRenderer: prebaked spec', { intent: spec.intent, blocks: spec.blocks?.length });
    const t = themeGenerator({
      palette_name: spec.theme.palette_name,
      type_family: spec.theme.type_family,
      density: spec.theme.density,
      radius: spec.theme.radius,
      motion: spec.theme.motion,
      bg_kind: spec.theme.background.kind,
      seed: spec.seed,
    });
    applyTheme(t);
    setTheme(t);
    setShell({ layout: spec.layout, blocks: spec.blocks });
    const filledMap = {};
    for (const b of spec.blocks) if (b.props) filledMap[b.id] = b.props;
    setFilled(filledMap);
  }, [spec]);

  // Live path: consume iterator events.
  useEffect(() => {
    if (!iterator) return;
    let cancelled = false;
    setTheme(null); setShell(null); setFilled({});
    devLog.info('ui', 'SceneRenderer: live iterator attached');
    (async () => {
      try {
        for await (const evt of iterator) {
          if (cancelled) return;
          devLog.debug('ui', `SceneRenderer ← ${evt.type}`, evt.id || evt.layout || '');
          if (evt.type === 'theme_hint' && evt.theme) { applyTheme(evt.theme); setTheme(evt.theme); }
          if (evt.type === 'theme_ready')             { applyTheme(evt.theme); setTheme(evt.theme); }
          if (evt.type === 'shell')                   setShell({ layout: evt.layout, blocks: evt.blocks });
          if (evt.type === 'block_filled') {
            setFilled((f) => ({ ...f, [evt.id]: evt.props }));
            // Defensive: if the shell scaffold missed this block id, append it
            // so the renderer actually mounts a slot for it.
            setShell((s) => {
              if (!s) return s;
              if (s.blocks.some((b) => b.id === evt.id)) return s;
              return { ...s, blocks: [...s.blocks, { id: evt.id, type: evt.blockType || 'markdown_prose', props_preview: {} }] };
            });
          }
        }
      } catch (err) {
        if (cancelled) return;
        devLog.warn('ui', 'SceneRenderer iterator threw', err);
        setShell({
          layout: 'fallback',
          blocks: [{ id: 'err', type: 'markdown_prose', props_preview: {} }],
        });
        setFilled({ err: { text: `Could not generate this page. ${err?.message || ''}` } });
      }
    })();
    return () => { cancelled = true; };
  }, [iterator]);

  const blocks = shell?.blocks ?? [];

  return (
    <>
      <SceneBackground theme={theme} />
      <div style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--font-family)' }}>
        <AnimatePresence mode="wait">
          {!theme && !shell && <Wrap key="pre"><HoldingShell question={question} /></Wrap>}
          {theme && !shell && <Wrap key="theme"><ThemedHoldingShell question={question} /></Wrap>}
          {shell && (
            <Wrap key="scene">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {blocks.map((b) => {
                  const entry = getBlock(b.type);
                  const Component = entry.Component;
                  const Skeleton = entry.Skeleton;
                  const props = filled[b.id];
                  if (props) {
                    if (props.fallback === 'markdown_prose') {
                      const Fallback = getBlock('markdown_prose').Component;
                      return <Fallback key={b.id} text={props.text} />;
                    }
                    return (
                      <motion.div key={b.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                        <Component {...props} />
                      </motion.div>
                    );
                  }
                  return <Skeleton key={b.id} {...(b.props_preview ?? {})} />;
                })}
              </div>
            </Wrap>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function Wrap({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
