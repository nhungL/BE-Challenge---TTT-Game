// test/unitTest/playerController.test.ts
import { describe, it, expect, jest, beforeEach} from '@jest/globals'
import { makePlayerController } from '../../src/api/controllers/playerController';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe('PlayerController', () => {
    let playerModel: any;
    let gameService: any; // not used by these handlers
    let controller: ReturnType<typeof makePlayerController>;

    beforeEach(() => {
        playerModel = {
        getAllPlayers: jest.fn(),
        createPlayer: jest.fn(),
        getPlayerById: jest.fn(),
        getAllPlayerStats: jest.fn(),
        };
        gameService = {};
        controller = makePlayerController({ gameService, playerModel });
        jest.clearAllMocks();
    });

    describe('listPlayers', () => {
        it('200 with players list', async () => {
        const req: any = {};
        const res = mockRes();
        const players = [{ id: 'p1' }, { id: 'p2' }];
        playerModel.getAllPlayers.mockResolvedValue(players);

        await controller.listPlayers(req, res);

        expect(playerModel.getAllPlayers).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(players);
        });

        it('400 on model error', async () => {
        const req: any = {};
        const res = mockRes();
        playerModel.getAllPlayers.mockRejectedValue(new Error('db down'));

        await controller.listPlayers(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'db down' });
        });
    });

    describe('createPlayer', () => {
        it('400 when name or email missing', async () => {
        const res = mockRes();

        await controller.createPlayer({ body: { name: 'A' } } as any, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Name and email are required' });

        jest.clearAllMocks();
        await controller.createPlayer({ body: { email: 'a@test.com' } } as any, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Name and email are required' });
        });

        it('400 when name too long (>30)', async () => {
        const req: any = { body: { name: 'x'.repeat(31), email: 'a@test.com' } };
        const res = mockRes();

        await controller.createPlayer(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Name is too long' });
        });

        it('400 when email too long (>50)', async () => {
        const req: any = { body: { name: 'Alice', email: `${'y'.repeat(51)}@t.com` } };
        const res = mockRes();

        await controller.createPlayer(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email is too long' });
        });

        it('201 on success', async () => {
        const req: any = { body: { name: 'Alice', email: 'a@test.com' } };
        const res = mockRes();
        const player = { id: 'p1', name: 'Alice', email: 'a@test.com' };
        playerModel.createPlayer.mockResolvedValue(player);

        await controller.createPlayer(req, res);

        expect(playerModel.createPlayer).toHaveBeenCalledWith('Alice', 'a@test.com');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(player);
        });

        it('400 on model error', async () => {
        const req: any = { body: { name: 'Alice', email: 'a@test.com' } };
        const res = mockRes();
        playerModel.createPlayer.mockRejectedValue(new Error('duplicate email'));

        await controller.createPlayer(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'duplicate email' });
        });
    });

    describe('getPlayer', () => {
        it('400 when missing playerId', async () => {
        const req: any = { params: {} };
        const res = mockRes();

        await controller.getPlayer(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Player ID is required' });
        });

        it('404 when not found', async () => {
        const req: any = { params: { playerId: 'missing' } };
        const res = mockRes();
        playerModel.getPlayerById.mockResolvedValue(null);

        await controller.getPlayer(req, res);

        expect(playerModel.getPlayerById).toHaveBeenCalledWith('missing');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Player not found' });
        });

        it('200 with player when found', async () => {
        const req: any = { params: { playerId: 'p1' } };
        const res = mockRes();
        const player = { id: 'p1', name: 'Alice', email: 'a@test.com' };
        playerModel.getPlayerById.mockResolvedValue(player);

        await controller.getPlayer(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(player);
        });

        it('400 on model error', async () => {
        const req: any = { params: { playerId: 'p1' } };
        const res = mockRes();
        playerModel.getPlayerById.mockRejectedValue(new Error('db error'));

        await controller.getPlayer(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'db error' });
        });
    });

    describe('getAllPlayerStats', () => {
        it('200 with stats', async () => {
        const req: any = {};
        const res = mockRes();
        const stats = [{ playerId: 'p1', gamesPlayed: 3 }];
        playerModel.getAllPlayerStats.mockResolvedValue(stats);

        await controller.getAllPlayerStats(req, res);

        expect(playerModel.getAllPlayerStats).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(stats);
        });

        it('400 on model error', async () => {
        const req: any = {};
        const res = mockRes();
        playerModel.getAllPlayerStats.mockRejectedValue(new Error('stats unavailable'));

        await controller.getAllPlayerStats(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'stats unavailable' });
        });
    });
});
