import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';

const BadmintonMatchAnalyzer = () => {
  const [rallies, setRallies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedSet, setSelectedSet] = useState('all');
  const [analysisData, setAnalysisData] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await window.fs.readFile('peikee meixing  jiayifan zhangshuxian.csv', { encoding: 'utf8' });
        
        const parsedData = Papa.parse(response, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true
        });
        
        const data = parsedData.data;
        const sortedData = data.sort((a, b) => a['Start time'] - b['Start time']);
        
        const ralliesData = [];
        let currentRally = null;
        
        for (const item of sortedData) {
          if (item.Row === 'RALLY') {
            if (currentRally) {
              ralliesData.push(currentRally);
            }
            
            currentRally = {
              number: item['Instance number'],
              startTime: item['Start time'],
              duration: item.Duration,
              notes: item.Notes,
              shots: [],
              outcome: null
            };
          } else if (currentRally) {
            const itemTime = item['Start time'];
            const rallyEnd = currentRally.startTime + currentRally.duration;
            
            if (itemTime >= currentRally.startTime && itemTime <= rallyEnd) {
              if (item.Row === 'CHINA' || item.Row === 'MALAYSIA') {
                let pointWinner;
                if (item.Row === 'MALAYSIA' && item.OUTCOME === 'WINNER') {
                  pointWinner = 'Malaysia';
                } else if (item.Row === 'MALAYSIA' && item.OUTCOME === 'ERROR') {
                  pointWinner = 'China';
                } else if (item.Row === 'CHINA' && item.OUTCOME === 'WINNER') {
                  pointWinner = 'China';
                } else if (item.Row === 'CHINA' && item.OUTCOME === 'ERROR') {
                  pointWinner = 'Malaysia';
                }
                
                currentRally.outcome = {
                  pointWinner: pointWinner,
                  outcomeTeam: item.Row,
                  type: item.OUTCOME,
                  time: itemTime
                };
              } else if (item['PLAYER\'S NAME']) {
                currentRally.shots.push({
                  type: item.Row,
                  player: item['PLAYER\'S NAME'],
                  stroke: item.Stroke,
                  direction: item['Shot Direction'],
                  time: itemTime
                });
              }
            }
          }
        }
        
        if (currentRally) {
          ralliesData.push(currentRally);
        }
        
        let malaysiaSet1 = 0, chinaSet1 = 0;
        let malaysiaSet2 = 0, chinaSet2 = 0;
        
        ralliesData.forEach((rally) => {
          rally.shots.sort((a, b) => a.time - b.time);
          rally.sequence = rally.shots.map(shot => shot.type).join(' → ');
          rally.shotCount = rally.shots.length;
          rally.lengthCategory = rally.duration > 10 ? 'Long' : rally.duration > 5 ? 'Medium' : 'Short';
          
          if (rally.outcome?.pointWinner === 'Malaysia') {
            if (malaysiaSet1 + chinaSet1 < 27) {
              malaysiaSet1++;
              rally.set = 1;
            } else {
              malaysiaSet2++;
              rally.set = 2;
            }
          } else if (rally.outcome?.pointWinner === 'China') {
            if (malaysiaSet1 + chinaSet1 < 27) {
              chinaSet1++;
              rally.set = 1;
            } else {
              chinaSet2++;
              rally.set = 2;
            }
          }
          
          const currentMalaysia = rally.set === 1 ? malaysiaSet1 : malaysiaSet2;
          const currentChina = rally.set === 1 ? chinaSet1 : chinaSet2;
          rally.runningScore = currentMalaysia + '-' + currentChina;
        });
        
        setRallies(ralliesData);
        setAnalysisData(generateAnalysis(ralliesData));
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load match data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const generateAnalysis = (ralliesData) => {
    const set1Rallies = ralliesData.filter(r => r.set === 1);
    const set2Rallies = ralliesData.filter(r => r.set === 2);
    
    // Shot sequence analysis
    const malaysiaSequences = { winning: {}, losing: {} };
    const chinaSequences = { winning: {}, losing: {} };
    
    ralliesData.forEach(rally => {
      if (rally.outcome && rally.shots.length > 0) {
        const gameShots = rally.shots.filter(shot => 
          shot.type !== 'SERVE' && shot.type !== 'RECEIVE SERVES'
        );
        
        if (gameShots.length > 0) {
          const sequence = gameShots.map(shot => shot.type).join(' → ');
          
          if (rally.outcome.outcomeTeam === 'MALAYSIA') {
            if (rally.outcome.type === 'WINNER') {
              malaysiaSequences.winning[sequence] = (malaysiaSequences.winning[sequence] || 0) + 1;
            } else if (rally.outcome.type === 'ERROR') {
              malaysiaSequences.losing[sequence] = (malaysiaSequences.losing[sequence] || 0) + 1;
            }
          }
          
          if (rally.outcome.outcomeTeam === 'CHINA') {
            if (rally.outcome.type === 'WINNER') {
              chinaSequences.winning[sequence] = (chinaSequences.winning[sequence] || 0) + 1;
            } else if (rally.outcome.type === 'ERROR') {
              chinaSequences.losing[sequence] = (chinaSequences.losing[sequence] || 0) + 1;
            }
          }
        }
      }
    });
    
    // Enhanced finishing player analysis
    const finishingStats = {};
    
    ralliesData.forEach(rally => {
      if (rally.shots.length > 0 && rally.outcome) {
        const lastShot = rally.shots[rally.shots.length - 1];
        const finisher = lastShot.player;
        const shotType = lastShot.type;
        
        if (!finishingStats[finisher]) {
          finishingStats[finisher] = {
            name: finisher,
            team: (finisher === 'GO PEI KEE' || finisher === 'TEOH MEI XING') ? 'Malaysia' : 'China',
            totalFinishes: 0,
            winners: 0,
            errors: 0,
            shotBreakdown: {}
          };
        }
        
        finishingStats[finisher].totalFinishes++;
        
        if (!finishingStats[finisher].shotBreakdown[shotType]) {
          finishingStats[finisher].shotBreakdown[shotType] = { total: 0, winners: 0, errors: 0 };
        }
        finishingStats[finisher].shotBreakdown[shotType].total++;
        
        const finisherTeam = (finisher === 'GO PEI KEE' || finisher === 'TEOH MEI XING') ? 'MALAYSIA' : 'CHINA';
        
        if (rally.outcome.outcomeTeam === finisherTeam) {
          if (rally.outcome.type === 'WINNER') {
            finishingStats[finisher].winners++;
            finishingStats[finisher].shotBreakdown[shotType].winners++;
          } else if (rally.outcome.type === 'ERROR') {
            finishingStats[finisher].errors++;
            finishingStats[finisher].shotBreakdown[shotType].errors++;
          }
        }
      }
    });
    
    Object.values(finishingStats).forEach(player => {
      player.weRatio = player.errors > 0 ? (player.winners / player.errors).toFixed(2) : player.winners;
      
      player.shotBreakdownArray = Object.entries(player.shotBreakdown)
        .map(([shot, data]) => ({
          shot,
          total: data.total,
          winners: data.winners,
          errors: data.errors,
          successRate: data.total > 0 ? ((data.winners / data.total) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.total - a.total);
    });

    // Rally length analysis
    const rallyLengthByOutcome = {
      short: { malaysia: 0, china: 0, total: 0 },
      medium: { malaysia: 0, china: 0, total: 0 },
      long: { malaysia: 0, china: 0, total: 0 }
    };
    
    ralliesData.forEach(rally => {
      if (rally.outcome?.pointWinner) {
        const category = rally.duration < 5 ? 'short' : rally.duration < 10 ? 'medium' : 'long';
        rallyLengthByOutcome[category].total++;
        
        if (rally.outcome.pointWinner === 'Malaysia') {
          rallyLengthByOutcome[category].malaysia++;
        } else {
          rallyLengthByOutcome[category].china++;
        }
      }
    });
    
    Object.keys(rallyLengthByOutcome).forEach(category => {
      const data = rallyLengthByOutcome[category];
      if (data.total > 0) {
        data.malaysiaPercentage = ((data.malaysia / data.total) * 100).toFixed(1);
        data.chinaPercentage = ((data.china / data.total) * 100).toFixed(1);
      }
    });

    // Momentum analysis
    const generateMomentumData = (setRallies) => {
      let malaysiaScore = 0;
      let chinaScore = 0;
      const momentumData = [];
      
      setRallies.forEach((rally, index) => {
        if (rally.outcome?.pointWinner === 'Malaysia') {
          malaysiaScore++;
        } else if (rally.outcome?.pointWinner === 'China') {
          chinaScore++;
        }
        
        momentumData.push({
          rally: index + 1,
          malaysiaScore,
          chinaScore,
          scoreDiff: malaysiaScore - chinaScore,
          pointWinner: rally.outcome?.pointWinner
        });
      });
      
      return momentumData;
    };

    // W/E Ratio analysis by set
    const setWeAnalysis = {
      set1: {
        malaysia: { winners: 0, errors: 0 },
        china: { winners: 0, errors: 0 }
      },
      set2: {
        malaysia: { winners: 0, errors: 0 },
        china: { winners: 0, errors: 0 }
      }
    };

    ralliesData.forEach(rally => {
      if (rally.outcome && rally.set) {
        const setKey = 'set' + rally.set;
        const team = rally.outcome.outcomeTeam.toLowerCase();
        
        if (rally.outcome.type === 'WINNER') {
          setWeAnalysis[setKey][team].winners++;
        } else if (rally.outcome.type === 'ERROR') {
          setWeAnalysis[setKey][team].errors++;
        }
      }
    });

    // Calculate W/E ratios for each set
    Object.keys(setWeAnalysis).forEach(setKey => {
      Object.keys(setWeAnalysis[setKey]).forEach(team => {
        const data = setWeAnalysis[setKey][team];
        data.weRatio = data.errors > 0 ? (data.winners / data.errors).toFixed(2) : data.winners;
      });
    });

    return {
      totalRallies: ralliesData.length,
      set1Count: set1Rallies.length,
      set2Count: set2Rallies.length,
      malaysiaPoints: ralliesData.filter(r => r.outcome?.pointWinner === 'Malaysia').length,
      chinaPoints: ralliesData.filter(r => r.outcome?.pointWinner === 'China').length,
      sequences: {
        malaysiaMostWinning: Object.entries(malaysiaSequences.winning).sort((a, b) => b[1] - a[1]).slice(0, 5),
        malaysiaMostLosing: Object.entries(malaysiaSequences.losing).sort((a, b) => b[1] - a[1]).slice(0, 5),
        chinaMostWinning: Object.entries(chinaSequences.winning).sort((a, b) => b[1] - a[1]).slice(0, 5),
        chinaMostLosing: Object.entries(chinaSequences.losing).sort((a, b) => b[1] - a[1]).slice(0, 5)
      },
      finishingPlayers: Object.values(finishingStats).sort((a, b) => b.totalFinishes - a.totalFinishes),
      rallyLengthByOutcome,
      momentum: {
        set1: generateMomentumData(set1Rallies),
        set2: generateMomentumData(set2Rallies)
      },
      setWeAnalysis
    };
  };

  const getShotColor = (shotType) => {
    const colors = {
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

  const getTeamColor = (player) => {
    if (player === 'GO PEI KEE' || player === 'TEOH MEI XING') {
      return 'bg-green-100 text-green-800';
    }
    return 'bg-red-100 text-red-800';
  };

  const getStrokeIcon = (stroke) => {
    if (!stroke) return '';
    if (stroke.toLowerCase().includes('forehand')) return '👉';
    if (stroke.toLowerCase().includes('backhand')) return '👈';
    if (stroke.toLowerCase().includes('overhead')) return '☝️';
    return '';
  };

  const getDirectionIcon = (direction) => {
    if (!direction) return '';
    if (direction.toLowerCase().includes('straight')) return '⬆️';
    if (direction.toLowerCase().includes('cross')) return '↗️';
    return '';
  };

  const MomentumLineGraph = ({ data, title }) => {
    if (!data || data.length === 0) return null;
    
    const maxScore = Math.max(...data.map(d => Math.max(d.malaysiaScore, d.chinaScore)));
    const svgWidth = Math.max(600, data.length * 15);
    const svgHeight = 300;
    const padding = 40;
    
    const xScale = (index) => padding + (index * (svgWidth - 2 * padding)) / (data.length - 1);
    const yScale = (score) => svgHeight - padding - ((score / maxScore) * (svgHeight - 2 * padding));
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="text-xl font-bold mb-4 text-center">{title}</h4>
        
        <div className="overflow-x-auto">
          <svg width={svgWidth} height={svgHeight} className="border rounded">
            {Array.from({length: maxScore + 1}, (_, i) => (
              <g key={i}>
                <line 
                  x1={padding} 
                  y1={yScale(i)} 
                  x2={svgWidth - padding} 
                  y2={yScale(i)} 
                  stroke="#e5e7eb" 
                  strokeWidth="0.5"
                />
                <text x={padding - 5} y={yScale(i)} textAnchor="end" fontSize="12" fill="#6b7280">
                  {i}
                </text>
              </g>
            ))}
            
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              points={data.map((d, i) => xScale(i) + ',' + yScale(d.malaysiaScore)).join(' ')}
            />
            
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              points={data.map((d, i) => xScale(i) + ',' + yScale(d.chinaScore)).join(' ')}
            />
            
            {data.map((d, i) => (
              <g key={i}>
                <circle cx={xScale(i)} cy={yScale(d.malaysiaScore)} r="4" fill="#10b981" />
                <circle cx={xScale(i)} cy={yScale(d.chinaScore)} r="4" fill="#ef4444" />
                
                {i % 5 === 0 && (
                  <text x={xScale(i)} y={svgHeight - 10} textAnchor="middle" fontSize="10" fill="#6b7280">
                    {d.rally}
                  </text>
                )}
              </g>
            ))}
            
            <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#374151" strokeWidth="2"/>
            <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} stroke="#374151" strokeWidth="2"/>
            
            <text x={svgWidth / 2} y={svgHeight - 5} textAnchor="middle" fontSize="14" fill="#374151">Rally Number</text>
            <text x={15} y={svgHeight / 2} textAnchor="middle" fontSize="14" fill="#374151" transform={'rotate(-90, 15, ' + (svgHeight / 2) + ')'}>Score</text>
          </svg>
        </div>
        
        <div className="flex justify-center space-x-6 text-sm mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-green-500"></div>
            <span>Malaysia</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-1 bg-red-500"></div>
            <span>China</span>
          </div>
        </div>
        
        <div className="text-center text-lg font-bold mt-2">
          Final: Malaysia {data[data.length - 1]?.malaysiaScore} - {data[data.length - 1]?.chinaScore} China
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="text-lg">Loading enhanced match analysis...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <div className="text-lg">Error: {error}</div>
      </div>
    );
  }

  const set1Rallies = rallies.filter(r => r.set === 1);
  const set2Rallies = rallies.filter(r => r.set === 2);
  const filteredRallies = selectedSet === 'all' ? rallies : 
                          selectedSet === '1' ? set1Rallies : set2Rallies;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">
        🏸 Enhanced Badminton Match Analysis: Malaysia vs China
      </h1>
      
      <div className="mb-8 p-6 bg-gradient-to-r from-red-50 to-green-50 rounded-lg border-2 border-gray-200">
        <h2 className="text-xl font-bold text-center mb-4">Final Result: China Wins 2-0</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Set 1</h3>
            <div className="text-2xl">
              <span className="text-green-600">6</span> 
              <span className="mx-2">-</span>
              <span className="text-red-600">21</span>
            </div>
            <p className="text-sm text-gray-600">{set1Rallies.length} rallies</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Set 2</h3>
            <div className="text-2xl">
              <span className="text-green-600">13</span>
              <span className="mx-2">-</span>
              <span className="text-red-600">21</span>
            </div>
            <p className="text-sm text-gray-600">{set2Rallies.length} rallies</p>
          </div>
        </div>
      </div>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-center">📊 Match Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analysisData.totalRallies}</div>
            <div className="text-sm text-gray-600">Total Rallies</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analysisData.malaysiaPoints}</div>
            <div className="text-sm text-gray-600">Malaysia Points</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-red-600">{analysisData.chinaPoints}</div>
            <div className="text-sm text-gray-600">China Points</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {rallies.length > 0 ? (rallies.reduce((sum, r) => sum + r.duration, 0) / rallies.length).toFixed(1) : 0}s
            </div>
            <div className="text-sm text-gray-600">Avg Rally Length</div>
          </div>
        </div>
      </div>

      <div className="mb-8 flex justify-center">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {showAnalysis ? 'Hide' : 'Show'} Advanced Analysis
        </button>
      </div>

      {showAnalysis && (
        <div className="mb-8 space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-6 text-center">🎯 Most Frequent Shot Sequences</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-green-800 text-center">🇲🇾 Malaysia</h4>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h5 className="font-bold text-green-700 mb-3">🏆 Most Frequent Winner Sequences</h5>
                  {analysisData.sequences?.malaysiaMostWinning?.length > 0 ? (
                    <div className="space-y-2">
                      {analysisData.sequences.malaysiaMostWinning.map(([sequence, count], index) => (
                        <div key={index} className="flex justify-between items-center bg-green-100 p-3 rounded">
                          <span className="font-medium text-sm">{sequence}</span>
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">{count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No repeated winning sequences</p>
                  )}
                </div>
                
                <div className="border-l-4 border-red-400 pl-4">
                  <h5 className="font-bold text-red-700 mb-3">❌ Most Frequent Error Sequences</h5>
                  {analysisData.sequences?.malaysiaMostLosing?.length > 0 ? (
                    <div className="space-y-2">
                      {analysisData.sequences.malaysiaMostLosing.map(([sequence, count], index) => (
                        <div key={index} className="flex justify-between items-center bg-red-100 p-3 rounded">
                          <span className="font-medium text-sm">{sequence}</span>
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">{count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No repeated error sequences</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xl font-bold text-red-800 text-center">🇨🇳 China</h4>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h5 className="font-bold text-green-700 mb-3">🏆 Most Frequent Winner Sequences</h5>
                  {analysisData.sequences?.chinaMostWinning?.length > 0 ? (
                    <div className="space-y-2">
                      {analysisData.sequences.chinaMostWinning.map(([sequence, count], index) => (
                        <div key={index} className="flex justify-between items-center bg-green-100 p-3 rounded">
                          <span className="font-medium text-sm">{sequence}</span>
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">{count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No repeated winning sequences</p>
                  )}
                </div>
                
                <div className="border-l-4 border-red-400 pl-4">
                  <h5 className="font-bold text-red-700 mb-3">❌ Most Frequent Error Sequences</h5>
                  {analysisData.sequences?.chinaMostLosing?.length > 0 ? (
                    <div className="space-y-2">
                      {analysisData.sequences.chinaMostLosing.map(([sequence, count], index) => (
                        <div key={index} className="flex justify-between items-center bg-red-100 p-3 rounded">
                          <span className="font-medium text-sm">{sequence}</span>
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">{count}x</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No repeated error sequences</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <MomentumLineGraph 
              data={analysisData.momentum?.set1} 
              title="Set 1 Score Momentum (Line Graph)"
            />
            <MomentumLineGraph 
              data={analysisData.momentum?.set2} 
              title="Set 2 Score Momentum (Line Graph)"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-6 text-center">⚖️ Winners/Errors Ratio by Set</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <h4 className="text-xl font-bold text-center mb-4 text-blue-800">Set 1 W/E Performance</h4>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-bold text-green-700 mb-3">Malaysia Set 1</h5>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-green-100 p-2 rounded">
                        <div className="font-bold text-green-600">{analysisData.setWeAnalysis?.set1?.malaysia?.winners || 0}</div>
                        <div className="text-xs">Winners</div>
                      </div>
                      <div className="bg-red-100 p-2 rounded">
                        <div className="font-bold text-red-600">{analysisData.setWeAnalysis?.set1?.malaysia?.errors || 0}</div>
                        <div className="text-xs">Errors</div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className={`font-bold ${parseFloat(analysisData.setWeAnalysis?.set1?.malaysia?.weRatio || 0) >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analysisData.setWeAnalysis?.set1?.malaysia?.weRatio || 0}
                        </div>
                        <div className="text-xs">W/E Ratio</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-bold text-red-700 mb-3">China Set 1</h5>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-green-100 p-2 rounded">
                        <div className="font-bold text-green-600">{analysisData.setWeAnalysis?.set1?.china?.winners || 0}</div>
                        <div className="text-xs">Winners</div>
                      </div>
                      <div className="bg-red-100 p-2 rounded">
                        <div className="font-bold text-red-600">{analysisData.setWeAnalysis?.set1?.china?.errors || 0}</div>
                        <div className="text-xs">Errors</div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className={`font-bold ${parseFloat(analysisData.setWeAnalysis?.set1?.china?.weRatio || 0) >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analysisData.setWeAnalysis?.set1?.china?.weRatio || 0}
                        </div>
                        <div className="text-xs">W/E Ratio</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                <h4 className="text-xl font-bold text-center mb-4 text-purple-800">Set 2 W/E Performance</h4>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-bold text-green-700 mb-3">Malaysia Set 2</h5>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-green-100 p-2 rounded">
                        <div className="font-bold text-green-600">{analysisData.setWeAnalysis?.set2?.malaysia?.winners || 0}</div>
                        <div className="text-xs">Winners</div>
                      </div>
                      <div className="bg-red-100 p-2 rounded">
                        <div className="font-bold text-red-600">{analysisData.setWeAnalysis?.set2?.malaysia?.errors || 0}</div>
                        <div className="text-xs">Errors</div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className={`font-bold ${parseFloat(analysisData.setWeAnalysis?.set2?.malaysia?.weRatio || 0) >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analysisData.setWeAnalysis?.set2?.malaysia?.weRatio || 0}
                        </div>
                        <div className="text-xs">W/E Ratio</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-bold text-red-700 mb-3">China Set 2</h5>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-green-100 p-2 rounded">
                        <div className="font-bold text-green-600">{analysisData.setWeAnalysis?.set2?.china?.winners || 0}</div>
                        <div className="text-xs">Winners</div>
                      </div>
                      <div className="bg-red-100 p-2 rounded">
                        <div className="font-bold text-red-600">{analysisData.setWeAnalysis?.set2?.china?.errors || 0}</div>
                        <div className="text-xs">Errors</div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded">
                        <div className={`font-bold ${parseFloat(analysisData.setWeAnalysis?.set2?.china?.weRatio || 0) >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analysisData.setWeAnalysis?.set2?.china?.weRatio || 0}
                        </div>
                        <div className="text-xs">W/E Ratio</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-6 text-center">📏 Rally Length vs Team Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(analysisData.rallyLengthByOutcome || {}).map(([category, data]) => (
                <div key={category} className="p-6 border-2 border-gray-200 rounded-lg">
                  <h4 className="font-bold text-center mb-4 capitalize text-lg">
                    {category} Rallies ({data.total})
                  </h4>
                  <p className="text-center text-sm text-gray-600 mb-4">
                    {category === 'short' ? '<5 seconds' : category === 'medium' ? '5-10 seconds' : '>10 seconds'}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-100 rounded">
                      <span className="font-medium">Malaysia</span>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{data.malaysia}</div>
                        <div className="text-sm">({data.malaysiaPercentage}%)</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-100 rounded">
                      <span className="font-medium">China</span>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{data.china}</div>
                        <div className="text-sm">({data.chinaPercentage}%)</div>
                      </div>
                    </div>
                    
                    <div className={`text-center p-3 rounded font-bold ${
                      data.malaysia > data.china ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {data.malaysia > data.china ? 'Malaysia' : 'China'} Dominates
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold mb-6 text-center">🎯 Last Shot Analysis by Player</h3>
            <p className="text-gray-600 text-center mb-6">Analysis of who took the final shot and what shot they used</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {analysisData.finishingPlayers?.map((player, index) => (
                <div key={index} className={`p-6 rounded-lg border-2 ${
                  player.team === 'Malaysia' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}>
                  <h4 className="font-bold text-center mb-3 text-xl">{player.name}</h4>
                  <div className="text-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      player.team === 'Malaysia' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                      <div className={`text-2xl font-bold ${parseFloat(player.weRatio) >= 1.0 ? 'text-green-600' : 'text-red-600'}`}>
                        {player.weRatio}
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
                              W:{shotData.winners} E:{shotData.errors} ({shotData.successRate}%)
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
        </div>
      )}

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
            onClick={() => setSelectedSet('1')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              selectedSet === '1' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Set 1 ({set1Rallies.length})
          </button>
          <button
            onClick={() => setSelectedSet('2')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              selectedSet === '2' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Set 2 ({set2Rallies.length})
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center">🏸 Complete Rally Analysis</h3>
        
        {filteredRallies.map((rally, index) => (
          <div 
            key={index}
            className={`border-l-4 rounded-lg p-6 shadow-lg ${
              rally.outcome?.pointWinner === 'Malaysia' ? 'border-l-green-500 bg-green-50' : 
              rally.outcome?.pointWinner === 'China' ? 'border-l-red-500 bg-red-50' : 
              'border-l-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="font-bold text-xl">Rally {rally.number}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Set {rally.set}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {rally.duration.toFixed(1)}s ({rally.lengthCategory})
                </span>
                {rally.outcome && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                    rally.outcome.pointWinner === 'Malaysia' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    Winner: {rally.outcome.pointWinner}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Score: {rally.runningScore} | Time: {(rally.startTime / 60).toFixed(1)} min
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="font-bold mb-3 text-lg">Shot-by-Shot Breakdown ({rally.shotCount} shots):</h4>
              {rally.shotCount > 0 ? (
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
              ) : (
                <p className="text-gray-500 bg-white p-4 rounded-lg">No shots recorded for this rally</p>
              )}
            </div>

            {rally.shotCount > 0 && (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <h5 className="font-medium mb-2">Shot Sequence:</h5>
                <div className="text-sm font-mono">{rally.sequence}</div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h5 className="font-medium mb-2">Rally Outcome:</h5>
                {rally.outcome ? (
                  <div className="space-y-1">
                    <div className="font-medium">{rally.outcome.outcomeTeam} {rally.outcome.type}</div>
                    <div className={`text-sm ${
                      rally.outcome.pointWinner === 'Malaysia' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Point Winner: {rally.outcome.pointWinner}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No outcome recorded</p>
                )}
              </div>
              
              {rally.notes && (
                <div className="bg-white p-4 rounded-lg">
                  <h5 className="font-medium mb-2">Pattern Notes:</h5>
                  <p className="text-sm">{rally.notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">
          Showing {filteredRallies.length} of {rallies.length} total rallies
        </p>
        <p className="text-sm text-gray-500 mt-2">
          🏸 Shot Types: SERVE, smash, defend, clear, H.drive, S.drive, block, tap, net, lob, drop<br/>
          👉 Strokes: Forehand, Backhand, Overhead | ⬆️ Directions: Straight, Cross
        </p>
      </div>
    </div>
  );
};

export default BadmintonMatchAnalyzer;