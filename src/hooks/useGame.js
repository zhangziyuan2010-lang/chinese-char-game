import { useReducer, useCallback } from 'react';
import charDB from '../data/charDB.js';

// 工具函数：随机选取 n 个不重复元素
function randomPick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function uniqueByChar(arr) {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.char)) return false;
    seen.add(item.char);
    return true;
  });
}

function randomPickUniqueChars(arr, n) {
  return randomPick(uniqueByChar(arr), n);
}

// 工具函数：shuffle 数组
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const initialState = {
  mode: null,           // 'new' | 'review' | 'mixed' | 'speak'
  roundChars: [],       // 本局 10 个字（char objects）
  phase: null,          // 'learn' | 'quiz' | 'result'
  learnIndex: 0,        // 当前朗读到第几个字（0-9）
  quizPool: [],         // 测验题队列（char objects，打乱顺序）
  quizIndex: 0,         // 当前测验题索引
  wrongChars: [],       // 本局答错的 char ids
  score: 10,            // 当前分数
  gameOver: false,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_LEARN': {
      return {
        ...initialState,
        mode: action.mode,
        roundChars: action.roundChars,
        quizPool: shuffle([...action.roundChars]),
        phase: 'learn',
        learnIndex: 0,
        quizIndex: 0,
        score: 10,
      };
    }

    case 'NEXT_CHAR': {
      const nextIdx = state.learnIndex + 1;
      if (nextIdx >= state.roundChars.length) {
        // 学习阶段完成，进入测验阶段
        return {
          ...state,
          learnIndex: nextIdx,
          phase: 'quiz',
          quizPool: shuffle([...state.roundChars]),
          quizIndex: 0,
        };
      }
      return { ...state, learnIndex: nextIdx };
    }

    case 'ANSWER_CORRECT': {
      const newPool = [...state.quizPool];
      newPool.splice(state.quizIndex, 1);
      const nextIdx = newPool.length > 0 ? state.quizIndex % newPool.length : 0;

      if (newPool.length === 0) {
        // 全部答对，游戏结束
        return {
          ...state,
          quizPool: newPool,
          phase: 'result',
          gameOver: true,
        };
      }

      return {
        ...state,
        quizPool: newPool,
        quizIndex: nextIdx < newPool.length ? nextIdx : 0,
      };
    }

    case 'ANSWER_WRONG': {
      const wrongId = action.charId;
      const alreadyWrong = state.wrongChars.includes(wrongId);
      const newWrong = alreadyWrong ? state.wrongChars : [...state.wrongChars, wrongId];
      const newScore = Math.max(0, state.score - 1);

      // 将答错的题移到队列末尾重来
      const currentChar = state.quizPool[state.quizIndex];
      const newPool = [...state.quizPool];
      newPool.splice(state.quizIndex, 1);
      newPool.push(currentChar); // 移到末尾重来

      return {
        ...state,
        quizPool: newPool,
        quizIndex: 0, // 从新队列头开始
        wrongChars: newWrong,
        score: newScore,
      };
    }

    case 'END_GAME': {
      return {
        ...state,
        phase: 'result',
        gameOver: true,
      };
    }

    case 'RESET': {
      return { ...initialState };
    }

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  /**
   * 开始游戏：根据模式抽取 10 个字
   */
  const startGame = useCallback((mode, learnedCharIds, errorCharIds) => {
    const learnedSet = new Set(learnedCharIds);
    const errorSet = new Set(errorCharIds);

    let selected = [];
    const allChars = charDB;

    if (mode === 'new') {
      // 新学字：从未学字中选取
      const unlearned = allChars.filter(c => !learnedSet.has(c.id));
      selected = randomPickUniqueChars(unlearned, Math.min(10, unlearned.length));
    } else if (mode === 'review') {
      // 复习字：从已学字中选取，错题本中的字优先
      const errorPool = allChars.filter(c => learnedSet.has(c.id) && errorSet.has(c.id));
      const normalPool = allChars.filter(c => learnedSet.has(c.id) && !errorSet.has(c.id));

      const fromError = randomPickUniqueChars(errorPool, Math.min(10, errorPool.length));
      const remaining = 10 - fromError.length;
      const fromNormal = randomPickUniqueChars(
        normalPool.filter(c => !fromError.some(item => item.char === c.char)),
        Math.min(remaining, normalPool.length)
      );
      selected = shuffle([...fromError, ...fromNormal]);
    } else if (mode === 'mixed') {
      // 混合：5个新 + 5个老（老字中错题优先）
      const unlearned = allChars.filter(c => !learnedSet.has(c.id));
      const errorPool = allChars.filter(c => learnedSet.has(c.id) && errorSet.has(c.id));
      const normalPool = allChars.filter(c => learnedSet.has(c.id) && !errorSet.has(c.id));

      const newChars = randomPickUniqueChars(unlearned, Math.min(5, unlearned.length));
      const oldTakenChars = new Set(newChars.map(c => c.char));
      const fromError = randomPickUniqueChars(
        errorPool.filter(c => !oldTakenChars.has(c.char)),
        Math.min(5, errorPool.length)
      );
      const errCount = fromError.length;
      fromError.forEach(c => oldTakenChars.add(c.char));
      const fromNormal = randomPickUniqueChars(
        normalPool.filter(c => !oldTakenChars.has(c.char)),
        Math.min(5 - errCount, normalPool.length)
      );
      selected = shuffle([...newChars, ...fromError, ...fromNormal]);
    } else if (mode === 'speak') {
      const learned = allChars.filter(c => learnedSet.has(c.id));
      const unlearned = allChars.filter(c => !learnedSet.has(c.id));
      const source = learned.length >= 5 ? learned : [...learned, ...unlearned];
      selected = randomPickUniqueChars(source, Math.min(10, source.length));
    }

    if (selected.length === 0) {
      return { success: false, error: '现在没有可以练习的字，先从新学字开始吧。' };
    }

    dispatch({ type: 'START_LEARN', mode, roundChars: selected });
    return { success: true, count: selected.length };
  }, []);

  const nextChar = useCallback(() => dispatch({ type: 'NEXT_CHAR' }), []);
  const answerCorrect = useCallback(() => dispatch({ type: 'ANSWER_CORRECT' }), []);
  const answerWrong = useCallback((charId) => dispatch({ type: 'ANSWER_WRONG', charId }), []);
  const resetGame = useCallback(() => dispatch({ type: 'RESET' }), []);

  return {
    state,
    dispatch,
    startGame,
    nextChar,
    answerCorrect,
    answerWrong,
    resetGame,
  };
}
