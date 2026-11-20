export type Cue = 'click' | 'entry' | 'correct' | 'wrong' | 'hint' | 'paper' | 'stamp';
let context: AudioContext | undefined;
let muted = false;
try { muted = localStorage.getItem('pinthatshi.sound.muted') === 'true'; } catch { /* Browser-local preferences are optional. */ }
export const soundMuted = () => muted;
export function setSoundMuted(value: boolean) { muted = value; try { localStorage.setItem('pinthatshi.sound.muted', String(value)); } catch { /* Keep the current session preference. */ } }
export function playSound(cue: Cue, count = 0) {
  if (muted || document.hidden) return;
  try {
    context ??= new AudioContext();
    const audio = context;
    if (audio.state === 'suspended') void audio.resume();
    const now = audio.currentTime;
    const tone = (frequency: number, delay: number, length: number, level = .05, type: OscillatorType = 'triangle') => {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = type; osc.frequency.setValueAtTime(frequency, now + delay);
      gain.gain.setValueAtTime(0, now + delay); gain.gain.linearRampToValueAtTime(level, now + delay + .004); gain.gain.exponentialRampToValueAtTime(.0001, now + delay + length);
      osc.connect(gain); gain.connect(audio.destination); osc.start(now + delay); osc.stop(now + delay + length + .01);
    };
    const noise = (length: number, level: number, cutoff: number) => {
      const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * length), audio.sampleRate), samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 2;
      const source = audio.createBufferSource(), gain = audio.createGain(), filter = audio.createBiquadFilter();
      source.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = cutoff; gain.gain.value = level;
      source.connect(filter); filter.connect(gain); gain.connect(audio.destination); source.start();
    };
    if (cue === 'click') tone(1150, 0, .045, .025);
    if (cue === 'entry') { noise(.16, .06, 1800); tone(1568, .035, .17, .025); }
    if (cue === 'correct') {
      const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093, 2349.32, 2637.02];
      tone(1150, 0, .025, .018); tone(notes[count % notes.length], .015, .32); tone(notes[(count + 2) % notes.length], .085, .42, .035);
      if ((count + 1) % 3 === 0) tone(3136, .19, .35, .012, 'sine');
    }
    if (cue === 'wrong') { tone(150, 0, .12, .035, 'square'); tone(120, .15, .12, .025, 'triangle'); }
    if (cue === 'hint') [1046.5, 1318.5, 1568].forEach((n, i) => tone(n, i * .065, .2, .025));
    if (cue === 'paper') noise(.34, .1, 2300);
    if (cue === 'stamp') { noise(.13, .13, 600); tone(85, 0, .15, .08, 'sine'); }
  } catch { /* Sound must never prevent a round from playing. */ }
}
document.addEventListener('visibilitychange', () => { if (document.hidden && context?.state === 'running') void context.suspend(); });
