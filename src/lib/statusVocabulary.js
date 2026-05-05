// Ephemeral status messages cycled while the LLM is working. Phased so the
// vocabulary matches what's actually happening under the hood — pondering
// while pass 1 routes, weaving while pass 2 streams, locking-in while theme
// is computed, etc. Pure data; consumers pick a random entry and rotate.

export const STATUS_VOCAB = {
  // Engine init / model download phase. Long; shown while model bytes load.
  warming: [
    'Warming up the model',
    'Loading the local AI',
    'Spinning up WebGPU',
    'Heating the GPU',
    'Stretching the neurons',
    'Booting the brain',
    'Tuning the weights',
    'Caching the layers',
    'Wiring up the worker',
    'Powering on',
    'Priming the pipes',
  ],

  // Iterator just attached — about to send pass 1.
  starting: [
    'Reading your question',
    'Parsing your prompt',
    'Listening',
    'Tuning in',
    'Preparing',
  ],

  // Pass 1 awaiting (router pick). Ponder-heavy vocab.
  routing: [
    'Pondering',
    'Mulling it over',
    'Considering',
    'Cogitating',
    'Picking an angle',
    'Choosing a vibe',
    'Routing the request',
    'Weighing options',
    'Reflecting',
    'Thinking',
    'Distilling intent',
    'Reading between the lines',
    'Calibrating',
    'Triangulating',
    'Settling on a mood',
  ],

  // Theme hint just arrived — generating CSS vars.
  theming: [
    'Sketching a palette',
    'Mixing colors',
    'Choosing a font',
    'Painting the canvas',
    'Setting the mood',
    'Picking type',
    'Tuning the spacing',
    'Composing the surface',
    'Dressing the page',
  ],

  // Pass 2 awaiting first chunk — composing started, no tokens yet.
  composing: [
    'Composing',
    'Drafting',
    'Sketching',
    'Outlining',
    'Framing',
    'Plotting the structure',
    'Mapping the layout',
    'Brainstorming sections',
  ],

  // Pass 2 actively streaming tokens.
  streaming: [
    'Streaming words',
    'Typing it out',
    'Weaving sentences',
    'Threading the answer',
    'Stitching together',
    'Filling in details',
    'Building the page',
    'Drafting the blocks',
    'Knitting it together',
    'Pouring the content',
    'Polishing phrases',
    'Crafting',
    'Generating',
    'Writing',
    'Synthesizing',
    'Materializing',
    'Forging',
    'Forming',
    'Inking',
    'Brewing',
  ],

  // Shell scaffold arrived — blocks are being filled in.
  shaping: [
    'Laying out blocks',
    'Placing the hero',
    'Arranging sections',
    'Setting the stage',
    'Building the layout',
    'Putting it together',
  ],

  // At least one block is filled, waiting for more.
  finishing: [
    'Filling the last block',
    'Wrapping up',
    'Tying the bow',
    'Polishing',
    'Final touches',
    'Almost there',
    'Sealing the page',
  ],

  // Done — brief flash before status hides itself.
  ready: [
    'Ready',
    'Done',
    'Fresh from the kiln',
    'Hot off the press',
    'Page is yours',
  ],
};

// Pick a different word than the previous one (avoids visible repeats).
export function pickStatus(phase, exclude) {
  const pool = STATUS_VOCAB[phase] || STATUS_VOCAB.streaming;
  if (pool.length <= 1) return pool[0];
  let word;
  for (let tries = 0; tries < 6; tries++) {
    word = pool[Math.floor(Math.random() * pool.length)];
    if (word !== exclude) return word;
  }
  return word;
}
