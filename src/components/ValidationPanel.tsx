"use client";

interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  entityType: string;
  entityId: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  checkedAt: string;
}

export default function ValidationPanel({ result }: { result: ValidationResult }) {
  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  return (
    <div>
      <div className="flex" style={{ marginBottom: 12 }}>
        <span style={{
          padding: "4px 12px",
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          background: result.valid ? "#d4edda" : "#f8d7da",
          color: result.valid ? "#155724" : "#721c24",
        }}>
          {result.valid ? "VALID" : `${errors.length} ERROR${errors.length !== 1 ? "S" : ""}`}
        </span>
        {warnings.length > 0 && (
          <span style={{
            padding: "4px 12px",
            borderRadius: 4,
            fontSize: 13,
            background: "#fff3cd",
            color: "#856404",
          }}>
            {warnings.length} WARNING{warnings.length !== 1 ? "S" : ""}
          </span>
        )}
        <span style={{ fontSize: 12, color: "#888" }}>
          {new Date(result.checkedAt).toLocaleTimeString("ko-KR")}
        </span>
      </div>

      {result.issues.length === 0 && (
        <p style={{ color: "#666", fontSize: 14 }}>문제가 발견되지 않았습니다.</p>
      )}

      {result.issues.map((issue, idx) => (
        <div
          key={idx}
          style={{
            padding: "8px 12px",
            marginBottom: 6,
            borderLeft: `3px solid ${issue.severity === "error" ? "#dc3545" : "#ffc107"}`,
            background: issue.severity === "error" ? "#fff5f5" : "#fffdf0",
            borderRadius: "0 4px 4px 0",
            fontSize: 13,
          }}
        >
          <div className="flex-between">
            <span>
              <strong style={{ color: issue.severity === "error" ? "#dc3545" : "#856404" }}>
                {issue.code}
              </strong>
              <span style={{ marginLeft: 8 }}>{issue.message}</span>
            </span>
            <span style={{ fontSize: 11, color: "#999", flexShrink: 0, marginLeft: 8 }}>
              {issue.entityType}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
