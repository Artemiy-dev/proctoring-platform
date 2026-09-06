import { useState } from "react";
import "../styles/CreateTest.css";

const DEFAULT_QUESTION = {
  question: "",
  answers: ["", "", "", ""],
  correct: 0,
  correctMultiple: [],
  fillAnswer: "",
};

export default function CreateTestModal({
  isOpen,
  onClose,
  onCreateTest,
  editTest = null,
  onUpdateTest,
}) {
  const [activeTab, setActiveTab] = useState("manual");


  const [testName, setTestName] = useState(editTest?.name || "");
  const [nameError, setNameError] = useState(false);
  const [description, setDescription] = useState(editTest?.description || "");
  const [testType, setTestType] = useState(editTest?.type || "single");
  const [uploadedFile, setUploadedFile] = useState(null);

  const [questions, setQuestions] = useState(() => {
    if (editTest?.questions?.length) {
      return editTest.questions.map((q) => ({
        question: q.question || "",
        answers: q.answers?.length ? q.answers : ["", "", "", ""],
        correct: q.correct ?? 0,
        correctMultiple: q.correctMultiple || [],
        fillAnswer: q.fillAnswer || "",
      }));
    }
    return [DEFAULT_QUESTION];
  });

  if (!isOpen) return null;

  const isEditMode = Boolean(editTest);

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

 
  const updateAnswer = (questionIndex, answerIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, qIdx) => {
        if (qIdx !== questionIndex) return q;
        return {
          ...q,
          answers: q.answers.map((ans, aIdx) =>
            aIdx === answerIndex ? value : ans
          ),
        };
      })
    );
  };


  const toggleMultipleAnswer = (questionIndex, answerIndex) => {
    setQuestions((prev) =>
      prev.map((q, qIdx) => {
        if (qIdx !== questionIndex) return q;
        const selected = q.correctMultiple;
        const updated = selected.includes(answerIndex)
          ? selected.filter((i) => i !== answerIndex)
          : [...selected, answerIndex];

        return { ...q, correctMultiple: updated };
      })
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, DEFAULT_QUESTION]);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) {
      setQuestions([DEFAULT_QUESTION]);
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!testName.trim()) {
      setNameError(true);
      return;
    }

    const payload = {
      name: testName,
      description,
      type: testType,
      questions,
    };

    if (isEditMode) {
      onUpdateTest({ ...editTest, ...payload });
    } else {
      onCreateTest({
        ...payload,
        status: "Активен",
        participants: 0,
        date: new Date().toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        }),
      });
    }

    onClose();
  };

  const handleClose = () => {
    setNameError(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content modal-large"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleClose}
        >
          ✕
        </button>

        <h2 className="modal-title">
          {isEditMode ? "Редактирование теста" : "Создание теста"}
        </h2>

        <p className="modal-subtitle">
          {isEditMode
            ? "Измените название, вопросы и ответы теста."
            : "Создайте новый тест или импортируйте готовый файл."}
        </p>

        {!isEditMode && (
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab ${activeTab === "manual" ? "active" : ""}`}
              onClick={() => setActiveTab("manual")}
            >
              ✏️ Ручной ввод
            </button>
            <button
              type="button"
              className={`modal-tab ${activeTab === "file" ? "active" : ""}`}
              onClick={() => setActiveTab("file")}
            >
              📄 Импорт файла
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === "manual" || isEditMode ? (
            <>
              <div className="form-field">
                <label className="form-label">Название теста</label>
                <input
                  className="form-input"
                  placeholder="Например: Основы React"
                  value={testName}
                  onChange={(e) => {
                    setTestName(e.target.value);
                    if (nameError) setNameError(false);
                  }}
                  style={nameError ? { borderColor: "#dc2626" } : undefined}
                />
                {nameError && (
                  <span style={{ color: "#dc2626", fontSize: "13px" }}>
                    Введите название теста
                  </span>
                )}
              </div>

              <div className="form-field">
                <label className="form-label">Описание</label>
                <textarea
                  className="form-textarea"
                  placeholder="Описание теста..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label className="form-label">Тип теста</label>
                <div className="test-types">
                  <div
                    className={`test-card ${
                      testType === "single" ? "active" : ""
                    }`}
                    onClick={() => setTestType("single")}
                  >
                    <span className="test-icon">🎯</span>
                    <div>
                      <h4>Один правильный ответ</h4>
                      <p>Пользователь выбирает один правильный вариант.</p>
                    </div>
                  </div>

                  <div
                    className={`test-card ${
                      testType === "multiple" ? "active" : ""
                    }`}
                    onClick={() => setTestType("multiple")}
                  >
                    <span className="test-icon">☑️</span>
                    <div>
                      <h4>Несколько правильных ответов</h4>
                      <p>Можно выбрать несколько правильных вариантов.</p>
                    </div>
                  </div>

                  <div
                    className={`test-card ${
                      testType === "fill" ? "active" : ""
                    }`}
                    onClick={() => setTestType("fill")}
                  >
                    <span className="test-icon">📝</span>
                    <div>
                      <h4>Вставить пропущенные слова</h4>
                      <p>Студент самостоятельно вводит недостающий текст.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="questions-wrapper">
                {questions.map((item, index) => (
                  <div className="question-card" key={index}>
                    <div className="question-card-header">
                      <h3>Вопрос {index + 1}</h3>
                      <button
                        type="button"
                        className="question-delete-btn"
                        title="Удалить вопрос"
                        onClick={() => removeQuestion(index)}
                      >
                        🗑️
                      </button>
                    </div>

                    <input
                      className="form-input"
                      placeholder="Введите вопрос..."
                      value={item.question}
                      onChange={(e) =>
                        updateQuestion(index, "question", e.target.value)
                      }
                    />

                    {testType !== "fill" &&
                      item.answers.map((answer, answerIndex) => (
                        <div className="answer-row" key={answerIndex}>
                          <input
                            className="form-input"
                            placeholder={`Ответ ${answerIndex + 1}`}
                            value={answer}
                            onChange={(e) =>
                              updateAnswer(index, answerIndex, e.target.value)
                            }
                          />

                          {testType === "single" ? (
                            <input
                              type="radio"
                              name={`question-single-${index}`}
                              checked={item.correct === answerIndex}
                              onChange={() =>
                                updateQuestion(index, "correct", answerIndex)
                              }
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={item.correctMultiple.includes(
                                answerIndex
                              )}
                              onChange={() =>
                                toggleMultipleAnswer(index, answerIndex)
                              }
                            />
                          )}
                        </div>
                      ))}

                    {testType === "fill" && (
                      <input
                        className="form-input"
                        style={{ marginTop: "10px" }}
                        placeholder="Правильное слово"
                        value={item.fillAnswer}
                        onChange={(e) =>
                          updateQuestion(index, "fillAnswer", e.target.value)
                        }
                      />
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-question-btn"
                  onClick={addQuestion}
                >
                  ＋ Добавить вопрос
                </button>
              </div>
            </>
          ) : (
            <div className="form-field">
              <label className="form-label">Импорт теста</label>
              <label htmlFor="upload" className="file-dropzone">
                <input
                  id="upload"
                  hidden
                  type="file"
                  accept=".json,.csv,.pdf"
                  onChange={(e) => setUploadedFile(e.target.files[0])}
                />
                <span className="upload-icon">📂</span>
                <span>
                  {uploadedFile
                    ? uploadedFile.name
                    : "Нажмите для выбора файла"}
                </span>
              </label>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={handleClose}
            >
              Отмена
            </button>
            <button type="submit" className="modal-btn-primary">
              {isEditMode ? "Сохранить изменения" : "Создать тест"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}