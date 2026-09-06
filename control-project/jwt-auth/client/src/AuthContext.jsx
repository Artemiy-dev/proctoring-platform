import { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../AuthService';
import $api, { setOnAuthFail, refreshTokens } from '../api';

const AuthContext = createContext({});

const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    name:
      userData.name ||
      userData.fullName ||
      userData.username ||
      userData.email?.split('@')[0] ||
      'Пользователь',
    role: (userData.role || 'USER').toUpperCase(),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      if (localStorage.getItem('accessToken')) {
        const data = await refreshTokens();
        setIsAuth(true);
        setUser(normalizeUser(data.user));
      }
    } catch (e) {
      console.error('Ошибка проверки авторизации:', e);
      setIsAuth(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    // Связываем сбрасывание авторизации с интерцептором api.js
    setOnAuthFail(() => {
      if (!ignore) {
        setIsAuth(false);
        setUser(null);
      }
    });

    const runCheckAuth = async () => {
      setIsLoading(true);
      try {
        if (localStorage.getItem('accessToken')) {
          const data = await refreshTokens();
          if (!ignore) {
            setIsAuth(true);
            setUser(normalizeUser(data.user));
          }
        }
      } catch (e) {
        if (!ignore) {
          console.error('Ошибка проверки авторизации:', e);
          setIsAuth(false);
          setUser(null);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    runCheckAuth();

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await AuthService.login(email, password);
      localStorage.setItem('accessToken', response.data.accessToken);
      setIsAuth(true);
      setUser(normalizeUser(response.data.user));
      return response;
    } catch (e) {
      console.error('Ошибка логина:', e);
      throw e;
    }
  };

  const registration = async (email, password, name) => {
    try {
      const response = await AuthService.registration(email, password, name);
      localStorage.setItem('accessToken', response.data.accessToken);
      setIsAuth(true);
      setUser(normalizeUser(response.data.user));
      return response;
    } catch (e) {
      console.error('Ошибка регистрации:', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } catch (e) {
      console.error('Ошибка вылета:', e);
    } finally {
      localStorage.removeItem('accessToken');
      setIsAuth(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuth,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        login,
        registration,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);