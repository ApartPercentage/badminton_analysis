// src/components/MatchAnalysis/Statistics/WERatioAnalysis.tsx
import React from 'react';

interface WERatioData {
  winners: number;
  errors: number;
  ratio?: number;  // Make ratio optional since it might not exist
}

interface SetAnalysis {
  [team: string]: WERatioData;
}

interface WERatioAnalysisProps {
  data: {
    set1: SetAnalysis;
    set2: SetAnalysis;
  };
  teams: string[];
}

export const WERatioAnalysis: React.FC<WERatioAnalysisProps> = ({ data, teams }) => {
  if (!data || !data.set1 || !data.set2) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-6 text-center">
          Winners/Errors Ratio Analysis
        </h3>
        <p className="text-center text-gray-600">No W/E ratio data available</p>
      </div>
    );
  }

  const renderSetAnalysis = (setKey: 'set1' | 'set2', setData: SetAnalysis) => {
    const setNumber = setKey.charAt(setKey.length - 1);

    return (
      <div className={`border-2 ${
        setKey === 'set1' ? 'border-blue-200 bg-blue-50' : 'border-purple-200 bg-purple-50'
      } rounded-lg p-6`}>
        <h4 className="text-xl font-bold text-center mb-4 text-gray-800">
          Set {setNumber} W/E Performance
        </h4>

        <div className="space-y-6">
          {teams.map(team => {
            const teamLower = team.toLowerCase();
            const teamData = setData[teamLower] || { winners: 0, errors: 0 };
            const totalShots = teamData.winners + teamData.errors;
            const winnerPercentage = totalShots > 0 
              ? (teamData.winners / totalShots) * 100 
              : 0;
            
            // Calculate W/E ratio here instead of using the one from data
            const weRatio = teamData.errors > 0 
              ? teamData.winners / teamData.errors 
              : teamData.winners;

            return (
              <div key={team} className="bg-white p-4 rounded-lg shadow">
                <h5 className="font-bold text-gray-700 mb-3">{team}</h5>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {/* Winners */}
                  <div className="bg-green-100 p-2 rounded">
                    <div className="font-bold text-green-600">
                      {teamData.winners}
                    </div>
                    <div className="text-xs">Winners</div>
                  </div>

                  {/* Errors */}
                  <div className="bg-red-100 p-2 rounded">
                    <div className="font-bold text-red-600">
                      {teamData.errors}
                    </div>
                    <div className="text-xs">Errors</div>
                  </div>

                  {/* W/E Ratio */}
                  <div className="bg-blue-100 p-2 rounded">
                    <div className={`font-bold ${
                      weRatio >= 1.0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {weRatio.toFixed(2)}
                    </div>
                    <div className="text-xs">W/E Ratio</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Winners vs Errors Distribution</span>
                    <span>{winnerPercentage.toFixed(1)}% Winners</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${winnerPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">
                    Total Shots: {totalShots}
                  </div>
                  <div className="text-gray-600 text-right">
                    Efficiency: {(weRatio * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Set Summary */}
        <div className="mt-6 p-4 bg-white rounded-lg">
          <h5 className="font-semibold mb-2">Set {setNumber} Summary</h5>
          <div className="space-y-2 text-sm">
            {teams.map(team => {
              const teamLower = team.toLowerCase();
              const teamData = setData[teamLower] || { winners: 0, errors: 0 };
              const weRatio = teamData.errors > 0 
                ? teamData.winners / teamData.errors 
                : teamData.winners;

              return (
                <div key={team} className="flex justify-between items-center">
                  <span>{team}</span>
                  <span className={`font-medium ${
                    weRatio >= 1.0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {teamData.winners} W / {teamData.errors} E
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6 text-center">
        Winners/Errors Ratio Analysis
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {renderSetAnalysis('set1', data.set1)}
        {renderSetAnalysis('set2', data.set2)}
      </div>

      {/* Overall Analysis */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h4 className="font-bold mb-4">Key Observations</h4>
        <div className="space-y-4">
          {teams.map(team => {
            const teamLower = team.toLowerCase();
            const set1Data = data.set1[teamLower] || { winners: 0, errors: 0 };
            const set2Data = data.set2[teamLower] || { winners: 0, errors: 0 };
            
            const set1Ratio = set1Data.errors > 0 
              ? set1Data.winners / set1Data.errors 
              : set1Data.winners;
            const set2Ratio = set2Data.errors > 0 
              ? set2Data.winners / set2Data.errors 
              : set2Data.winners;
            
            const improvement = set2Ratio - set1Ratio;

            return (
              <div key={team} className="text-sm">
                <span className="font-medium">{team}: </span>
                {improvement > 0 ? (
                  <span className="text-green-600">
                    Improved W/E ratio by {improvement.toFixed(2)} in Set 2
                  </span>
                ) : (
                  <span className="text-red-600">
                    Decreased W/E ratio by {Math.abs(improvement).toFixed(2)} in Set 2
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};