import type { MatchData } from "../../types/match";

interface SetScore {
  team1Score: number;
  team2Score: number;
  rallies: number;
}

export const FinalResult: React.FC<{ data: MatchData }> = ({ data }) => {
  const getSetScore = (setNumber: number): SetScore => {
    const setRallies = data.rallies?.filter(r => r.set === setNumber) || [];
    const team1Score = setRallies.filter(r => r.outcome?.pointWinner === data.teams[0]).length;
    const team2Score = setRallies.filter(r => r.outcome?.pointWinner === data.teams[1]).length;
    return { 
      team1Score, 
      team2Score,
      rallies: setRallies.length 
    };
  };

  const determineMatchResult = (set1Score: SetScore, set2Score: SetScore, set3Score: SetScore) => {
    let team1Sets = 0;
    let team2Sets = 0;

    // Count set 1
    if (set1Score.team1Score > set1Score.team2Score) team1Sets++;
    else if (set1Score.team2Score > set1Score.team1Score) team2Sets++;

    // Count set 2
    if (set2Score.team1Score > set2Score.team2Score) team1Sets++;
    else if (set2Score.team2Score > set2Score.team1Score) team2Sets++;

    // Count set 3 if it exists (has rallies)
    if (set3Score.rallies > 0) {
      if (set3Score.team1Score > set3Score.team2Score) team1Sets++;
      else if (set3Score.team2Score > set3Score.team1Score) team2Sets++;
    }

    const winner = team1Sets > team2Sets ? data.teams[0] : data.teams[1];
    const score = `${team1Sets}-${team2Sets}`;
    
    return { winner, score };
  };

  const set1Score = getSetScore(1);
  const set2Score = getSetScore(2);
  const set3Score = getSetScore(3);
  const matchResult = determineMatchResult(set1Score, set2Score, set3Score);

  // Get player names for each team
  const team1Players = data.players?.[data.teams[0]] || [];
  const team2Players = data.players?.[data.teams[1]] || [];

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-red-50 rounded-lg border-2 border-gray-200">
      <h2 className="text-xl font-bold text-center mb-4">
        Final Result: {matchResult.score} ({matchResult.winner} Wins)
      </h2>
      
      {/* Team and Player Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold text-lg text-blue-600 mb-2">{data.teams[0]}</h3>
          <div className="text-sm text-gray-700">
            {team1Players.length > 0 ? (
              team1Players.map((player, index) => (
                <div key={index} className="mb-1">{player}</div>
              ))
            ) : (
              <div className="text-gray-500">No player data</div>
            )}
          </div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold text-lg text-red-600 mb-2">{data.teams[1]}</h3>
          <div className="text-sm text-gray-700">
            {team2Players.length > 0 ? (
              team2Players.map((player, index) => (
                <div key={index} className="mb-1">{player}</div>
              ))
            ) : (
              <div className="text-gray-500">No player data</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Set 1</h3>
          <div className="text-2xl">
            <span className="text-blue-600">{set1Score.team1Score}</span>
            <span className="mx-2">-</span>
            <span className="text-red-600">{set1Score.team2Score}</span>
          </div>
          <p className="text-sm text-gray-600">{set1Score.rallies} rallies</p>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Set 2</h3>
          <div className="text-2xl">
            <span className="text-blue-600">{set2Score.team1Score}</span>
            <span className="mx-2">-</span>
            <span className="text-red-600">{set2Score.team2Score}</span>
          </div>
          <p className="text-sm text-gray-600">{set2Score.rallies} rallies</p>
        </div>
        {set3Score.rallies > 0 && (
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Set 3</h3>
            <div className="text-2xl">
              <span className="text-blue-600">{set3Score.team1Score}</span>
              <span className="mx-2">-</span>
              <span className="text-red-600">{set3Score.team2Score}</span>
            </div>
            <p className="text-sm text-gray-600">{set3Score.rallies} rallies</p>
          </div>
        )}
      </div>
    </div>
  );
};
