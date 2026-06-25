import { useState, useEffect, useRef } from 'react';
import { speak, speakSegments, stopSpeak, isSpeechSupported } from '../utils/speech.js';
import './CharCard.css';

export default function CharCard({ charData, onComplete, isLast = false }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechDone, setSpeechDone] = useState(false);
  const hasSpoken = useRef(false);
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    // 自动朗读
    if (!hasSpoken.current && speechSupported) {
      hasSpoken.current = true;
      speakFullText();
    } else if (!speechSupported && !hasSpoken.current) {
      hasSpoken.current = true;
      // 没有语音时，2 秒后自动完成
      const timer = setTimeout(() => {
        setSpeechDone(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [charData.id]);

  const speakFullText = async () => {
    setIsSpeaking(true);
    setSpeechDone(false);

    // 分段朗读，中间自然停顿，更像真人说话
    const segments = [
      charData.char,                                              // "大"
      `${charData.char}的意思是，${charData.meaning}`,             // "大的意思是，在体积方面超过一般"
      `比如：${charData.sentence}`,                                // "比如：大象很庞大"
    ];

    await speakSegments(segments);
    setIsSpeaking(false);
    setSpeechDone(true);

    // 非最后一个字：自动通知完成
    if (!isLast) {
      onComplete?.();
    }
  };

  const handleReplay = () => {
    stopSpeak();
    speakFullText();
  };

  if (!charData) return null;

  return (
    <div className="char-card">
      <div className="char-card__big">{charData.char}</div>
      <div className="char-card__pinyin">{charData.pinyin}</div>
      <div className="char-card__meaning-label">释义</div>
      <div className="char-card__meaning">{charData.meaning}</div>
      <div className="char-card__sentence-label">例句</div>
      <div className="char-card__sentence">{charData.sentence}</div>

      {isSpeaking && <div className="char-card__speaking">🔊 朗读中...</div>}

      {!isSpeaking && speechDone && !isLast && (
        <div className="char-card__done">✅ 朗读完成，即将继续...</div>
      )}

      {!isSpeaking && speechDone && isLast && (
        <button className="char-card__next-btn" onClick={() => onComplete?.()}>
          🎯 开始测验 →
        </button>
      )}

      {!isSpeaking && !speechDone && (
        <button className="char-card__replay" onClick={handleReplay}>🔊 再读一次</button>
      )}
    </div>
  );
}
