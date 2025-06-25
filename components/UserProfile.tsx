

import React from 'react';
import type { InventoryNFTItem, UserCrashBetRecord, UserCaseOpeningRecord, UserSoldItemRecord } from '../types';
import { UserCrashBetOutcome, Rarity } from '../types';
import { NftItemCard } from './NftItemCard';
import { TonIcon } from './icons/TonIcon';

interface UserProfileProps {
  inventory: InventoryNFTItem[];
  onSellNft: (itemInstanceId: string) => void;
  userCrashBetHistory: UserCrashBetRecord[];
  userCaseOpeningHistory: UserCaseOpeningRecord[];
  userSoldItemsHistory: UserSoldItemRecord[]; // New prop for sold items history
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
    inventory, 
    onSellNft, 
    userCrashBetHistory, 
    userCaseOpeningHistory,
    userSoldItemsHistory 
}) => {
  
  const formatProfit = (profit: number) => {
    const absProfit = Math.abs(profit).toFixed(2);
    return profit >= 0 ? `+${absProfit}` : `-${absProfit}`;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-green-400';
    if (profit < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const getMultiplierDisplay = (record: UserCrashBetRecord) => {
    if (record.outcome === UserCrashBetOutcome.WIN && record.cashOutMultiplier) {
      return `${record.cashOutMultiplier.toFixed(2)}x`;
    }
    return `${record.crashPoint.toFixed(2)}x (Crashed)`;
  };

  const getRarityColor = (rarity: Rarity): string => {
    switch (rarity) {
        case Rarity.COMMON: return "text-slate-400";
        case Rarity.UNCOMMON: return "text-green-400";
        case Rarity.RARE: return "text-blue-400";
        case Rarity.EPIC: return "text-purple-400";
        case Rarity.LEGENDARY: return "text-amber-400";
        case Rarity.MYTHIC: return "text-red-500";
        default: return "text-slate-100";
    }
  };


  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold text-slate-100 text-center mb-10">My Profile</h2>

      {/* NFT Collection Section */}
      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-sky-400 mb-6">NFT Collection</h3>
        {inventory.length === 0 ? (
          <div className="text-center py-8 bg-slate-800 rounded-lg shadow">
            <p className="text-slate-400 text-lg">Your NFT inventory is currently empty.</p>
            <p className="text-slate-400 text-lg mt-2">Go open some gift boxes to find treasures!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {inventory.map(item => (
              <div key={item.instanceId} className="bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col">
                <NftItemCard nft={item} />
                {typeof item.sellPriceTon === 'number' && item.sellPriceTon > 0 && (
                  <div className="p-4 mt-auto">
                    <button
                      onClick={() => onSellNft(item.instanceId)}
                      className="w-full flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      Sell for <TonIcon className="w-4 h-4 mx-1 text-white" /> {item.sellPriceTon}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Case Opening History Section */}
      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-sky-400 mb-6">My Case Opening History</h3>
        {userCaseOpeningHistory.length === 0 ? (
          <div className="text-center py-8 bg-slate-800 rounded-lg shadow">
            <p className="text-slate-400 text-lg">You haven't opened any cases yet.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-750">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Case Opened</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Case Price (TON)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Item Won</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Rarity</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {userCaseOpeningHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{record.caseName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{record.casePriceTon.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                        <div className="flex items-center">
                            <img src={record.wonNftImageUrl} alt={record.wonNftName} className="w-8 h-8 object-cover rounded mr-2 border border-slate-600" />
                            {record.wonNftName}
                        </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${getRarityColor(record.wonNftRarity)}`}>
                      {record.wonNftRarity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sold Items History Section */}
      <section className="mb-12">
        <h3 className="text-2xl font-semibold text-sky-400 mb-6">My Sold Items History</h3>
        {userSoldItemsHistory.length === 0 ? (
          <div className="text-center py-8 bg-slate-800 rounded-lg shadow">
            <p className="text-slate-400 text-lg">You haven't sold any items yet.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-750">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Item Sold</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Rarity</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Sold For (TON)</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {userSoldItemsHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                        <div className="flex items-center">
                            <img src={record.itemImageUrl} alt={record.itemName} className="w-8 h-8 object-cover rounded mr-2 border border-slate-600" />
                            {record.itemName}
                        </div>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${getRarityColor(record.itemRarity)}`}>
                      {record.itemRarity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-400">
                      {record.soldForPriceTon.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Crash Game History Section */}
      <section>
        <h3 className="text-2xl font-semibold text-sky-400 mb-6">My Crash Game History</h3>
        {userCrashBetHistory.length === 0 ? (
          <div className="text-center py-8 bg-slate-800 rounded-lg shadow">
            <p className="text-slate-400 text-lg">You haven't played any Crash rounds yet.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-750">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Bet (TON)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Outcome</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Multiplier</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Profit (TON)</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {userCrashBetHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{new Date(record.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{record.betAmount.toFixed(2)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${record.outcome === UserCrashBetOutcome.WIN ? 'text-green-400' : 'text-red-400'}`}>
                      {record.outcome}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{getMultiplierDisplay(record)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${getProfitColor(record.profit)}`}>
                      {formatProfit(record.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
