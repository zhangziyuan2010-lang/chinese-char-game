// localStorage 读写封装

const STORAGE_KEY = 'chinese_char_game';
const STORAGE_VERSION = 2;

const emptyStore = () => ({
  version: STORAGE_VERSION,
  users: {},
  currentUser: null,
});

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : emptyStore();
    return migrateStore(store);
  } catch {
    return emptyStore();
  }
}

function writeStore(data) {
  data.version = STORAGE_VERSION;
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

function makeSalt() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint32Array(2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, n => n.toString(36)).join('');
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function hashPassword(password, salt) {
  return simpleHash(`${salt}:${password}`);
}

function normalizeUsername(username) {
  return String(username || '').trim();
}

function normalizePassword(password) {
  return String(password || '');
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(id => Number.isInteger(id))));
}

function normalizeUser(user) {
  return {
    ...user,
    learnedChars: normalizeIdList(user.learnedChars),
    errorChars: normalizeIdList(user.errorChars),
    gameHistory: Array.isArray(user.gameHistory) ? user.gameHistory : [],
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt || new Date().toISOString(),
  };
}

function migrateStore(store) {
  const migrated = {
    ...emptyStore(),
    ...store,
    users: {},
  };

  Object.entries(store?.users || {}).forEach(([username, user]) => {
    if (!user) return;
    const normalized = normalizeUser(user);
    if (!normalized.passwordSalt) normalized.passwordLegacy = true;
    migrated.users[username] = normalized;
  });

  if (!migrated.currentUser || !migrated.users[migrated.currentUser]) {
    migrated.currentUser = null;
  }

  if (migrated.version !== STORAGE_VERSION) {
    writeStore(migrated);
  }

  return migrated;
}

/**
 * 注册新用户
 * @returns {{ success: boolean, error?: string }}
 */
export function registerUser(username, password) {
  const store = readStore();
  username = normalizeUsername(username);
  password = normalizePassword(password);
  if (!username || !password) return { success: false, error: '用户名和密码不能为空' };
  if (username.length < 2) return { success: false, error: '用户名至少2个字符' };
  if (password.length < 2) return { success: false, error: '密码至少2个字符' };
  if (store.users[username]) return { success: false, error: '用户名已存在' };

  const passwordSalt = makeSalt();
  store.users[username] = {
    passwordSalt,
    password: hashPassword(password, passwordSalt),
    learnedChars: [],
    errorChars: [],
    gameHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  username = normalizeUsername(username);
  password = normalizePassword(password);
  if (!store.users[username]) return { success: false, error: '用户不存在' };
  const user = store.users[username];
  const expected = user.passwordLegacy
    ? simpleHash(password)
    : hashPassword(password, user.passwordSalt);
  if (user.password !== expected) return { success: false, error: '密码错误' };

  if (user.passwordLegacy) {
    user.passwordSalt = makeSalt();
    user.password = hashPassword(password, user.passwordSalt);
    delete user.passwordLegacy;
    user.updatedAt = new Date().toISOString();
  }
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
  user.updatedAt = new Date().toISOString();
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
  user.updatedAt = new Date().toISOString();
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
  user.updatedAt = new Date().toISOString();
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
  store.users[username].updatedAt = new Date().toISOString();
  writeStore(store);
}
