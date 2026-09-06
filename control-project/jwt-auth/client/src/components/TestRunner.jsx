import { useRef, useState } from "react";
import ProctoringPanel from "./ProctoringPanel";
import { saveRecording } from "../data/utils/videoStorage";
import "../styles/CreateTest.css";
import "../styles/Proctoring.css";

// Переиспользуемая кнопка "Назад"
function BackButton({ onClick, title = "Назад" }) {
  return (
    <button type="button" onClick={onClick} title={title} className="back-button" aria-label={title}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  );
}

export default function TestRunner({ test, onExit, onFinish }) {
  const questions = test?.questions || [];

  // Отслеживаем ID предыдущего теста для корректного сброса состояния
  const [prevTestId, setPrevTestId] = useState(test?.id);

  const [phase, setPhase] = useState("setup");
  const [proctoring, setProctoring] = useState({ browser: "", cameraOn: false, screenOn: false });
  const [saving, setSaving] = useState(false);

  const proctoringRef = useRef(null);
  const [attemptId, setAttemptId] = useState("");

  const [answers, setAnswers] = useState(() =>
    questions.map(() => ({ single: null, multiple: [], fill: "" }))
  );
  const [result, setResult] = useState(null);

  // Чистый сброс состояния во время рендера (без нечистых функций)
  if (test?.id !== prevTestId) {
    setPrevTestId(test?.id);
    setPhase("setup");
    setAttemptId("");
    setAnswers(questions.map(() => ({ single: null, multiple: [], fill: "" })));
    setResult(null);
  }

  if (!test || questions.length === 0) {
    return (
      <div className="tests-page">
        <BackButton onClick={onExit} />
        <div className="tests-header">
          <div>
            <h1 className="tests-title">{test?.name || "Тест не найден"}</h1>
            <p className="tests-subtitle">В этом тесте пока нет вопросов.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleBackClick = () => {
    if (phase === "running") {
      const confirmExit = window.confirm("Вы действительно хотите выйти? Прогресс и текущая попытка будут потеряны.");
      if (!confirmExit) return;
      proctoringRef.current?.stopRecording().catch(() => {});
    }
    onExit();
  };

  const setSingle = (qIndex, answerIndex) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], single: answerIndex };
      return copy;
    });
  };

  const toggleMultiple = (qIndex, answerIndex) => {
    setAnswers((prev) => {
      const copy = [...prev];
      const current = copy[qIndex]?.multiple || [];
      copy[qIndex] = {
        ...copy[qIndex],
        multiple: current.includes(answerIndex)
          ? current.filter((i) => i !== answerIndex)
          : [...current, answerIndex],
      };
      return copy;
    });
  };

  const setFill = (qIndex, value) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], fill: value };
      return copy;
    });
  };

  const isOptionCorrect = (q, answerIndex) => {
    if (test.type === "single") return q.correct === answerIndex;
    if (test.type === "multiple") return (q.correctMultiple || []).includes(answerIndex);
    return false;
  };

  const isOptionSelected = (userAnswer, answerIndex) => {
    if (test.type === "single") return userAnswer?.single === answerIndex;
    if (test.type === "multiple") return (userAnswer?.multiple || []).includes(answerIndex);
    return false;
  };

  const getOptionClass = (q, userAnswer, answerIndex) => {
    if (phase !== "done") return "";
    const correct = isOptionCorrect(q, answerIndex);
    const selected = isOptionSelected(userAnswer, answerIndex);

    if (correct && selected) return "is-correct-selected";
    if (!correct && selected) return "is-incorrect-selected";
    if (correct && !selected) return "is-correct-unselected";
    return "";
  };

  const handleStart = () => {
    // Генерируем ID попытки в момент нажатия кнопки "Начать"
    const newAttemptId = String(Date.now());
    setAttemptId(newAttemptId);
    proctoringRef.current?.startRecording();
    setPhase("running");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    // Подстраховка на случай, если attemptId не заполнился
    const currentAttemptId = attemptId || String(Date.now());

    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userAnswer = answers[idx] || { single: null, multiple: [], fill: "" };

      if (test.type === "single") {
        if (userAnswer.single === q.correct) correctCount += 1;
      } else if (test.type === "multiple") {
        const correctSet = [...(q.correctMultiple || [])].sort().join(",");
        const userSet = [...(userAnswer.multiple || [])].sort().join(",");
        if (correctSet !== "" && correctSet === userSet) correctCount += 1;
      } else if (test.type === "fill") {
        const expected = (q.fillAnswer || "").trim().toLowerCase();
        const given = (userAnswer.fill || "").trim().toLowerCase();
        if (expected !== "" && expected === given) correctCount += 1;
      }
    });

    try {
      const recordings = await proctoringRef.current?.stopRecording();
      const cameraBlob = recordings?.cameraBlob;
      const screenBlob = recordings?.screenBlob;

      if (cameraBlob && cameraBlob.size > 0) {
        await saveRecording(`${currentAttemptId}_camera`, cameraBlob);
      }
      if (screenBlob && screenBlob.size > 0) {
        await saveRecording(`${currentAttemptId}_screen`, screenBlob);
      }
    } catch (err) {
      console.error("Ошибка при сохранении видеозаписей:", err);
    } finally {
      setSaving(false);
    }

    const finalResult = {
      attemptId: currentAttemptId,
      id: currentAttemptId,
      testId: test.id,
      testName: test.name,
      correct: correctCount,
      total: questions.length,
      percent: Math.round((correctCount / questions.length) * 100),
      proctoring,
      answers,
      completedAt: new Date().toISOString(),
      date: new Date().toLocaleString("ru-RU"),
    };

    setResult(finalResult);
    setPhase("done");

    if (onFinish) {
      onFinish(finalResult);
    }
  };

  const canStart = proctoring.cameraOn && proctoring.screenOn;

  return (
    <div className="tests-page">
      <BackButton onClick={handleBackClick} title={phase === "running" ? "Прервать тест" : "Назад"} />

      {/* Скрытый блок прокторинга */}
      <div className={phase === "setup" ? "" : "hidden"}>
        <ProctoringPanel ref={proctoringRef} onStatusChange={setProctoring} />
      </div>

      {phase === "setup" && (
        <>
          <div className="tests-header">
            <div>
              <h1 className="tests-title">{test.name}</h1>
              <p className="tests-subtitle">
                Перед началом включите камеру и демонстрацию экрана — запись будет вестись весь тест.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            className={`test-start-btn ${canStart ? "test-start-btn--enabled" : "test-start-btn--disabled"}`}
          >
            {canStart ? "Начать тест" : "Включите камеру и трансляцию, чтобы начать"}
          </button>
        </>
      )}

      {phase === "running" && (
        <>
          <div className="tests-header">
            <div>
              <h1 className="tests-title">{test.name}</h1>
              {test.description && <p className="tests-subtitle">{test.description}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="questions-wrapper mt-24">
            {questions.map((q, index) => (
              <div className="question-card" key={index}>
                <h3>Вопрос {index + 1}</h3>
                <p className="question-text">{q.question}</p>

                {test.type === "fill" ? (
                  <input
                    className="form-input"
                    placeholder="Ваш ответ"
                    value={answers[index]?.fill || ""}
                    onChange={(e) => setFill(index, e.target.value)}
                  />
                ) : (
                  (q.answers || []).map((answer, answerIndex) => (
                    <div className="answer-row" key={answerIndex}>
                      <input className="form-input" value={answer} readOnly />
                      {test.type === "single" ? (
                        <input
                          type="radio"
                          name={`q-${index}`}
                          checked={answers[index]?.single === answerIndex}
                          onChange={() => setSingle(index, answerIndex)}
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={(answers[index]?.multiple || []).includes(answerIndex)}
                          onChange={() => toggleMultiple(index, answerIndex)}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}

            <button type="submit" className="add-question-btn" disabled={saving}>
              {saving ? "Сохранение результатов..." : "Завершить тест"}
            </button>
          </form>
        </>
      )}

      {phase === "done" && result && (
        <>
          <div className="tests-header">
            <div>
              <h1 className="tests-title">Результат: {test.name}</h1>
              <p className="tests-subtitle">
                Правильных ответов: {result.correct} из {result.total} ({result.percent}%) — запись сохранена
              </p>
            </div>
          </div>

          <div className="questions-wrapper mt-24">
            {questions.map((q, index) => {
              const userAnswer = answers[index] || { single: null, multiple: [], fill: "" };
              return (
                <div className="question-card" key={index}>
                  <h3>Вопрос {index + 1}</h3>
                  <p className="question-text">{q.question}</p>

                  {test.type === "fill" ? (
                    <>
                      <input
                        className={`form-input fill-answer ${
                          (q.fillAnswer || "").trim().toLowerCase() ===
                          (userAnswer.fill || "").trim().toLowerCase()
                            ? "is-correct"
                            : "is-incorrect"
                        }`}
                        value={userAnswer.fill || ""}
                        disabled
                      />
                      <p className="correct-answer-hint">Правильный ответ: {q.fillAnswer}</p>
                    </>
                  ) : (
                    (q.answers || []).map((answer, answerIndex) => (
                      <div className="answer-row" key={answerIndex}>
                        <input
                          className={`form-input answer-option ${getOptionClass(q, userAnswer, answerIndex)}`}
                          value={answer}
                          disabled
                        />
                        {test.type === "single" ? (
                          <input type="radio" checked={userAnswer.single === answerIndex} disabled />
                        ) : (
                          <input type="checkbox" checked={(userAnswer.multiple || []).includes(answerIndex)} disabled />
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}