// Renders Cuelume cues offline to 16-bit mono WAVs next to this file.
//   number    = mech  / ready    (numbers and groups appearing)
//   operation = press / ready    (+ - x / = signs appearing)
//   result    = press / success  (the answer appearing)
import { OfflineAudioContext } from "node-web-audio-api";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES } from "./node_modules/cuelume/dist/sounds/themes.js";
import { resolveEmphasis, shapeFor } from "./node_modules/cuelume/dist/sounds/context.js";
import { createOutput } from "./node_modules/cuelume/dist/audio/output.js";
import { renderRecipe } from "./node_modules/cuelume/dist/audio/render.js";

const OUT = dirname(fileURLToPath(import.meta.url));
const RATE = 44100;
const SECONDS = 1.6; // room tail included
// [theme, cue, max seconds] - short cues so they never crowd the captions.
const CUES = {
  number: ["mech", "ready", 0.3],
  operation: ["press", "ready", 0.4],
  result: ["press", "success", 0.9],
};

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), 44 + i * 2));
  return buf;
}

for (const [role, [theme, sound, maxSeconds]] of Object.entries(CUES)) {
  const ctx = new OfflineAudioContext(2, Math.ceil(RATE * SECONDS), RATE);
  const emphasis = resolveEmphasis(undefined);
  const played = {
    recipe: THEMES[theme][sound], volume: 1, emphasis,
    shape: shapeFor(sound, {}, emphasis, Infinity), step: 0,
  };
  let bus = null;
  renderRecipe(ctx, () => (bus ??= createOutput(ctx)), new Map(), sound, played, "both");
  const out = await ctx.startRendering();
  const [l, r] = [out.getChannelData(0), out.getChannelData(1)];
  const mono = Float32Array.from(l, (v, i) => (v + r[i]) / 2);
  let peak = mono.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  let end = mono.length;
  while (end > 0 && Math.abs(mono[end - 1]) < peak * 0.03) end--;
  const gain = peak > 0 ? 0.8 / peak : 1;
  const FADE = Math.floor(RATE * 0.04);
  const len = Math.min(mono.length, end + FADE, Math.floor(RATE * maxSeconds));
  const trimmed = mono.slice(0, len).map((v, i) => v * gain * Math.min(1, (len - i) / FADE));
  writeFileSync(join(OUT, `${role}.wav`), wav(trimmed));
  console.log(role, `${theme}/${sound}`, `${(trimmed.length / RATE).toFixed(2)}s`, `peak ${peak.toFixed(3)}`);
}
