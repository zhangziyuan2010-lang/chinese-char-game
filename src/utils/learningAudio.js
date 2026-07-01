let currentAudio = null;

export function stopLearningAudio() {
  if (!currentAudio) return;
  const { audio, done } = currentAudio;
  audio.pause();
  audio.currentTime = 0;
  done({ ok: false, error: 'stopped' });
  currentAudio = null;
}

export function playLearningAudio(charId) {
  if (typeof Audio === 'undefined' || !charId) {
    return Promise.resolve({ ok: false, error: 'audio-not-supported' });
  }

  stopLearningAudio();

  return new Promise((resolve) => {
    const audio = new Audio(`/audio/learn/${charId}.m4a`);
    audio.preload = 'auto';

    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      if (currentAudio?.audio === audio) currentAudio = null;
      resolve(result);
    };

    currentAudio = { audio, done };

    audio.onended = () => done({ ok: true });
    audio.onerror = () => done({ ok: false, error: 'audio-load-failed' });

    const playResult = audio.play();
    if (playResult?.catch) {
      playResult.catch(() => done({ ok: false, error: 'audio-play-blocked' }));
    }
  });
}
