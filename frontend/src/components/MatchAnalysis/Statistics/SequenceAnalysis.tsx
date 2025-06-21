import React from 'react';

interface SequenceAnalysisProps {
  data: {
    [key: string]: [string, number][];
  };
  teams: string[];
}

export const SequenceAnalysis: React.FC<SequenceAnalysisProps> = ({ data, teams }) => {
  // Calculate the maximum number of sequences across all categories
  const maxWinningSequences = Math.max(
    ...teams.map(team => data[`${team.toLowerCase()}MostWinning`]?.length || 0)
  );
  const maxLosingSequences = Math.max(
    ...teams.map(team => data[`${team.toLowerCase()}MostLosing`]?.length || 0)
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6 text-center">Shot Sequence Analysis</h3>
      
      {/* Winning Sequences Section */}
      <div className="mb-8">
        <h4 className="text-xl font-bold text-center mb-6 text-green-700">Most Frequent Winner Sequences</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams.map(team => (
            <div key={team} className="space-y-2">
              <h5 className="font-bold text-center text-lg">{team}</h5>
              <div className="border-l-4 border-green-500 pl-4">
                {data[`${team.toLowerCase()}MostWinning`]?.length > 0 ? (
                  <div className="space-y-2">
                    {data[`${team.toLowerCase()}MostWinning`].map(([sequence, count], index) => (
                      <div key={index} className="flex justify-between items-center bg-green-50 p-3 rounded">
                        <span className="font-medium text-sm">{sequence}</span>
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                          {count}x
                        </span>
                      </div>
                    ))}
                    {/* Add empty spaces to align with the team that has more sequences */}
                    {Array.from({ length: maxWinningSequences - (data[`${team.toLowerCase()}MostWinning`]?.length || 0) }).map((_, index) => (
                      <div key={`empty-winning-${index}`} className="h-12 bg-gray-50 rounded opacity-50"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-500 italic">No repeated winning sequences</p>
                    {Array.from({ length: maxWinningSequences }).map((_, index) => (
                      <div key={`empty-winning-${index}`} className="h-12 bg-gray-50 rounded opacity-50"></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Losing Sequences Section */}
      <div>
        <h4 className="text-xl font-bold text-center mb-6 text-red-700">Most Frequent Error Sequences</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams.map(team => (
            <div key={team} className="space-y-2">
              <h5 className="font-bold text-center text-lg">{team}</h5>
              <div className="border-l-4 border-red-400 pl-4">
                {data[`${team.toLowerCase()}MostLosing`]?.length > 0 ? (
                  <div className="space-y-2">
                    {data[`${team.toLowerCase()}MostLosing`].map(([sequence, count], index) => (
                      <div key={index} className="flex justify-between items-center bg-red-50 p-3 rounded">
                        <span className="font-medium text-sm">{sequence}</span>
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                          {count}x
                        </span>
                      </div>
                    ))}
                    {/* Add empty spaces to align with the team that has more sequences */}
                    {Array.from({ length: maxLosingSequences - (data[`${team.toLowerCase()}MostLosing`]?.length || 0) }).map((_, index) => (
                      <div key={`empty-losing-${index}`} className="h-12 bg-gray-50 rounded opacity-50"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-500 italic">No repeated error sequences</p>
                    {Array.from({ length: maxLosingSequences }).map((_, index) => (
                      <div key={`empty-losing-${index}`} className="h-12 bg-gray-50 rounded opacity-50"></div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};