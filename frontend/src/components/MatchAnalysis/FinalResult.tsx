import type { MatchData } from "../../types/match";

export const FinalResult: React.FC<{ data: MatchData }> = ({ data }) => {
  const getSetScore = (setNumber: number) => {
    const setRallies = data.rallies?.filter(r => r.set === setNumber) || [];
    const team1Score = setRallies.filter(r => r.outcome?.pointWinner === data.teams[0]).length;
    const team2Score = setRallies.filter(r => r.outcome?.pointWinner === data.teams[1]).length;
    return { team1Score, team2Score };
  };

  const set1Score = getSetScore(1);
  const set2Score = getSetScore(2);

  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-red-50 rounded-lg border-2 border-gray-200">
      <h2 className="text-xl font-bold text-center mb-4">Final Result</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Set 1</h3>
          <div className="text-2xl">
            <span className="text-blue-600">{set1Score.team1Score}</span>
            <span className="mx-2">-</span>
            <span className="text-red-600">{set1Score.team2Score}</span>
          </div>
        </div>
        <div className="text-center p-4 bg-white rounded-lg shadow">
          <h3 className="font-bold text-lg mb-2">Set 2</h3>
          <div className="text-2xl">
            <span className="text-blue-600">{set2Score.team1Score}</span>
            <span className="mx-2">-</span>
            <span className="text-red-600">{set2Score.team2Score}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
