import React from 'react';
import type { PlayerStats as PlayerStatsType } from '../../../types/match';

interface PlayerStatsProps {
  players: PlayerStatsType[];
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ players }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-2xl font-bold mb-6 text-center">Player Performance Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {players.map((player, index) => (
          <div 
            key={index} 
            className={`p-6 rounded-lg border-2 ${
              player.team.toLowerCase().includes('malaysia') 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}
          >
            <h4 className="font-bold text-center mb-3 text-xl">{player.name}</h4>
            <div className="text-center mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                player.team.toLowerCase().includes('malaysia')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {player.team}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {player.totalFinishes}
                </div>
                <div className="text-sm">Last Shots</div>
              </div>
              <div className="text-center p-3 bg-white rounded">
                <div className={`text-2xl font-bold ${
                  parseFloat(player.weRatio.toString()) >= 1.0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {player.weRatio}
                </div>
                <div className="text-sm">W/E Ratio</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded">
              <h5 className="font-medium mb-3">Shot Breakdown:</h5>
              <div className="space-y-2">
                {player.shotBreakdownArray.slice(0, 5).map((shotData, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                    <span className="px-2 py-1 rounded text-white text-xs bg-blue-500">
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