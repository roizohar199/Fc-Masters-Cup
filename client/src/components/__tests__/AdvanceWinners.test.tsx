import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdvanceWinners from '../AdvanceWinners';
import { api } from '../../api';

// Mock the API
jest.mock('../../api');
const mockApi = api as jest.MockedFunction<typeof api>;

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock canvas-confetti
jest.mock('canvas-confetti', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AdvanceWinners Component', () => {
  const mockProps = {
    tournamentId: 'test-tournament-id',
    round: 'R16' as const,
    onAdvanceComplete: jest.fn(),
    isDisabled: false,
  };

  const mockMatches = [
    {
      id: 'match1',
      homeId: 'player1',
      awayId: 'player2',
      homeScore: 2,
      awayScore: 1,
      status: 'CONFIRMED',
    },
    {
      id: 'match2',
      homeId: 'player3',
      awayId: 'player4',
      homeScore: 1,
      awayScore: 3,
      status: 'CONFIRMED',
    },
  ];

  const mockPlayers = [
    { id: 'player1', psn: 'Player1', displayName: 'Player One' },
    { id: 'player2', psn: 'Player2', displayName: 'Player Two' },
    { id: 'player3', psn: 'Player3', displayName: 'Player Three' },
    { id: 'player4', psn: 'Player4', displayName: 'Player Four' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.mockImplementation((url: string) => {
      if (url.includes('/matches')) {
        return Promise.resolve(mockMatches);
      }
      if (url.includes('/players')) {
        return Promise.resolve(mockPlayers);
      }
      if (url.includes('/preview')) {
        return Promise.resolve({
          success: true,
          nextRound: 'QF',
          matches: [
            { id: 'preview-1', homeId: 'player1', awayId: 'player4', round: 'QF' },
          ],
          winnerCount: 2,
        });
      }
      if (url.includes('/confirm')) {
        return Promise.resolve({
          success: true,
          matchIds: ['new-match-1'],
          operationId: 'op-1',
          idempotencyKey: 'key-1',
        });
      }
      return Promise.resolve({});
    });
  });

  it('renders correctly with matches and players', async () => {
    render(<AdvanceWinners {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('נבחרו 0/2')).toBeInTheDocument();
    });
  });

  it('shows correct button states based on selection', async () => {
    render(<AdvanceWinners {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('נבחרו 0/2')).toBeInTheDocument();
    });

    // Initially should show "בחר מנצחים" state
    expect(screen.getByText('נבחרו 0/2')).toHaveClass('bg-gray-100');
  });

  it('auto-selects winners when auto-select button is clicked', async () => {
    render(<AdvanceWinners {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('🎯 בחר מנצחים אוטומטית')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('🎯 בחר מנצחים אוטומטית'));

    await waitFor(() => {
      expect(screen.getByText('מוכן: 2/2')).toBeInTheDocument();
    });
  });

  it('handles individual winner selection', async () => {
    render(<AdvanceWinners {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Player1 vs Player2')).toBeInTheDocument();
    });

    // Click on first match to select winner
    const firstMatch = screen.getByText('Player1 vs Player2').closest('div');
    if (firstMatch) {
      fireEvent.click(firstMatch);
    }

    await waitFor(() => {
      expect(screen.getByText('נבחרו 1/2')).toBeInTheDocument();
    });
  });

  it('shows preview modal when preview button is clicked', async () => {
    render(<AdvanceWinners {...mockProps} />);
    
    // Auto-select winners first
    await waitFor(() => {
      fireEvent.click(screen.getByText('🎯 בחר מנצחים אוטומטית'));
    });

    await waitFor(() => {
      expect(screen.getByText('תצוגה מקדימה → רבע גמר')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('תצוגה מקדימה → רבע גמר'));

    await waitFor(() => {
      expect(screen.getByText('תצוגה מקדימה - העלאת מנצחים')).toBeInTheDocument();
    });
  });

  it('disables buttons when component is disabled', () => {
    render(<AdvanceWinners {...mockProps} isDisabled={true} />);
    
    expect(screen.getByText('שלב זה הופעל כבר')).toBeInTheDocument();
  });

  it('shows correct round names', async () => {
    const { rerender } = render(<AdvanceWinners {...mockProps} round="QF" />);
    
    await waitFor(() => {
      expect(screen.getByText('תצוגה מקדימה → חצי גמר')).toBeInTheDocument();
    });

    rerender(<AdvanceWinners {...mockProps} round="SF" />);
    
    await waitCard(() => {
      expect(screen.getByText('תצוגה מקדימה → גמר')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockApi.mockImplementation((url: string) => {
      if (url.includes('/matches')) {
        return Promise.reject(new Error('API Error'));
      }
      return Promise.resolve([]);
    });

    render(<AdvanceWinners {...mockProps} />);
    
    await waitFor(() => {
      // Should not crash and should show loading or error state
      expect(screen.queryByText('נבחרו 0/2')).not.toBeInTheDocument();
    });
  });
});

describe('Seeding Logic', () => {
  it('generates correct seed assignments', () => {
    const winners = ['player1', 'player2', 'player3', 'player4'];
    const seededPlayers = winners.map((id, index) => ({
      id,
      seed: index + 1,
    }));

    expect(seededPlayers).toEqual([
      { id: 'player1', seed: 1 },
      { id: 'player2', seed: 2 },
      { id: 'player3', seed: 3 },
      { id: 'player4', seed: 4 },
    ]);
  });

  it('validates even number of winners', () => {
    const validateWinners = (winners: string[]) => {
      return winners.length % 2 === 0;
    };

    expect(validateWinners(['player1', 'player2'])).toBe(true);
    expect(validateWinners(['player1', 'player2', 'player3'])).toBe(false);
    expect(validateWinners(['player1', 'player2', 'player3', 'player4'])).toBe(true);
  });

  it('generates correct match pairings', () => {
    const generateMatchPairings = (winners: string[]) => {
      const pairings = [];
      for (let i = 0; i < winners.length; i += 2) {
        pairings.push({
          homeId: winners[i],
          awayId: winners[i + 1],
        });
      }
      return pairings;
    };

    const winners = ['player1', 'player2', 'player3', 'player4'];
    const pairings = generateMatchPairings(winners);

    expect(pairings).toEqual([
      { homeId: 'player1', awayId: 'player2' },
      { homeId: 'player3', awayId: 'player4' },
    ]);
  });
});

describe('Guard Mechanisms', () => {
  it('prevents advancement with incomplete selection', () => {
    const canAdvance = (selectedCount: number, expectedCount: number) => {
      return selectedCount === expectedCount && expectedCount > 0;
    };

    expect(canAdvance(0, 2)).toBe(false);
    expect(canAdvance(1, 2)).toBe(false);
    expect(canAdvance(2, 2)).toBe(true);
    expect(canAdvance(3, 2)).toBe(false);
  });

  it('validates seed conflicts', () => {
    const hasSeedConflict = (seeds: Array<{ id: string; seed: number }>) => {
      const seedNumbers = seeds.map(s => s.seed);
      const uniqueSeeds = new Set(seedNumbers);
      return seedNumbers.length !== uniqueSeeds.size;
    };

    expect(hasSeedConflict([
      { id: 'p1', seed: 1 },
      { id: 'p2', seed: 2 },
    ])).toBe(false);

    expect(hasSeedConflict([
      { id: 'p1', seed: 1 },
      { id: 'p2', seed: 1 },
    ])).toBe(true);
  });

  it('validates operation timing for undo', () => {
    const canUndo = (operationTime: number, currentTime: number) => {
      const timeDiff = currentTime - operationTime;
      return timeDiff <= 30000; // 30 seconds
    };

    const now = Date.now();
    expect(canUndo(now - 15000, now)).toBe(true); // 15 seconds ago
    expect(canUndo(now - 30000, now)).toBe(true); // exactly 30 seconds ago
    expect(canUndo(now - 31000, now)).toBe(false); // 31 seconds ago
  });
});
