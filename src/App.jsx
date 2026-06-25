import { useState, useCallback, useReducer } from 'react';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import GameLearnPhase from './components/GameLearnPhase';
import GameQuizPhase from './components/GameQuizPhase';
import GameResultPage from './components/GameResultPage';
import { useAuth } from './hooks/useAuth';
import { useGame } from './hooks/useGame';
import './App.css';

export default function App() {
  const auth = useAuth();
  const game = useGame();
  const [page, setPage] = useState(auth.currentUser ? 'dashboard' : 'login');
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const handleLogin = useCallback((username, password) => {
    const result = auth.login(username, password);
    if (result.success) setPage('dashboard');
    return result;
  }, [auth]);

  const handleRegister = useCallback((username, password) => {
    const result = auth.register(username, password);
    if (result.success) setPage('dashboard');
    return result;
  }, [auth]);

  const handleLogout = useCallback(() => {
    auth.logout();
    game.resetGame();
    setPage('login');
  }, [auth, game]);

  const handleStartGame = useCallback((mode) => {
    game.startGame(mode, auth.learnedChars, auth.errorChars);
    setPage('learn');
  }, [game, auth.learnedChars, auth.errorChars]);

  const handleLearnComplete = useCallback(() => {
    setPage('quiz');
  }, []);

  const handleBackToLobby = useCallback(() => {
    game.resetGame();
    forceUpdate();
    setPage('dashboard');
  }, [game, forceUpdate]);

  const handlePlayAgain = useCallback(() => {
    if (game.state.mode) {
      game.startGame(game.state.mode, auth.learnedChars, auth.errorChars);
      setPage('learn');
    }
  }, [game, auth.learnedChars, auth.errorChars]);

  // 测验阶段完成 → 记录成绩并进入结果页
  const handleQuizComplete = useCallback(() => {
    const correctIds = game.state.roundChars
      .filter(c => !game.state.wrongChars.includes(c.id))
      .map(c => c.id);
    const newLearnedIds = game.state.mode === 'new'
      ? game.state.roundChars.filter(c => !game.state.wrongChars.includes(c.id)).map(c => c.id)
      : [];

    auth.recordGame({
      mode: game.state.mode,
      score: game.state.score,
      wrongChars: game.state.wrongChars,
      correctChars: correctIds,
      newLearned: newLearnedIds,
    });
    forceUpdate();
    setPage('result');
  }, [game.state, auth, forceUpdate]);

  const stats = auth.getStats(auth.currentUser);

  return (
    <div className="app">
      {page === 'login' && (
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
      )}

      {page === 'dashboard' && (
        <DashboardPage
          username={auth.currentUser}
          stats={stats}
          onStartGame={handleStartGame}
          onLogout={handleLogout}
        />
      )}

      {page === 'learn' && game.state?.roundChars && (
        <GameLearnPhase
          roundChars={game.state.roundChars}
          onComplete={handleLearnComplete}
        />
      )}

      {page === 'quiz' && game.state && (
        <GameQuizPhase
          roundChars={game.state.roundChars}
          quizPool={game.state.quizPool}
          quizIndex={game.state.quizIndex}
          score={game.state.score}
          onCorrect={() => game.answerCorrect()}
          onWrong={(charId) => game.answerWrong(charId)}
          onComplete={handleQuizComplete}
        />
      )}

      {page === 'result' && game.state && (
        <GameResultPage
          score={game.state.score}
          wrongChars={game.state.wrongChars}
          roundChars={game.state.roundChars}
          mode={game.state.mode}
          username={auth.currentUser}
          onBackToLobby={handleBackToLobby}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
