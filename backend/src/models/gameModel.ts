// backend/src/models/gameModel.ts
import type {  Game, GameBoard, Player } from "../types.js";
import { v4 as uuidv4 } from 'uuid';

export class GameModel {
    private games: Map<string, Game> = new Map();

    // create new game
    async createGame(name?: string): Promise<Game> {
        if (name && name.trim().length > 50) {
            throw new Error("Game name is too long");
        }
        const newGame: Game = {
            id: uuidv4(),
            name: name || "",
            board: this.createEmptyGrid(3),
            status: "waiting",
            result: "draw",
            players: [],
            currentPlayerId: null,
            winnerId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            moves: []
        };
        this.games.set(newGame.id, newGame);
        return Promise.resolve(newGame);
    }

    async getGameById(id: string): Promise<Game | null> {
        return this.games.get(id) || null;
    }

    // add players to current game
    async addPlayer(gameId: string, player: Player): Promise<Game> {
        const game = await this.getGameById(gameId);
        if (!game) {
            throw new Error("Game not found");
        }
        if (game.status !== "waiting") {
            throw new Error("Game is in progress, not accepting new players");
        }
        if (game.players.length >= 2) {
            throw new Error("Game is full");
        }
        if (game.players.find(p => p.id === player.id)) {
            throw new Error("Player already in the game");
        }
        if (game.players.some(p => p.email.toLowerCase() === player.email.toLowerCase())) {
            throw new Error("Another player with the same email is already in this game");
        }

        const marker = game.players.length === 0 ? 1 : 2;
        game.players.push({...player, marker});

        if (game.players.length === 2) {
            game.status = "active";
            const firstPlayer = game.players[0]!;
            game.currentPlayerId = firstPlayer.id ?? null;
        }

        game.updatedAt = new Date();
        this.games.set(game.id, game); //for in-memory storage
        return game;
    }

    // add player's move to current game board
    async makeMove(gameId: string, playerId: string, row: number, col: number): Promise<Game> {
        const game = await this.getGameById(gameId);
        if (!game) {
            throw new Error("Game not found");
        }
        if (game.status !== "active") {
            throw new Error("Game is not active");
        }
        if (game.currentPlayerId !== playerId) {
            throw new Error("It's not your turn yet!");
        }
        if (!Number.isInteger(row) || !Number.isInteger(col)) {
            throw new Error("Row/col must be integers");
        }

        const boardSize = game.board.length;
        if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) {
            throw new Error('Cell coordinates are out of bounds');
        }
        
        const rowCell = game.board[row]!;
        if (rowCell[col] !== null) {
            throw new Error("Cell is already occupied");
        }

        const currentPlayer = game.players.find(p => p.id === playerId);
        if (!currentPlayer) {
            throw new Error("Player not found in this game");
        }

        // Place the marker
        rowCell[col] = currentPlayer.marker;

        // Record the move
        game.moves.push({
            id: uuidv4(),
            gameId: game.id,
            playerId: currentPlayer.id,
            row,
            col,
            timestamp: new Date()
        });

        // Detect and declare win/draw outcomes
        const gameResult = this.checkGameStatus(game.board, currentPlayer.marker);
        if (gameResult === "win") {
            game.status = "completed";
            game.result = "win";
            game.winnerId = currentPlayer.id
            game.currentPlayerId = null;
        } else if (gameResult === "draw") {
            game.status = "completed";
            game.result = "draw";
            game.winnerId = null;
            game.currentPlayerId = null;
        } else {
            // Switch turn
            const nextPlayer = game.players.find(p => p.id !== currentPlayer.id);
            game.currentPlayerId = nextPlayer ? nextPlayer.id : null;
        }

        game.updatedAt = new Date();
        this.games.set(game.id, game);
        return game;
    }

    async countPlayerMoves(game: Game, playerId: string): Promise<number> {
        return game.moves.filter(m => m.playerId === playerId).length;
    }

    async getAllGames(status?: "waiting" | "active" | "completed"): Promise<Game[]> {
        const games = Array.from(this.games.values());
        return status ? games.filter(g => g.status === status) : games;
    }   

    async getActiveGames(): Promise<Game[]> {
        return Array.from(this.games.values()).filter(g => g.status === "active");
    }

    async deleteGame(gameId: string): Promise<void> {
        const game = await this.getGameById(gameId);
        if (!game) {
            throw new Error("Game not found");
        }
        this.games.delete(gameId);
    }

    private createEmptyGrid(size: number): GameBoard {
        return Array.from({length: size}, () =>
            Array.from({ length: size}, () => null)
        )
    }

    private checkGameStatus(board: GameBoard, marker: number): "win" | "draw" | "ongoing" {
        const size = board.length;
        let isDraw = true;

        // rows & cols
        for (let i = 0; i < size; i++) {
            const rowCells = board[i]!;
            if (rowCells.every(c => c === marker)) return "win";              // row
            if (board.every(row => row[i] === marker)) return "win";          // col
        }

        // Check diagonals
        if (board.every((row, idx) => row[idx] === marker)) return "win";
        if (board.every((row, idx) => row[size - 1 - idx] === marker)) return "win";

        // Check if draw
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r]![c] === null) {
                    isDraw = false;
                    break;
                }
            }
            if (!isDraw) break;
        }

        return isDraw ? "draw" : "ongoing";
    }
}