import React, { useState, useEffect } from 'react';

interface SetScoreInputProps {
  teams: string[];
  onScoresSubmit: (scores: Record<string, Record<string, number>>) => void;
}

interface Scores {
  set1: { [key: string]: number };
  set2: { [key: string]: number };
  set3?: { [key: string]: number };  // Make set3 optional
}

export const SetScoreInput: React.FC<SetScoreInputProps> = ({ teams, onScoresSubmit }) => {
  const [scores, setScores] = useState<Scores>({
    set1: { [teams[0]]: 0, [teams[1]]: 0 },
    set2: { [teams[0]]: 0, [teams[1]]: 0 }
  });
  
  const [needsThirdSet, setNeedsThirdSet] = useState(false);

  // Check if third set is needed based on first two sets
  useEffect(() => {
    const set1Winner = scores.set1[teams[0]] > scores.set1[teams[1]] ? teams[0] : teams[1];
    const set2Winner = scores.set2[teams[0]] > scores.set2[teams[1]] ? teams[0] : teams[1];
    
    // If winners are different, we need a third set
    if (set1Winner !== set2Winner && 
        scores.set1[teams[0]] + scores.set1[teams[1]] > 0 && 
        scores.set2[teams[0]] + scores.set2[teams[1]] > 0) {
      setNeedsThirdSet(true);
      // Initialize set3 scores if not already present
      if (!scores.set3) {
        setScores(prev => ({
          ...prev,
          set3: { [teams[0]]: 0, [teams[1]]: 0 }
        }));
      }
    } else {
      setNeedsThirdSet(false);
      // Remove set3 if it exists
      if (scores.set3) {
        const { set3, ...restScores } = scores;
        setScores(restScores);
      }
    }
  }, [scores.set1, scores.set2, teams]);

  const handleScoreChange = (set: keyof Scores, team: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setScores(prev => ({
      ...prev,
      [set]: {
        ...prev[set],
        [team]: numValue
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting scores:', scores);
    onScoresSubmit(scores as unknown as Record<string, Record<string, number>>);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Enter Match Scores</h2>
      <form onSubmit={handleSubmit}>
        {(['set1', 'set2'] as const).map((set) => (
          <div key={set} className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              Set {set.charAt(set.length - 1)}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team} className="space-y-2">
                  <label 
                    htmlFor={`${set}-${team}`} 
                    className="block text-sm font-medium text-gray-700"
                  >
                    {team}
                  </label>
                  <input
                    type="number"
                    id={`${set}-${team}`}
                    min="0"
                    max="30"
                    value={scores[set][team]}
                    onChange={(e) => handleScoreChange(set as keyof Scores, team, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm 
                             focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {/* Conditionally render third set */}
        {needsThirdSet && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Set 3</h3>
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team} className="space-y-2">
                  <label 
                    htmlFor={`set3-${team}`} 
                    className="block text-sm font-medium text-gray-700"
                  >
                    {team}
                  </label>
                  <input
                    type="number"
                    id={`set3-${team}`}
                    min="0"
                    max="30"
                    value={scores.set3?.[team] || 0}
                    onChange={(e) => handleScoreChange('set3' as keyof Scores, team, e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm 
                             focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required={needsThirdSet}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:ring-offset-2"
          >
            Analyze Match
          </button>
        </div>
      </form>
    </div>
  );
};