// src/components/MatchAnalysis/Statistics/MomentumGraph.tsx
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface MomentumGraphProps {
  data: Array<{
    rally: number;
    scoreDiff: number;
    pointWinner: string;
    [key: string]: number | string;
  }>;
  teams: string[];
  title: string;
}

export const MomentumGraph: React.FC<MomentumGraphProps> = ({ data, teams, title }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rally" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={`${teams[0].toLowerCase()}Score`}
              stroke="#3b82f6"
              name={teams[0]}
            />
            <Line
              type="monotone"
              dataKey={`${teams[1].toLowerCase()}Score`}
              stroke="#ef4444"
              name={teams[1]}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-center space-x-6 text-sm mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-blue-500"></div>
          <span>{teams[0]}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-1 bg-red-500"></div>
          <span>{teams[1]}</span>
        </div>
      </div>
    </div>
  );
};