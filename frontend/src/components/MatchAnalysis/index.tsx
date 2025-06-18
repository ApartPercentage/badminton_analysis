// src/components/MatchAnalysis/index.tsx
import React, { useState } from 'react';
import type { MatchData } from '../../types/match';
import { MomentumGraph } from './Statistics/MomentumGraph';
import { SequenceAnalysis } from './Statistics/SequenceAnalysis';
import { PlayerStats } from './Statistics/PlayerStats';
import { RallyLengthAnalysis } from './Statistics/RallyLengthAnalysis';
import { WERatioAnalysis } from './Statistics/WERatioAnalysis';
import { RallyList } from './RallyList';
import { LastShotAnalysis } from './Statistics/LastShotAnalysis';
import { FinalResult } from './FinalResult';
import { PDFDownload } from '../PDFDownload';

interface MatchAnalysisProps {
  data: MatchData | null;
  teams: string[];
}

interface RallyLengthData {
  total: number;
  [key: string]: number;
}

interface RallyLengthByOutcome {
  short: { [team: string]: number };
  medium: { [team: string]: number };
  long: { [team: string]: number };
}

interface TransformedRallyLength {
  short: RallyLengthData;
  medium: RallyLengthData;
  long: RallyLengthData;
}

const transformRallyLengthData = (data: RallyLengthByOutcome): TransformedRallyLength => {
  return {
    short: {
      ...data.short,
      total: Object.values(data.short).reduce((sum, val) => sum + val, 0)
    },
    medium: {
      ...data.medium,
      total: Object.values(data.medium).reduce((sum, val) => sum + val, 0)
    },
    long: {
      ...data.long,
      total: Object.values(data.long).reduce((sum, val) => sum + val, 0)
    }
  };
};

export const MatchAnalysis: React.FC<MatchAnalysisProps> = ({ data, teams: propsTeams }) => {
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);

  // Use teams from either props or data
  const teams = propsTeams || data?.teams;
  
  // Add debug logs
  console.log('Advanced Analysis State:', {
    showAdvancedAnalysis,
    statistics: data?.statistics,
    hasWeRatio: !!data?.statistics?.setWeAnalysis,
    hasRallyLength: !!data?.statistics?.rallyLengthByOutcome,
    hasSequences: !!data?.statistics?.sequences
  });

  console.log('MatchAnalysis props:', { data, teams });

  if (!data) {
    return <div>No match data available</div>;
  }

  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    return <div>No teams data available</div>;
  }

  // Add this before rendering LastShotAnalysis
  console.log('LastShotAnalysis Data:', {
    hasFinishingPlayers: !!data.statistics?.finishingPlayers,
    finishingPlayersData: data.statistics?.finishingPlayers,
    teams,
    fullStatistics: data.statistics
  });

  return (
    <div id="match-analysis" className="space-y-8 p-4">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold text-center mb-4">Match Analysis</h2>
        
        {/* PDF Download Button */}
        <PDFDownload data={data} teams={teams} />
      </div>

      {/* Add FinalResult component at the top */}
      <FinalResult data={data} />

      {/* Points Timeline */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Points Timeline</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teams.map((team, index) => (
            <div key={`${team}-${index}`} className="p-4 border rounded">
              <h4 className="font-medium mb-2">{team}</h4>
              <div className="space-y-2">
                {data.pointsTimeline?.[team]?.map((point, pointIndex) => (
                  <div key={`${team}-point-${pointIndex}`} className="flex justify-between">
                    <span>Point {pointIndex + 1}:</span>
                    <span>{point.time}s</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {data.playerStats && (
          <PlayerStats 
            players={data.playerStats} 
          />
        )}
        
        {data.rallyLengthAnalysis && (
          <RallyLengthAnalysis 
            data={data.rallyLengthAnalysis}
            teams={teams}
          />
        )}
      </div>

      <MatchStatistics data={data} />
      
      <div className="mb-8 flex justify-center">
        <button
          onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {showAdvancedAnalysis ? 'Hide' : 'Show'} Advanced Analysis
        </button>
      </div>

      {showAdvancedAnalysis && (
        <div className="space-y-8">
          {/* Add Momentum Graphs */}
          {data.statistics?.momentum?.set1 && (
            <MomentumGraph 
              data={data.statistics.momentum.set1} 
              teams={teams}
              title="Set 1 Score Momentum"
            />
          )}
          
          {data.statistics?.momentum?.set2 && (
            <MomentumGraph 
              data={data.statistics.momentum.set2} 
              teams={teams}
              title="Set 2 Score Momentum"
            />
          )}

          {/* Add Set 3 Momentum Graph */}
          {data.statistics?.momentum?.set3 && data.statistics.momentum.set3.length > 0 && (
            <MomentumGraph 
              data={data.statistics.momentum.set3} 
              teams={teams}
              title="Set 3 Score Momentum"
            />
          )}

          {/* Add Last Shot Analysis */}
          {data.statistics?.finishingPlayers && (
            <LastShotAnalysis 
              data={data.statistics.finishingPlayers}
              teams={teams}
            />
          )}

          {/* Existing components */}
          {data.statistics?.setWeAnalysis && (
            <WERatioAnalysis data={data.statistics.setWeAnalysis} teams={teams} />
          )}
          
          {data.statistics?.rallyLengthByOutcome && (
            <RallyLengthAnalysis 
              data={transformRallyLengthData(data.statistics.rallyLengthByOutcome)} 
              teams={teams} 
            />
          )}
          
          {data.statistics?.sequences && (
            <SequenceAnalysis data={data.statistics.sequences} teams={teams} />
          )}
        </div>
      )}
      
      <RallyList rallies={data.rallies} teams={teams} />
    </div>
  );
};

// Add this before the MatchStatistics component
interface StatCardProps {
  title: string;
  value: number | string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="text-center p-4 border rounded-lg">
      <div className="text-2xl font-bold text-blue-600">
        {value}
      </div>
      <div className="text-sm text-gray-600">
        {title}
      </div>
    </div>
  );
};

// Then your existing MatchStatistics component will work
const MatchStatistics: React.FC<{ data: MatchData }> = ({ data }) => {
  const totalRallies = data.rallies?.length || 0;
  const team1Points = data.rallies?.filter(r => r.outcome?.pointWinner === data.teams[0]).length || 0;
  const team2Points = data.rallies?.filter(r => r.outcome?.pointWinner === data.teams[1]).length || 0;
  const avgRallyLength = data.rallies?.reduce((sum, r) => sum + r.duration, 0) / totalRallies || 0;

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 text-center">Match Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Rallies" value={totalRallies} />
        <StatCard title={`${data.teams[0]} Points`} value={team1Points} />
        <StatCard title={`${data.teams[1]} Points`} value={team2Points} />
        <StatCard title="Avg Rally Length" value={`${avgRallyLength.toFixed(1)}s`} />
      </div>
    </div>
  );
};