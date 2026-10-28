// PagePort content entry: idempotent, survives extension reloads cleanly.
import {openPanel} from './ui.js';
import {Picker} from './picker.js';

let stale = false;
try { chrome.runtime.getURL('/'); } catch { stale = true; }

// Remove any previous overlay (stale scripts from a reloaded extension included).
document.querySelectorAll('[data-pageport]').forEach(n => n.remove());
if (stale) {
  // Old bundle after extension reload: its runtime is dead, just clean up.
} else {
  const api = openPanel({Picker});
}
