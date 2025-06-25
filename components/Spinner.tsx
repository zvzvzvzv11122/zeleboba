
import React, { useState, useEffect, useRef } from 'react';
import type { NFTItem } from '../types';
import { NftItemCard } from './NftItemCard';

interface SpinnerProps {
  items: NFTItem[]; // Full list of items for the reel
  winningItem: NFTItem;
  onSpinEnd: () => void;
}

const ITEM_WIDTH_PX = 128 + 8; // Card width (128px) + margin (4px left + 4px right = 8px for mx-1 on each side for NftItemCard small)
const NUM_VISIBLE_ITEMS_APPROX = 7; // For calculating centering offset

export const Spinner: React.FC<SpinnerProps> = ({ items, winningItem, onSpinEnd }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [transformStyle, setTransformStyle] = useState('translateX(0px)');
  const spinnerReelRef = useRef<HTMLDivElement>(null);
  const spinnerWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (items.length > 0 && winningItem) {
      setIsSpinning(true);

      // Find the first index of the winning item (or a specific one if multiples)
      // For this animation, we usually pick a specific target instance of the winning item in the reel
      // The items array is constructed such that winningItem is at a known position (e.g. 75% mark)
      let targetIndex = -1;
      for(let i=0; i < items.length; i++) {
        if(items[i].id === winningItem.id) {
            // A common strategy is to pick a winning item instance that is not too close to the start or end
            // For simplicity, let's assume `items` is constructed with `winningItem` at a specific desired "landing" index.
            // The `prepareSpinnerItems` in App.tsx places it at roughly 75% through the reel.
             if (i > items.length * 0.5 && i < items.length * 0.9) { // Heuristic to pick a good visual target
                targetIndex = i;
                break;
             }
        }
      }
      if (targetIndex === -1) targetIndex = items.findIndex(item => item.id === winningItem.id); // Fallback to first instance
      if (targetIndex === -1 && items.length > 0) targetIndex = Math.floor(items.length / 2); // Further fallback
      if (targetIndex === -1 ) targetIndex = 0; // Absolute fallback

      
      const windowWidth = spinnerWindowRef.current ? spinnerWindowRef.current.offsetWidth : ITEM_WIDTH_PX * NUM_VISIBLE_ITEMS_APPROX;
      
      // Calculate the translateX to center the target item
      // Target position: center of the window.
      // Item's left edge needs to be at: (windowWidth / 2) - (ITEM_WIDTH_PX / 2)
      // So, translateX = -(targetIndex * ITEM_WIDTH_PX) + (windowWidth / 2) - (ITEM_WIDTH_PX / 2)
      const targetTranslateX = -(targetIndex * ITEM_WIDTH_PX) + (windowWidth / 2) - (ITEM_WIDTH_PX / 2);

      // Start position (further to the left to give a sense of speed)
      setTransformStyle(`translateX(${targetTranslateX + ITEM_WIDTH_PX * 10}px)`);


      // Short delay to apply initial transform, then animate to target
      const initialAnimationTimer = setTimeout(() => {
        setTransformStyle(`translateX(${targetTranslateX}px)`);
      }, 100);

      // Duration of spin animation
      const spinDuration = 4000; // 4 seconds
      const spinEndTimer = setTimeout(() => {
        setIsSpinning(false);
        onSpinEnd();
      }, spinDuration + 100); // Add the 100ms from above

      return () => {
        clearTimeout(initialAnimationTimer);
        clearTimeout(spinEndTimer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, winningItem, onSpinEnd]); 

  if (!items || items.length === 0) {
    return <div className="text-center p-8 text-slate-300">Preparing items...</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-4 bg-slate-800 rounded-lg shadow-xl relative select-none">
      <div 
        ref={spinnerWindowRef}
        className="h-48 overflow-hidden relative border-2 border-sky-500 rounded flex items-center"
        style={{ '--item-width': `${ITEM_WIDTH_PX}px` } as React.CSSProperties}
      >
        <div
          ref={spinnerReelRef}
          className="flex items-center h-full absolute left-0 top-0"
          style={{
            transform: transformStyle,
            transition: isSpinning ? 'transform 4s cubic-bezier(0.25, 0.1, 0.2, 1)' : 'none', // Slower easing out
            willChange: 'transform',
          }}
        >
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="shrink-0" style={{ width: `${ITEM_WIDTH_PX}px` }}>
              <NftItemCard nft={item} small />
            </div>
          ))}
        </div>
      </div>
      {/* Center marker - top triangle */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-none z-10
                   border-l-[12px] border-l-transparent
                   border-r-[12px] border-r-transparent
                   border-t-[12px] border-t-red-500 opacity-85"
        style={{ top: `calc(50% - 96px - 12px)`}} // 96px = h-48/2 for window, 12px for triangle height
      ></div>
      {/* Center marker - bottom triangle */}
       <div 
        className="absolute left-1/2 -translate-x-1/2 w-0 h-0 pointer-events-none z-10
                   border-l-[12px] border-l-transparent
                   border-r-[12px] border-r-transparent
                   border-b-[12px] border-b-red-500 opacity-85"
        style={{ top: `calc(50% + 96px)`}} // 96px = h-48/2 for window
      ></div>

    </div>
  );
};