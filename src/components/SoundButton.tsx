import { useState } from 'react';
import { playSound, setSoundMuted, soundMuted } from '../game/sound';
export function SoundButton() {
  const [muted, setMuted] = useState(soundMuted);
  return <button className="sound-control" aria-label={muted ? 'Turn sound on' : 'Mute sound'} aria-pressed={!muted} onClick={() => { setSoundMuted(!muted); setMuted(!muted); if (muted) playSound('click'); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z"/>{muted ? <path d="m17 9 5 6m0-6-5 6"/> : <><path d="M16 8q4 4 0 8"/><path d="M19 5q7 7 0 14"/></>}</svg></button>;
}
