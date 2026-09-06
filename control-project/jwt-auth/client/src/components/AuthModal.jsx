import { useState } from "react";
import "../styles/AuthModal.css";

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, error }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Защита от повторных отправлений

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm(EMPTY_FORM);
      setShowPassword(false);
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Предотвращаем дублирование, если запрос уже летит

    const { name, email, password } = form;
    if (!email || !password) return;

    try {
      setIsSubmitting(true);
      if (isLoginTab) {
        await onLogin(email, password);
      } else {
        if (!name) return;
        await onRegister({ name, email, password });
      }
      onClose(); // Закрываем модалку только при успехе
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-modal-brand">
          <div className="auth-modal-scanline" aria-hidden="true" />

          <div className="auth-modal-brand-top">
            <div className="auth-modal-logo">
              <span className="auth-modal-logo-mark">◆</span>
              SAFEPROCTOR
            </div>
            <span className="auth-modal-logo-sub">STUDIO</span>
          </div>

          <div className="auth-modal-brand-copy">
            <p className="auth-modal-tagline">
              Каждая попытка —<br />под контролем.
            </p>
            <div className="auth-modal-status">
              <span className="auth-modal-status-dot" />
              Мониторинг активен
            </div>
          </div>
        </div>

        <div className="auth-modal-form-panel">
          <button className="auth-modal-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>

          <div className="auth-modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isLoginTab}
              className={`auth-modal-tab ${isLoginTab ? 'is-active' : ''}`}
              onClick={() => setIsLoginTab(true)}
            >
              Вход
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLoginTab}
              className={`auth-modal-tab ${!isLoginTab ? 'is-active' : ''}`}
              onClick={() => setIsLoginTab(false)}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-modal-form">
            {!isLoginTab && (
              <div className="auth-modal-field">
                <label htmlFor="auth-name">Имя и фамилия</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Иван Иванов"
                  value={form.name}
                  onChange={updateField('name')}
                  required
                />
              </div>
            )}

            <div className="auth-modal-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                placeholder="example@mail.com"
                value={form.email}
                onChange={updateField('email')}
                required
              />
            </div>

            <div className="auth-modal-field">
              <label htmlFor="auth-password">Пароль</label>
              <div className="auth-modal-password-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={updateField('password')}
                  required
                />
                <button
                  type="button"
                  className="auth-modal-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-modal-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="auth-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Загрузка...'
                : isLoginTab
                ? 'Войти'
                : 'Зарегистрироваться'}
            </button>

            <p className="auth-modal-switch">
              {isLoginTab ? (
                <>
                  Нет аккаунта?{' '}
                  <button type="button" onClick={() => setIsLoginTab(false)}>
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{' '}
                  <button type="button" onClick={() => setIsLoginTab(true)}>
                    Войти
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}