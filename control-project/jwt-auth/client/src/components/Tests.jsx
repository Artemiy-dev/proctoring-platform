import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadTests, saveTests } from '../data/utils/storage';
import CreateTestModal from './CreateTestModal';
import '../styles/Tests.css';

const DEFAULT_TESTS = [];

const statusClass = {
  'Активен': 'tests-status--active',
  'Завершён': 'tests-status--done',
  'Черновик': 'tests-status--draft',
};

function FadeInOnScroll({ children, delay = 0, className = '' }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef(null);

  useEffect(() => {
    const node = domRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(node);

    return () => {
      observer.unobserve(node);
    };
  }, []);

  return (
    <div
      ref={domRef}
      className={`scroll-fade-in ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Tests({ isAdmin = false }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState(() => loadTests(DEFAULT_TESTS));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // Используем ID вместо индекса

  const isEditOpen = editingId !== null;
  const editingTest = tests.find((t) => t.id === editingId) || null;

  const handleTestClick = (testId) => {
    if (testId) {
      navigate(`/tests/${encodeURIComponent(testId)}`);
    }
  };

  const openEdit = (e, testId) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setEditingId(testId);
  };

  const handleDeleteTest = (e, testId) => {
    e.stopPropagation();
    if (!isAdmin) return;

    const confirmed = window.confirm('Вы уверены, что хотите удалить этот тест?');
    if (!confirmed) return;

    setTests((prev) => {
      const updated = prev.filter((t) => t.id !== testId);
      saveTests(updated);
      return updated;
    });
  };

  const closeModal = () => {
    setIsCreateOpen(false);
    setEditingId(null);
  };

  const handleCreateTest = (newTest) => {
    // Гарантируем наличие уникального ID при создании
    const testWithId = {
      ...newTest,
      id: newTest.id || String(Date.now()),
    };

    setTests((prev) => {
      const updated = [...prev, testWithId];
      saveTests(updated);
      return updated;
    });
    setIsCreateOpen(false);
  };

  const handleUpdateTest = (updatedTest) => {
    setTests((prev) => {
      const updated = prev.map((t) => (t.id === editingId ? updatedTest : t));
      saveTests(updated);
      return updated;
    });
    setEditingId(null);
  };

  return (
    <div className="tests-page">
      <FadeInOnScroll className="tests-header">
        <div>
          <h1 className="tests-title">Тесты</h1>
          <p className="tests-subtitle">
            Все созданные тесты — статус, участники и дата создания.<br />
            Нажмите на тест, чтобы пройти его.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            className="home-btn-primary"
            onClick={() => setIsCreateOpen(true)}
            style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Создать тест
          </button>
        )}
      </FadeInOnScroll>

      <section className="tests-section" style={{ borderBottom: 'none' }}>
        <FadeInOnScroll>
          <h2 className="tests-section-title">Список тестов</h2>
        </FadeInOnScroll>

        <FadeInOnScroll className="tests-table">
          <div className="tests-table-head">
            <span>Название</span>
            <span>Статус</span>
            <span>Вопросы</span>
            <span>Дата</span>
            <span></span>
          </div>

          {tests.length > 0 ? (
            tests.map((t, idx) => {
              const testId = t.id || `fallback-${idx}`;
              return (
                <div
                  key={testId}
                  className="tests-table-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleTestClick(t.id)}
                >
                  <span className="tests-table-name">{t.name || 'Без названия'}</span>
                  <div>
                    <span className={`tests-status ${statusClass[t.status] || 'tests-status--done'}`}>
                      {t.status || 'Активен'}
                    </span>
                  </div>
                  <span>{t.questions?.length ?? 0}</span>
                  <span>{t.date || '—'}</span>
                  {isAdmin && (
                    <div className="tests-actions-cell">
                      <button
                        type="button"
                        className="tests-gear-btn"
                        title="Редактировать тест"
                        onClick={(e) => openEdit(e, t.id)}
                      >
                        ⚙️
                      </button>
                      <button
                        type="button"
                        className="tests-delete-btn"
                        title="Удалить тест"
                        onClick={(e) => handleDeleteTest(e, t.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              Нет доступных тестов
            </div>
          )}
        </FadeInOnScroll>
      </section>

      {isAdmin && (
        <CreateTestModal
          key={isEditOpen ? `edit-${editingId}` : 'create'}
          isOpen={isCreateOpen || isEditOpen}
          onClose={closeModal}
          onCreateTest={handleCreateTest}
          editTest={editingTest}
          onUpdateTest={handleUpdateTest}
        />
      )}
    </div>
  );
}