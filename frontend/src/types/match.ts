// src/types/match.ts

// First, define all interfaces
export interface Shot {
    type: string;
    player: string;
    stroke: string | null;
    direction: string | null;
    time: number;
  }
  
  export interface RallyOutcome {
    pointWinner: string;
    outcomeTeam: string;
    type: string;
    time: number;
  }
  
  export interface Rally {
    number: number;
    startTime: number;
    duration: number;
    shots: Shot[];
    outcome: RallyOutcome | null;
    set?: number;
    score?: string;
  }
  
  // Make sure PlayerStats is properly exported
  export interface PlayerStats {
    name: string;
    team: string;
    totalFinishes: number;
    winners: number;
    errors: number;
    weRatio: number;
    shotBreakdown: Record<string, {
      total: number;
      winners: number;
      errors: number;
    }>;
    shotBreakdownArray: Array<{
      shot: string;
      total: number;
      winners: number;
      errors: number;
      successRate: number;
    }>;
  }
  
  export interface MomentumData {
    rally: number;
    scoreDiff: number;
    pointWinner: string;
    [key: string]: number | string;
  }
  
  export interface MatchData {
    teams: string[];
    players: {
      [team: string]: string[];
    };
    rallies: Rally[];
    statistics: {
      totalRallies: number;
      set1Count: number;
      set2Count: number;
      [key: string]: any;
      setWeAnalysis: {
        set1: { [team: string]: { winners: number; errors: number; ratio: number } };
        set2: { [team: string]: { winners: number; errors: number; ratio: number } };
      };
      rallyLengthByOutcome: {
        short: { [team: string]: number };
        medium: { [team: string]: number };
        long: { [team: string]: number };
      };
      sequences: {
        [team: string]: Array<[string, number]>;
      };
      finishingPlayers: PlayerStats[];
      momentum: {
        set1: MomentumData[];
        set2: MomentumData[];
        set3?: MomentumData[];
      };
    };
    pointsTimeline: {
      [team: string]: Array<{ time: number }>;
    };
    playerStats: any; // Replace with proper type
    rallyLengthAnalysis: {
      short: RallyLengthData;
      medium: RallyLengthData;
      long: RallyLengthData;
    };
  }

  interface RallyLengthData {
    total: number;
    [team: string]: number;
  }