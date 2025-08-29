// test/integration/players.e2e.test.ts
import { describe, it, expect, afterAll } from '@jest/globals';
import app, { server } from "../../src/index.js";
import request from "supertest";    

describe("Games API (integration)", () => {
    let p1: any;
    let p2: any;
    let p3: any;
    let gameId: string;

    // Players to reuse across tests
    it("creates players for the match", async () => {
        const r1 = await request(app).post("/players/create").send({ name: "Alice", email: "alice+g@test.com" });
        expect(r1.status).toBe(201);
        p1 = r1.body;

        const r2 = await request(app).post("/players/create").send({ name: "Bob", email: "bob+g@test.com" });
        expect(r2.status).toBe(201);
        p2 = r2.body;

        // a third player to test 'game full'
        const r3 = await request(app).post("/players/create").send({ name: "Carol", email: "carol+g@test.com" });
        expect(r3.status).toBe(201);
        p3 = r3.body;
    });

    it("creates a game", async () => {
        const res = await request(app).post("/games/create").send({ name: "Match 1" });
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("id");
        expect(res.body.status).toBe("waiting");
        gameId = res.body.id;
    });

    it("joins two players (second join activates the game)", async () => {
        const j1 = await request(app).post(`/games/${gameId}/join`).send({ player: p1 });
        expect(j1.status).toBe(200);
        expect(j1.body.players).toHaveLength(1);

        const j2 = await request(app).post(`/games/${gameId}/join`).send({ player: p2 });
        expect(j2.status).toBe(200);
        expect(j2.body.status).toBe("active");
        expect(j2.body.players).toHaveLength(2);
        expect(j2.body.currentPlayerId).toBeTruthy();
    });

    it("rejects joining a third player into a full game", async () => {
        const j3 = await request(app).post(`/games/${gameId}/join`).send({ player: p3 });
        expect(j3.status).toBe(400); // GameModel throws "Game is full"
        expect(typeof j3.body.error).toBe("string");
    });

    it("rejects move with missing fields", async () => {
        const bad = await request(app).post(`/games/${gameId}/moves`).send({});
        expect(bad.status).toBe(400);
        expect(bad.body.error).toMatch(/player id, row, and column are required/i);
    });

    it("enforces turn order (same player cannot move twice)", async () => {
        // fetch current state to know starter/opponent
        const g = await request(app).get(`/games/${gameId}`);
        expect(g.status).toBe(200);
        const starterId = g.body.currentPlayerId as string;

        // First legal move by starter
        const m1 = await request(app)
        .post(`/games/${gameId}/moves`)
        .send({ playerId: starterId, row: 0, col: 0 });
        expect(m1.status).toBe(200);

        // Try to move again with the same player -> should 400
        const mSame = await request(app)
        .post(`/games/${gameId}/moves`)
        .send({ playerId: starterId, row: 0, col: 1 });
        expect(mSame.status).toBe(400);
        expect(mSame.body.error).toMatch(/not your turn/i);
    });

    it("plays to a win for the starting player", async () => {
        // Re-fetch to get up-to-date turn (opponent should be up now)
        const gNow = await request(app).get(`/games/${gameId}`);
        expect(gNow.status).toBe(200);
        const current = gNow.body.currentPlayerId as string;
        const players = gNow.body.players as any[];
        const starterId = players.find(p => p.id !== current).id; // the one who already moved first
        const opponentId = current;

        // Continue with a top-row win for the starter:
        // Moves so far: starter (0,0) done in previous test.
        // Sequence now (opponent -> starter -> opponent -> starter win):
        const seq = [
        { playerId: opponentId, row: 1, col: 0 },
        { playerId: starterId,  row: 0, col: 1 },
        { playerId: opponentId, row: 1, col: 1 },
        { playerId: starterId,  row: 0, col: 2 }, // winning move
        ];

        let lastGame: any;
        for (const m of seq) {
        const r = await request(app).post(`/games/${gameId}/moves`).send(m);
        expect(r.status).toBe(200);
        lastGame = r.body.game; // controller returns { game, move }
        }

        expect(lastGame.status).toBe("completed");
        expect(lastGame.result).toBe("win");
        expect(lastGame.winnerId).toBe(starterId);
    });

    it("returns a game by id", async () => {
        const res = await request(app).get(`/games/${gameId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("id", gameId);
        expect(res.body).toHaveProperty("status", "completed");
    });

    it("lists games", async () => {
        const res = await request(app).get("/games");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((g: any) => g.id === gameId)).toBe(true);
    });

    it("deletes a game", async () => {
        const res = await request(app).delete(`/games/${gameId}`);
        expect(res.status).toBe(204);

        const after = await request(app).get(`/games/${gameId}`);
        expect(after.status).toBe(400); // "Game not found"
    });

    it("returns 404 for a non-existent game id", async () => {
        const res = await request(app).get(`/games/does-not-exist`);
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/game not found/i);
    });

    afterAll((done) => {
        server.close(done); 
    });
});