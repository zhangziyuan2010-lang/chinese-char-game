import { useState, useCallback, useEffect, useRef } from 'react';
import { speak, stopSpeak } from '../utils/speech.js';
import './GameQuizPhase.css';

export default function GameQuizPhase({ roundChars, quizPool, quizIndex, score, onCorrect, onWrong, onComplete }) {
  const [feedback, setFeedback] = useState(null);
  const [disabledChars, setDisabledChars] = useState(new Set());
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const currentQuiz = quizPool[quizIndex];
  if (!currentQuiz && !allDone) return null;

  // 每道题自动朗读一遍题目
  useEffect(() => {
    if (currentQuiz) {
      speakQuestion();
    }
  }, [currentQuiz?.id]);

  const speakQuestion = async () => {
    if (!currentQuiz) return;
    stopSpeak();
    setIsSpeaking(true);
    await speak(currentQuiz.char);           // 先念字
    await new Promise(r => setTimeout(r, 200)); // 短暂停顿
    await speak(currentQuiz.meaning);         // 再念释义
    setIsSpeaking(false);
  };

  const handleReplay = () => {
    stopSpeak();
    speakQuestion();
  };

  const handleSelect = useCallback((charId) => {
    if (disabledChars.has(charId) || allDone) return;

    if (charId === currentQuiz.id) {
      // 正确
      const isLastQuestion = quizPool.length === 1;

      setFeedback({ type: 'correct', charId });
      const newDisabled = new Set(disabledChars);
      newDisabled.add(charId);
      setDisabledChars(newDisabled);

      if (isLastQuestion) {
        // 最后一道题答对了，等 feedback 动画播完就结束
        setAllDone(true);
        setTimeout(() => {
          onCorrect(); // 还是要更新 state
          onComplete(); // 直接通知父组件
        }, 800);
      } else {
        setTimeout(() => {
          setFeedback(null);
          onCorrect();
        }, 800);
      }
    } else {
      // 错误
      setFeedback({ type: 'wrong', charId });
      setTimeout(() => {
        setFeedback(null);
        onWrong(currentQuiz.id);
      }, 1000);
    }
  }, [currentQuiz, disabledChars, quizPool.length, allDone, onCorrect, onWrong, onComplete]);

  const getCharButtonClass = (char) => {
    let cls = 'quiz-char-btn';
    if (feedback && feedback.charId === char.id) {
      cls += feedback.type === 'correct' ? ' quiz-char-btn--correct' : ' quiz-char-btn--wrong';
    }
    if (disabledChars.has(char.id)) {
      cls += ' quiz-char-btn--disabled';
    }
    return cls;
  };

  return (
    <div className="quiz-phase">
      {/* 得分 + 进度 */}
      <div className="quiz-header">
        <div className="quiz-score">⭐ {score} 分</div>
        <div className="quiz-progress">
          {allDone ? '🎉 全部完成！' : `剩余 ${quizPool.length} 题`}
        </div>
      </div>

      {/* 题目：展示释义 + 喇叭按钮 */}
      {currentQuiz && (
        <div className="quiz-question">
          <div className="quiz-question-label">请选出对应这个意思的字：</div>
          <div className="quiz-question-row">
            <div className="quiz-question-meaning">{currentQuiz.meaning}</div>
            <button
              className={`quiz-speaker-btn ${isSpeaking ? 'quiz-speaker-btn--active' : ''}`}
              onClick={handleReplay}
              title="重听题目"
            >
              {isSpeaking ? '🔊' : '🔈'}
            </button>
          </div>
          {isSpeaking && <div className="quiz-speaker-hint">朗读中...</div>}
        </div>
      )}

      {/* allDone 提示 */}
      {allDone && (
        <div className="quiz-question">
          <div className="quiz-question-label" style={{fontSize: 22, color: '#27ae60'}}>
            🎉 本局测验完成！正在计算成绩...
          </div>
        </div>
      )}

      {/* 反馈 */}
      {feedback && (
        <div className={`quiz-feedback ${feedback.type === 'correct' ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`}>
          {feedback.type === 'correct' ? '✅ 正确！太棒了！' : '❌ 不对哦，再想想！'}
        </div>
      )}

      {/* 字板：所有 10 个字 */}
      <div className="quiz-char-board">
        {roundChars.map(c => (
          <button
            key={c.id}
            className={getCharButtonClass(c)}
            onClick={() => handleSelect(c.id)}
            disabled={disabledChars.has(c.id)}
          >
            {c.char}
          </button>
        ))}
      </div>
    </div>
  );
}
