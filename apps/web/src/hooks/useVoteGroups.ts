import { useMemo } from "react";
import type { RoomState } from "../types/room";

export interface VoteGroup {
  targetId: string;
  label: string;
  voters: string[];
}

/**
 * Computes vote tally groups from room state for the results phase.
 * Returns an array sorted by most votes descending, then alphabetically.
 */
export function useVoteGroups(roomState: RoomState | null): VoteGroup[] {
  return useMemo(() => {
    if (!roomState) return [];

    const groups = new Map<string, VoteGroup>();

    // Initialize a bucket for each player + a "no infiltrator" option
    for (const p of roomState.players) {
      groups.set(p.socketId, {
        targetId: p.socketId,
        label: p.name,
        voters: [],
      });
    }
    groups.set("none", {
      targetId: "none",
      label: "No Infiltrator",
      voters: [],
    });

    // Fill voters into their chosen bucket
    for (const voter of roomState.players) {
      if (!voter.submission) continue;
      const g = groups.get(voter.submission.value);
      if (!g) continue;
      g.voters.push(voter.name);
    }

    // Sort: most votes first, then alphabetically
    return Array.from(groups.values()).sort((a, b) => {
      const d = b.voters.length - a.voters.length;
      if (d !== 0) return d;
      return a.label.localeCompare(b.label);
    });
  }, [roomState]);
}
