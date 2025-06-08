import React from 'react';

interface SequenceAnalysisProps {
  data: {
    [key: string]: [string, number][];
  };
  teams: string[];
}

export const SequenceAnalysis: React.FC<SequenceAnalysisProps> = ({ data, teams }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6 text-center">Shot Sequence Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {teams.map(team => (
          <div key={team} className="space-y-6">
            <h4 className="text-xl font-bold text-center">{team}</h4>
            
            {/* Winning Sequences */}
            <div className="border-l-4 border-green-500 pl-4">
              <h5 className="font-bold text-green-700 mb-3">Most Frequent Winner Sequences</h5>
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
                </div>
              ) : (
                <p className="text-gray-500 italic">No repeated winning sequences</p>
              )}
            </div>

            {/* Losing Sequences */}
            <div className="border-l-4 border-red-400 pl-4">
              <h5 className="font-bold text-red-700 mb-3">Most Frequent Error Sequences</h5>
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
                </div>
              ) : (
                <p className="text-gray-500 italic">No repeated error sequences</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};