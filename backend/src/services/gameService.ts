// gameService.ts
// Service layer for game and player operations
import { GameModel } from "../models/gameModel.js";
import { PlayerModel } from "../models/playerModel.js";
import type { Game, Player } from "../types.js";

export class GameService {
    constructor(
        private gameModel = new GameModel(),
        private playerModel = new PlayerModel(),
    ) {}

    async createGame(name?: string): Promise<Game> {
        const gname = name?.trim();
        // check game name length
        if (gname && gname.length > 50) {
            throw new Error("Game name is too long");
        }   

        console.log(`\nCreating new game ${name || ''} ...`);
        const game = await this.gameModel.createGame(gname ? gname : '');
        console.log(`   ${name || ''} created with ID: ${game.id}`);
        return game;
    }

    async addPlayerToGame(gameId: string, player: Player): Promise<Game> {
        console.log(`Adding player ${player.name} to game ${gameId}...`);

        // check if player already exists, if not create new player
        let existingPlayer = await this.playerModel.getPlayerById(player.id);
        if (!existingPlayer) {
            throw new Error("Player not found");
        }
        player = existingPlayer;

        // check if player is already in the game
        const game = await this.gameModel.getGameById(gameId);
        if (!game) {
            throw new Error("Game not found");
        }
        if (game.players.find(p => p.id === player.id)) {
            throw new Error("Player already in the game");
        }

        // check if player is already in another active game
        const activeGames = await this.gameModel.getActiveGames();
        for (const g of activeGames) {
            if (g.players.find(p => p.id === player.id)) {
                throw new Error("Player is already in another active game");
            }
        }

        const updatedGame = await this.gameModel.addPlayer(gameId, player);
        console.log(`   gameService: Player ${player.name} added to game ${game.name}`);
        return updatedGame;
    }

    async makeMove(gameId: string, playerId: string, row: number, col: number): Promise<Game> {
        if (row < 0 || col < 0 || row >= 3 || col >= 3) {
            throw new Error("Cell coordinates are out of bounds");
        }

        console.log(`Game ${gameId}: Player ${playerId} making move at (${row}, ${col})...`);

        const game = await this.gameModel.makeMove(gameId, playerId, row, col);
        if (game.status === "completed") {
            if (game.winnerId) {
                const winner = game.players.find(p => p.id === game.winnerId);
                if (winner) {
                    console.log(`*** Game ${game.name} completed *** Status: ${game.status}. Winner is ${winner.name}`);
                }
                // update stats for winner and loser
                const winnerMoves = await this.gameModel.countPlayerMoves(game, game.winnerId);
                await this.playerModel.updatePlayerStatsPerGame(game.winnerId, "win", winnerMoves);
                
                const loser = game.players.find(p => p.id !== game.winnerId);
                if (loser) {
                    const loserMoves = await this.gameModel.countPlayerMoves(game, loser.id);
                    await this.playerModel.updatePlayerStatsPerGame(loser.id, "loss", loserMoves);
                }
            } else {
                // draw
                console.log(`*** Game ${game.name} completed ***  Status: ${game.status}. Draw game.`);
                for (const player of game.players) {
                    const playerMoves = await this.gameModel.countPlayerMoves(game, player.id);
                    await this.playerModel.updatePlayerStatsPerGame(player.id, "draw", playerMoves);
                }
            }

            console.log("\nUpdated stats for all players.");
        }
        return game;
    }

    async getGameById(gameId: string): Promise<Game | null> {
        if (!gameId) {
            throw new Error("Game ID is required");
        }   

        const game = await this.gameModel.getGameById(gameId);
        if (!game) {
            throw new Error("Game not found: " + gameId);
        } else {
            console.log(`Fetched game ${game.name} (status: ${game.status}) with ID: ${game.id}`);
        }
        return game;
    }

    async getAllGames(): Promise<Game[]> {
        const games = await this.gameModel.getAllGames();
        console.log(`Fetched ${games.length} games from the system.`);
        return games;
    }   

    async getGamesByStatus(status: "waiting" | "active" | "completed"): Promise<Game[]> {
        const games = await this.gameModel.getAllGames(status);
        console.log(`Fetched ${games.length} ${status} games from the system.`);
        return games;
    }

    async deleteGame(gameId: string): Promise<void> {
        if (!gameId) {
            throw new Error("Game ID is required");
        }   
        const game = await this.gameModel.getGameById(gameId);
        if (!game) {
            throw new Error("Game not found");
        }
        if (game.status === "active") {
            throw new Error("Cannot delete an active game");
        }

        await this.gameModel.deleteGame(gameId);
        console.log(`Deleted game ${game.name} with ID: ${game.id}`);
    }
}