/* =====================================================================
   SOUND  (builds on save.js and screen.js)
   A tiny synth, no audio files: every sound is a few oscillator notes or a puff of noise. M or the Sound button
   turns it off, kept in settings.muted. Slow motion does not change the sounds, only when they play.

   Contents: settings · the synth · the sounds · on and off
   ===================================================================== */

/* ---------- Settings ---------- */

const SOUND_VOLUME = 0.5; // the master volume, 0 to 1
const CHAIN_SEMITONES = 2; // each step of a chain plays its turnover this many semitones higher
const CHAIN_TOP_STEP = 10; // steps past this one keep the same pitch
const TAKE_BASE_HZ = 523; // C5: a stone turning blue
const LOSE_BASE_HZ = 330; // E4: a stone turning red
const POINTS_STEP_MS = 70; // the notes of the +N arpeggio follow each other this fast
const POINTS_SCALE = [0, 4, 7, 12, 16, 19, 24]; // its notes, in semitones above TAKE_BASE_HZ: one per point

/* ---------- The synth ---------- */

let audio = null; // the AudioContext, made at the first sound (browsers only allow it after a click or key)
let masterGain = null;
let noiseBuffer = null;

function audioReady() {
  if (settings.muted) return false;
  try {
    if (!audio) {
      audio = new AudioContext();
      masterGain = audio.createGain();
      masterGain.gain.value = SOUND_VOLUME;
      masterGain.connect(audio.destination);
      noiseBuffer = audio.createBuffer(1, audio.sampleRate / 2, audio.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    if (audio.state === 'suspended') audio.resume();
    return true;
  } catch (error) {
    return false; // no Web Audio: the game is silent
  }
}

// One note: frequency `hz` sliding to `toHz`, fading out over `seconds`, starting `delay` seconds from now.
function tone(hz, seconds, { type = 'sine', volume = 0.1, toHz = hz, delay = 0 } = {}) {
  if (!audioReady()) return;
  const start = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(hz, start);
  oscillator.frequency.exponentialRampToValueAtTime(toHz, start + seconds);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  oscillator.connect(gain).connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + seconds);
}

// A puff of noise through a band-pass filter at `hz`: a crack, a crumble, a thud.
function noise(hz, seconds, { volume = 0.1, delay = 0, sharpness = 1 } = {}) {
  if (!audioReady()) return;
  const start = audio.currentTime + delay;
  const source = audio.createBufferSource();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();
  source.buffer = noiseBuffer;
  filter.type = 'bandpass';
  filter.frequency.value = hz;
  filter.Q.value = sharpness;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
  source.connect(filter).connect(gain).connect(masterGain);
  source.start(start);
  source.stop(start + seconds);
}

// Notes one after another, `gap` seconds apart; the last one rings for `lastSeconds`.
function melody(notes, gap, seconds, options, lastSeconds = seconds) {
  notes.forEach((hz, i) => {
    const ringFor = i === notes.length - 1 ? lastSeconds : seconds;
    tone(hz, ringFor, { ...options, delay: (options.delay || 0) + i * gap });
  });
}

function semitonesUp(hz, semitones) {
  return hz * 2 ** (semitones / 12);
}

/* ---------- The sounds ---------- */

const sounds = {
  select: () => tone(880, 0.05, { type: 'triangle', volume: 0.05 }),
  // A stone lands: a wooden knock, a little higher for yours.
  place: (mover) => {
    noise(mover === YOU ? 900 : 650, 0.09, { volume: 0.35, sharpness: 2 });
    tone(mover === YOU ? 220 : 165, 0.12, { type: 'triangle', volume: 0.12, toHz: 110 });
  },
  // Spikes snap off: a short bright crack, a little louder for more spikes.
  crack: (count) => noise(3200, 0.06, { volume: Math.min(0.12 + 0.04 * count, 0.3), sharpness: 4 }),
  // A stone turns over: rising with every step of the chain, bright when it turns blue, low when it turns red.
  turnOver: (owner, step) => {
    const semitones = CHAIN_SEMITONES * Math.min(step, CHAIN_TOP_STEP);
    if (owner === YOU) {
      const hz = semitonesUp(TAKE_BASE_HZ, semitones);
      tone(hz, 0.22, { type: 'triangle', volume: 0.11 });
      tone(hz * 2, 0.12, { type: 'sine', volume: 0.04 });
    } else {
      tone(semitonesUp(LOSE_BASE_HZ, semitones), 0.24, { type: 'sawtooth', volume: 0.05, toHz: LOSE_BASE_HZ * 0.8 });
    }
  },
  shield: () => [1568, 2093, 2637].forEach((hz, i) => tone(hz, 0.5, { volume: 0.05 / (i + 1) })),
  bite: () => {
    tone(260, 0.18, { type: 'square', volume: 0.04, toHz: 520 });
    tone(390, 0.14, { type: 'sine', volume: 0.05, toHz: 780, delay: 0.06 });
  },
  crumble: () => {
    noise(300, 0.45, { volume: 0.4, sharpness: 0.7 });
    tone(90, 0.4, { type: 'sawtooth', volume: 0.05, toHz: 45 });
  },
  crown: () => melody([784, 988, 1175, 1568], 0.07, 0.4, { type: 'triangle', volume: 0.07 }),
  buzz: () => tone(180, 0.6, { type: 'sawtooth', volume: 0.025, toHz: 240 }),
  // The +N after a move: one note per point, a falling pair for a loss.
  points: (net) => {
    if (net < 0) {
      melody([294, 220], 0.12, 0.25, { type: 'triangle', volume: 0.08 }, 0.35);
      return;
    }
    const notes = POINTS_SCALE.slice(0, net).map((semitones) => semitonesUp(TAKE_BASE_HZ, semitones));
    melody(notes, POINTS_STEP_MS / 1000, 0.3, { type: 'triangle', volume: 0.08 });
  },
  victory: () => melody([523, 659, 784, 1047, 784, 1047, 1319], 0.1, 0.3, { type: 'triangle', volume: 0.09 }, 0.8),
  defeat: () => melody([392, 370, 349, 262], 0.22, 0.35, { type: 'triangle', volume: 0.08 }, 0.9),
  reward: () => melody([659, 988, 1319], 0.06, 0.25, { type: 'sine', volume: 0.07 }),
};

/* ---------- On and off ---------- */

function setMuted(muted) {
  settings.muted = muted;
  find('#sound-button').setAttribute('aria-pressed', !muted);
  find('#sound-button').textContent = muted ? 'Muted' : 'Sound';
  store();
}
