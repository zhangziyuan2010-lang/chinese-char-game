function getRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return !!getRecognitionConstructor();
}

export function normalizeTranscript(text) {
  return String(text || '')
    .replace(/[，。！？、,.!?\s]/g, '')
    .trim();
}

export function listenOnce({ lang = 'zh-CN', timeoutMs = 6000 } = {}) {
  return new Promise((resolve) => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition) {
      resolve({ success: false, error: '当前浏览器不支持语音识别' });
      return;
    }

    const recognition = new Recognition();
    let settled = false;
    let transcript = '';

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        recognition.stop();
      } catch {
        // Some browsers throw if recognition has already stopped.
      }
      resolve(payload);
    };

    const timer = setTimeout(() => {
      finish({ success: false, error: '没有听清，请再读一次' });
    }, timeoutMs);

    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      const alternatives = Array.from(event.results?.[0] || []);
      transcript = alternatives
        .map(item => item.transcript)
        .filter(Boolean)
        .join(' ');
      finish({ success: true, transcript });
    };

    recognition.onerror = (event) => {
      const error = event.error === 'not-allowed'
        ? '需要允许麦克风权限后才能跟读'
        : '没有听清，请再读一次';
      finish({ success: false, error });
    };

    recognition.onend = () => {
      if (!settled && transcript) {
        finish({ success: true, transcript });
      } else if (!settled) {
        finish({ success: false, error: '没有听清，请再读一次' });
      }
    };

    try {
      recognition.start();
    } catch {
      finish({ success: false, error: '麦克风启动失败，请稍后再试' });
    }
  });
}
