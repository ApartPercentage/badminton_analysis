// src/components/MatchAnalysis/Statistics/RallyLengthAnalysis.tsx
import React from 'react';

interface RallyLengthData {
  total: number;
  [key: string]: number;  // For dynamic team names and percentages
}

interface RallyLengthAnalysisProps {
  data: {
    short: RallyLengthData;
    medium: RallyLengthData;
    long: RallyLengthData;
  };
  teams: string[];
}

export const RallyLengthAnalysis: React.FC<RallyLengthAnalysisProps> = ({ data, teams }) => {
  const getDurationRange = (category: string) => {
    switch (category) {
      case 'short':
        return '< 5 seconds';
      case 'medium':
        return '5-10 seconds';
      case 'long':
        return '> 10 seconds';
      default:
        return '';
    }
  };

  const getWinningTeam = (category: RallyLengthData, teams: string[]) => {
    const team1Score = category[teams[0].toLowerCase()];
    const team2Score = category[teams[1].toLowerCase()];
    if (team1Score === team2Score) return null;
    return team1Score > team2Score ? teams[0] : teams[1];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6 text-center">Rally Length Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(data).map(([category, categoryData]) => {
          const winningTeam = getWinningTeam(categoryData, teams);
          
          return (
            <div key={category} className="p-6 border-2 border-gray-200 rounded-lg">
              <h4 className="font-bold text-center mb-4 capitalize text-lg">
                {category} Rallies
              </h4>
              <p className="text-center text-sm text-gray-600 mb-4">
                {getDurationRange(category)}
              </p>

              <div className="space-y-4">
                {teams.map(team => {
                  const teamLower = team.toLowerCase();
                  const percentage = categoryData[`${teamLower}_percentage`] || 0;
                  const wins = categoryData[teamLower] || 0;

                  return (
                    <div key={team}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{team}</span>
                        <div className="text-right">
                          <span className="font-bold">
                            {wins} wins ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            team === teams[0] ? 'bg-blue-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {winningTeam && (
                  <div className={`text-center p-3 rounded font-bold mt-4 ${
                    winningTeam === teams[0] 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {winningTeam} Dominates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Short: &lt;5s | Medium: 5-10s | Long: &gt;10s</p>
      </div>
    </div>
  );
};