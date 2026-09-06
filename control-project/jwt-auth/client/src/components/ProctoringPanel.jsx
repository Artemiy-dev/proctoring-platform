import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createPortal } from "react-dom";
import '../styles/Proctoring.css';

function detectBrowser() {
  if (typeof navigator === "undefined") return "Неизвестный браузер";
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Chrome/") && !ua.includes("Edg/") && !ua.includes("OPR/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  return "Неизвестный браузер";
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
    "video/mp4",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

const KNOWN_BROWSERS = ["Chrome", "Firefox", "Opera", "Edge"];
const CAMERA_CORNERS = ["bottom-right", "bottom-left", "top-left", "top-right"];

const CORNER_POSITION_STYLE = {
  "bottom-right": { bottom: 20, right: 20 },
  "bottom-left": { bottom: 20, left: 20 },
  "top-left": { top: 20, left: 20 },
  "top-right": { top: 20, right: 20 },
};

const ProctoringPanel = forwardRef(function ProctoringPanel({ onStatusChange }, ref) {
  const [browser] = useState(detectBrowser);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [cornerIndex, setCornerIndex] = useState(0);

  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const videoRef = useRef(null);
  const floatingVideoRef = useRef(null);

  const cameraRecorderRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const cameraChunksRef = useRef([]);
  const screenChunksRef = useRef([]);

  // Вспомогательная функция для корректного закрытия потоков
  const stopStream = (streamRef) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    onStatusChange?.({ browser, cameraOn, screenOn });
  }, [browser, cameraOn, screenOn, onStatusChange]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      stopStream(cameraStreamRef);
      stopStream(screenStreamRef);
    };
  }, []);

  // Синхронизация потока камеры с видео-тегами + вызов play() против зависаний
  useEffect(() => {
    if (!cameraStreamRef.current) return;

    [videoRef.current, floatingVideoRef.current].forEach((video) => {
      if (video) {
        video.srcObject = cameraStreamRef.current;
        video.play().catch((err) => console.warn("Auto-play prevented:", err));
      }
    });
  }, [cameraOn]);

  const enableCamera = async () => {
    try {
      stopStream(cameraStreamRef); // Останавливаем старый поток перед запуском нового
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      cameraStreamRef.current = stream;

      [videoRef.current, floatingVideoRef.current].forEach((video) => {
        if (video) {
          video.srcObject = stream;
          video.play().catch((err) => console.warn("Auto-play prevented:", err));
        }
      });

      setCameraOn(true);
    } catch (err) {
      console.error("Ошибка при включении камеры:", err);
      setCameraOn(false);
    }
  };

  const enableScreenShare = async () => {
    try {
      stopStream(screenStreamRef); // Останавливаем старый поток экрана перед запуском
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = stream;
      setScreenOn(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          setScreenOn(false);
          screenStreamRef.current = null;
        });
      }
    } catch (err) {
      console.error("Ошибка при включении экрана:", err);
      setScreenOn(false);
    }
  };

  const cycleCameraCorner = () => {
    setCornerIndex((i) => (i + 1) % CAMERA_CORNERS.length);
  };

  useImperativeHandle(ref, () => ({
    startRecording() {
      cameraChunksRef.current = [];
      screenChunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;

      if (cameraStreamRef.current) {
        try {
          const rec = new MediaRecorder(cameraStreamRef.current, options);
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) cameraChunksRef.current.push(e.data);
          };
          rec.start(200);
          cameraRecorderRef.current = rec;
        } catch (err) {
          console.error("Ошибка записи камеры:", err);
        }
      }

      if (screenStreamRef.current) {
        try {
          const rec = new MediaRecorder(screenStreamRef.current, options);
          rec.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) screenChunksRef.current.push(e.data);
          };
          rec.start(200);
          screenRecorderRef.current = rec;
        } catch (err) {
          console.error("Ошибка записи экрана:", err);
        }
      }
    },

    stopRecording() {
      const stopSingleRecorder = (recorder, chunksRef) => {
        return new Promise((resolve) => {
          if (!recorder || recorder.state === "inactive") {
            const mime = recorder?.mimeType || "video/webm";
            resolve(chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mime }) : null);
            return;
          }

          recorder.onstop = () => {
            const mime = recorder.mimeType || "video/webm";
            const blob = chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mime }) : null;
            resolve(blob);
          };

          try {
            if (recorder.state === "recording") {
              recorder.requestData();
            }
            recorder.stop();
          } catch (e) {
            console.warn("Ошибка stopRecorder:", e);
            const mime = recorder.mimeType || "video/webm";
            resolve(chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type: mime }) : null);
          }
        });
      };

      return Promise.all([
        stopSingleRecorder(cameraRecorderRef.current, cameraChunksRef),
        stopSingleRecorder(screenRecorderRef.current, screenChunksRef),
      ]).then(([cameraBlob, screenBlob]) => {
        stopStream(cameraStreamRef);
        stopStream(screenStreamRef);
        setCameraOn(false);
        setScreenOn(false);

        return { cameraBlob, screenBlob };
      });
    },
  }));

  return (
    <>
      <div className="question-card" style={{ marginBottom: 24 }}>
        <h3>Проверка прокторинга</h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {KNOWN_BROWSERS.map((name) => (
            <span
              key={name}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                background: browser === name ? "#dcfce7" : "#f1f5f9",
                color: browser === name ? "#16a34a" : "#94a3b8",
              }}
            >
              {browser === name ? name : `нет ${name.toLowerCase()}`}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={enableCamera}
            style={{
              width: "auto",
              padding: "0 20px",
              height: 42,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              cursor: cameraOn ? "default" : "pointer",
              border: cameraOn ? "1px solid #86efac" : "1px solid #0f172a",
              background: cameraOn ? "#f0fdf4" : "#0f172a",
              color: cameraOn ? "#16a34a" : "#ffffff",
              transition: "background 0.15s ease",
            }}
          >
            {cameraOn ? "✓ Камера включена" : "Нет камеры — включить"}
          </button>

          <button
            type="button"
            onClick={enableScreenShare}
            style={{
              width: "auto",
              padding: "0 20px",
              height: 42,
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 14,
              cursor: screenOn ? "default" : "pointer",
              border: screenOn ? "1px solid #86efac" : "1px solid #0f172a",
              background: screenOn ? "#f0fdf4" : "#0f172a",
              color: screenOn ? "#16a34a" : "#ffffff",
              transition: "background 0.15s ease",
            }}
          >
            {screenOn ? "✓ Трансляция активна" : "Нет трансляции — включить"}
          </button>

          {cameraOn && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: 96, height: 72, borderRadius: 10, background: "#000", objectFit: "cover" }}
            />
          )}
        </div>
      </div>

      {cameraOn &&
        typeof document !== "undefined" &&
        document.body &&
        createPortal(
          <div
            className="floating-camera-preview"
            style={CORNER_POSITION_STYLE[CAMERA_CORNERS[cornerIndex]]}
            onClick={cycleCameraCorner}
            title="Нажми, чтобы переместить в другой угол"
          >
            <video ref={floatingVideoRef} autoPlay muted playsInline />
            <span className="floating-camera-hint">⇄</span>
          </div>,
          document.body
        )}
    </>
  );
});

export default ProctoringPanel;