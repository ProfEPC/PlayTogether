interface TimingSelectorProps {
  timing: string | null;
  onTimingChange: (timing: "before" | "after") => void;
}

export function TimingSelector({
  timing,
  onTimingChange,
}: TimingSelectorProps) {
  return (
    <div className="timing-section">
      <label>Timing:</label>
      <div className="timing-buttons">
        <button
          className={`timing-btn ${timing === "before" ? "active" : ""}`}
          onClick={() => onTimingChange("before")}
        >
          Before Swap
        </button>
        <button
          className={`timing-btn ${timing === "after" ? "active" : ""}`}
          onClick={() => onTimingChange("after")}
        >
          After Swap
        </button>
      </div>
    </div>
  );
}
