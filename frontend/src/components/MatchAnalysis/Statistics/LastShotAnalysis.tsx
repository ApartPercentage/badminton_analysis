import React from 'react';

interface ShotBreakdown {
  shot: string;
  total: number;
  winners: number;
  errors: number;
  successRate: number;
}

interface PlayerStats {
  name: string;
  team: string;
  totalFinishes: number;
  winners: number;
  errors: number;
  weRatio: number;
  shotBreakdownArray: ShotBreakdown[];
}

interface LastShotAnalysisProps {
  data: PlayerStats[];
  teams: string[];
}

export const LastShotAnalysis: React.FC<LastShotAnalysisProps> = ({ data, teams }) => {
  console.log('LastShotAnalysis Component:', {
    receivedData: data,
    dataLength: data?.length,
    teams,
    firstPlayer: data?.[0]
  });

  const getShotColor = (shotType: string): string => {
    const colors: { [key: string]: string } = {
      'smash': 'bg-red-600',
      'defend': 'bg-green-600',
      'clear': 'bg-blue-600',
      'H.drive': 'bg-purple-600',
      'S.drive': 'bg-indigo-600',
      'block': 'bg-cyan-600',
      'tap': 'bg-orange-600',
      'net': 'bg-yellow-600',
      'lob': 'bg-pink-600',
      'drop': 'bg-gray-600',
      'SERVE': 'bg-teal-600'
    };
    return colors[shotType] || 'bg-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6 text-center">🎯 Last Shot Analysis by Player</h3>
      <p className="text-gray-600 text-center mb-6">Analysis of who took the final shot and what shot they used</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {data.map((player, index) => (
          <div key={index} className={`p-6 rounded-lg border-2 ${
            player.team === teams[0] ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
          }`}>
            <h4 className="font-bold text-center mb-3 text-xl">{player.name}</h4>
            <div className="text-center mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                player.team === teams[0] ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
              }`}>
                {player.team}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-blue-600">{player.totalFinishes}</div>
                <div className="text-sm">Last Shots</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className={`text-2xl font-bold ${player.weRatio >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                  {player.weRatio.toFixed(2)}
                </div>
                <div className="text-sm">W/E Ratio</div>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between bg-white p-2 rounded">
                <span>Winners:</span>
                <span className="font-bold text-green-600">{player.winners}</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded">
                <span>Errors:</span>
                <span className="font-bold text-red-600">{player.errors}</span>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded">
              <h5 className="font-medium mb-3">Shot Breakdown:</h5>
              <div className="space-y-2">
                {player.shotBreakdownArray?.slice(0, 5).map((shotData, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span className={`px-2 py-1 rounded text-white text-xs ${getShotColor(shotData.shot)}`}>
                      {shotData.shot}
                    </span>
                    <div className="text-right">
                      <div className="font-medium">{shotData.total}x total</div>
                      <div className="text-xs text-gray-600">
                        W:{shotData.winners} E:{shotData.errors} ({shotData.successRate.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
