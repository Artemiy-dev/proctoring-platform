import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import inconrow from '../assets/inconrow.png';
import row from '../assets/row.png';
import home from '../assets/home.png';
import analytics from '../assets/analytics.png';
import proctoring from '../assets/proctoring.png';
import '../styles/Sidebarfooter.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Главная', icon: home, path: '/dashboard' },
  { id: 'proctoring', label: 'Прокторинг', icon: proctoring, path: '/proctoring', adminOnly: true },
  { id: 'test', label: 'Тесты', icon: analytics, path: '/tests' },
];

export default function SideBar({ currentUser, onOpenAuth, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Проверка роли ADMIN прямо внутри компонента (без зависимости от внешних пропсов)
  const isUserAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  // Безопасное получение имени для вывода
  const displayName = currentUser?.name || currentUser?.fullName || currentUser?.email?.split('@')[0] || '';

  // Фильтрация пунктов меню
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isUserAdmin);

  const handleCardClick = () => {
    if (currentUser) {
      setIsUserMenuOpen((prev) => !prev);
    } else {
      onOpenAuth();
    }
  };

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    onLogout();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
    setIsUserMenuOpen(false);
  };

  return (
    <aside 
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Боковая навигация"
    >
      <button
        type="button"
        className="collapse-btn"
        onClick={handleToggleCollapse}
        title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
        aria-label={isCollapsed ? "Развернуть боковое меню" : "Свернуть боковое меню"}
      >
        <img 
          src={isCollapsed ? row : inconrow} 
          alt="" 
          className="collapse-icon-img" 
        />
      </button>

      <nav className="sidebar-nav">
        <ul>
          {visibleNavItems.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="nav-icon">
                  <img src={item.icon} alt="" className="sidebar-png" />
                </span>
                {!isCollapsed && <span className="nav-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`sbf-root ${isCollapsed ? 'sbf-collapsed' : ''}`}>
        <div 
          ref={menuRef} 
          className={`sbf-group ${isUserMenuOpen && currentUser ? 'sbf-group--open' : ''}`}
        >
          {isUserMenuOpen && currentUser && (
            <div className="sbf-dropdown" role="menu">
              <div className="sbf-dropdown-title">{displayName}</div>
              <button
                type="button"
                className="sbf-dropdown-item sbf-logout"
                onClick={handleLogout}
                role="menuitem"
              >
                <span className="sbf-dropdown-icon" aria-hidden="true">↩</span>
                Выйти из аккаунта
              </button>
            </div>
          )}

          <button 
            type="button"
            className="sbf-card" 
            onClick={handleCardClick}
            title={isCollapsed && currentUser ? displayName : undefined}
            aria-expanded={isUserMenuOpen}
            aria-haspopup={currentUser ? "true" : "false"}
          >
            <div className={`sbf-avatar ${isUserAdmin ? 'sbf-avatar--admin' : ''}`}>
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </div>

            {!isCollapsed && (
              <div className="sbf-info">
                <span className="sbf-name">{currentUser ? displayName : 'Гость'}</span>
                <span className="sbf-role">
                  {currentUser ? (isUserAdmin ? 'Администратор' : 'Студент') : 'Не авторизован'}
                </span>
              </div>
            )}

            {!isCollapsed && (
              currentUser ? (
                <span className={`sbf-chevron ${isUserMenuOpen ? 'sbf-chevron--rotated' : ''}`}>
                  ⌄
                </span>
              ) : (
                <span className="sbf-login-arrow">Войти</span>
              )
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}