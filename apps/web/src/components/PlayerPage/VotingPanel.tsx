import type { FC } from "react";
import type { Submission } from "../../types/room";

interface VotingPanelProps {
  voteOptions: Array<{ id: string; label: string }>;
  selectedVote: string | null;
  mySubmission: Submission | null;
  roundId: string | null;
  secondsLeft: number;
  onSelectVote: (voteId: string) => void;
  onSubmit: () => void;
}

export const VotingPanel: FC<VotingPanelProps> = ({
  voteOptions,
  selectedVote,
  mySubmission,
  roundId,
  secondsLeft,
  onSelectVote,
  onSubmit,
}) => (
  <div style={{ padding: 12, border: "1px solid #ccc", borderRadius: 8, position: "relative" }}>
    {/* Timer in top right corner */}
    <div style={{ position: "absolute", top: 12, right: 12, fontSize: "0.9em", opacity: 0.7 }}>
      <strong>{secondsLeft}s</strong>
    </div>

    {/* Voting header with submission status */}
    <div style={{ marginBottom: 8 }}>
      <strong>Vote</strong>
      {mySubmission && (
        <span style={{ marginLeft: 8, opacity: 0.7 }}>submitted ✅</span>
      )}
    </div>

    {/* Radio buttons for each voting option (players + No Infiltrator) */}
    <div style={{ display: "grid", gap: 6 }}>
      {voteOptions.map((opt) => (
        <label
          key={opt.id}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <input
            type="radio"
            name="vote"
            value={opt.id}
            checked={selectedVote === opt.id}
            disabled={!!mySubmission}
            onChange={() => onSelectVote(opt.id)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>

    {/* Submit vote button - disabled after submission */}
    <button
      onClick={onSubmit}
      disabled={!roundId || !!mySubmission}
      style={{ marginTop: 10 }}
    >
      Submit Vote
    </button>
  </div>
);
