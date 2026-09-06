import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import AuthModal from "./AuthModal";
import CreateTestModal from "./CreateTestModal";

import "../styles/index.css";
import "../styles/Dashboard.css";
import "../styles/Tests.css";

import Header from "./Header";
import SideBar from "./SideBar";
import Dashboard from "./Dashboard";
import SavedTests from "./SavedTests";
import TestRunner from "./TestRunner";
import AdminRecordings from "./AdminRecordings";
import AttemptDetails from "./AttemptDetail";

import {
  loadTests,
  saveTests,
  loadAttempts,
  saveAttempts,
} from "../data/utils/storage";

import { useAuth } from "../AuthContext.jsx";
const defaultTests = [];

function TestRunnerRoute({ testsList, onExit, onFinishTest }) {
  const { testId } = useParams();
  const test = testsList.find((t) => String(t.id) === String(testId));

  if (!test) {
    return (
      <div className="tests-page">
        <div className="tests-header">
          <div>
            <h1 className="tests-title">Тест не найден</h1>
            <p className="tests-subtitle">Возможно, он был удалён.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TestRunner
      test={test}
      onExit={onExit}
      onFinish={(result) => onFinishTest(test.id, result)}
    />
  );
}

function AttemptDetailsRoute({ attemptsList, testsList, onDeleteAttempt }) {
  const { attemptId } = useParams();
  const attempt = attemptsList.find(
    (a) => String(a.attemptId ?? a.id) === String(attemptId)
  );

  if (!attempt) {
    return (
      <div className="tests-page">
        <div className="tests-header">
          <div>
            <h1 className="tests-title">Попытка не найдена</h1>
            <p className="tests-subtitle">Возможно, она была удалена.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AttemptDetails
      attempt={attempt}
      testsList={testsList}
      onDeleteAttempt={onDeleteAttempt}
    />
  );
}

function RequireAuth({ user, onRequireLogin, children }) {
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => onRequireLogin(), 0);
      return () => clearTimeout(timer);
    }
  }, [user, onRequireLogin]);

  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RequireAdmin({ user, children }) {
  // Проверяем роль в верхнем регистре
  const userRole = user?.role?.toUpperCase();
  if (!user || userRole !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);

  const [testsList, setTestsList] = useState(() => loadTests(defaultTests));
  const [attemptsList, setAttemptsList] = useState(() => loadAttempts());

  const {
    user: currentUser,
    isAdmin,
    isLoading: isAuthLoading,
    login,
    registration,
    logout,
  } = useAuth();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authError, setAuthError] = useState("");

  const openAuth = () => {
    setAuthError("");
    setIsAuthOpen(true);
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
    setAuthError("");
  };

  const handleLogin = async (email, password) => {
  try {
    setAuthError(""); 
    await login(email, password);
    closeAuth();
  } catch (err) {
    setAuthError(
      err.response?.data?.message || "Неверный email или пароль"
    );
  }
};
  const handleRegister = async ({ email, password, name }) => {
    try {
      await registration(email, password, name);
      closeAuth();
    } catch (err) {
      setAuthError(
        err.response?.data?.message ||
          "Не удалось зарегистрироваться. Попробуйте другой email."
      );
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    saveTests(testsList);
  }, [testsList]);

  useEffect(() => {
    saveAttempts(attemptsList);
  }, [attemptsList]);

  const editingTest =
    testsList.find((t) => String(t.id) === String(editingTestId)) || null;

  const handleCreateTest = (newTest) => {
    setTestsList((prev) => [{ ...newTest, id: Date.now() }, ...prev]);
  };

  const handleUpdateTest = (updatedTest) => {
    setTestsList((prev) =>
      prev.map((t) =>
        String(t.id) === String(updatedTest.id) ? updatedTest : t
      )
    );
    setEditingTestId(null);
  };

  const closeTestModal = () => {
    setIsCreateModalOpen(false);
    setEditingTestId(null);
  };

  const handleDeleteTest = (testId) => {
    setTestsList((prev) => prev.filter((t) => String(t.id) !== String(testId)));
  };

  const handleStartTest = (testId) => navigate(`/tests/${testId}`);
  const handleExitTest = () => navigate("/tests");

  const handleFinishTest = (testId, result) => {
    const attempt = {
      attemptId: Date.now(),
      testId,
      ...result,
      completedAt: new Date().toISOString(),
    };

    setAttemptsList((prev) => [...prev, attempt]);

    setTestsList((prev) =>
      prev.map((t) =>
        String(t.id) === String(testId)
          ? { ...t, participants: (t.participants || 0) + 1 }
          : t
      )
    );

    navigate("/tests");
  };

  const handleDeleteAttempt = (attemptId) => {
    setAttemptsList((prev) =>
      prev.filter((a) => String(a.attemptId ?? a.id) !== String(attemptId))
    );
  };

  if (isAuthLoading) {
    return (
      <div className="app-shell">
        <Header currentUser={currentUser} onOpenAuth={openAuth} onLogout={handleLogout} />
        <div className="app-body">
          <main className="app-content">
            <p>Загрузка...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Передаем данные пользователя в Header */}
      <Header
        currentUser={currentUser}
        isAdmin={isAdmin}
        onOpenAuth={openAuth}
        onLogout={handleLogout}
      />

      <div className="app-body">
        {/* Передаем пропсы user и currentUser для совпадения любого именования в SideBar */}
        <SideBar
          user={currentUser}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onOpenAuth={openAuth}
          onLogout={handleLogout}
        />

        <main className="app-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <Dashboard
                  onOpenCreateModal={() => setIsCreateModalOpen(true)}
                />
              }
            />

            <Route
              path="/tests"
              element={
                <RequireAuth user={currentUser} onRequireLogin={openAuth}>
                  <SavedTests
                    testsList={testsList}
                    isAdmin={isAdmin}
                    onOpenCreateModal={() => setIsCreateModalOpen(true)}
                    onStartTest={handleStartTest}
                    onEditTest={(testId) => setEditingTestId(testId)}
                    onDeleteTest={handleDeleteTest}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/tests/:testId"
              element={
                <RequireAuth user={currentUser} onRequireLogin={openAuth}>
                  <TestRunnerRoute
                    testsList={testsList}
                    onExit={handleExitTest}
                    onFinishTest={handleFinishTest}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/proctoring"
              element={
                <RequireAdmin user={currentUser}>
                  <AdminRecordings
                    attempts={attemptsList}
                    testsList={testsList}
                    onDeleteAttempt={handleDeleteAttempt}
                  />
                </RequireAdmin>
              }
            />

            <Route
              path="/proctoring/:attemptId"
              element={
                <RequireAdmin user={currentUser}>
                  <AttemptDetailsRoute
                    attemptsList={attemptsList}
                    testsList={testsList}
                    onDeleteAttempt={handleDeleteAttempt}
                  />
                </RequireAdmin>
              }
            />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={closeAuth}
        onLogin={handleLogin}
        onRegister={handleRegister}
        error={authError}
      />

      <CreateTestModal
        key={editingTest ? `edit-${editingTest.id}` : "create"}
        isOpen={isCreateModalOpen || editingTestId !== null}
        onClose={closeTestModal}
        onCreateTest={handleCreateTest}
        editTest={editingTest}
        onUpdateTest={handleUpdateTest}
      />
    </div>
  );
}