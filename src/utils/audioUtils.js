// D:\Portfolio\rachit-super-admin-portfolio\src\utils\audioUtils.js
// Web Audio API Sound Generator for Chat Notifications & Incoming Call Ringtone

let ringtoneStopFn = null;

/**
 * Play a short 2-tone chime for incoming chat messages.
 */
export const playMessageSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Tone 1 (High chime)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Tone 2 (Higher chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn('[Audio] Message sound playback error:', err);
  }
};

/**
 * Start repeating ringtone for incoming WebRTC video call.
 * Returns a function to stop the ringtone.
 */
export const startRingtoneSound = () => {
  if (typeof window === 'undefined') return () => {};
  stopRingtoneSound(); // stop any active ringtone first

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return () => {};
    const ctx = new AudioCtx();
    let isRinging = true;

    const playRing = () => {
      if (!isRinging || ctx.state === 'closed') return;
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    };

    playRing();
    const interval = setInterval(playRing, 1200);

    ringtoneStopFn = () => {
      isRinging = false;
      clearInterval(interval);
      try { ctx.close(); } catch {}
      ringtoneStopFn = null;
    };

    return ringtoneStopFn;
  } catch (err) {
    console.warn('[Audio] Ringtone playback error:', err);
    return () => {};
  }
};

/**
 * Stop active ringtone.
 */
export const stopRingtoneSound = () => {
  if (ringtoneStopFn) {
    ringtoneStopFn();
  }
};
