import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { themeGenerator, applyTheme } from '../lib/themeGenerator';
import { getBlock } from './blocks/registry';
import HoldingShell, { ThemedHoldingShell } from './HoldingShell';
import SceneBackground from './SceneBackground';
import StreamingStatus from './StreamingStatus';
import { SceneLayout, BlockFrame } from './SceneLayout';
import { chooseSceneLook } from '../lib/sceneLayouts';
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
  const [phase, setPhase] = useState(null);   // streaming-status phase key, or null when idle

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
    let filledCount = 0;
    setTheme(null); setShell(null); setFilled({}); setPhase('routing');
    devLog.info('ui', 'SceneRenderer: live iterator attached');
    (async () => {
      try {
        for await (const evt of iterator) {
          if (cancelled) return;
          devLog.debug('ui', `SceneRenderer ← ${evt.type}`, evt.id || evt.layout || '');
          if (evt.type === 'theme_hint' && evt.theme) { applyTheme(evt.theme); setTheme(evt.theme); setPhase('composing'); }
          if (evt.type === 'theme_ready')             { applyTheme(evt.theme); setTheme(evt.theme); setPhase((p) => p === 'composing' ? 'streaming' : p); }
          if (evt.type === 'shell')                   { setShell({ layout: evt.layout, blocks: evt.blocks }); setPhase('shaping'); }
          if (evt.type === 'block_filled') {
            filledCount += 1;
            setPhase(filledCount >= 2 ? 'finishing' : 'shaping');
            setFilled((f) => ({ ...f, [evt.id]: evt.props }));
            // Reconcile shell.blocks with the authoritative type from this event.
            // The streaming parser may have committed a truncated type into the
            // shell (e.g. "exp" instead of "exp_role_card_stack") if it fired
            // before the type string finished. The block_filled event carries
            // the fully-parsed type, so prefer it.
            setShell((s) => {
              if (!s) return s;
              const idx = s.blocks.findIndex((b) => b.id === evt.id);
              if (idx === -1) {
                return { ...s, blocks: [...s.blocks, { id: evt.id, type: evt.blockType || 'markdown_prose', props_preview: {} }] };
              }
              const existing = s.blocks[idx];
              if (evt.blockType && evt.blockType !== existing.type) {
                const updated = [...s.blocks];
                updated[idx] = { ...existing, type: evt.blockType };
                devLog.debug('ui', `shell: reconciled block ${evt.id} type ${existing.type} → ${evt.blockType}`);
                return { ...s, blocks: updated };
              }
              return s;
            });
          }
          if (evt.type === 'done') {
            setPhase('ready');
            // Clear the status pill after a brief flash so the rendered scene
            // gets the spotlight.
            setTimeout(() => { if (!cancelled) setPhase(null); }, 1200);
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
  const sceneSeed = (spec?.seed ?? theme?.seed ?? 0) | 0;
  const sceneIntent = spec?.intent || theme?.intent;
  const { layoutStrategy, frames } = chooseSceneLook({ seed: sceneSeed, intent: sceneIntent, blocks });
  const frameById = Object.fromEntries(frames.map((f) => [f.id, f]));

  return (
    <>
      <SceneBackground theme={theme} />
      <div style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--font-family)' }}>
        {phase && (
          <div style={{ marginBottom: 14 }}>
            <StreamingStatus phase={phase} />
          </div>
        )}
        <AnimatePresence mode="wait">
          {!theme && !shell && <Wrap key="pre"><HoldingShell question={question} /></Wrap>}
          {theme && !shell && <Wrap key="theme"><ThemedHoldingShell question={question} /></Wrap>}
          {shell && (
            <Wrap key="scene">
              <SceneLayout strategy={layoutStrategy}>
                {blocks.map((b, i) => {
                  const entry = getBlock(b.type);
                  const Component = entry.Component;
                  const Skeleton = entry.Skeleton;
                  const props = filled[b.id];
                  const frame = frameById[b.id] || { variant: 'clean', isHero: false };
                  let content;
                  if (props) {
                    if (props.fallback === 'markdown_prose') {
                      const Fallback = getBlock('markdown_prose').Component;
                      content = <Fallback text={props.text} />;
                    } else {
                      content = <Component {...props} />;
                    }
                  } else {
                    content = <Skeleton {...(b.props_preview ?? {})} />;
                  }
                  return (
                    <BlockFrame key={b.id} variant={frame.variant} index={i} isHero={frame.isHero}>
                      {content}
                    </BlockFrame>
                  );
                })}
              </SceneLayout>
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
