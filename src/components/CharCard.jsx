import { useState, useEffect, useRef } from 'react';
import { speakSegments, stopSpeak, isSpeechSupported } from '../utils/speech.js';
import { getCharSpeechText, getExampleSentences, getExampleSpeechSentences } from '../utils/charText.js';
import './CharCard.css';

export default function CharCard({ charData, onSpeechDone }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechDone, setSpeechDone] = useState(false);
  const hasSpoken = useRef(false);
  const isMounted = useRef(true);
  const onSpeechDoneRef = useRef(onSpeechDone);
  const speechSupported = isSpeechSupported();
  const exampleSentences = getExampleSentences(charData);
  const exampleSpeechSentences = getExampleSpeechSentences(charData);
  const charSpeechText = getCharSpeechText(charData);

  useEffect(() => {
    onSpeechDoneRef.current = onSpeechDone;
  }, [onSpeechDone]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // 自动朗读
    if (!hasSpoken.current && speechSupported) {
      hasSpoken.current = true;
      speakFullText();
    } else if (!speechSupported && !hasSpoken.current) {
      hasSpoken.current = true;
      // 没有语音时，2 秒后自动完成
      const timer = setTimeout(() => {
        if (!isMounted.current) return;
        setSpeechDone(true);
        onSpeechDoneRef.current?.();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [charData.id, speechSupported]);

  const speakFullText = async () => {
    setIsSpeaking(true);
    setSpeechDone(false);

    await speakSegments([charSpeechText, ...exampleSpeechSentences], 1000);
    if (!isMounted.current) return;
    setIsSpeaking(false);
    setSpeechDone(true);
    onSpeechDoneRef.current?.();
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
      <div className="char-card__sentence-label">例句</div>
      <div className="char-card__sentences">
        {exampleSentences.map((sentence, i) => (
          <div key={sentence} className="char-card__sentence">
            <span className="char-card__sentence-index">{i + 1}</span>
            <span>{sentence}</span>
          </div>
        ))}
      </div>

      {isSpeaking && <div className="char-card__speaking">🔊 朗读中...</div>}

      {!isSpeaking && speechDone && (
        <div className="char-card__done">✅ 朗读完成</div>
      )}

      {!isSpeaking && !speechDone && (
        <button className="char-card__replay" onClick={handleReplay}>🔊 再读一次</button>
      )}
    </div>
  );
}
