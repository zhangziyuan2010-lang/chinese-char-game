// localStorage 读写封装

const STORAGE_KEY = 'chinese_char_game';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { users: {}, currentUser: null };
  } catch {
    return { users: {}, currentUser: null };
  }
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** 简单的哈希（非加密用途，仅避免明文存储） */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

/**
 * 注册新用户
 * @returns {{ success: boolean, error?: string }}
 */
export function registerUser(username, password) {
  const store = readStore();
  if (!username || !password) return { success: false, error: '用户名和密码不能为空' };
  if (username.length < 2) return { success: false, error: '用户名至少2个字符' };
  if (password.length < 2) return { success: false, error: '密码至少2个字符' };
  if (store.users[username]) return { success: false, error: '用户名已存在' };

  store.users[username] = {
    password: simpleHash(password),
    learnedChars: [],
    errorChars: [],
    gameHistory: [],
    createdAt: new Date().toISOString(),
  };
  store.currentUser = username;
  writeStore(store);
  return { success: true };
}

/**
 * 登录
 * @returns {{ success: boolean, error?: string }}
 */
export function loginUser(username, password) {
  const store = readStore();
  if (!store.users[username]) return { success: false, error: '用户不存在' };
  if (store.users[username].password !== simpleHash(password)) return { success: false, error: '密码错误' };

  store.currentUser = username;
  writeStore(store);
  return { success: true };
}

/**
 * 登出
 */
export function logoutUser() {
  const store = readStore();
  store.currentUser = null;
  writeStore(store);
}

/**
 * 获取当前登录的用户名
 */
export function getCurrentUser() {
  return readStore().currentUser;
}

/**
 * 获取用户数据
 */
export function getUserData(username) {
  const store = readStore();
  return store.users[username] || null;
}

/**
 * 更新用户的已学字列表
 */
export function updateLearnedChars(username, newCharIds) {
  const store = readStore();
  if (!store.users[username]) return;

  const user = store.users[username];
  const set = new Set(user.learnedChars);
  newCharIds.forEach(id => set.add(id));
  user.learnedChars = Array.from(set);
  writeStore(store);
}

/**
 * 添加错字到错题本
 */
export function addErrorChars(username, charIds) {
  const store = readStore();
  if (!store.users[username]) return;

  const user = store.users[username];
  const set = new Set(user.errorChars);
  charIds.forEach(id => set.add(id));
  user.errorChars = Array.from(set);
  writeStore(store);
}

/**
 * 从错题本中移除已纠正的字
 */
export function removeErrorChars(username, charIds) {
  const store = readStore();
  if (!store.users[username]) return;

  const user = store.users[username];
  user.errorChars = user.errorChars.filter(id => !charIds.includes(id));
  writeStore(store);
}

/**
 * 添加游戏记录
 */
export function addGameRecord(username, record) {
  const store = readStore();
  if (!store.users[username]) return;

  store.users[username].gameHistory.push({
    ...record,
    date: new Date().toISOString(),
  });
  writeStore(store);
}
