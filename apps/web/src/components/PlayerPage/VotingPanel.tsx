import type { FC } from "react";
import type { Vote, RoomState } from "../../types/room";
import { COLORS } from "../../constants/colors";

interface VotingPanelProps {
  roomState: RoomState | null;
  voteOptions: Array<{ id: string; label: string }>;
  selectedVote: string | null;
  myVote: Vote | null;
  gameId: string | null;
  secondsLeft: number;
  onSelectVote: (voteId: string) => void;
  onSubmit: () => void;
}

export const VotingPanel: FC<VotingPanelProps> = ({
  roomState,
  voteOptions,
  selectedVote,
  myVote,
  gameId,
  secondsLeft,
  onSelectVote,
  onSubmit,
}) => (
  <div
    style={{
      padding: 12,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      position: "relative",
    }}
  >
    {/* Timer in top right corner */}
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        fontSize: "0.9em",
        opacity: 0.7,
      }}
    >
      <strong>{secondsLeft}s</strong>
    </div>

    {/* Voting header with submission status */}
    <div style={{ marginBottom: 8 }}>
      <strong>Vote</strong>
      {myVote && (
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
            disabled={!!myVote}
            onChange={() => onSelectVote(opt.id)}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>

    {/* Submit vote button - disabled after submission */}
    <button
      onClick={onSubmit}
      disabled={!gameId || !!myVote}
      style={{ marginTop: 10 }}
    >
      Submit Vote
    </button>

    {/* Display revealed information from powers */}
    {roomState?.players.some((p) => p.characterRevealed) && (
      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: COLORS.info,
          border: `1px solid ${COLORS.infoBorder}`,
          borderRadius: 6,
          color: COLORS.infoText,
        }}
      >
        <strong>Revealed Roles:</strong>
        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
          {roomState?.players
            .filter((p) => p.characterRevealed)
            .map((p) => (
              <li key={p.socketId}>
                <strong>{p.name}</strong> is {p.team}
                {p.character?.name && ` (${p.character.name})`}
              </li>
            ))}
        </ul>
      </div>
    )}
  </div>
);
