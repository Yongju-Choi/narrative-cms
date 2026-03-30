"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface AssetRef {
  slotId: string;
  slotName: string;
  slotType: string;
  assetId: string | null;
  filePath: string | null;
  displayName: string;
  isApproved: boolean;
  required: boolean;
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
  isLocked: boolean;
  price: number | null;
  nextSceneId: string | null;
  fallbackSceneId: string | null;
  unlockLabel: string | null;
}

interface CompiledCue {
  id: string;
  orderIndex: number;
  type: string;
  speaker: string | null;
  content: string;
  emotionTag: string | null;
  choices: ChoiceCue[];
}

interface CompiledScene {
  sceneId: string;
  sceneTitle: string;
  sequenceId: string | null;
  sequenceTitle: string | null;
  orderIndex: number;
  mood: string | null;
  location: string | null;
  cues: CompiledCue[];
  assets: AssetRef[];
  initialAssetState: AssetState;
}

interface CompiledSequence {
  sequenceId: string;
  sequenceTitle: string;
  orderIndex: number;
  scenes: CompiledScene[];
}

interface CompiledScript {
  scriptId: string;
  scriptTitle: string;
  sequences: CompiledSequence[];
  scenes: CompiledScene[];
}

export default function ScriptPreviewPage() {
  const { id: projectId, scriptId } = useParams<{ id: string; scriptId: string }>();

  const [script, setScript] = useState<CompiledScript | null>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [currentCueIdx, setCurrentCueIdx] = useState(0);
  const [simulateLocked, setSimulateLocked] = useState(false);
  const [showDebug, setShowDebug] = useState(true);
  const [history, setHistory] = useState<{ sceneIdx: number; cueIdx: number; reason: string }[]>([]);
  const [lastNavReason, setLastNavReason] = useState("start");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/preview/script/${scriptId}`);
    if (!res.ok) { setError("스크립트 데이터를 불러올 수 없습니다."); return; }
    setScript(await res.json());
  }, [scriptId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="container">
        <a href={`/projects/${projectId}`}>← 프로젝트로</a>
        <p style={{ color: "#c00", marginTop: 16 }}>{error}</p>
      </div>
    );
  }
  if (!script) return <p>로딩 중...</p>;
  if (script.scenes.length === 0) {
    return (<div><a href={`/projects/${projectId}`}>← 프로젝트로</a><p className="mt-16">씬이 없습니다.</p></div>);
  }

  const currentScene = script.scenes[currentSceneIdx];
  const cues = currentScene?.cues || [];
  const currentCue = cues[currentCueIdx] || null;
  const assetState = currentScene?.initialAssetState;

  function goToScene(sceneId: string, reason: string) {
    const idx = script!.scenes.findIndex((s) => s.sceneId === sceneId);
    if (idx >= 0) {
      setHistory((h) => [...h, { sceneIdx: currentSceneIdx, cueIdx: currentCueIdx, reason }]);
      setCurrentSceneIdx(idx);
      setCurrentCueIdx(0);
      setLastNavReason(reason);
    }
  }

  function goToNextScene() {
    if (currentSceneIdx < script!.scenes.length - 1) {
      setHistory((h) => [...h, { sceneIdx: currentSceneIdx, cueIdx: currentCueIdx, reason: "implicit_next" }]);
      setCurrentSceneIdx(currentSceneIdx + 1);
      setCurrentCueIdx(0);
      setLastNavReason("implicit_next");
    }
  }

  function handleNext() {
    if (currentCueIdx < cues.length - 1) {
      setCurrentCueIdx(currentCueIdx + 1);
    } else {
      goToNextScene();
    }
  }

  function handlePrev() {
    if (currentCueIdx > 0) {
      setCurrentCueIdx(currentCueIdx - 1);
    } else if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentSceneIdx(prev.sceneIdx);
      setCurrentCueIdx(prev.cueIdx);
      setLastNavReason("back");
    }
  }

  function handleChoiceClick(choice: ChoiceCue) {
    if (simulateLocked && choice.isLocked) {
      if (choice.fallbackSceneId) {
        goToScene(choice.fallbackSceneId, `fallback(${choice.label})`);
      } else {
        handleNext();
      }
    } else {
      if (choice.nextSceneId) {
        goToScene(choice.nextSceneId, `nextScene(${choice.label})`);
      } else {
        handleNext();
      }
    }
  }

  function handleRestart() {
    setCurrentSceneIdx(0); setCurrentCueIdx(0); setHistory([]); setLastNavReason("restart");
  }

  const isLastCue = currentCueIdx >= cues.length - 1;
  const isLastScene = currentSceneIdx >= script.scenes.length - 1;

  function resolveNextScene(): string {
    if (isLastScene) return "(끝)";
    return `→ #${script!.scenes[currentSceneIdx + 1].orderIndex} ${script!.scenes[currentSceneIdx + 1].sceneTitle}`;
  }

  return (
    <div>
      <div className="mb-8 flex-between">
        <a href={`/projects/${projectId}`}>← 프로젝트로</a>
        <div className="flex">
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
            <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} style={{ width: "auto", marginBottom: 0 }} />
            디버그
          </label>
          <button onClick={handleRestart} style={{ fontSize: 13 }}>처음부터</button>
        </div>
      </div>

      <h1 style={{ fontSize: 18, marginBottom: 16 }}>{script.scriptTitle} — 프리뷰</h1>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr" + (showDebug ? " 240px" : ""), gap: 16 }}>
        {/* Scene list sidebar */}
        <div>
          <h2 style={{ fontSize: 14, marginBottom: 8 }}>씬 목록</h2>
          {script.sequences.map((seq) => (
            <div key={seq.sequenceId} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 2 }}>
                {seq.sequenceTitle}
              </div>
              {seq.scenes.map((s) => {
                const idx = script.scenes.findIndex((sc) => sc.sceneId === s.sceneId);
                return (
                  <div key={s.sceneId} onClick={() => goToScene(s.sceneId, "manual")} style={{
                    padding: "6px 10px", marginBottom: 2, borderRadius: 4, cursor: "pointer", fontSize: 12,
                    background: idx === currentSceneIdx ? "#0066cc" : "#fff",
                    color: idx === currentSceneIdx ? "#fff" : "#333",
                    border: "1px solid " + (idx === currentSceneIdx ? "#0066cc" : "#eee"),
                  }}>
                    #{s.orderIndex} {s.sceneTitle}
                  </div>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={simulateLocked} onChange={(e) => setSimulateLocked(e.target.checked)} style={{ width: "auto", marginBottom: 0 }} />
              잠금 시뮬레이션
            </label>
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ background: "#1a1a2e", borderRadius: 6, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "8px 16px", background: "#16213e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#aaa" }}>
              {currentScene.sceneTitle}
              {currentScene.mood && <span style={{ marginLeft: 8 }}>({currentScene.mood})</span>}
              {currentScene.location && <span style={{ marginLeft: 8 }}>@ {currentScene.location}</span>}
            </span>
            <span style={{ fontSize: 12, color: "#666" }}>
              Cue {currentCueIdx + 1}/{cues.length} · Scene {currentSceneIdx + 1}/{script.scenes.length}
            </span>
          </div>

          {/* Asset State Bar */}
          {assetState && (() => {
            const t = assetState.assetsByType;
            return (
              <div style={{ padding: "6px 16px", background: "#0d1b2a", display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11 }}>
                <span style={{ color: t.background ? (t.background.isApproved ? "#6a6" : "#ca6") : "#666" }}>
                  BG: {t.background ? t.background.displayName : "없음"}
                  {t.background && !t.background.isApproved && <span style={{ color: "#ca6" }}> ⚠</span>}
                  {t.background && !t.background.exists && <span style={{ color: "#f66" }}> ✗</span>}
                </span>
                <span style={{ color: (t.characters?.length || 0) > 0 ? "#6a6" : "#666" }}>
                  CHAR: {(t.characters?.length || 0) > 0 ? t.characters!.map((c) => c.displayName).join(", ") : "없음"}
                  {t.characters?.some((c) => !c.isApproved) && <span style={{ color: "#ca6" }}> ⚠</span>}
                </span>
                <span style={{ color: t.bgm ? (t.bgm.isApproved ? "#6a6" : "#ca6") : "#666" }}>
                  BGM: {t.bgm ? t.bgm.displayName : "없음"}
                  {t.bgm && !t.bgm.isApproved && <span style={{ color: "#ca6" }}> ⚠</span>}
                  {t.bgm && !t.bgm.exists && <span style={{ color: "#f66" }}> ✗</span>}
                </span>
                {t.messageImages?.map((a) => (
                  <span key={a.slotId} style={{ color: a.isApproved ? "#9a9" : "#ca6" }}>
                    IMG: {a.displayName}{!a.isApproved && " ⚠"}{!a.exists && <span style={{ color: "#f66" }}> ✗</span>}
                  </span>
                ))}
                {t.shortVideos?.map((a) => (
                  <span key={a.slotId} style={{ color: a.isApproved ? "#9a9" : "#ca6" }}>
                    VID: {a.displayName}{!a.isApproved && " ⚠"}{!a.exists && <span style={{ color: "#f66" }}> ✗</span>}
                  </span>
                ))}
              </div>
            );
          })()}

          {/* Content */}
          <div style={{ minHeight: 220, padding: 24, display: "flex", flexDirection: "column", justifyContent: "flex-end", color: "#eee" }}>
            {!currentCue ? (
              <p style={{ color: "#888" }}>이 씬에 이벤트 블록이 없습니다.</p>
            ) : currentCue.type === "choice" && currentCue.choices.length > 0 ? (
              <div>
                <p style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>선택지</p>
                {currentCue.choices.map((c) => {
                  const locked = simulateLocked && c.isLocked;
                  return (
                    <button key={c.id} onClick={() => handleChoiceClick(c)} style={{
                      display: "block", width: "100%", padding: "10px 16px", marginBottom: 8,
                      background: locked ? "#2a1a1a" : "#16213e",
                      border: locked ? "1px solid #663333" : "1px solid #333",
                      borderRadius: 4, color: locked ? "#cc8888" : "#eee", cursor: "pointer", textAlign: "left",
                    }}>
                      {locked && c.unlockLabel ? c.unlockLabel : c.label}
                      {c.isPremium && <span style={{ marginLeft: 8, fontSize: 11, color: "#f0c040" }}>PREMIUM{c.price ? ` (${c.price})` : ""}</span>}
                      {locked && <span style={{ marginLeft: 8, fontSize: 11, color: "#c66" }}>잠김</span>}
                      {c.nextSceneId && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: "#6a6" }}>
                          → {script.scenes.find((s) => s.sceneId === c.nextSceneId)?.sceneTitle || "?"}
                        </span>
                      )}
                      {locked && c.fallbackSceneId && (
                        <span style={{ marginLeft: 8, fontSize: 10, color: "#c96" }}>
                          fallback: {script.scenes.find((s) => s.sceneId === c.fallbackSceneId)?.sceneTitle || "?"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                {currentCue.emotionTag && <span style={{ fontSize: 11, color: "#f0c040", marginBottom: 4, display: "block" }}>[{currentCue.emotionTag}]</span>}
                <span style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>{currentCue.type}</span>
                {currentCue.speaker && <strong style={{ color: "#7ec8e3", display: "block", marginBottom: 4 }}>{currentCue.speaker}</strong>}
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: 15 }}>{currentCue.content}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ padding: "12px 16px", background: "#16213e", display: "flex", justifyContent: "space-between" }}>
            <button onClick={handlePrev} disabled={currentCueIdx === 0 && history.length === 0} style={{
              padding: "6px 16px", background: "none", border: "1px solid #444",
              color: currentCueIdx === 0 && history.length === 0 ? "#555" : "#eee",
              cursor: currentCueIdx === 0 && history.length === 0 ? "default" : "pointer", borderRadius: 4,
            }}>← 이전</button>
            <div className="flex" style={{ gap: 8 }}>
              {isLastCue && !isLastScene && (
                <button onClick={goToNextScene} style={{ padding: "6px 16px", background: "#1a5c2a", border: "1px solid #2a8c3a", color: "#fff", cursor: "pointer", borderRadius: 4, fontSize: 13 }}>다음 씬 →</button>
              )}
              <button onClick={handleNext} disabled={isLastCue && isLastScene} style={{
                padding: "6px 16px", background: isLastCue && isLastScene ? "none" : "#0066cc",
                border: "1px solid #0066cc", color: isLastCue && isLastScene ? "#555" : "#fff",
                cursor: isLastCue && isLastScene ? "default" : "pointer", borderRadius: 4,
              }}>{isLastCue && isLastScene ? "끝" : "다음 →"}</button>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div style={{ background: "#111", color: "#ccc", borderRadius: 6, padding: 12, fontSize: 11, lineHeight: 1.8 }}>
            <h3 style={{ fontSize: 13, color: "#fff", marginBottom: 8, borderBottom: "1px solid #333", paddingBottom: 4 }}>Debug</h3>
            <div><strong>Script:</strong> {script.scriptTitle}</div>
            <div><strong>Sequence:</strong> {currentScene.sequenceTitle || "—"}</div>
            <div><strong>Scene:</strong> #{currentScene.orderIndex} {currentScene.sceneTitle}</div>
            <div><strong>Scene ID:</strong> <code style={{ fontSize: 10 }}>{currentScene.sceneId.slice(0, 12)}...</code></div>
            <div><strong>Cue:</strong> {currentCueIdx + 1}/{cues.length}</div>
            <div><strong>Cue Type:</strong> {currentCue?.type || "—"}</div>

            <div style={{ marginTop: 8, borderTop: "1px solid #333", paddingTop: 4 }}>
              <strong>Navigation:</strong>
              <div>Last: <span style={{ color: "#8af" }}>{lastNavReason}</span></div>
              <div>Next: <span style={{ color: "#8fa" }}>{resolveNextScene()}</span></div>
              <div>Locked sim: <span style={{ color: simulateLocked ? "#f88" : "#888" }}>{simulateLocked ? "ON" : "OFF"}</span></div>
              <div>History: {history.length} entries</div>
            </div>

            <div style={{ marginTop: 8, borderTop: "1px solid #333", paddingTop: 4 }}>
              <strong>Active Assets:</strong>
              {(() => {
                const t = assetState?.assetsByType;
                if (!t || (!t.background && !t.bgm && !(t.characters?.length))) {
                  return <div style={{ color: "#666" }}>없음</div>;
                }
                return (
                  <>
                    {t.background && (
                      <div style={{ color: t.background.exists ? "#6a6" : "#f66" }}>
                        BG: {t.background.displayName} {t.background.exists ? "✓" : "✗ missing"}
                      </div>
                    )}
                    {t.characters?.map((c) => (
                      <div key={c.slotId} style={{ color: c.exists ? "#6a6" : "#f66" }}>
                        CHAR: {c.displayName} {c.exists ? "✓" : "✗"}
                      </div>
                    ))}
                    {t.bgm && (
                      <div style={{ color: t.bgm.exists ? "#6a6" : "#f66" }}>
                        BGM: {t.bgm.displayName} {t.bgm.exists ? "✓" : "✗"}
                      </div>
                    )}
                    {t.messageImages?.map((a) => (
                      <div key={a.slotId} style={{ color: a.exists ? "#6a6" : "#f66" }}>
                        IMG: {a.displayName} {a.exists ? "✓" : "✗"}
                      </div>
                    ))}
                    {t.shortVideos?.map((a) => (
                      <div key={a.slotId} style={{ color: a.exists ? "#6a6" : "#f66" }}>
                        VID: {a.displayName} {a.exists ? "✓" : "✗"}
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>

            <div style={{ marginTop: 8, borderTop: "1px solid #333", paddingTop: 4 }}>
              <strong>All Slots ({currentScene.assets.length}):</strong>
              {currentScene.assets.map((a) => (
                <div key={a.slotId} style={{ color: a.assetId ? (a.exists ? "#6a6" : "#f66") : (a.required ? "#f88" : "#666") }}>
                  {a.slotType}: {a.displayName} {a.assetId ? (a.exists ? "✓" : "✗") : (a.required ? "⚠ empty" : "○")}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8, borderTop: "1px solid #333", paddingTop: 4 }}>
              <strong>Approval:</strong>
              {currentScene.assets.filter((a) => a.assetId).length === 0 ? (
                <div style={{ color: "#666" }}>할당된 에셋 없음</div>
              ) : (
                currentScene.assets.filter((a) => a.assetId).map((a) => (
                  <div key={a.slotId} style={{ color: a.isApproved ? "#6a6" : "#ca6" }}>
                    {a.slotType}: {a.displayName} — {a.isApproved ? "approved" : "not approved ⚠"}
                  </div>
                ))
              )}
            </div>

            {currentCue?.type === "choice" && currentCue.choices.length > 0 && (
              <div style={{ marginTop: 8, borderTop: "1px solid #333", paddingTop: 4 }}>
                <strong>Choice Detail:</strong>
                {currentCue.choices.map((c) => {
                  const locked = simulateLocked && c.isLocked;
                  return (
                    <div key={c.id} style={{ fontSize: 10, color: locked ? "#f88" : "#8af" }}>
                      {c.label} → {c.nextSceneId ? (script.scenes.find((s) => s.sceneId === c.nextSceneId)?.sceneTitle || "?") : "none"}
                      {locked && c.fallbackSceneId && ` | fb: ${script.scenes.find((s) => s.sceneId === c.fallbackSceneId)?.sceneTitle || "?"}`}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
