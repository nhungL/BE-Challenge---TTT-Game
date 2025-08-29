// types.ts
// Shared types for the game application
export interface Game {
  id: string;
  name?: string;
  board: GameBoard;
  status: "waiting" | "active" | "completed";
  result: "win" | "draw";
  players: Player[];
  currentPlayerId: string | null;
  winnerId: string | null;
  createdAt: Date;
  updatedAt: Date;
  moves: Move[];
}

export type GameBoard = (number | null) [][]; // cell value can be playerId or empty

export interface Player {
  id: string;
  name: string;
  email: string;
  marker: number; // e.g., 1 or 2
  stats: PlayerStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
  totalMoves: number;
  winRate: number;
  efficiency: number; //average number of moves per win (lower is better)
}

export interface Move {
  id: string;
  gameId: string;
  playerId: string;
  row: number;
  col: number;
  timestamp: Date;
};


// Configuration for simulation
export interface SimulationConfig {
  numGames: number;
  concurrentGames: number;
  numPlayers: number;
}

export interface SimulationResult {
  totalGames: number;
  completedGames: number;
  failedGames: number;
  totalMoves: number;
  averageMovesPerGame: number;
  playerStats: PlayerInfo[];
  leaderboard: LeaderboardEntry[];
  duration: number;
  errors: string[];
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  wins: number;
  winRate: number;
  efficiency: number; // average number of moves per win (lower is better)
}

export interface PlayerInfo {
  playerId: string;
  playerName: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
  totalMoves: number;
  winRate: number;
  efficiency: number; // average number of moves per win (lower is better)
}       