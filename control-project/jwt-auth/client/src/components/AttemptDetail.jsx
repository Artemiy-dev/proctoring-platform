import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecording, deleteRecording } from "../data/utils/videoStorage";
import "../styles/CreateTest.css";
import "../styles/Proctoring.css";

export default function AttemptDetails({
  attempt,
  testsList,
  onDeleteAttempt,
}) {
  const navigate = useNavigate();

  // Безопасный поиск теста с приведением типов к строке
  const fullTest = testsList.find(
    (t) => String(t.id) === String(attempt.testId)
  );

  const savedAnswers = attempt.answers;
  const attemptIdStr = String(attempt.attemptId ?? attempt.id);

  const [cameraUrl, setCameraUrl] = useState(null);
  const [screenUrl, setScreenUrl] = useState(null);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  const cameraUrlRef = useRef(null);
  const screenUrlRef = useRef(null);

  useEffect(() => {
    cameraUrlRef.current = cameraUrl;
    screenUrlRef.current = screenUrl;
  }, [cameraUrl, screenUrl]);

  // Загрузка видеозаписей
  useEffect(() => {
    let cancelled = false;

    const loadRecordings = async () => {
      try {
        const cameraBlob = await getRecording(`${attemptIdStr}_camera`);
        const screenBlob = await getRecording(`${attemptIdStr}_screen`);

        if (cancelled) return;

        if (cameraBlob && cameraBlob.size > 0) {
          setCameraUrl(URL.createObjectURL(cameraBlob));
        }

        if (screenBlob && screenBlob.size > 0) {
          setScreenUrl(URL.createObjectURL(screenBlob));
        }
      } catch (err) {
        console.error("Ошибка получения записи:", err);
      } finally {
        if (!cancelled) setLoadingRecordings(false);
      }
    };

    loadRecordings();

    return () => {
      cancelled = true;
    };
  }, [attemptIdStr]);

  // Освобождение Blob-памяти при размонтировании
  useEffect(() => {
    return () => {
      if (cameraUrlRef.current) {
        URL.revokeObjectURL(cameraUrlRef.current);
      }
      if (screenUrlRef.current) {
        URL.revokeObjectURL(screenUrlRef.current);
      }
    };
  }, []);

  const formatDate = () => {
    const raw = attempt.completedAt || attempt.date;
    if (!raw) return "—";

    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toLocaleString("ru-RU");
  };

  const handleResetAttempt = async () => {
    if (
      !window.confirm(
        "Сбросить попытку? Студент сможет пройти тест заново."
      )
    ) {
      return;
    }

    try {
      await deleteRecording(`${attemptIdStr}_camera`);
      await deleteRecording(`${attemptIdStr}_screen`);
    } catch (err) {
      console.warn("Ошибка при удалении записей видео:", err);
    }

    onDeleteAttempt?.(attemptIdStr);
    navigate("/proctoring");
  };

  return (
    <div className="tests-page">
      <button
        className="back-button-round"
        onClick={() => navigate("/proctoring")}
        title="Назад к попыткам"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span>Назад</span>
      </button>

      <div className="tests-header">
        <div>
          <h1 className="tests-title">{attempt.testName || fullTest?.title || "Детали попытки"}</h1>

          <div className="attempt-meta-row">
            <span
              className={`attempt-score-badge ${
                attempt.percent >= 80
                  ? "is-good"
                  : attempt.percent >= 50
                  ? "is-mid"
                  : "is-bad"
              }`}
            >
              {attempt.correct ?? 0}/{attempt.total ?? 0} · {attempt.percent ?? 0}%
            </span>

            <span className="attempt-meta-date">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M3 9h18M8 2v4M16 2v4" />
              </svg>
              {formatDate()}
            </span>
          </div>
        </div>
      </div>

      <div className="questions-wrapper mt-24">
        {!savedAnswers ? (
          <p className="review-modal-empty">
            Для этой попытки нет сохранённых ответов.
          </p>
        ) : !fullTest ? (
          <p className="review-modal-empty">
            Тест был удалён или изменён.
          </p>
        ) : (
          fullTest.questions.map((q, index) => {
            const userAnswer = savedAnswers[index] || {
              single: null,
              multiple: [],
              fill: "",
            };

            const questionType = q.type || fullTest.type;

            return (
              <div className="question-card" key={index}>
                <h3>Вопрос {index + 1}</h3>
                <p className="question-text">{q.question}</p>

                {questionType === "fill" ? (
                  <>
                    <input
                      readOnly
                      value={userAnswer.fill || ""}
                      className={`form-input fill-answer ${
                        (q.fillAnswer || "").trim().toLowerCase() ===
                        (userAnswer.fill || "").trim().toLowerCase()
                          ? "is-correct"
                          : "is-incorrect"
                      }`}
                    />

                    <p className="correct-answer-hint">
                      Правильный ответ: {q.fillAnswer}
                    </p>
                  </>
                ) : (
                  (q.answers || []).map((answer, answerIndex) => {
                    const correct =
                      questionType === "single"
                        ? q.correct === answerIndex
                        : (q.correctMultiple || []).includes(answerIndex);

                    const selected =
                      questionType === "single"
                        ? userAnswer.single === answerIndex
                        : (userAnswer.multiple || []).includes(answerIndex);

                    let optionClass = "";

                    if (correct && selected) {
                      optionClass = "is-correct-selected";
                    } else if (!correct && selected) {
                      optionClass = "is-incorrect-selected";
                    } else if (correct && !selected) {
                      optionClass = "is-correct-unselected";
                    }

                    return (
                      <div className="answer-row" key={answerIndex}>
                        <input
                          readOnly
                          value={answer}
                          className={`form-input answer-option ${optionClass}`}
                        />

                        <input
                          type={questionType === "single" ? "radio" : "checkbox"}
                          checked={selected}
                          readOnly
                        />
                      </div>
                    );
                  })
                )}
              </div>
            );
          })
        )}
      </div>

      <div
        style={{
          marginTop: 30,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button
          className="modal-btn-cancel"
          onClick={() => navigate("/proctoring")}
        >
          Назад
        </button>

        <button
          className="btn-reset-attempt"
          onClick={handleResetAttempt}
        >
          Сбросить попытку
        </button>
      </div>

      <div className="proctoring-dropdown mt-24">
        <p className="proctoring-dropdown-title">
          Запись попытки (ID: {attemptIdStr})
        </p>

        {loadingRecordings && (
          <p className="recording-loading">
            Загрузка видео из хранилища...
          </p>
        )}

        <div className="recordings-grid">
          <div>
            <p className="recording-label">Камера</p>

            {cameraUrl ? (
              <video
                src={cameraUrl}
                controls
                className="recording-video--camera"
              />
            ) : (
              !loadingRecordings && (
                <p className="recording-empty">
                  Запись камеры недоступна
                </p>
              )
            )}
          </div>

          <div>
            <p className="recording-label">Экран</p>

            {screenUrl ? (
              <video
                src={screenUrl}
                controls
                className="recording-video--screen"
              />
            ) : (
              !loadingRecordings && (
                <p className="recording-empty">
                  Запись экрана недоступна
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}