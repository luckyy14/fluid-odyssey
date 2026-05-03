import { get, set, keys, del } from 'idb-keyval';

const PREFIX = 'fluid:spec:';

export async function persistSpec(spec) {
  if (!spec?.request_id) return;
  try { await set(PREFIX + spec.request_id, spec); } catch { /* storage quota — silent */ }
}

export async function loadSpec(requestId) {
  try { return (await get(PREFIX + requestId)) || null; } catch { return null; }
}

export async function listSpecs() {
  try {
    const ks = await keys();
    return ks.filter((k) => typeof k === 'string' && k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
  } catch { return []; }
}

export async function clearSpecs() {
  for (const id of await listSpecs()) await del(PREFIX + id);
}

// Permalink helpers — store the full spec in URL hash for share links.
export function specToHash(spec) {
  if (!spec) return '';
  try {
    const json = JSON.stringify(spec);
    // base64url
    const b64 = typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(json))) : '';
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch { return ''; }
}

export function hashToSpec(hash) {
  if (!hash) return null;
  try {
    let b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(escape(atob(b64)));
    return JSON.parse(json);
  } catch { return null; }
}
