
import React from 'react';
import { TonIcon } from './icons/TonIcon';
import { CrashGameState, type CrashRound, type CrashDataPoint } from '../types';
import { CrashGraph } from './CrashGraph'; // Import the new CrashGraph component

interface CrashGameViewProps {
  gameState: CrashGameState;
  currentMultiplier: number;
  countdown: number; 
  betAmountInput: string;
  onBetAmountInputChange: (value: string) => void;
  autoCashoutAtInput: string; 
  onAutoCashoutAtInputChange: (value: string) => void; 
  onPlaceBet: () => void;
  onCashOut: () => void;
  crashHistory: CrashRound[];
  userBetInCurrentRound: number | null;
  userCashedOutAt: number | null; 
  userAutoCashoutTarget: number | null; 
  balance: number;
  maxBet: number; 
  errorMessage: string | null; 
  phaseTimeTotal: number; 
  roundDataPoints: CrashDataPoint[]; // New prop for graph data
}

export const CrashGameView: React.FC<CrashGameViewProps> = ({
  gameState,
  currentMultiplier,
  countdown,
  betAmountInput,
  onBetAmountInputChange,
  autoCashoutAtInput,
  onAutoCashoutAtInputChange,
  onPlaceBet,
  onCashOut,
  crashHistory,
  userBetInCurrentRound,
  userCashedOutAt,
  userAutoCashoutTarget,
  balance,
  maxBet,
  errorMessage,
  phaseTimeTotal,
  roundDataPoints,
}) => {

  const getMultiplierColor = (multiplier: number): string => {
    if (multiplier < 1.5) return 'text-sky-400';
    if (multiplier < 2) return 'text-green-400';
    if (multiplier < 5) return 'text-yellow-400';
    if (multiplier < 10) return 'text-orange-500';
    return 'text-red-500';
  };

  const getHistoryItemColor = (point: number): string => {
    if (point < 1.01) return 'text-red-400'; 
    if (point < 1.5) return 'text-orange-400';
    if (point < 2) return 'text-yellow-300';
    if (point < 5) return 'text-sky-300';
    return 'text-green-400';
  };
  
  const progressPercentage = phaseTimeTotal > 0 ? ((phaseTimeTotal - countdown) / phaseTimeTotal) * 100 : 0;

  const renderActionButton = () => {
    if (gameState === CrashGameState.BETTING && !userBetInCurrentRound) { 
      return (
        <button
          onClick={onPlaceBet}
          disabled={!betAmountInput || parseFloat(betAmountInput) <= 0 || parseFloat(betAmountInput) > balance}
          className="w-full py-3 px-6 text-lg font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
        >
          Place Bet ({parseFloat(betAmountInput) > 0 ? parseFloat(betAmountInput).toFixed(2) : '0.00'} TON)
        </button>
      );
    }
    if (gameState === CrashGameState.RUNNING && userBetInCurrentRound && !userCashedOutAt) {
      const potentialWinnings = (userBetInCurrentRound * currentMultiplier).toFixed(2);
      return (
        <button
          onClick={onCashOut}
          className="w-full py-3 px-6 text-lg font-semibold text-white bg-sky-500 rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-150"
        >
          Cash Out @ {currentMultiplier.toFixed(2)}x ({potentialWinnings} TON)
        </button>
      );
    }
    if (userBetInCurrentRound && userCashedOutAt) { 
         const winnings = (userBetInCurrentRound * userCashedOutAt).toFixed(2);
      return (
        <button
          disabled
          className="w-full py-3 px-6 text-lg font-semibold text-white bg-gray-500 rounded-lg shadow-md disabled:opacity-70 cursor-not-allowed"
        >
          Cashed Out @ {userCashedOutAt.toFixed(2)}x for {winnings} TON
        </button>
      );
    }
    
    return (
      <button
        disabled
        className="w-full py-3 px-6 text-lg font-semibold text-white bg-slate-600 rounded-lg shadow-md opacity-50 cursor-not-allowed"
      >
        {userBetInCurrentRound && gameState !== CrashGameState.RUNNING && !userCashedOutAt ? `Bet Placed: ${userBetInCurrentRound.toFixed(2)} TON` : 'Waiting for next round...'}
      </button>
    );
  };

  const getStatusText = () => {
    switch (gameState) {
      case CrashGameState.IDLE:
        return `Next round starting soon...`;
      case CrashGameState.BETTING:
        if (userBetInCurrentRound && userAutoCashoutTarget) return `Bet Placed! Auto @ ${userAutoCashoutTarget.toFixed(2)}x. Betting ends in ${(countdown / 1000).toFixed(1)}s`;
        if (userBetInCurrentRound) return `Bet Placed! Betting ends in ${(countdown / 1000).toFixed(1)}s`;
        return `Place your bets! Ending in ${(countdown / 1000).toFixed(1)}s`;
      case CrashGameState.STARTING_ROUND:
        if (userBetInCurrentRound && userAutoCashoutTarget) return `Bet Placed! Auto @ ${userAutoCashoutTarget.toFixed(2)}x. Round starting in ${(countdown / 1000).toFixed(1)}s...`;
        if (userBetInCurrentRound) return `Bet Placed! Round starting in ${(countdown / 1000).toFixed(1)}s...`;
        return `Round starting in ${(countdown / 1000).toFixed(1)}s...`;
      case CrashGameState.RUNNING:
        if (userBetInCurrentRound && userCashedOutAt) return `You cashed out at ${userCashedOutAt.toFixed(2)}x! Multiplier: ${currentMultiplier.toFixed(2)}x`;
        if (userBetInCurrentRound && userAutoCashoutTarget) return `Auto @ ${userAutoCashoutTarget.toFixed(2)}x. Cash out or risk it!`;
        if (userBetInCurrentRound) return "Multiplier is rising! Cash out or risk it all!";
        return "Multiplier is rising!";
      case CrashGameState.CRASHED:
        if (userBetInCurrentRound && userCashedOutAt) return `CRASHED @ ${currentMultiplier.toFixed(2)}x! You cashed out at ${userCashedOutAt.toFixed(2)}x.`;
        return `CRASHED @ ${currentMultiplier.toFixed(2)}x!`;
      default:
        return "Loading...";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 bg-slate-800 rounded-xl shadow-2xl flex flex-col space-y-6">
      {/* Multiplier Display Area with Graph */}
      <div className="relative flex flex-col items-center justify-center h-64 md:h-80 bg-slate-900 rounded-lg shadow-inner overflow-hidden border-2 border-slate-700">
        <CrashGraph 
            dataPoints={roundDataPoints} 
            gameState={gameState} 
            currentMultiplierValue={currentMultiplier} 
        />
        <div 
            className={`absolute text-5xl md:text-7xl font-bold tracking-tighter ${getMultiplierColor(currentMultiplier)} transition-colors duration-300 z-10 pointer-events-none drop-shadow-lg`}
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            aria-live="polite"
        >
          {currentMultiplier.toFixed(2)}x
        </div>
        <p className="absolute top-4 text-slate-400 text-lg z-10 px-2 text-center pointer-events-none bg-slate-900 bg-opacity-50 rounded-md py-1">
            {getStatusText()}
        </p>
        {(gameState === CrashGameState.BETTING || gameState === CrashGameState.STARTING_ROUND) && phaseTimeTotal > 0 && (
           <div className="absolute bottom-0 left-0 w-full h-2.5 bg-slate-700 rounded-b-lg overflow-hidden z-20">
             <div 
                className="h-full bg-sky-500 transition-all duration-100 ease-linear" 
                style={{ width: `${progressPercentage}%`}}
              ></div>
           </div>
        )}
      </div>

      {/* Controls Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="space-y-4 p-4 bg-slate-850 rounded-lg border border-slate-700">
          <h3 className="text-xl font-semibold text-slate-100">Place Your Bet</h3>
          {/* Bet Amount Input */}
          <div>
            <label htmlFor="betAmount" className="sr-only">Bet Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TonIcon className="w-5 h-5 text-sky-400" />
              </div>
              <input
                type="number"
                id="betAmount"
                name="betAmount"
                value={betAmountInput}
                onChange={(e) => onBetAmountInputChange(e.target.value)}
                placeholder="0.00"
                disabled={gameState !== CrashGameState.BETTING || !!userBetInCurrentRound}
                className="w-full py-3 pl-10 pr-4 text-lg bg-slate-700 text-white rounded-lg border-slate-600 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                min="0.01"
                step="0.01"
              />
            </div>
          </div>

          {/* Auto Cashout Input */}
          <div>
            <label htmlFor="autoCashoutAt" className="sr-only">Auto Cashout At Multiplier</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-lg">@</span>
              </div>
              <input
                type="number"
                id="autoCashoutAt"
                name="autoCashoutAt"
                value={autoCashoutAtInput}
                onChange={(e) => onAutoCashoutAtInputChange(e.target.value)}
                placeholder="Auto Cashout (e.g., 2.5)"
                disabled={gameState !== CrashGameState.BETTING || !!userBetInCurrentRound}
                className="w-full py-3 pl-10 pr-4 text-lg bg-slate-700 text-white rounded-lg border-slate-600 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                min="1.01" 
                step="0.01"
              />
               <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-slate-400 text-lg">x</span>
              </div>
            </div>
          </div>
          
          {errorMessage && <p className="mt-2 text-sm text-red-400">{errorMessage}</p>}
          {gameState === CrashGameState.BETTING && !userBetInCurrentRound && (
                 <p className="mt-1 text-xs text-slate-400">Balance: {balance.toFixed(2)} TON. Max Bet: {maxBet.toFixed(2)} TON</p>
          )}

          {renderActionButton()}
        </div>

        {/* History Area */}
        <div className="space-y-3 p-4 bg-slate-850 rounded-lg border border-slate-700 h-full">
          <h3 className="text-xl font-semibold text-slate-100 mb-2">Recent Crashes</h3>
          {crashHistory.length === 0 ? (
            <p className="text-slate-500">No history yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {crashHistory.map((round) => (
                <span
                  key={round.id}
                  className={`px-3 py-1 text-sm font-medium rounded-full bg-slate-700 shadow ${getHistoryItemColor(round.crashPoint)}`}
                  title={`Crashed at ${round.crashPoint.toFixed(2)}x on ${new Date(round.timestamp).toLocaleTimeString()}`}
                >
                  {round.crashPoint.toFixed(2)}x
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
