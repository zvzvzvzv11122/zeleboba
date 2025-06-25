
import React from 'react';
import { TonIcon } from './icons/TonIcon';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';

interface HeaderProps {
  balance: number;
  onShowProfile: () => void;
  onShowCases: () => void;
  onShowCrashGame: () => void; // New prop
  currentView: 'cases' | 'profile' | 'crash'; // Updated prop
  onOpenAddFundsModal: () => void; 
}

export const Header: React.FC<HeaderProps> = ({ 
  balance, 
  onShowProfile, 
  onShowCases, 
  onShowCrashGame,
  currentView, 
  onOpenAddFundsModal 
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const connected = tonConnectUI.connected;

  return (
    <header className="w-full max-w-5xl p-4 mb-2 sm:mb-8">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-4 rounded-xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-400 mb-4 sm:mb-0">
          Telegram NFT Gifts
        </h1>
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {currentView !== 'cases' && (
            <button
              onClick={onShowCases}
              className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 whitespace-nowrap"
            >
              Play Cases
            </button>
          )}
          {currentView !== 'profile' && (
             <button
              onClick={onShowProfile}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-400 whitespace-nowrap"
            >
              My Profile
            </button>
          )}
          {currentView !== 'crash' && (
            <button
              onClick={onShowCrashGame}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-orange-400 whitespace-nowrap"
            >
              Play Crash
            </button>
          )}

          <div className="flex items-center bg-slate-700 px-4 py-2 rounded-lg">
            <TonIcon className="w-6 h-6 mr-2 text-sky-400" />
            <span className="text-xl font-semibold text-slate-100">{balance.toFixed(2)} TON</span>
          </div>
          
          {connected && (
            <button
              onClick={onOpenAddFundsModal}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 whitespace-nowrap"
            >
              Deposit TON
            </button>
          )}
          <TonConnectButton className="ton-connect-button" />
          <style>{`
            .ton-connect-button button { 
              /* Example: Adjust padding or font size if default doesn't fit well */
              /* padding: 0.5rem 1rem !important; */
              /* font-size: 0.875rem !important; */
              /* background-color: #yourColor !important; */
            }
          `}</style>
        </div>
      </div>
    </header>
  );
};
