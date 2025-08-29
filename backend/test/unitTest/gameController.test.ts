// test/unitTest/gameController.test.ts
import { describe, it, expect, jest, beforeEach} from '@jest/globals';
import { makeGameController } from '../../src/api/controllers/gameController';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

describe('GameController', () => {
    let service: any;
    let controller: any;

    beforeEach(() => {
        service = {
        createGame: jest.fn(),
        getGameById: jest.fn(),
        getAllGames: jest.fn(),
        addPlayerToGame: jest.fn(),
        makeMove: jest.fn(),
        deleteGame: jest.fn(),
        };
        controller = makeGameController(service);
        jest.clearAllMocks();
    });

    describe('createGame', () => {
        it('201 on success', async () => {
        const req: any = { body: { name: 'Nice' } };
        const res = mockRes();
        const game = { id: 'g1', name: 'Nice' };
        service.createGame.mockResolvedValue(game);

        await controller.createGame(req, res);

        expect(service.createGame).toHaveBeenCalledWith('Nice');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(game);
        });

        it('400 on service error', async () => {
        const req: any = { body: { name: 'x'.repeat(50) } };
        const res = mockRes();
        service.createGame.mockRejectedValue(new Error('Game name is too long'));

        await controller.createGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Game name is too long' });
        });
    });

    describe('getGame', () => {
        it('400 when missing gameId', async () => {
        const req: any = { params: {} };
        const res = mockRes();

        await controller.getGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Game ID is required' });
        });

        it('404 when service returns null', async () => {
        const req: any = { params: { gameId: 'missing' } };
        const res = mockRes();
        service.getGameById.mockResolvedValue(null);

        await controller.getGame(req, res);

        expect(service.getGameById).toHaveBeenCalledWith('missing');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Game not found' });
        });

        it('200 with game when found', async () => {
        const req: any = { params: { gameId: 'g1' } };
        const res = mockRes();
        const game = { id: 'g1', name: 'Tic' };
        service.getGameById.mockResolvedValue(game);

        await controller.getGame(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(game);
        });

        it('400 on thrown error', async () => {
        const req: any = { params: { gameId: 'g1' } };
        const res = mockRes();
        service.getGameById.mockRejectedValue(new Error('boom'));

        await controller.getGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'boom' });
        });
    });

    describe('listGames', () => {
        it('200 with list', async () => {
        const req: any = {};
        const res = mockRes();
        const games = [{ id: 'g1' }, { id: 'g2' }];
        service.getAllGames.mockResolvedValue(games);

        await controller.listGames(req, res);

        expect(service.getAllGames).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(games);
        });

        it('400 on error', async () => {
        const req: any = {};
        const res = mockRes();
        service.getAllGames.mockRejectedValue(new Error('db down'));

        await controller.listGames(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'db down' });
        });
    });

    describe('addPlayerToGame', () => {
        it('400 when missing gameId', async () => {
        const req: any = { params: {}, body: { player: { id: 'p1', name: 'A' } } };
        const res = mockRes();

        await controller.addPlayerToGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Game ID is required' });
        });

        it('400 when missing player', async () => {
        const req: any = { params: { gameId: 'g1' }, body: {} };
        const res = mockRes();

        await controller.addPlayerToGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Player not found' });
        });

        it('200 on success', async () => {
        const req: any = { params: { gameId: 'g1' }, body: { player: { id: 'p1', name: 'A' } } };
        const res = mockRes();
        const updated = { id: 'g1', players: [{ id: 'p1', name: 'A' }] };
        service.addPlayerToGame.mockResolvedValue(updated);

        await controller.addPlayerToGame(req, res);

        expect(service.addPlayerToGame).toHaveBeenCalledWith('g1', { id: 'p1', name: 'A' });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updated);
        });

        it('400 on service error', async () => {
        const req: any = { params: { gameId: 'g1' }, body: { player: { id: 'p1', name: 'A' } } };
        const res = mockRes();
        service.addPlayerToGame.mockRejectedValue(new Error('Player already in the game'));

        await controller.addPlayerToGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Player already in the game' });
        });
    });

    describe('makeMove', () => {
        it('400 when missing gameId', async () => {
        const req: any = { params: {}, body: { playerId: 'p1', row: 0, col: 0 } };
        const res = mockRes();

        await controller.makeMove(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Game ID is required' });
        });

        it('400 when missing playerId/row/col', async () => {
        const res = mockRes();
        await controller.makeMove({ params: { gameId: 'g1' }, body: {} } as any, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Player ID, row, and column are required' });
        });

        it('200 on success returns { game, move } where move = game.moves', async () => {
        const req: any = { params: { gameId: 'g1' }, body: { playerId: 'p1', row: 1, col: 2 } };
        const res = mockRes();
        const game = { id: 'g1', moves: [{ id: 'm1', row: 1, col: 2 }] };
        service.makeMove.mockResolvedValue(game);

        await controller.makeMove(req, res);

        expect(service.makeMove).toHaveBeenCalledWith('g1', 'p1', 1, 2);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ game, move: game.moves });
        });

        it('400 on service error', async () => {
        const req: any = { params: { gameId: 'g1' }, body: { playerId: 'p1', row: 0, col: 0 } };
        const res = mockRes();
        service.makeMove.mockRejectedValue(new Error('Cell coordinates are out of bounds'));

        await controller.makeMove(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cell coordinates are out of bounds' });
        });
    });

    describe('deleteGame', () => {
        it('400 when missing gameId', async () => {
        const req: any = { params: {} };
        const res = mockRes();

        await controller.deleteGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Game ID is required' });
        });

        it('204 on success', async () => {
        const req: any = { params: { gameId: 'g1' } };
        const res = mockRes();
        service.deleteGame.mockResolvedValue(undefined);

        await controller.deleteGame(req, res);

        expect(service.deleteGame).toHaveBeenCalledWith('g1');
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.end).toHaveBeenCalled();
        });

        it('400 on service error (e.g., active game)', async () => {
        const req: any = { params: { gameId: 'g1' } };
        const res = mockRes();
        service.deleteGame.mockRejectedValue(new Error('Cannot delete an active game'));

        await controller.deleteGame(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Cannot delete an active game' });
        });
    });
});
