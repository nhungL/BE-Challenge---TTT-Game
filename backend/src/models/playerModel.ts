// backend/src/models/playerModel.ts
import type { Player, PlayerStats } from "../types.js";
import { v4 as uuidv4 } from "uuid";

export class PlayerModel {
    private players: Map<string, Player> = new Map();

    // create new player
    async createPlayer(name: string, email: string): Promise<Player> {
        // validate name
        if (!name || typeof name !== 'string' || name.trim().length == 0 || name.trim().length > 50) {
            throw new Error("Invalid name. Name is required and must be less than 50 characters.");
        }

        // validate email
        if (!email || typeof email !== 'string' || email.trim().length == 0 || !this.isValidEmail(email)) {
            throw new Error("Invalid email");
        }
        const cleanedEmail = email.trim().toLowerCase();
        // check if email already exists
        const existingPlayer = await this.getPlayerByEmail(cleanedEmail);
        if (existingPlayer) {
            throw new Error("Email already in use. Choose another email.");
        }
        if (cleanedEmail.length > 100) {
            throw new Error("Email is too long");
        }

        name = name.trim();
        email = cleanedEmail;       

        const newPlayer: Player = {
            id: uuidv4(),
            name,
            email,
            marker: 0, // default marker, will be set when added to a game
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesTied: 0,
                totalMoves: 0,
                winRate: 0,
                efficiency: 0
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.players.set(newPlayer.id, newPlayer);
        return newPlayer;
    }

    async getPlayerById(id: string): Promise<Player | null> {
        return this.players.get(id) || null;
    }

    async getPlayerByEmail(email: string): Promise<Player | null> {
        // console.log(`SEARCHING EMAIL: ${email}`);
        email = email.trim().toLowerCase();
        for (const player of this.players.values()) {
            if (player.email === email) {
                return player;
            }
        }
        return null;
    }

    async updatePlayerStatsPerGame(playerId: string, result: "win" | "loss" | "draw", moves: number): Promise<Player> {
        const player = await this.getPlayerById(playerId);
        if (!player) {
            throw new Error("Player not found");
        } 
        if (!Number.isInteger(moves) || moves < 0) throw new Error("Invalid moves");

        // Update stats based on game result
        player.stats.gamesPlayed += 1;
        player.stats.totalMoves += moves;
        if (result === "win") player.stats.gamesWon += 1;
        else if (result === "loss") player.stats.gamesLost += 1;
        else if (result === "draw") player.stats.gamesTied += 1;

        // Recalculate derived stats
        player.stats.winRate = this.calculateWinRate(player.stats.gamesWon, player.stats.gamesPlayed);
        player.stats.efficiency = this.calculateEfficiency(player.stats.totalMoves, player.stats.gamesWon);
    
        player.updatedAt = new Date();
        this.players.set(player.id, player);

        return player
    }

    // get all players sorted by number of wins
    async getAllPlayers(): Promise<Player[]> {
        return Array.from(this.players.values()).sort((a, b) => b.stats.gamesWon - a.stats.gamesWon);
    }

    // get all player info + stats
    async getAllPlayerStats(): Promise<PlayerStats[]> {
        return Array.from(this.players.values()).map(p => ({
            playerId: p.id,
            playerName: p.name,
            ...p.stats
        }));
    }

    // Update player info (name, email)
    async updatePlayerInfo(playerId: string, newName?: string, newEmail?: string): Promise<Player> {
        const player = await this.getPlayerById(playerId);
        if (!player) {
            throw new Error("Player not found");
        } 
        
        // validate new name if provided
        if (typeof newName !== 'undefined') {
            const cleanedName = newName.trim();
            if (!newName || typeof newName !== 'string' || cleanedName.length == 0 || cleanedName.length > 50) {
                throw new Error("Invalid name");
            }
            player.name = cleanedName;
        }

        // validate new email if provided
        if (typeof newEmail !== 'undefined') {
            if (!newEmail || typeof newEmail !== 'string' || newEmail.trim().length == 0 || !this.isValidEmail(newEmail)) {
                throw new Error("Invalid email");
            }
            const cleanedEmail = newEmail.trim().toLowerCase();
            // check if email already exists
            const existingPlayer = await this.getPlayerByEmail(cleanedEmail);
            if (existingPlayer && existingPlayer.id !== playerId) {
                throw new Error("Email already in use. Choose another email.");
            }
            player.email = cleanedEmail;
        }

        player.updatedAt = new Date();
        this.players.set(player.id, player);
        return player;
    }   

    async deletePlayer(playerId: string): Promise<void> {
        const player = await this.getPlayerById(playerId);
        if (!player) {
            throw new Error("Player not found");
        }
        this.players.delete(playerId);
    }

    private calculateWinRate(gamesWon: number, gamesPlayed: number): number {
        return gamesPlayed > 0 ? (gamesWon / gamesPlayed)*100 : 0;
    }
    private calculateEfficiency(totalMoves: number, gamesWon: number): number {
        return gamesWon > 0 ? (totalMoves / gamesWon) : 0;
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof email === "string" && emailRegex.test(email.trim()); 
    }     
}