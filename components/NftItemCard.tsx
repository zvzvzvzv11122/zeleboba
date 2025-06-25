
import React from 'react';
import type { NFTItem } from '../types';

interface NftItemCardProps {
  nft: NFTItem;
  small?: boolean; // For use in spinner
}

export const NftItemCard: React.FC<NftItemCardProps> = ({ nft, small = false }) => {
  if (small) {
    return (
      <div className={`spinner-item-card bg-slate-800 rounded-lg p-2 w-32 h-40 flex flex-col items-center justify-center border-2 border-slate-700 shadow-md mx-1`}>
        <img src={nft.imageUrl} alt={nft.name} className="w-20 h-20 object-cover rounded mb-1" />
        <p className="text-xs text-center text-slate-300 truncate w-full">{nft.name}</p>
        <p className={`text-xs font-semibold ${nft.rarityColor}`}>{nft.rarity}</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden w-full max-w-sm border-2 border-slate-700">
      <div className={`p-1 text-center font-bold ${nft.rarityColor} bg-opacity-30`} style={{ backgroundColor: nft.rarityColor.startsWith('text-') ? nft.rarityColor.replace('text-', 'bg-').replace('-400', '-700').replace('-500','-800') : 'bg-slate-700'  }}>
         {nft.rarity}
      </div>
      <img src={nft.imageUrl} alt={nft.name} className="w-full h-64 object-cover" />
      <div className="p-6">
        <h3 className="text-2xl font-bold text-sky-300 mb-2">{nft.name}</h3>
        <p className={`text-sm font-semibold ${nft.rarityColor} mb-3`}>Rarity: {nft.rarity}</p>
        <p className="text-slate-400 text-sm">{nft.description}</p>
      </div>
    </div>
  );
};