// test/unitTest/gameService.test.ts
import { GameService } from "../../src/services/gameService.js";
import { describe, it, expect, jest, beforeEach} from '@jest/globals';

describe('GameService', () => {
  let gameModel: any;
  let playerModel: any;
  let service: any;

  const playerA = { id: 'pA', name: 'Alice' };
  const playerB = { id: 'pB', name: 'Bob' };

  const baseGame = {
    id: 'g1',
    name: 'TicTac',
    status: 'waiting' as const,
    players: [] as any[],
    currentPlayerId: null as string | null,
    winnerId: null as string | null,
    board: [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    gameModel = {
      createGame: jest.fn(),
      getGameById: jest.fn(),
      getActiveGames: jest.fn(),
      addPlayer: jest.fn(),
      makeMove: jest.fn(),
      countPlayerMoves: jest.fn(),
      getAllGames: jest.fn(),
      deleteGame: jest.fn(),
    };

    playerModel = {
      getPlayerById: jest.fn(),
      updatePlayerStatsPerGame: jest.fn(),
    };

    service = new GameService(gameModel, playerModel);
    jest.clearAllMocks();
  });

  // ---- createGame ----
  it('createGame: throws when name > 50 chars', async () => {
    await expect(service.createGame('x'.repeat(51))).rejects.toThrow('Game name is too long');
    expect(gameModel.createGame).not.toHaveBeenCalled();
  });

  it('createGame: trims name and calls model', async () => {
    gameModel.createGame.mockResolvedValue({ ...baseGame, name: 'NiceName' });
    const g = await service.createGame('  NiceName  ');
    expect(gameModel.createGame).toHaveBeenCalledWith('NiceName');
    expect(g.name).toBe('NiceName');
  });

  it('createGame: passes empty string when no name', async () => {
    gameModel.createGame.mockResolvedValue({ ...baseGame, name: '' });
    const g = await service.createGame();
    expect(gameModel.createGame).toHaveBeenCalledWith('');
    expect(g.name).toBe('');
  });

  // ---- addPlayerToGame ----
  it('addPlayerToGame: throws if player not found', async () => {
    playerModel.getPlayerById.mockResolvedValue(null);
    await expect(service.addPlayerToGame('g1', playerA as any)).rejects.toThrow('Player not found');
  });

  it('addPlayerToGame: throws if game not found', async () => {
    playerModel.getPlayerById.mockResolvedValue(playerA);
    gameModel.getGameById.mockResolvedValue(null);
    await expect(service.addPlayerToGame('missing', playerA as any)).rejects.toThrow('Game not found');
  });

  it('addPlayerToGame: throws if player already in game', async () => {
    playerModel.getPlayerById.mockResolvedValue(playerA);
    gameModel.getGameById.mockResolvedValue({ ...baseGame, players: [playerA] });
    await expect(service.addPlayerToGame('g1', playerA as any)).rejects.toThrow('Player already in the game');
  });

  it('addPlayerToGame: throws if player is in another active game', async () => {
    playerModel.getPlayerById.mockResolvedValue(playerA);
    gameModel.getGameById.mockResolvedValue({ ...baseGame, players: [] });
    gameModel.getActiveGames.mockResolvedValue([
      { ...baseGame, id: 'gActive', status: 'active', players: [playerA] },
    ]);
    await expect(service.addPlayerToGame('g1', playerA as any)).rejects.toThrow(
      'Player is already in another active game'
    );
  });

  it('addPlayerToGame: succeeds and returns updated game', async () => {
    playerModel.getPlayerById.mockResolvedValue(playerA);
    gameModel.getGameById.mockResolvedValue({ ...baseGame, players: [] });
    gameModel.getActiveGames.mockResolvedValue([]);
    const updated = { ...baseGame, players: [playerA] };
    gameModel.addPlayer.mockResolvedValue(updated);

    const res = await service.addPlayerToGame('g1', playerA as any);
    expect(gameModel.addPlayer).toHaveBeenCalledWith('g1', playerA);
    expect(res.players).toHaveLength(1);
  });

  // ---- makeMove ----
  it('makeMove: throws on out-of-bounds coordinates', async () => {
    await expect(service.makeMove('g1', 'p1', -1, 0)).rejects.toThrow('Cell coordinates are out of bounds');
    await expect(service.makeMove('g1', 'p1', 3, 0)).rejects.toThrow('Cell coordinates are out of bounds');
    await expect(service.makeMove('g1', 'p1', 0, 3)).rejects.toThrow('Cell coordinates are out of bounds');
  });

  it('makeMove: when completed with winner, updates winner/loser stats', async () => {
    const completedWithWinner = {
      ...baseGame,
      status: 'completed' as const,
      players: [playerA, playerB],
      winnerId: playerA.id,
    };

    gameModel.makeMove.mockResolvedValue(completedWithWinner);
    gameModel.countPlayerMoves
      .mockResolvedValueOnce(4) // winner moves
      .mockResolvedValueOnce(5); // loser moves

    await service.makeMove('g1', playerA.id, 0, 0);

    expect(gameModel.countPlayerMoves).toHaveBeenCalledTimes(2);
    expect(playerModel.updatePlayerStatsPerGame).toHaveBeenNthCalledWith(1, playerA.id, 'win', 4);
    expect(playerModel.updatePlayerStatsPerGame).toHaveBeenNthCalledWith(2, playerB.id, 'loss', 5);
  });

  it('makeMove: when completed draw, updates both players with draw', async () => {
    const drawGame = {
      ...baseGame,
      status: 'completed' as const,
      players: [playerA, playerB],
      winnerId: null,
    };

    gameModel.makeMove.mockResolvedValue(drawGame);
    // order of calls: for playerA then playerB
    gameModel.countPlayerMoves.mockResolvedValueOnce(3).mockResolvedValueOnce(3);

    await service.makeMove('g1', playerA.id, 1, 1);

    expect(playerModel.updatePlayerStatsPerGame).toHaveBeenNthCalledWith(1, playerA.id, 'draw', 3);
    expect(playerModel.updatePlayerStatsPerGame).toHaveBeenNthCalledWith(2, playerB.id, 'draw', 3);
  });

  // ---- getGameById ----
  it('getGameById: throws if no id', async () => {
    await expect(service.getGameById('')).rejects.toThrow('Game ID is required');
  });

  it('getGameById: throws if not found', async () => {
    gameModel.getGameById.mockResolvedValue(null);
    await expect(service.getGameById('missing')).rejects.toThrow('Game not found: missing');
  });

  it('getGameById: returns game if found', async () => {
    gameModel.getGameById.mockResolvedValue(baseGame);
    const g = await service.getGameById('g1');
    expect(g.id).toBe('g1');
  });

  // ---- getAllGames / getGamesByStatus ----
  it('getAllGames: returns list', async () => {
    gameModel.getAllGames.mockResolvedValue([baseGame]);
    const res = await service.getAllGames();
    expect(res).toHaveLength(1);
  });

  it('getGamesByStatus: forwards status to model', async () => {
    gameModel.getAllGames.mockResolvedValue([{ ...baseGame, status: 'active' }]);
    const res = await service.getGamesByStatus('active');
    expect(gameModel.getAllGames).toHaveBeenCalledWith('active');
    expect(res[0].status).toBe('active');
  });

  // ---- deleteGame ----
  it('deleteGame: throws if no id', async () => {
    await expect(service.deleteGame('')).rejects.toThrow('Game ID is required');
  });

  it('deleteGame: throws if game not found', async () => {
    gameModel.getGameById.mockResolvedValue(null);
    await expect(service.deleteGame('missing')).rejects.toThrow('Game not found');
  });

  it('deleteGame: throws if trying to delete an active game', async () => {
    gameModel.getGameById.mockResolvedValue({
      ...baseGame,
      status: 'active' as const,
    });
    await expect(service.deleteGame('g1')).rejects.toThrow('Cannot delete an active game');
    expect(gameModel.deleteGame).not.toHaveBeenCalled();
  });

  it('deleteGame: deletes when found', async () => {
    gameModel.getGameById.mockResolvedValue(baseGame);
    await service.deleteGame('g1');
    expect(gameModel.deleteGame).toHaveBeenCalledWith('g1');
  });
});


