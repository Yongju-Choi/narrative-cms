"use client";

import { useState } from "react";

interface AssetRef {
  slotId: string;
  slotName: string;
  slotType: string;
  displayName: string;
  isApproved: boolean;
  exists: boolean;
}

interface AssetState {
  assetsByType: {
    background?: AssetRef;
    characters?: AssetRef[];
    bgm?: AssetRef;
    messageImages?: AssetRef[];
    shortVideos?: AssetRef[];
  };
}

interface ChoiceCue {
  id: string;
  label: string;
  isPremium: boolean;
  price: number | null;
}

interface PreviewCue {
  id: string;
  orderIndex: number;
  type: string;
  speaker: string | null;
  content: string;
  emotionTag: string | null;
  choices: ChoiceCue[];
}

interface ScenePreviewData {
  sceneId: string;
  sceneTitle: string;
  cues: PreviewCue[];
  initialAssetState?: AssetState | null;
}

export default function PreviewPanel({ sceneId }: { sceneId: string }) {
  const [data, setData] = useState<ScenePreviewData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPreview() {
    setError(null);
    const res = await fetch(`/api/preview/${sceneId}`);
    if (!res.ok) {
      setError("프리뷰 데이터를 불러올 수 없습니다.");
      return;
    }
    const d = await res.json();
    setData(d);
    setCurrentIndex(0);
    setSelectedChoices(new Set());
    setRunning(true);
  }

  function handleNext() {
    if (!data) return;
    if (currentIndex < data.cues.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleChoiceSelect(choiceId: string) {
    setSelectedChoices((prev) => new Set(prev).add(choiceId));
  }

  function stopPreview() {
    setRunning(false);
    setData(null);
    setCurrentIndex(0);
  }

  if (!running) {
    return (
      <div className="card" style={{ background: "#1a1a2e", color: "#eee", textAlign: "center", padding: 32 }}>
        <p style={{ marginBottom: 12, color: "#aaa" }}>씬 프리뷰</p>
        <button className="btn-primary" onClick={startPreview}>프리뷰 실행</button>
        {error && <p style={{ color: "#f66", marginTop: 8 }}>{error}</p>}
      </div>
    );
  }

  if (!data || data.cues.length === 0) {
    return (
      <div className="card" style={{ background: "#1a1a2e", color: "#eee", textAlign: "center", padding: 32 }}>
        <p>이벤트 블록이 없습니다.</p>
        <button onClick={stopPreview} style={{ marginTop: 12 }}>닫기</button>
      </div>
    );
  }

  const cue = data.cues[currentIndex];

  return (
    <div style={{ background: "#1a1a2e", color: "#eee", borderRadius: 6, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 16px", background: "#16213e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#aaa" }}>
          {data.sceneTitle} — {currentIndex + 1} / {data.cues.length}
        </span>
        <button onClick={stopPreview} style={{ background: "none", border: "none", color: "#f66", cursor: "pointer", fontSize: 13 }}>
          닫기
        </button>
      </div>

      {/* Asset State Bar */}
      {data.initialAssetState && (() => {
        const t = data.initialAssetState.assetsByType;
        return (
          <div style={{ padding: "6px 16px", background: "#0d1b2a", display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11 }}>
            <span style={{ color: t.background ? (t.background.isApproved ? "#6a6" : "#ca6") : "#666" }}>
              BG: {t.background ? t.background.displayName : "없음"}
              {t.background && !t.background.isApproved && <span style={{ color: "#ca6" }}> ⚠</span>}
              {t.background && !t.background.exists && <span style={{ color: "#f66" }}> ✗</span>}
            </span>
            <span style={{ color: (t.characters?.length || 0) > 0 ? "#6a6" : "#666" }}>
              CHAR: {(t.characters?.length || 0) > 0 ? t.characters!.map((c) => c.displayName).join(", ") : "없음"}
            </span>
            <span style={{ color: t.bgm ? (t.bgm.isApproved ? "#6a6" : "#ca6") : "#666" }}>
              BGM: {t.bgm ? t.bgm.displayName : "없음"}
              {t.bgm && !t.bgm.isApproved && <span style={{ color: "#ca6" }}> ⚠</span>}
            </span>
          </div>
        );
      })()}

      {/* Content area */}
      <div style={{ minHeight: 200, padding: 24, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {cue.type === "choice" && cue.choices.length > 0 ? (
          <div>
            <p style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>선택지</p>
            {cue.choices.map((c) => (
              <button
                key={c.id}
                onClick={() => handleChoiceSelect(c.id)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "10px 16px",
                  marginBottom: 8,
                  background: selectedChoices.has(c.id) ? "#0f3460" : "#16213e",
                  border: selectedChoices.has(c.id) ? "1px solid #0066cc" : "1px solid #333",
                  borderRadius: 4,
                  color: "#eee",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {c.label}
                {c.isPremium && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#f0c040" }}>
                    PREMIUM{c.price ? ` (${c.price})` : ""}
                  </span>
                )}
                {selectedChoices.has(c.id) && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: "#4f4" }}>선택됨</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div>
            {cue.emotionTag && (
              <span style={{ fontSize: 11, color: "#f0c040", marginBottom: 4, display: "block" }}>
                [{cue.emotionTag}]
              </span>
            )}
            <span style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>
              {cue.type}
            </span>
            {cue.speaker && (
              <strong style={{ color: "#7ec8e3", display: "block", marginBottom: 4 }}>
                {cue.speaker}
              </strong>
            )}
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 15 }}>{cue.content}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ padding: "12px 16px", background: "#16213e", display: "flex", justifyContent: "space-between" }}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{
            padding: "6px 16px",
            background: "none",
            border: "1px solid #444",
            color: currentIndex === 0 ? "#555" : "#eee",
            cursor: currentIndex === 0 ? "default" : "pointer",
            borderRadius: 4,
          }}
        >
          ← 이전
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex >= data.cues.length - 1}
          style={{
            padding: "6px 16px",
            background: currentIndex >= data.cues.length - 1 ? "none" : "#0066cc",
            border: "1px solid #0066cc",
            color: currentIndex >= data.cues.length - 1 ? "#555" : "#fff",
            cursor: currentIndex >= data.cues.length - 1 ? "default" : "pointer",
            borderRadius: 4,
          }}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
