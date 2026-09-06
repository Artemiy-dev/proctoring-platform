
const STATUS_CLASS_MAP = {
  'Активен': 'tests-status--active',
  'Завершён': 'tests-status--done',
  'Черновик': 'tests-status--draft',
};

export default function SavedTests({
  testsList = [],
  isAdmin = false,
  onOpenCreateModal,
  onStartTest,
  onEditTest,
  onDeleteTest,
}) {
  const handleGearClick = (e, testId) => {
    e.stopPropagation();
    if (!isAdmin || !onEditTest) return;
    onEditTest(testId);
  };

  const handleDeleteClick = (e, testId, testName) => {
    e.stopPropagation();
    if (!isAdmin || !onDeleteTest) return;
    
    if (window.confirm(`Удалить тест «${testName}»? Это действие нельзя отменить.`)) {
      onDeleteTest(testId);
    }
  };

  const handleRowClick = (testId) => {
    if (onStartTest) {
      onStartTest(testId);
    }
  };

  const handleRowKeyDown = (e, testId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(testId);
    }
  };

  return (
    <div className="tests-page">
      <div className="tests-header">
        <div>
          <h1 className="tests-title">Тесты</h1>
          <p className="tests-subtitle">
            Все созданные тесты — статус, участники и дата создания. Нажмите на тест, чтобы пройти его.
          </p>
        </div>
        {isAdmin && (
          <button 
            type="button" 
            className="home-btn-primary" 
            onClick={onOpenCreateModal}
          >
            Создать тест
          </button>
        )}
      </div>

      <section className="tests-section">
        <h2 className="tests-section-title">Список тестов</h2>

        <div className="tests-table" role="table">
          <div className="tests-table-head" role="row">
            <span role="columnheader">Название</span>
            <span role="columnheader">Статус</span>
            <span role="columnheader">Вопросы</span>
            <span role="columnheader">Дата</span>
            <span role="columnheader"></span>
          </div>

          {!testsList || testsList.length === 0 ? (
            <div className="tests-table-row tests-table-row--empty">
              <span className="tests-table-name">Пока нет созданных тестов</span>
            </div>
          ) : (
            testsList.map((t, idx) => {
              const testId = t.id ?? idx;
              const statusText = t.status || 'Черновик';
              const statusClass = STATUS_CLASS_MAP[statusText] || 'tests-status--draft';
              const questionCount = Array.isArray(t.questions) ? t.questions.length : 0;

              return (
                <div
                  className="tests-table-row"
                  key={testId}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleRowClick(t.id)}
                  onKeyDown={(e) => handleRowKeyDown(e, t.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="tests-table-name">{t.name || 'Без названия'}</span>
                  <span className={`tests-status ${statusClass}`}>
                    {statusText}
                  </span>
                  <span>{questionCount}</span>
                  <span>{t.date || '—'}</span>
                  
                  {isAdmin && (
                    <div className="tests-actions-cell">
                      <button
                        type="button"
                        className="tests-gear-btn"
                        title="Редактировать тест"
                        aria-label={`Редактировать тест ${t.name}`}
                        onClick={(e) => handleGearClick(e, t.id)}
                      >
                        ⚙️
                      </button>
                      <button
                        type="button"
                        className="tests-delete-btn"
                        title="Удалить тест"
                        aria-label={`Удалить тест ${t.name}`}
                        onClick={(e) => handleDeleteClick(e, t.id, t.name || 'без названия')}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}