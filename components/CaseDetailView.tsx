
import React from 'react';
import type { Case, NFTItem } from '../types';
import { NFT_ITEMS } from '../constants';
import { NftItemCard } from './NftItemCard';
import { TonIcon } from './icons/TonIcon';

interface CaseDetailViewProps {
  caseData: Case;
  onOpenCase: (caseData: Case) => void;
  onBack: () => void;
  balance: number;
  isOpening: boolean; // To disable open button if another operation is in progress
}

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseData, onOpenCase, onBack, balance, isOpening }) => {
  const possibleItems: NFTItem[] = caseData.lootTable
    .map(loot => NFT_ITEMS.find(nft => nft.id === loot.nftId))
    .filter((item): item is NFTItem => item !== undefined); // Type guard to filter out undefined

  const canAfford = balance >= caseData.priceTon;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 flex flex-col items-center">
      <div className="w-full flex justify-start mb-6">
        <button
          onClick={onBack}
          className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-2 px-4 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          &larr; Back to Cases
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 w-full">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
          <img 
            src={caseData.imageUrl} 
            alt={caseData.name} 
            className="w-full md:w-1/3 h-auto max-h-80 object-contain rounded-lg border-2 border-slate-700" 
          />
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-sky-400 mb-3">{caseData.name}</h2>
            <p className="text-slate-400 mb-4">{caseData.description}</p>
            <div className="flex items-center justify-center md:justify-start text-2xl font-semibold text-amber-400 mb-6">
              <TonIcon className="w-7 h-7 mr-2 text-sky-400" />
              Price: {caseData.priceTon} TON
            </div>
            <button
              onClick={() => onOpenCase(caseData)}
              disabled={!canAfford || isOpening}
              className={`w-full md:w-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-400 ${(!canAfford || isOpening) ? 'opacity-50 cursor-not-allowed bg-slate-600 hover:bg-slate-600' : ''}`}
            >
              Open Case for {caseData.priceTon} TON
            </button>
            {!canAfford && <p className="text-red-400 text-sm mt-2 text-center md:text-left">Insufficient balance.</p>}
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-700">
          <h3 className="text-2xl font-semibold text-slate-100 mb-6 text-center">Possible Items Inside:</h3>
          {possibleItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {possibleItems.map(item => (
                <div key={item.id} className="transform hover:scale-105 transition-transform duration-200">
                  <NftItemCard nft={item} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center">No item details available for this case.</p>
          )}
        </div>
      </div>
    </div>
  );
};
