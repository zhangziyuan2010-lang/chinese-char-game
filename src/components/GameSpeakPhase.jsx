import { useMemo, useState, useEffect } from 'react';
import { speak, stopSpeak, unlockSpeech } from '../utils/speech.js';
import {
  isSpeechRecognitionSupported,
  listenOnce,
  normalizeTranscript,
} from '../utils/speechRecognition.js';
import { getChildMeaning } from '../utils/charText.js';
import './GameSpeakPhase.css';

export default function GameSpeakPhase({ roundChars, onComplete }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(10);
  const [wrongChars, setWrongChars] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('先听一遍，再按麦克风跟读');
  const [lastTranscript, setLastTranscript] = useState('');

  const current = roundChars[index];
  const childMeaning = getChildMeaning(current);
  const supported = isSpeechRecognitionSupported();
  const progressText = `${Math.min(index + 1, roundChars.length)} / ${roundChars.length}`;

  const wrongSet = useMemo(() => new Set(wrongChars), [wrongChars]);

  useEffect(() => {
    return () => stopSpeak();
  }, []);

  const playDemo = async () => {
    if (!current) return;
    setStatus('speaking');
    setMessage('正在示范朗读');
    await unlockSpeech();
    await speak(`${current.char}，${current.pinyin}`);
    setStatus('idle');
    setMessage(supported ? '按麦克风，大声读出这个字' : '当前浏览器不支持麦克风识别');
  };

  const finishCurrent = (nextWrongChars = wrongChars, nextScore = score) => {
    if (index >= roundChars.length - 1) {
      onComplete({
        score: nextScore,
        wrongChars: nextWrongChars,
        correctChars: roundChars.filter(c => !nextWrongChars.includes(c.id)).map(c => c.id),
      });
      return;
    }

    setIndex(i => i + 1);
    setLastTranscript('');
    setStatus('idle');
    setMessage('先听一遍，再按麦克风跟读');
  };

  const handleListen = async () => {
    if (!current || status === 'listening') return;
    if (!supported) {
      setMessage('这个浏览器还不能识别语音，建议用 Chrome 再试');
      return;
    }

    stopSpeak();
    setStatus('listening');
    setMessage('正在听，请读出屏幕上的字');
    setLastTranscript('');

    const result = await listenOnce();
    if (!result.success) {
      setStatus('idle');
      setMessage(result.error);
      return;
    }

    const transcript = normalizeTranscript(result.transcript);
    const isCorrect = transcript.includes(current.char);
    setLastTranscript(transcript || result.transcript);

    if (isCorrect) {
      setStatus('correct');
      setMessage('读对了');
      setTimeout(() => finishCurrent(), 700);
      return;
    }

    const nextWrongChars = wrongSet.has(current.id)
      ? wrongChars
      : [...wrongChars, current.id];
    const nextScore = Math.max(0, score - 1);

    setWrongChars(nextWrongChars);
    setScore(nextScore);
    setStatus('wrong');
    setMessage(`这次听成了“${transcript || result.transcript}”，正确读音是 ${current.pinyin}`);
  };

  if (!current) return null;

  return (
    <div className="speak-phase">
      <div className="speak-header">
        <div className="speak-score">⭐ {score} 分</div>
        <div className="speak-progress">{progressText}</div>
      </div>

      <div className="speak-card">
        <div className="speak-char">{current.char}</div>
        <div className="speak-pinyin">{current.pinyin}</div>
        <div className="speak-meaning">{childMeaning}</div>
      </div>

      <div className={`speak-status speak-status--${status}`}>
        {message}
        {lastTranscript && (
          <div className="speak-transcript">我听到：{lastTranscript}</div>
        )}
      </div>

      <div className="speak-actions">
        <button className="speak-action-btn speak-action-btn--demo" onClick={playDemo}>
          🔈 听示范
        </button>
        <button
          className="speak-mic-btn"
          onClick={handleListen}
          disabled={status === 'listening' || status === 'speaking'}
        >
          {status === 'listening' ? '🎙️' : '🎤'}
        </button>
        <button className="speak-action-btn" onClick={() => finishCurrent()}>
          跳过
        </button>
      </div>
    </div>
  );
}
