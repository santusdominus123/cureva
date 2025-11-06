// src/utils/authPersistence.ts
import Cookies from 'js-cookie';

const USER_COOKIE_KEY = 'cureva-session';
const USER_LOCAL_KEY = 'cureva-user';
const COOKIE_EXPIRY_DAYS = 7; // 7 days

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  provider: string;
  role: string;
  loginTime: string;
}

/**
 * Save user session to both localStorage and cookies
 * This ensures session persistence across page refreshes and tab closes
 */
export const saveUserSession = (userData: UserData): void => {
  try {
    const sessionData = JSON.stringify(userData);

    // Save to localStorage (faster access)
    localStorage.setItem(USER_LOCAL_KEY, sessionData);

    // Save to cookies (persistent across sessions)
    Cookies.set(USER_COOKIE_KEY, sessionData, {
      expires: COOKIE_EXPIRY_DAYS,
      sameSite: 'strict',
      secure: window.location.protocol === 'https:',
    });

    console.log('✅ Session saved to localStorage and cookies');
  } catch (error) {
    console.error('❌ Failed to save session:', error);
  }
};

/**
 * Get user session from cookies or localStorage
 * Priority: Cookies > localStorage
 */
export const getUserSession = (): UserData | null => {
  try {
    // Try cookies first (more persistent)
    const cookieData = Cookies.get(USER_COOKIE_KEY);
    if (cookieData) {
      const userData = JSON.parse(cookieData);
      // Sync to localStorage for faster access
      localStorage.setItem(USER_LOCAL_KEY, cookieData);
      console.log('✅ Session restored from cookies');
      return userData;
    }

    // Fallback to localStorage
    const localData = localStorage.getItem(USER_LOCAL_KEY);
    if (localData) {
      const userData = JSON.parse(localData);
      // Sync back to cookies
      Cookies.set(USER_COOKIE_KEY, localData, {
        expires: COOKIE_EXPIRY_DAYS,
        sameSite: 'strict',
        secure: window.location.protocol === 'https:',
      });
      console.log('✅ Session restored from localStorage');
      return userData;
    }

    return null;
  } catch (error) {
    console.error('❌ Failed to get session:', error);
    return null;
  }
};

/**
 * Clear user session from both localStorage and cookies
 */
export const clearUserSession = (): void => {
  try {
    localStorage.removeItem(USER_LOCAL_KEY);
    localStorage.removeItem('cureva-intro-seen');
    Cookies.remove(USER_COOKIE_KEY);
    console.log('✅ Session cleared');
  } catch (error) {
    console.error('❌ Failed to clear session:', error);
  }
};

/**
 * Check if user session is valid and not expired
 */
export const isSessionValid = (): boolean => {
  const userData = getUserSession();
  if (!userData) return false;

  try {
    // Check if session is not older than 7 days
    const loginTime = new Date(userData.loginTime);
    const now = new Date();
    const daysDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff < COOKIE_EXPIRY_DAYS;
  } catch (error) {
    console.error('❌ Failed to validate session:', error);
    return false;
  }
};

/**
 * Refresh session timestamp
 */
export const refreshSession = (): void => {
  const userData = getUserSession();
  if (userData) {
    userData.loginTime = new Date().toISOString();
    saveUserSession(userData);
    console.log('✅ Session refreshed');
  }
};
