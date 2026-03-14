'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Mic, 
  Play, 
  RotateCcw, 
  History, 
  Trophy, 
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  MicOff,
  Edit3,
  X,
  UserPlus
} from 'lucide-react';
import { calculateRoundScores, RoundType, FallahEntry } from '@/lib/gameLogic';
import { parseVoiceInput } from '@/lib/voiceParser';

interface PlayerScore {
  name: string;
  total: number;
}

interface RoundHistory {
  type: RoundType;
  scores: Record<string, number>;
  timestamp: number;
  transcription?: string;
  isManual?: boolean;
}

export default function KenkanApp() {
  // Game State
  const [players, setPlayers] = useState<string[]>(['Thamer', 'Essam', 'Mohammed']);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [scoreLimit, setScoreLimit] = useState(500);
  const [gameStarted, setGameStarted] = useState(false);
  
  // UI State
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Manual Entry State
  const [manualType, setManualType] = useState<RoundType>('Kan');
  const [manualAchiever, setManualAchiever] = useState('');
  const [manualFallahs, setManualFallahs] = useState<Record<string, number>>({});

  // Refs for Voice
  const recognitionRef = useRef<any>(null);

  // Initialize scores when game starts
  const startGame = () => {
    if (players.length < 2) {
      setErrorMessage('At least 2 players are required');
      return;
    }
    const initialScores: Record<string, number> = {};
    players.forEach(p => initialScores[p] = 0);
    setScores(initialScores);
    setGameStarted(true);
    setErrorMessage('');
    setManualAchiever(players[0]);
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game?')) {
      setGameStarted(false);
      setHistory([]);
      setScores({});
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() && !players.includes(newPlayerName.trim())) {
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (name: string) => {
    setPlayers(players.filter(p => p !== name));
  };

  // Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; 

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setTranscription(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        setErrorMessage('Voice Error: ' + event.error);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Speech recognition not supported in this browser');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscription('');
      setErrorMessage('');
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const submitVoiceRound = () => {
    if (!transcription) return;
    
    const result = parseVoiceInput(transcription, players);
    if (result) {
      const roundScores = calculateRoundScores(players, result);
      addRound(result.type, roundScores, transcription);
      setTranscription('');
    } else {
      setErrorMessage("Couldn't understand. Try naming someone and a type.");
    }
  };

  const submitManualRound = () => {
    if (!manualAchiever) return;

    const fallahs: FallahEntry[] = Object.entries(manualFallahs)
      .filter(([_, val]) => val > 0)
      .map(([name, val]) => ({ playerName: name, handValue: val }));

    const result = { achieverName: manualAchiever, type: manualType, fallahs };
    const roundScores = calculateRoundScores(players, result);
    addRound(manualType, roundScores, undefined, true);
    setShowManualEntry(false);
    setManualFallahs({});
  };

  const addRound = (type: RoundType, roundScores: Record<string, number>, transcript?: string, isManual = false) => {
    const newScores = { ...scores };
    Object.keys(roundScores).forEach(name => {
      newScores[name] = (newScores[name] || 0) + roundScores[name];
    });

    setScores(newScores);
    setHistory([{
      type,
      scores: roundScores,
      timestamp: Date.now(),
      transcription: transcript,
      isManual
    }, ...history]);
  };

  // Determine Loser/Winner
  const loser = Object.entries(scores).find(([_, score]) => score >= scoreLimit);
  const sortedPlayers = Object.entries(scores).sort((a, b) => a[1] - b[1]);

  if (!gameStarted) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center animate-in">
        <div className="glass w-full max-w-md p-8 flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="bg-primary p-4 rounded-[2rem] shadow-lg shadow-primary/20">
              <Users className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Kenkan</h1>
            <p className="text-foreground-muted text-sm">Scorekeeper Dashboard</p>
          </div>
          
          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-primary tracking-widest uppercase px-1">Game Limit</label>
              <input 
                type="number" 
                className="w-full text-2xl font-bold text-center py-4"
                value={scoreLimit} 
                onChange={(e) => setScoreLimit(Number(e.target.value))}
                placeholder="Limit"
              />
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-primary tracking-widest uppercase px-1">Players ({players.length})</label>
              <div className="flex flex-wrap gap-2">
                {players.map(p => (
                  <div key={p} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 group animate-in">
                    <span className="font-semibold text-sm">{p}</span>
                    <button onClick={() => removePlayer(p)} className="text-foreground-muted hover:text-danger p-0.5 rounded transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted" size={18} />
                  <input 
                    className="w-full pl-12"
                    type="text" 
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                    placeholder="Player name..."
                  />
                </div>
                <button onClick={addPlayer} className="secondary aspect-square p-0 w-12 rounded-xl">
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-start gap-3 animate-in">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              {errorMessage}
            </div>
          )}

          <button 
            onClick={startGame}
            className="primary w-full py-5 text-lg rounded-2xl group shadow-xl shadow-primary/20"
          >
            START GAME <Play className="ml-2 transition-transform group-hover:translate-x-1" size={18} fill="currentColor" />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto flex flex-col gap-8 animate-in pb-32">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kenkan</h1>
          <p className="text-foreground-muted text-sm font-medium">To {scoreLimit} pts</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowHistory(true)} className="secondary p-3 rounded-xl shadow-sm">
            <History size={20} />
          </button>
          <button onClick={resetGame} className="secondary p-3 rounded-xl shadow-sm">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Scoreboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlayers.map(([name, score], index) => {
          const isLoser = score >= scoreLimit;
          const isWinner = index === 0;
          return (
            <div 
              key={name} 
              className={`glass card relative overflow-hidden flex flex-col gap-2 ${
                isLoser ? 'border-danger/50 shadow-2xl shadow-danger/10' : 
                isWinner ? 'border-primary/50 shadow-xl shadow-primary/10' : ''
              }`}
            >
              {isWinner && <div className="absolute top-0 right-0 w-12 h-12 bg-primary/20 rounded-bl-full flex items-start justify-end p-2"><Trophy size={16} className="text-warning" /></div>}
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">RANK #{index + 1}</span>
                {isLoser && <span className="text-[10px] bg-danger text-white px-2 py-0.5 rounded-full font-bold">GAME OVER</span>}
              </div>
              <span className="text-2xl font-bold truncate">{name}</span>
              <div className="flex items-baseline gap-1">
                <span className={`text-5xl font-black ${isLoser ? 'text-danger' : 'text-foreground'}`}>
                  {score}
                </span>
                <span className="text-foreground-muted text-sm font-semibold">pts</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isLoser ? 'bg-danger' : 'bg-primary'}`} 
                  style={{ width: `${Math.min((score / scoreLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Actions Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 z-40">
        <div className="glass p-4 sm:p-6 shadow-2xl shadow-black/50 border-white/10 flex flex-col gap-4">
          
          {/* Transcription Display */}
          {transcription && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 italic text-center animate-in shadow-inner">
              <p className="text-foreground-muted text-xs mb-1 uppercase tracking-widest font-bold">Transcription</p>
              "{transcription}"
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowManualEntry(true)} 
              className="secondary flex-1 py-4 px-2 rounded-2xl gap-2 font-bold text-sm"
            >
              <Edit3 size={18} /> MANUAL
            </button>
            
            <div className="relative group">
              {isRecording && (
                <div className="absolute inset-0 bg-primary/40 animate-ping rounded-[2rem]" />
              )}
              <button 
                onMouseDown={toggleRecording}
                onMouseUp={toggleRecording}
                onTouchStart={toggleRecording}
                onTouchEnd={toggleRecording}
                className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isRecording ? 'bg-danger scale-110 shadow-danger/40' : 'bg-primary shadow-primary/40'
                }`}
              >
                {isRecording ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
              </button>
            </div>

            <button 
              onClick={submitVoiceRound} 
              disabled={!transcription || isRecording}
              className={`flex-1 py-4 px-2 rounded-2xl gap-2 font-bold text-sm transition-all ${
                transcription && !isRecording ? 'primary shadow-lg shadow-primary/20' : 'secondary opacity-50'
              }`}
            >
              <CheckCircle2 size={18} /> RECORD
            </button>
          </div>
          
          {!transcription && !isRecording && (
            <p className="text-center text-[10px] text-foreground-muted font-bold tracking-widest uppercase">
              Hold the mic to speak or use manual entry
            </p>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowManualEntry(false)} />
          <div className="relative w-full max-w-lg glass p-8 shadow-2xl border-white/20 flex flex-col gap-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manual Entry</h2>
                <p className="text-foreground-muted text-xs font-bold uppercase tracking-widest mt-1">Record Round Details</p>
              </div>
              <button onClick={() => setShowManualEntry(false)} className="secondary p-2 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Round Type */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-primary tracking-widest uppercase">1. Select Round Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['Kan', 'Double', 'DoubleColor', 'DoubleRoyal'] as RoundType[]).map(t => (
                    <button 
                      key={t}
                      onClick={() => setManualType(t)}
                      className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                        manualType === t ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-foreground-muted'
                      }`}
                    >
                      {t.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Achiever */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-primary tracking-widest uppercase">2. Who achieved it?</p>
                <div className="flex flex-wrap gap-2">
                  {players.map(p => (
                    <button 
                      key={p}
                      onClick={() => setManualAchiever(p)}
                      className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                        manualAchiever === p ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-foreground-muted'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fallahs */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-primary tracking-widest uppercase">3. Any Fallah? (Hand value)</p>
                <div className="space-y-3">
                  {players.filter(p => p !== manualAchiever).map(p => (
                    <div key={p} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                      <span className="font-bold text-sm">{p}</span>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          className="w-20 text-right font-bold py-2 px-3 rounded-lg"
                          placeholder="0"
                          value={manualFallahs[p] || ''}
                          onChange={(e) => setManualFallahs({...manualFallahs, [p]: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={submitManualRound} className="primary py-5 rounded-2xl font-black tracking-widest uppercase mt-4 shadow-xl shadow-primary/30">
              SAVE ROUND
            </button>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] flex justify-end animate-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-md bg-background border-l border-white/10 p-8 overflow-y-auto flex flex-col gap-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">History</h2>
                <p className="text-foreground-muted text-xs font-bold uppercase tracking-widest mt-1">Previous Rounds</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="secondary p-3 rounded-xl">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {history.length === 0 && (
                <div className="flex flex-col items-center gap-4 mt-20 text-foreground-muted opacity-50">
                  <History size={48} strokeWidth={1} />
                  <p className="font-bold uppercase tracking-widest text-xs">No rounds recorded</p>
                </div>
              )}
              {history.map((h, i) => (
                <div key={h.timestamp} className="glass p-5 flex flex-col gap-4 border-white/5 shadow-lg group">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary tracking-widest uppercase mb-1">
                        Round {history.length - i}
                      </span>
                      <span className="text-lg font-black">{h.type.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </div>
                    <span className="text-[10px] font-bold text-foreground-muted bg-white/5 px-2 py-1 rounded">
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(h.scores).sort((a,b) => a[1]-b[1]).map(([name, score]) => (
                      <div key={name} className="flex justify-between items-center py-1 border-b border-white/5 last:border-0">
                        <span className="text-sm font-semibold">{name}</span>
                        <span className={`text-sm font-black ${score < 0 ? 'text-success' : 'text-danger'}`}>
                          {score > 0 ? '+' : ''}{score}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {h.transcription && (
                    <div className="pt-3 border-t border-white/5 text-[10px] text-foreground-muted italic leading-relaxed">
                      Voice input: "{h.transcription}"
                    </div>
                  )}
                  {h.isManual && (
                    <div className="text-[10px] font-black text-primary tracking-widest uppercase opacity-50">
                      Manual Entry
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
