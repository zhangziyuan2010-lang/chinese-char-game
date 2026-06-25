// Web Speech API 封装 — 中文语音朗读（v3 自然语音优化版）

let synth = null;

function getSynth() {
  if (!synth && typeof window !== 'undefined') {
    synth = window.speechSynthesis;
  }
  return synth;
}

/**
 * 选择最自然的中文语音
 * 跨平台策略：macOS → Tingting / Siri；Windows → Microsoft；Chrome → Google
 */
function pickBestVoice(s) {
  const voices = s.getVoices();
  if (voices.length === 0) return null;

  // 按自然度排序：macOS Siri 语音 > macOS 增强语音 > Google 语音 > Microsoft 语音
  const ranked = [
    // macOS Siri 系列（最自然）
    (v) => v.name.includes('Tingting') && v.name.includes('Siri'),
    (v) => v.name.includes('Ting-Ting'),
    (v) => v.name.includes('Tingting'),
    // macOS 其他优质中文
    (v) => v.name.includes('Sinji'),
    (v) => v.name.includes('Sin-Ji'),
    (v) => v.name.includes('Mei-Jia'),
    // Google 普通话（Chrome 自带）
    (v) => v.name.includes('Google') && v.lang.includes('zh'),
    // Microsoft 中文语音（Windows）
    (v) => v.name.includes('Microsoft') && v.lang.includes('zh'),
    (v) => v.name.includes('Kangkang'),
    (v) => v.name.includes('Yaoyao'),
    (v) => v.name.includes('Huihui'),
    // 回退：任何中文语音
    (v) => v.lang.startsWith('zh-CN'),
    (v) => v.lang.startsWith('zh-TW'),
    (v) => v.lang.startsWith('zh-HK'),
    (v) => v.lang.startsWith('zh'),
  ];

  for (const matcher of ranked) {
    const match = voices.find(matcher);
    if (match) return match;
  }

  return null;
}

/**
 * 朗读一段中文文本（分段朗读，更自然的节奏）
 * @param {string} text - 要朗读的中文
 * @returns {Promise<void>} 朗读完成时 resolve
 */
export function speak(text) {
  return new Promise((resolve) => {
    const s = getSynth();
    if (!s) {
      resolve();
      return;
    }

    // 估算总时长：中文约 2.5 字/秒（稍慢），加 4 秒缓冲
    const estimatedMs = Math.max(4000, (text.length / 2.5) * 1000 + 4000);
    let resolved = false;

    const done = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve();
      }
    };

    // 超时兜底
    const timer = setTimeout(() => {
      if (!resolved) {
        console.warn('Speech timeout, forcing continue');
        s.cancel();
        done();
      }
    }, estimatedMs);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.75;   // 更慢，更清晰自然
    utterance.pitch = 1.05;  // 略微提高音调，更像亲切的童声
    utterance.volume = 1;

    const bestVoice = pickBestVoice(s);
    if (bestVoice) {
      utterance.voice = bestVoice;
    }

    utterance.onend = () => done();
    utterance.onerror = () => done();

    s.speak(utterance);
  });
}

/**
 * 分段朗读：在句子之间加入自然停顿
 * @param {string[]} segments - 多个文本段落，每段之间自动停顿
 * @returns {Promise<void>}
 */
export async function speakSegments(segments) {
  for (const seg of segments) {
    await speak(seg);
    // 段落间停顿 300ms，模拟自然换气
    await new Promise(r => setTimeout(r, 300));
  }
}

/**
 * 停止朗读
 */
export function stopSpeak() {
  const s = getSynth();
  if (s) s.cancel();
}

/**
 * 检查浏览器是否支持语音
 * @returns {boolean}
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}
