import pandas as pd
from typing import Dict, List, Any
import json
import traceback

class MatchDataProcessor:
    def __init__(self, csv_file):
        try:
            # Try to read the CSV file
            self.df = pd.read_csv(csv_file)
            
            # Debug print
            print("CSV columns:", self.df.columns.tolist())
            print("First few rows:", self.df.head())
            
            # Extract teams and players
            self.teams = self._extract_teams()
            print("Extracted teams:", self.teams)
            
            self.players = self._extract_players()
            print("Extracted players:", self.players)
            
        except Exception as e:
            print(f"Error initializing MatchDataProcessor: {str(e)}")
            raise

    def _extract_teams(self) -> List[str]:
        """Extract unique team names from the CSV."""
        try:
            # Get all unique values from the 'Row' column where OUTCOME is either WINNER or ERROR
            teams = self.df[
                (self.df['OUTCOME'].isin(['WINNER', 'ERROR'])) &
                (self.df['Row'].notna())
            ]['Row'].unique()
            
            # Debug print
            print("Found teams:", teams)
            
            if len(teams) != 2:
                raise ValueError(f"Expected exactly 2 teams, found {len(teams)} teams: {teams}")
            
            return teams.tolist()
        except Exception as e:
            print(f"Error extracting teams: {str(e)}")
            raise
        
    def _extract_players(self) -> Dict[str, List[str]]:
        """Extract players and their team associations."""
        players = {team: [] for team in self.teams}
        
        # Add debug print
        print("Debug - All player names:", self.df["PLAYER'S NAME"].dropna().unique())
        
        # Look for players in all rows, not just team rows
        for _, row in self.df.iterrows():
            if pd.notna(row["PLAYER'S NAME"]):
                player_name = row["PLAYER'S NAME"]
                # Find which team this player belongs to
                for team in self.teams:
                    team_rows = self.df[
                        (self.df["Row"] == team) & 
                        (self.df["PLAYER'S NAME"] == player_name)
                    ]
                    if not team_rows.empty and player_name not in players[team]:
                        players[team].append(player_name)
        
        # Add debug print
        print("Debug - Extracted players by team:", players)
        return players
    
    def process_match_data(self, set_scores: Dict[str, Dict[str, int]]) -> Dict[str, Any]:
        """Process match data with provided set scores."""
        try:
            print("Processing match data with scores:", set_scores)
            
            # Initialize empty rallies list
            rallies = []
            current_rally = None
            
            # Sort dataframe by start time
            sorted_df = self.df.sort_values(by=["Start time"])
            
            # Process each row
            for _, row in sorted_df.iterrows():
                if row["Row"] == "RALLY":
                    if current_rally:
                        rallies.append(current_rally)
                    current_rally = {
                        "number": row["Instance number"],
                        "startTime": row["Start time"],
                        "duration": row["Duration"],
                        "shots": [],
                        "outcome": None,
                        "set": None  # Will be assigned later
                    }
                elif current_rally:
                    if row["Row"] in self.teams:
                        # Process outcome
                        point_winner = self._determine_point_winner(row)
                        current_rally["outcome"] = {
                            "pointWinner": point_winner,
                            "outcomeTeam": row["Row"],
                            "type": row["OUTCOME"],
                            "time": row["Start time"]
                        }
                    elif pd.notna(row["PLAYER'S NAME"]):
                        # Process shot
                        current_rally["shots"].append({
                            "type": row["Row"] if pd.notna(row["Row"]) else None,
                            "player": row["PLAYER'S NAME"] if pd.notna(row["PLAYER'S NAME"]) else None,
                            "stroke": row["Stroke"] if pd.notna(row["Stroke"]) else None,
                            "direction": row["Shot Direction"] if pd.notna(row["Shot Direction"]) else None,
                            "time": float(row["Start time"]) if pd.notna(row["Start time"]) else None
                        })
            
            # Add the last rally if exists
            if current_rally:
                rallies.append(current_rally)
            
            # Assign sets and scores to rallies
            self._assign_sets_to_rallies(rallies, set_scores)
            
            # Generate statistics
            statistics = self._generate_statistics(rallies)
            
            return {
                "teams": self.teams,
                "players": self.players,
                "rallies": rallies,
                "statistics": statistics
            }
            
        except Exception as e:
            print(f"Error processing match data: {str(e)}")
            print(traceback.format_exc())
            raise
    
    def _determine_point_winner(self, row) -> str:
        """Determine point winner based on outcome."""
        if row["Row"] == self.teams[0]:
            return self.teams[0] if row["OUTCOME"] == "WINNER" else self.teams[1]
        else:
            return self.teams[1] if row["OUTCOME"] == "WINNER" else self.teams[0]
        
    def _assign_sets_to_rallies(self, rallies: List[Dict], set_scores: Dict[str, Dict[str, int]]):
        """Assign set numbers and running scores to rallies."""
        current_set = 1
        team1_score = 0
        team2_score = 0

        for rally in rallies:
            if rally["outcome"]:
                # Determine if we need to switch sets
                if current_set == 1:
                    target_score = set_scores['set1']
                    if (team1_score >= 21 or team2_score >= 21) and \
                       abs(team1_score - team2_score) >= 2:
                        current_set = 2
                        team1_score = 0
                        team2_score = 0

                # Update scores
                winner = rally["outcome"]["pointWinner"]
                if winner == self.teams[0]:
                    team1_score += 1
                else:
                    team2_score += 1

                # Assign set and score to rally
                rally['set'] = current_set
                rally['score'] = f"{team1_score}-{team2_score}"

    def _generate_statistics(self, rallies: List[Dict]) -> Dict[str, Any]:
        """Generate comprehensive match statistics."""
        team1, team2 = self.teams  # Get the two teams dynamically
        
        # Basic stats
        stats = {
            'totalRallies': len(rallies),
            'set1Count': len([r for r in rallies if r.get('set') == 1]),
            'set2Count': len([r for r in rallies if r.get('set') == 2]),
            f'{team1}Points': len([r for r in rallies if r['outcome'] and r['outcome']['pointWinner'] == team1]),
            f'{team2}Points': len([r for r in rallies if r['outcome'] and r['outcome']['pointWinner'] == team2])
        }

        # Shot sequence analysis
        sequences = {
            team1.lower(): {'winning': {}, 'losing': {}},
            team2.lower(): {'winning': {}, 'losing': {}}
        }

        # Rally length analysis
        rally_length_outcomes = {
            'short': {team1.lower(): 0, team2.lower(): 0, 'total': 0},
            'medium': {team1.lower(): 0, team2.lower(): 0, 'total': 0},
            'long': {team1.lower(): 0, team2.lower(): 0, 'total': 0}
        }

        # W/E Ratio analysis by set
        set_we_analysis = {
            'set1': {team.lower(): {'winners': 0, 'errors': 0} for team in self.teams},
            'set2': {team.lower(): {'winners': 0, 'errors': 0} for team in self.teams}
        }

        # Player finishing stats
        finishing_stats = {}

        for rally in rallies:
            if rally['outcome']:
                # Process shot sequences
                if rally['shots']:
                    game_shots = [shot for shot in rally['shots'] 
                                if shot['type'] not in ['SERVE', 'RECEIVE SERVES']]
                    if game_shots:
                        sequence = ' → '.join(shot['type'] for shot in game_shots)
                        outcome_team = rally['outcome']['outcomeTeam'].lower()
                        outcome_type = rally['outcome']['type'].lower()
                        
                        if outcome_type == 'winner':
                            sequences[outcome_team]['winning'][sequence] = \
                                sequences[outcome_team]['winning'].get(sequence, 0) + 1
                        elif outcome_type == 'error':
                            sequences[outcome_team]['losing'][sequence] = \
                                sequences[outcome_team]['losing'].get(sequence, 0) + 1

                # Process rally length outcomes
                duration = rally['duration']
                category = 'short' if duration < 5 else 'medium' if duration < 10 else 'long'
                rally_length_outcomes[category]['total'] += 1
                winner = rally['outcome']['pointWinner'].lower()
                rally_length_outcomes[category][winner] += 1

                # Process W/E ratio by set
                set_key = f"set{rally['set']}"
                outcome_team = rally['outcome']['outcomeTeam'].lower()
                outcome_type = rally['outcome']['type'].lower()
                if set_key in set_we_analysis:
                    if outcome_type == 'winner':
                        set_we_analysis[set_key][outcome_team]['winners'] += 1
                    elif outcome_type == 'error':
                        set_we_analysis[set_key][outcome_team]['errors'] += 1

            # Process finishing player stats
            if rally['shots']:
                last_shot = rally['shots'][-1]
                finisher = last_shot['player']
                
                # Find player's team
                player_team = None
                for team in self.teams:
                    if finisher in self.players.get(team, []):
                        player_team = team
                        break
                
                if player_team:
                    if finisher not in finishing_stats:
                        finishing_stats[finisher] = {
                            'name': finisher,
                            'team': player_team,
                            'totalFinishes': 0,
                            'winners': 0,
                            'errors': 0,
                            'shotBreakdown': {}
                        }
                    
                    stats_entry = finishing_stats[finisher]
                    stats_entry['totalFinishes'] += 1
                    
                    shot_type = last_shot['type']
                    if shot_type not in stats_entry['shotBreakdown']:
                        stats_entry['shotBreakdown'][shot_type] = {
                            'total': 0,
                            'winners': 0,
                            'errors': 0
                        }
                    
                    stats_entry['shotBreakdown'][shot_type]['total'] += 1
                    
                    if rally['outcome']:
                        outcome_type = rally['outcome']['type']
                        if outcome_type == 'WINNER':
                            stats_entry['winners'] += 1
                            stats_entry['shotBreakdown'][shot_type]['winners'] += 1
                        elif outcome_type == 'ERROR':
                            stats_entry['errors'] += 1
                            stats_entry['shotBreakdown'][shot_type]['errors'] += 1

        # Calculate percentages for rally length outcomes
        for category in rally_length_outcomes:
            total = rally_length_outcomes[category]['total']
            if total > 0:
                for team in [team1.lower(), team2.lower()]:
                    rally_length_outcomes[category][f'{team}_percentage'] = \
                        (rally_length_outcomes[category][team] / total) * 100

        # Calculate W/E ratios and format shot breakdown
        for player in finishing_stats.values():
            player['weRatio'] = (player['winners'] / player['errors']) if player['errors'] > 0 else player['winners']
            player['shotBreakdownArray'] = [
                {
                    'shot': shot,
                    'total': data['total'],
                    'winners': data['winners'],
                    'errors': data['errors'],
                    'successRate': (data['winners'] / data['total'] * 100) if data['total'] > 0 else 0
                }
                for shot, data in player['shotBreakdown'].items()
            ]
            player['shotBreakdownArray'].sort(key=lambda x: x['total'], reverse=True)

        # Generate momentum data
        set1_rallies = [r for r in rallies if r.get('set') == 1]
        set2_rallies = [r for r in rallies if r.get('set') == 2]
        
        momentum = {
            'set1': self._generate_momentum_data(set1_rallies),
            'set2': self._generate_momentum_data(set2_rallies)
        }

        # Add debug prints
        print("Debug - Rally shots:", [
            {
                'rally_number': rally['number'],
                'shots': rally['shots'],
                'outcome': rally['outcome']
            }
            for rally in rallies[:5]  # Print first 5 rallies for brevity
        ])

        print("Debug - Finishing stats before conversion:", finishing_stats)

        # After the finishing_stats processing
        finishing_players_list = list(finishing_stats.values())
        print("Debug - Final finishing players list:", finishing_players_list)

        return {
            'totalRallies': stats['totalRallies'],
            'set1Count': stats['set1Count'],
            'set2Count': stats['set2Count'],
            f'{team1}Points': stats[f'{team1}Points'],
            f'{team2}Points': stats[f'{team2}Points'],
            'sequences': {
                f'{team1.lower()}MostWinning': sorted(sequences[team1.lower()]['winning'].items(), key=lambda x: x[1], reverse=True)[:5],
                f'{team1.lower()}MostLosing': sorted(sequences[team1.lower()]['losing'].items(), key=lambda x: x[1], reverse=True)[:5],
                f'{team2.lower()}MostWinning': sorted(sequences[team2.lower()]['winning'].items(), key=lambda x: x[1], reverse=True)[:5],
                f'{team2.lower()}MostLosing': sorted(sequences[team2.lower()]['losing'].items(), key=lambda x: x[1], reverse=True)[:5]
            },
            'finishingPlayers': finishing_players_list,
            'rallyLengthByOutcome': rally_length_outcomes,
            'momentum': momentum,
            'setWeAnalysis': set_we_analysis
        }

    def _generate_momentum_data(self, rallies: List[Dict]) -> List[Dict]:
        """Generate momentum data for a set of rallies."""
        if not rallies:
            return []
        
        momentum_data = []
        team1_score = 0
        team2_score = 0
        
        for i, rally in enumerate(rallies, 1):
            if rally['outcome'] and rally['outcome']['pointWinner']:
                if rally['outcome']['pointWinner'] == self.teams[0]:
                    team1_score += 1
                else:
                    team2_score += 1
                
                momentum_data.append({
                    'rally': i,
                    f'{self.teams[0].lower()}Score': team1_score,
                    f'{self.teams[1].lower()}Score': team2_score,
                    'scoreDiff': team1_score - team2_score,
                    'pointWinner': rally['outcome']['pointWinner']
                })
        
        return momentum_data

    def analyze_match(self, set_scores: Dict) -> Dict:
        """Analyze match data and return structured analysis."""
        # Process the match data first to populate rallies
        match_data = self.process_match_data(set_scores)
        self.rallies = match_data['rallies']  # Store the rallies

        analysis = {
            'teams': self.teams,
            'players': self.players,
            'statistics': match_data['statistics'],
            'rallies': self.rallies
        }
        
        return analysis

    def _generate_points_timeline(self) -> Dict:
        """Generate timeline of points for each team."""
        timeline = {team: [] for team in self.teams}
        
        for rally in self.rallies:
            if rally['outcome'] and rally['outcome']['pointWinner']:
                winner = rally['outcome']['pointWinner']
                timeline[winner].append({
                    'time': rally['startTime'],
                    'point': len(timeline[winner]) + 1
                })
        
        return timeline
