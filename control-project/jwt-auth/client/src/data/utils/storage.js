const TESTS_KEY = 'safeproctor_tests';
const ATTEMPTS_KEY = 'safeproctor_attempts';
const USERS_KEY = 'safeproctor_users';
const SESSION_KEY = 'safeproctor_session';
 
export function loadTests(defaultTests) {
  try {
    const raw = localStorage.getItem(TESTS_KEY);
    return raw ? JSON.parse(raw) : defaultTests;
  } catch {
    return defaultTests;
  }
}
 
export function saveTests(tests) {
  try {
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  } catch {
    // localStorage недоступен — молча игнорируем
  }
}
 
export function loadAttempts() {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
 
export function saveAttempts(attempts) {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch {
    // localStorage недоступен — молча игнорируем
  }
}
 
// ===== Пользователи (регистрация) =====
 
export function loadUsers(defaultUsers = []) {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : defaultUsers;
  } catch {
    return defaultUsers;
  }
}
 
export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // localStorage недоступен — молча игнорируем
  }
}
 
// ===== Текущая сессия (кто залогинен) =====
 
export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
 
export function saveSession(user) {
  try {
    if (user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // localStorage недоступен — молча игнорируем
  }
}
