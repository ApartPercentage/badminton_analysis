// src/components/MatchAnalysis/RallyList.tsx
import React, { useState } from 'react';
import type { Rally } from '../../types/match';

interface RallyListProps {
  rallies: Rally[];
  teams: string[];
}

export const RallyList: React.FC<RallyListProps> = ({ rallies, teams }) => {
  const [selectedRally, setSelectedRally] = useState<number | null>(null);
  const [selectedSet, setSelectedSet] = useState<'all' | 1 | 2>('all');
  const filteredRallies = selectedSet === 'all' 
    ? rallies 
    : rallies.filter(r => r.set === selectedSet);

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

  const getTeamColor = (player: string): string => {
    return teams[0].toLowerCase().includes(player.toLowerCase())
      ? 'bg-blue-100 text-blue-800'
      : 'bg-red-100 text-red-800';
  };

  const getStrokeIcon = (stroke: string | null): string => {
    if (!stroke) return '';
    if (stroke.toLowerCase().includes('forehand')) return '👉';
    if (stroke.toLowerCase().includes('backhand')) return '👈';
    if (stroke.toLowerCase().includes('overhead')) return '☝️';
    return '';
  };

  const getDirectionIcon = (direction: string | null): string => {
    if (!direction) return '';
    if (direction.toLowerCase().includes('straight')) return '⬆️';
    if (direction.toLowerCase().includes('cross')) return '↗️';
    return '';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-center">Rally Analysis</h3>
      <div className="mb-6 flex justify-center">
        <div className="bg-white rounded-lg shadow p-2 flex space-x-2">
          <button
            onClick={() => setSelectedSet('all')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              selectedSet === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Rallies ({rallies.length})
          </button>
          <button
            onClick={() => setSelectedSet(1)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              selectedSet === 1 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Set 1 ({rallies.filter(r => r.set === 1).length})
          </button>
          <button
            onClick={() => setSelectedSet(2)}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              selectedSet === 2 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Set 2 ({rallies.filter(r => r.set === 2).length})
          </button>
        </div>
      </div>
      {filteredRallies.map((rally, _index) => (
        <div 
          key={rally.number}
          className={`border-l-4 rounded-lg p-6 shadow-lg ${
            rally.outcome?.pointWinner === teams[0]
              ? 'border-l-blue-500 bg-blue-50'
              : 'border-l-red-500 bg-red-50'
          }`}
        >
          <div className="flex flex-wrap justify-between items-center mb-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className="font-bold text-xl">Rally {rally.number}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Set {rally.set}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                {rally.duration.toFixed(1)}s
              </span>
              {rally.outcome && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                  rally.outcome.pointWinner === teams[0] ? 'bg-blue-500' : 'bg-red-500'
                }`}>
                  Winner: {rally.outcome.pointWinner}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Score: {rally.score}
            </div>
          </div>

          <div className="mb-4">
            <button
              onClick={() => setSelectedRally(selectedRally === rally.number ? null : rally.number)}
              className="font-bold mb-3 text-lg flex items-center space-x-2"
            >
              <span>Shot-by-Shot Breakdown</span>
              <span className="text-gray-500">({rally.shots.length} shots)</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  selectedRally === rally.number ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {selectedRally === rally.number && rally.shots.length > 0 && (
              <div className="space-y-3">
                {rally.shots.map((shot, shotIndex) => (
                  <div
                    key={shotIndex}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-gray-700 w-8">#{shotIndex + 1}</span>
                      <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getShotColor(shot.type)}`}>
                        {shot.type}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTeamColor(shot.player)}`}>
                        {shot.player}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      {shot.stroke && (
                        <span className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          <span>{getStrokeIcon(shot.stroke)}</span>
                          <span>{shot.stroke}</span>
                        </span>
                      )}
                      {shot.direction && (
                        <span className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          <span>{getDirectionIcon(shot.direction)}</span>
                          <span>{shot.direction}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {rally.shots.length > 0 && (
            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
              <h5 className="font-medium mb-2">Shot Sequence:</h5>
              <div className="text-sm font-mono">
                {rally.shots.map(shot => shot.type).join(' → ')}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-medium mb-2">Rally Outcome:</h5>
              {rally.outcome ? (
                <div className="space-y-1">
                  <div className="font-medium">
                    {rally.outcome.outcomeTeam} {rally.outcome.type}
                  </div>
                  <div className={`text-sm ${
                    rally.outcome.pointWinner === teams[0] ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    Point Winner: {rally.outcome.pointWinner}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No outcome recorded</p>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">
          Showing {filteredRallies.length} of {rallies.length} total rallies
          {selectedSet !== 'all' && ` (Set ${selectedSet})`}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          🏸 Shot Types: SERVE, smash, defend, clear, H.drive, S.drive, block, tap, net, lob, drop<br/>
          👉 Strokes: Forehand, Backhand, Overhead | ⬆️ Directions: Straight, Cross
        </p>
      </div>
    </div>
  );
};