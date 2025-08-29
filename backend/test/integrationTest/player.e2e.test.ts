// test/integration/players.e2e.test.ts
import { describe, it, expect, afterAll } from '@jest/globals';
import app, { server } from "../../src/index.js";
import request from "supertest";

describe("Players API (integration)", () => {
    let playerId: string;

    it("rejects missing name/email", async () => {
        const r1 = await request(app).post("/players/create").send({});
        expect(r1.status).toBe(400);
        expect(r1.body.error).toMatch(/name and email are required/i);

        const r2 = await request(app).post("/players/create").send({ name: "Alice" });
        expect(r2.status).toBe(400);

        const r3 = await request(app).post("/players/create").send({ email: "a@test.com" });
        expect(r3.status).toBe(400);
    });

    it("rejects too-long name/email per controller constraints", async () => {
        const longName = "x".repeat(31); // controller caps name at 30
        const r1 = await request(app).post("/players/create").send({ name: longName, email: "long@test.com" });
        expect(r1.status).toBe(400);
        expect(r1.body.error).toMatch(/name is too long/i);

        const longEmail = `${"y".repeat(51)}@t.com`; // controller caps email at 50
        const r2 = await request(app).post("/players/create").send({ name: "Ok", email: longEmail });
        expect(r2.status).toBe(400);
        expect(r2.body.error).toMatch(/email is too long/i);
    });

    it("creates a player", async () => {
        const res = await request(app)
        .post("/players/create")
        .send({ name: "Alice", email: "alice@test.com" });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("id");
        expect(res.body.name).toBe("Alice");
        expect(res.body.email).toBe("alice@test.com");
        playerId = res.body.id;
    });

    it("rejects duplicate email", async () => {
        const dup = await request(app)
        .post("/players/create")
        .send({ name: "Alice Two", email: "alice@test.com" });

        expect(dup.status).toBe(400);
        expect(dup.body.error).toMatch(/email.*in use/i);
    });

    it("lists players", async () => {
        const res = await request(app).get("/players");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // includes Alice
        expect(res.body.some((p: any) => p.email === "alice@test.com")).toBe(true);
    });

    it("gets a player by id", async () => {
        const res = await request(app).get(`/players/${playerId}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("id", playerId);
        expect(res.body).toHaveProperty("stats");
        expect(res.body.stats).toMatchObject({
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            gamesTied: 0,
            totalMoves: 0,
        });
    });

    it("returns 404 for unknown player id", async () => {
        const res = await request(app).get(`/players/does-not-exist`);
        expect(res.status).toBe(404);
        expect(res.body.error).toMatch(/player not found/i);
    });

    it("gets all player stats", async () => {
        const res = await request(app).get("/players/allstats");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const aliceStats = res.body.find((s: any) => s.playerName === "Alice");
        expect(aliceStats).toBeTruthy();
        expect(aliceStats).toMatchObject({
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            gamesTied: 0,
            totalMoves: 0,
        });
    });

    afterAll((done) => {
        server.close(done); 
    });
});
