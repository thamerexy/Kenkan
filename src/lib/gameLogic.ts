export type RoundType = 'Kan' | 'Double' | 'DoubleColor' | 'DoubleRoyal';

export interface Player {
  name: string;
  totalScore: number;
}

export interface FallahEntry {
  playerName: string;
  handValue: number;
}

export interface RoundResult {
  achieverName: string;
  type: RoundType;
  fallahs: FallahEntry[];
}

export const ROUND_CONFIG = {
  Kan: { achieverScore: -30, othersBaseScore: 100, fallahMultiplier: 1 },
  Double: { achieverScore: -60, othersBaseScore: 200, fallahMultiplier: 2 },
  DoubleColor: { achieverScore: -60, othersBaseScore: 400, fallahMultiplier: 4 },
  DoubleRoyal: { achieverScore: -60, othersBaseScore: 800, fallahMultiplier: 8 },
};

export function calculateRoundScores(
  players: string[],
  result: RoundResult
): Record<string, number> {
  const scores: Record<string, number> = {};
  const config = ROUND_CONFIG[result.type];

  players.forEach((playerName) => {
    if (playerName === result.achieverName) {
      scores[playerName] = config.achieverScore;
    } else {
      const fallah = result.fallahs.find((f) => f.playerName === playerName);
      if (fallah) {
        scores[playerName] = fallah.handValue * config.fallahMultiplier;
      } else {
        scores[playerName] = config.othersBaseScore;
      }
    }
  });

  return scores;
}
