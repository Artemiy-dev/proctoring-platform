import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { deleteRecording } from "../data/utils/videoStorage";
import "../styles/Proctoring.css";


const formatDate = (attempt) => {
  const raw = attempt.completedAt || attempt.date;
  if (!raw) return "—";

  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toLocaleString("ru-RU");
};

export default function AdminRecordings({
  attempts = [],
  testsList = [],
  onDeleteAttempt,
}) {
  const navigate = useNavigate();

  
  const testsMap = useMemo(() => {
    return new Map(testsList.map((t) => [String(t.id), t.name]));
  }, [testsList]);

  const getTestName = (testId, testNameFallback) => {
    if (testNameFallback) return testNameFallback;
    if (!testId) return "Тест";
    return testsMap.get(String(testId)) || "Тест";
  };

  const handleDelete = async (e, attemptIdStr) => {
    e.stopPropagation();

    if (!window.confirm("Удалить попытку?")) {
      return;
    }

    try {
      await deleteRecording(`${attemptIdStr}_camera`);
      await deleteRecording(`${attemptIdStr}_screen`);
    } catch (err) {
      console.warn("Ошибка при удалении медиафайлов:", err);
    }

    onDeleteAttempt?.(attemptIdStr);
  };

  const openReview = (e, attempt) => {
    e.stopPropagation();
    const id = attempt.attemptId ?? attempt.id;
    navigate(`/proctoring/${id}`);
  };

  return (
    <div className="tests-page">
      <div className="tests-header">
        <div>
          <h1 className="tests-title">Прокторинг</h1>
          <p className="tests-subtitle">
            Записи камеры и экрана по каждой попытке прохождения теста.
          </p>
        </div>
      </div>

      <section className="tests-section">
        <h2 className="tests-section-title">Попытки прохождения</h2>

        <div
          className="tests-table"
          style={{ width: "100%", overflowX: "auto" }}
        >
          <div className="tests-table-head proctoring-table-grid">
            <span>Тест</span>
            <span>Результат</span>
            <span>Браузер</span>
            <span>Дата</span>
            <span style={{ textAlign: "center" }}>Действия</span>
          </div>

          {attempts.length === 0 ? (
            <div className="tests-table-row">
              <span className="tests-table-name">
                Пока нет попыток прохождения
              </span>
            </div>
          ) : (
            attempts.map((a, idx) => {
              const attemptIdStr = String(
                a.attemptId ?? a.id ?? `attempt-${idx}`
              );

              const correct = a.correct ?? 0;
              const total = a.total ?? 0;
              const percent =
                a.percent ?? (total ? Math.round((correct / total) * 100) : 0);

              return (
                <div
                  key={attemptIdStr}
                  className="tests-table-row proctoring-table-grid proctoring-row"
                >
                  <span className="tests-table-name proctoring-row-name">
                    {getTestName(a.testId, a.testName)}
                  </span>

                  <span>
                    {correct}/{total} ({percent}%)
                  </span>

                  <span>{a.proctoring?.browser || "—"}</span>

                  <span>{formatDate(a)}</span>

                  <div className="attempt-actions">
                    <button
                      type="button"
                      onClick={(e) => openReview(e, a)}
                      title="Ответы студента"
                      className="icon-btn icon-btn--gear"
                    >
                      ⚙
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, attemptIdStr)}
                      title="Удалить попытку"
                      className="icon-btn icon-btn--delete"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}