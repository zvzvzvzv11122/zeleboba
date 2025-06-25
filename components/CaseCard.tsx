
import React from 'react';
import type { Case } from '../types';
import { TonIcon } from './icons/TonIcon';
import { NFT_ITEMS } from '../constants'; // Import all NFT items

interface CaseCardProps {
  caseData: Case;
  onViewDetails: () => void; // Changed from onOpen
  disabled?: boolean;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseData, onViewDetails, disabled }) => {
  const getSampleLootImages = (): string[] => {
    const uniqueImageUrls = new Set<string>();
    for (const loot of caseData.lootTable) {
      if (uniqueImageUrls.size >= 4) break;
      const nftItem = NFT_ITEMS.find(item => item.id === loot.nftId);
      if (nftItem && nftItem.imageUrl) {
        uniqueImageUrls.add(nftItem.imageUrl);
      }
    }
    return Array.from(uniqueImageUrls);
  };

  const sampleLootImages = getSampleLootImages();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZTB expresiónRegularMjNlMCIvPjwvc3ZnPg=="; 
    e.currentTarget.onerror = null; 
  };

  return (
    <div className={`bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex flex-col ${disabled ? 'opacity-60' : ''}`}>
      <img 
        src={caseData.imageUrl} 
        alt={caseData.name} 
        className="w-full h-48 object-cover" 
        onError={handleImageError} 
      />
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-2xl font-bold text-sky-400 mb-2">{caseData.name}</h3>
        <p className="text-sm text-slate-400 mb-3 flex-grow">{caseData.description}</p>
        
        {sampleLootImages.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1 font-medium">Possible items:</p>
            <div className="flex flex-wrap gap-2">
              {sampleLootImages.map((imageUrl, index) => (
                <img
                  key={`${caseData.id}-sample-${index}`}
                  src={imageUrl}
                  alt={`Sample item ${index + 1}`}
                  className="w-10 h-10 object-cover rounded border border-slate-700 bg-slate-700" 
                  onError={handleImageError}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center text-xl font-semibold text-amber-400">
            <TonIcon className="w-5 h-5 mr-1 text-sky-400" />
            {caseData.priceTon} TON
          </div>
          <button
            onClick={onViewDetails} // Changed from onOpen
            disabled={disabled}
            className={`bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 ${disabled ? 'cursor-not-allowed bg-slate-600 hover:bg-slate-600' : ''}`}
          >
            View Details 
          </button>
        </div>
      </div>
    </div>
  );
};
