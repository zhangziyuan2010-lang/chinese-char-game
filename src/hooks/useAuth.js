import { useState, useCallback, useMemo } from 'react';
import {
  registerUser, loginUser, logoutUser, getCurrentUser, getUserData,
  updateLearnedChars, addErrorChars, removeErrorChars, addGameRecord,
} from '../utils/storage.js';
import charDB from '../data/charDB.js';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [dataVersion, setDataVersion] = useState(0);

  const refreshUserData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  const login = useCallback((username, password) => {
    const result = loginUser(username, password);
    if (result.success) {
      setCurrentUser(username);
      refreshUserData();
    }
    return result;
  }, [refreshUserData]);

  const register = useCallback((username, password) => {
    const result = registerUser(username, password);
    if (result.success) {
      setCurrentUser(username);
      refreshUserData();
    }
    return result;
  }, [refreshUserData]);

  const logout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
  }, []);

  const userData = useMemo(() => {
    return currentUser ? getUserData(currentUser) : null;
  }, [currentUser, dataVersion]);

  const learnedChars = userData?.learnedChars || [];
  const errorChars = userData?.errorChars || [];

  const learnedCount = learnedChars.length;
  const totalCount = charDB.length;

  const getStats = useCallback((username) => {
    const data = username ? getUserData(username) : userData;
    if (!data) return { learnedCount: 0, totalCount: charDB.length, errorCount: 0 };
    return {
      learnedCount: data.learnedChars.length,
      totalCount: charDB.length,
      errorCount: data.errorChars.length,
    };
  }, [userData]);

  const recordGame = useCallback((gameResult) => {
    if (!currentUser) return;
    // 记录已学字
    if (gameResult.newLearned && gameResult.newLearned.length > 0) {
      updateLearnedChars(currentUser, gameResult.newLearned);
    }
    // 记录错字
    if (gameResult.wrongChars && gameResult.wrongChars.length > 0) {
      addErrorChars(currentUser, gameResult.wrongChars);
    }
    // 从错题本移除正确的字
    if (gameResult.correctChars && gameResult.correctChars.length > 0) {
      removeErrorChars(currentUser, gameResult.correctChars.filter(
        id => userData?.errorChars?.includes(id)
      ));
    }
    // 存储游戏记录
    addGameRecord(currentUser, {
      mode: gameResult.mode,
      score: gameResult.score,
      wrongChars: gameResult.wrongChars || [],
    });
    refreshUserData();
  }, [currentUser, userData, refreshUserData]);

  return {
    currentUser,
    userData,
    learnedChars,
    errorChars,
    learnedCount,
    totalCount,
    login,
    register,
    logout,
    getStats,
    recordGame,
    refreshUserData,
  };
}
