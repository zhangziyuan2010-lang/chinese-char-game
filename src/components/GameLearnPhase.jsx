import { useState, useCallback, useEffect, useRef } from 'react';
import CharCard from './CharCard.jsx';
import { speakSegments, stopSpeak, isSpeechSupported } from '../utils/speech.js';
import { playLearningAudio, stopLearningAudio } from '../utils/learningAudio.js';
import { getCharSpeechText, getExampleSpeechSentences } from '../utils/charText.js';
import './GameLearnPhase.css';

export default function GameLearnPhase({ roundChars, onComplete }) {
  const [index, setIndex] = useState(0);
  const [showChar, setShowChar] = useState(true);
  const [speechDone, setSpeechDone] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const playIdRef = useRef(0);
  const hasChars = roundChars.length > 0;
  const isLast = index === roundChars.length - 1;

  const stopAllAudio = useCallback(() => {
    stopLearningAudio();
    stopSpeak();
  }, []);

  const playChar = useCallback(async (charData) => {
    const playId = playIdRef.current + 1;
    playIdRef.current = playId;
    stopAllAudio();
    setIsSpeaking(true);
    setSpeechDone(false);
    setSpeechError('');

    const segments = [
      getCharSpeechText(charData),
      ...getExampleSpeechSentences(charData),
    ];

    let result = await playLearningAudio(charData.id);
    if (!result?.ok && isSpeechSupported()) {
      result = await speakSegments(segments, 1000);
    }

    if (playIdRef.current !== playId) return;
    setIsSpeaking(false);
    setSpeechDone(true);
    if (!result?.ok) {
      setSpeechError('没有听到声音时，请确认手机媒体音量已打开，再点播放朗读');
    }
  }, [stopAllAudio]);

  const moveToIndex = useCallback((nextIndex) => {
    playIdRef.current += 1;
    stopAllAudio();
    setIsSpeaking(false);
    setSpeechDone(false);
    setSpeechError('');
    setIndex(nextIndex);
    setShowChar(false);
    setTimeout(() => setShowChar(true), 100);
  }, []);

  const handlePrev = useCallback(() => {
    if (index === 0) return;
    const nextIndex = index - 1;
    moveToIndex(nextIndex);
    playChar(roundChars[nextIndex]);
  }, [index, moveToIndex, playChar, roundChars]);

  const handleNext = useCallback(() => {
    if (!speechDone) return;

    if (isLast) {
      stopAllAudio();
      onComplete();
      return;
    }

    const nextIndex = index + 1;
    moveToIndex(nextIndex);
    playChar(roundChars[nextIndex]);
  }, [index, isLast, moveToIndex, onComplete, playChar, roundChars, speechDone, stopAllAudio]);

  // 组件卸载时取消朗读
  useEffect(() => {
    return () => stopAllAudio();
  }, [stopAllAudio]);

  if (!hasChars) {
    return (
      <div className="learn-phase">
        <div className="learn-card-area">
          <div className="learn-card-hint">现在没有可以练习的字，先回首页选择新学字吧。</div>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-phase">
      {/* 进度条 */}
      <div className="learn-progress">
        <div className="learn-progress-dots">
          {roundChars.map((_, i) => (
            <div
              key={i}
              className={`learn-dot ${i < index ? 'learn-dot--done' : i === index ? 'learn-dot--active' : ''}`}
            ></div>
          ))}
        </div>
        <div className="learn-progress-text">{index + 1} / {roundChars.length}</div>
      </div>

      {/* 字卡 */}
      <div className="learn-card-area">
        {showChar && (
          <CharCard
            key={roundChars[index].id}
            charData={roundChars[index]}
            isSpeaking={isSpeaking}
            speechDone={speechDone}
            onReplay={() => playChar(roundChars[index])}
          />
        )}
      </div>

      <div className="learn-card-hint">
        {speechError || (speechDone ? '朗读完成后，可以继续或返回复听' : '请点击播放朗读')}
      </div>

      <div className="learn-nav">
        <button
          className="learn-nav-btn"
          onClick={handlePrev}
          disabled={index === 0}
        >
          ← 上一个
        </button>
        <button
          className="learn-nav-btn learn-nav-btn--primary"
          onClick={handleNext}
          disabled={!speechDone}
        >
          {isLast ? '开始测验 →' : '下一个 →'}
        </button>
      </div>
    </div>
  );
}
