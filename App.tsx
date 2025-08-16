
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Screen, ArtDesign } from './types';
import TerminalLayout from './components/TerminalLayout';
import InitialScreen from './components/InitialScreen';
import ProcessingScreen from './components/ProcessingScreen';
import ResultScreen from './components/ResultScreen';
import { getTopAlbums } from './services/lastfmService';
import { generateArtDesign } from './services/geminiService';
import { drawArt } from './services/drawingService';

const App: React.FC = () => {
  // State management for the application flow
  const [screen, setScreen] = useState<Screen>('INITIAL');
  const [username, setUsername] = useState<string>('');
  const [artDesign, setArtDesign] = useState<ArtDesign | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Ref for the canvas element to enable downloading
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Memoized handler to start the curation process
  const handleStartCuration = useCallback(async (user: string) => {
    if (!user.trim()) {
      setError("O nome de usuário não pode estar vazio.");
      return;
    }
    setUsername(user);
    setError(null);
    setScreen('PROCESSING');
  }, []);

  // Effect to fetch data and generate content when screen is 'PROCESSING'
  useEffect(() => {
    if (screen === 'PROCESSING' && username) {
      const processData = async () => {
        try {
          // Fetch top albums from Last.fm
          const fetchedAlbums = await getTopAlbums(username);
          if (fetchedAlbums.length < 9) {
            setError(`O usuário "${username}" não possui audições semanais suficientes (encontradas ${fetchedAlbums.length}, são necessárias 9). Tente outro nome de usuário.`);
            setScreen('INITIAL');
            return;
          }

          // Generate art design using Gemini API
          const design = await generateArtDesign(fetchedAlbums);
          setArtDesign(design);
          setSeed(Math.random()); // Set a stable seed for the artwork
          
          // Move to the result screen
          setScreen('RESULT');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
          setError(`Erro: ${errorMessage}. Por favor, verifique o nome de usuário ou as chaves da API.`);
          setScreen('INITIAL');
        }
      };

      processData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, username]);

  // Handler to reset the application state and go back to the initial screen
  const handleReset = useCallback(() => {
    setScreen('INITIAL');
    setUsername('');
    setArtDesign(null);
    setError(null);
    setSeed(null);
  }, []);

  // Handler to download the generated art from the canvas at high resolution
  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || !artDesign || seed === null) return;

    setIsDownloading(true);

    try {
      const scale = 2; // Generate image at 2x resolution
      const parentElement = canvasRef.current.parentElement;
      if (!parentElement) {
        throw new Error("Canvas parent element not found.");
      }
      
      const { clientWidth, clientHeight } = parentElement;
      
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = clientWidth * scale;
      offscreenCanvas.height = clientHeight * scale;

      // Use the centralized drawing function to render the art on the off-screen canvas
      drawArt(offscreenCanvas, artDesign.params, seed);

      const dataUrl = offscreenCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${artDesign.title.toLowerCase().replace(/\s/g, '_')}_por_${username}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to generate high-res download:", e);
      // Optionally, set an error state to show the user
    } finally {
      setIsDownloading(false);
    }
  }, [username, artDesign, seed]);


  // Function to render the correct component based on the current screen state
  const renderScreen = () => {
    switch (screen) {
      case 'INITIAL':
        return (
          <TerminalLayout vAlign="end" hAlign="start">
            <InitialScreen onStart={handleStartCuration} error={error} />
          </TerminalLayout>
        );
      case 'PROCESSING':
        return (
          <TerminalLayout vAlign="end" hAlign="start">
            <ProcessingScreen />
          </TerminalLayout>
        );
      case 'RESULT':
        if (!artDesign || seed === null) {
            // Should not happen in normal flow, but good practice to handle
            return <TerminalLayout vAlign="center" hAlign="center"><p>Erro: O design da arte não está disponível.</p></TerminalLayout>
        }
        return (
            <ResultScreen
              artDesign={artDesign}
              onDownload={handleDownload}
              onReset={handleReset}
              canvasRef={canvasRef}
              seed={seed}
              isDownloading={isDownloading}
            />
        );
      default:
         return (
          <TerminalLayout vAlign="end" hAlign="start">
            <InitialScreen onStart={handleStartCuration} error={error} />
          </TerminalLayout>
        );
    }
  };

  return <>{renderScreen()}</>;
};

export default App;
