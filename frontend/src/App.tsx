import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { SetScoreInput } from './components/SetScoreInput';
import type { MatchData } from './types/match';
import { MatchAnalysis } from './components/MatchAnalysis';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [fileData, setFileData] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting file upload:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      let data;
      try {
        const text = await response.text();
        console.log('Response text:', text);
        data = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Server returned invalid JSON');
      }

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      setFileData(data.fileData);
      setTeams(data.teams);
      setIsLoading(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const handleScoresSubmit = async (scores: Record<string, Record<string, number>>) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!fileData) {
        throw new Error('No file data available');
      }

      const requestData = {
        set_scores: scores,
        file_data: fileData
      };
      
      // Debug logs
      console.log('Sending request with data:', {
        set_scores: scores,
        file_data_length: fileData.length
      });

      const response = await fetch(`${API_URL}/api/analyze/`, {
      //const response = await fetch(`http://localhost:8000/api/analyze/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Debug logs
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Failed to analyze match data');
      }

      const data = await response.json();
      console.log('Analysis response:', data);

      setMatchData(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Score submission error:', error);
      setError(`Error analyzing match: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Badminton Match Analyzer
          </h1>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Processing...</p>
            </div>
          ) : !teams.length ? (
            <FileUpload onFileUpload={handleFileUpload} />
          ) : !matchData ? (
            <SetScoreInput teams={teams} onScoresSubmit={handleScoresSubmit} />
          ) : (
            <MatchAnalysis data={matchData} teams={teams} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;