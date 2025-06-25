import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { CaseCard } from './components/CaseCard';
import { Modal } from './components/Modal';
import { NftItemCard } from './components/NftItemCard';
import { Spinner } from './components/Spinner';
import { UserProfile } from './components/UserProfile';
import { AddFundsModal } from './components/AddFundsModal';
import { CrashGameView } from './components/CrashGameView'; 
import { CaseDetailView } from './components/CaseDetailView';
import { 
    CASES, NFT_ITEMS, INITIAL_TON_BALANCE, APP_WALLET_ADDRESS, TON_NANO_MULTIPLIER,
    CRASH_GAME_PHASE_TIMINGS, CRASH_GAME_MAX_HISTORY, CRASH_GAME_HOUSE_EDGE_PROBABILITY,
    CRASH_POINT_SKEW_POWER, CRASH_POINT_MAX_RANDOM_FACTOR, USER_CRASH_BET_HISTORY_MAX_LENGTH,
    USER_CASE_OPENING_HISTORY_MAX_LENGTH, USER_SOLD_ITEMS_HISTORY_MAX_LENGTH
} from './constants';
import type { ChosenNFT, NFTItem, Case, InventoryNFTItem, CrashRound, CrashDataPoint, UserCrashBetRecord, UserCaseOpeningRecord, UserSoldItemRecord } from './types';
import { Rarity, CrashGameState, UserCrashBetOutcome } from './types';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { SendTransactionRequest, toNano } from '@tonconnect/sdk';


const App: React.FC = () => {
  const [balance, setBalance] = useState<number>(INITIAL_TON_BALANCE);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [viewingCaseDetails, setViewingCaseDetails] = useState<Case | null>(null);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [wonNft, setWonNft] = useState<ChosenNFT | null>(null);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [spinnerItems, setSpinnerItems] = useState<NFTItem[]>([]);
  const [inventory, setInventory] = useState<InventoryNFTItem[]>([]);
  const [currentView, setCurrentView] = useState<'cases' | 'profile' | 'crash'>('cases');
  const [showAddFundsModal, setShowAddFundsModal] = useState<boolean>(false);
  const [wonItemProcessed, setWonItemProcessed] = useState<boolean>(false);

  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  // Crash Game State
  const [crashGameState, setCrashGameState] = useState<CrashGameState>(CrashGameState.IDLE);
  const [crashCurrentMultiplier, setCrashCurrentMultiplier] = useState<number>(1.00);
  const [crashTargetPoint, setCrashTargetPoint] = useState<number | null>(null);
  const crashTargetPointRef = useRef<number | null>(null); 
  const [crashUserBetAmount, setCrashUserBetAmount] = useState<number | null>(null);
  const crashUserBetAmountRef = useRef<number | null>(null);
  const [crashUserCashedOutAt, setCrashUserCashedOutAt] = useState<number | null>(null); 
  const crashUserCashedOutAtRef = useRef<number | null>(null);
  const [crashCountdown, setCrashCountdown] = useState<number>(0); 
  const [crashPhaseTotalTime, setCrashPhaseTotalTime] = useState<number>(0); 
  const [crashHistory, setCrashHistory] = useState<CrashRound[]>([]); 
  const [userCrashBetHistory, setUserCrashBetHistory] = useState<UserCrashBetRecord[]>([]); 
  const [userCaseOpeningHistory, setUserCaseOpeningHistory] = useState<UserCaseOpeningRecord[]>([]); 
  const [userSoldItemsHistory, setUserSoldItemsHistory] = useState<UserSoldItemRecord[]>([]); 
  const [crashBetAmountInput, setCrashBetAmountInput] = useState<string>("");
  const [crashErrorMessage, setCrashErrorMessage] = useState<string | null>(null);
  const [crashRoundDataPoints, setCrashRoundDataPoints] = useState<CrashDataPoint[]>([]);
  const [crashAutoCashoutAtInput, setCrashAutoCashoutAtInput] = useState<string>("");
  const [crashUserAutoCashoutTarget, setCrashUserAutoCashoutTarget] = useState<number | null>(null);
  const crashUserAutoCashoutTargetRef = useRef<number | null>(null);
  const advanceCrashGameRef = useRef<((nextState: CrashGameState, duration: number) => void) | null>(null);
  const triggerNextCrashPhaseRef = useRef<((currentPhaseEnded: CrashGameState) => void) | null>(null);
  const crashTimerRef = useRef<number | null>(null);
  const crashMultiplierIntervalRef = useRef<number | null>(null);

  useEffect(() => { crashTargetPointRef.current = crashTargetPoint; }, [crashTargetPoint]);
  useEffect(() => { crashUserBetAmountRef.current = crashUserBetAmount; }, [crashUserBetAmount]);
  useEffect(() => { crashUserCashedOutAtRef.current = crashUserCashedOutAt; }, [crashUserCashedOutAt]);
  useEffect(() => { crashUserAutoCashoutTargetRef.current = crashUserAutoCashoutTarget; }, [crashUserAutoCashoutTarget]);


  useEffect(() => {
    const savedInventory = localStorage.getItem('nftInventory');
    if (savedInventory) setInventory(JSON.parse(savedInventory));
    
    const savedBalance = localStorage.getItem('userBalance');
    if (savedBalance) {
        setBalance(parseFloat(savedBalance));
    } else {
        setBalance(INITIAL_TON_BALANCE);
    }

    const savedCrashHistory = localStorage.getItem('crashHistory');
    if (savedCrashHistory) setCrashHistory(JSON.parse(savedCrashHistory));
    const savedUserCrashBetHistory = localStorage.getItem('userCrashBetHistory');
    if (savedUserCrashBetHistory) setUserCrashBetHistory(JSON.parse(savedUserCrashBetHistory));
    const savedUserCaseOpeningHistory = localStorage.getItem('userCaseOpeningHistory');
    if (savedUserCaseOpeningHistory) setUserCaseOpeningHistory(JSON.parse(savedUserCaseOpeningHistory));
    const savedUserSoldItemsHistory = localStorage.getItem('userSoldItemsHistory');
    if (savedUserSoldItemsHistory) setUserSoldItemsHistory(JSON.parse(savedUserSoldItemsHistory));
  }, []);

  useEffect(() => { localStorage.setItem('nftInventory', JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem('userBalance', balance.toString()); }, [balance]);
  useEffect(() => { localStorage.setItem('crashHistory', JSON.stringify(crashHistory)); }, [crashHistory]);
  useEffect(() => { localStorage.setItem('userCrashBetHistory', JSON.stringify(userCrashBetHistory)); }, [userCrashBetHistory]);
  useEffect(() => { localStorage.setItem('userCaseOpeningHistory', JSON.stringify(userCaseOpeningHistory)); }, [userCaseOpeningHistory]);
  useEffect(() => { localStorage.setItem('userSoldItemsHistory', JSON.stringify(userSoldItemsHistory)); }, [userSoldItemsHistory]);


  useEffect(() => {
    let timerId: number | undefined;
    if (notification && !notification.startsWith("Sending transaction...") && !notification.startsWith("Placing bet...")) {
      timerId = window.setTimeout(() => setNotification(null), 4000);
    }
    return () => { if (timerId) clearTimeout(timerId); };
  }, [notification]);

  // --- ВОССТАНАВЛИВАЕМ ЛОГИКУ КНОПКИ "DEPOSIT TON" ---
  const handleOpenAddFundsModal = useCallback(() => {
    if (!wallet) { 
        setNotification("Please connect your wallet first."); 
        return; 
    }
    setShowAddFundsModal(true);
  }, [wallet]);

  const handleCloseAddFundsModal = useCallback(() => setShowAddFundsModal(false), []);

  const handleConfirmDeposit = useCallback(async (amount: number) => {
    if (!wallet || !tonConnectUI) { 
        setNotification("Wallet not connected."); 
        return; 
    }
    if (amount <= 0) { 
        setNotification("Deposit amount must be positive."); 
        return; 
    }

    const transaction: SendTransactionRequest = {
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{ 
          address: APP_WALLET_ADDRESS, 
          amount: toNano(amount).toString() 
      }],
    };

    try {
      setNotification("Sending transaction... Please confirm in your wallet.");
      const result = await tonConnectUI.sendTransaction(transaction);
      
      // Имитируем ожидание подтверждения транзакции в блокчейне
      setNotification("Transaction sent! Waiting for confirmation...");
      
      // Здесь в реальном приложении нужно было бы слушать блокчейн,
      // но для простоты мы просто добавляем баланс сразу после отправки.
      setBalance(prev => prev + amount);
      setNotification(`Successfully deposited ${amount} TON!`);

    } catch (error: unknown) {
      console.error("TON Connect transaction failed:", error);
      let errorMessage = "Transaction failed or rejected.";
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('user rejected')) {
            errorMessage = "Transaction rejected by user.";
        } else if (error.message.toLowerCase().includes('aborted')) {
            errorMessage = "Transaction aborted.";
        }
      }
      setNotification(errorMessage);
    } finally {
      setShowAddFundsModal(false);
    }
  }, [wallet, tonConnectUI]);
  // --------------------------------------------------------

  const addUserCaseOpeningRecord = useCallback((caseData: Case, nftData: ChosenNFT) => {
    setUserCaseOpeningHistory(prev => {
        const newRecord: UserCaseOpeningRecord = {
            id: self.crypto.randomUUID(),
            timestamp: Date.now(),
            caseName: caseData.name,
            casePriceTon: caseData.priceTon,
            wonNftName: nftData.name,
            wonNftImageUrl: nftData.imageUrl,
            wonNftRarity: nftData.rarity,
        };
        return [newRecord, ...prev.slice(0, USER_CASE_OPENING_HISTORY_MAX_LENGTH - 1)];
    });
  }, []);

  const addUserSoldItemRecord = useCallback((itemData: NFTItem, soldPrice: number) => {
    setUserSoldItemsHistory(prev => {
        const newRecord: UserSoldItemRecord = {
            id: self.crypto.randomUUID(),
            timestamp: Date.now(),
            itemName: itemData.name,
            itemImageUrl: itemData.imageUrl,
            itemRarity: itemData.rarity,
            soldForPriceTon: soldPrice,
        };
        return [newRecord, ...prev.slice(0, USER_SOLD_ITEMS_HISTORY_MAX_LENGTH - 1)];
    });
  }, []);

  const selectNftForOpening = useCallback((caseData: Case): ChosenNFT => {
    const lootTable = caseData.lootTable;
    let totalWeight = lootTable.reduce((sum, item) => sum + item.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    for (const item of lootTable) {
      if (randomWeight < item.weight) {
        const nft = NFT_ITEMS.find(nftItem => nftItem.id === item.nftId);
        return nft || NFT_ITEMS[0]; 
      }
      randomWeight -= item.weight;
    }
    return NFT_ITEMS.find(nft => nft.id === lootTable[0].nftId) || NFT_ITEMS[0]; 
  }, []);

  const prepareSpinnerItems = useCallback((targetNft: NFTItem, caseData: Case): NFTItem[] => {
    const itemsForSpinner: NFTItem[] = [];
    const numItems = 50; 
    const targetIndex = Math.floor(numItems * 0.75);
    const caseNftIds = new Set(caseData.lootTable.map(item => item.nftId));
    const nftsInCase = NFT_ITEMS.filter(nft => caseNftIds.has(nft.id));
    if (nftsInCase.length === 0) return Array(numItems).fill(NFT_ITEMS[0]); 

    for (let i = 0; i < numItems; i++) {
      itemsForSpinner.push(i === targetIndex ? targetNft : nftsInCase[Math.floor(Math.random() * nftsInCase.length)]);
    }
    return itemsForSpinner;
  }, []);

  const handleSelectCaseForViewing = useCallback((caseData: Case) => {
    setViewingCaseDetails(caseData);
    setCurrentView('cases');
  }, []);

  const handleCloseCaseDetailView = useCallback(() => {
    setViewingCaseDetails(null);
  }, []);

  const handleOpenCaseFromDetail = useCallback((caseData: Case) => {
    if (balance < caseData.priceTon) { setNotification("Insufficient TON balance!"); return; }
    if (isOpening) return;
    
    // Списываем с внутреннего баланса, а не через транзакцию
    setBalance(prev => prev - caseData.priceTon);
    
    setSelectedCase(caseData);
    setViewingCaseDetails(null);
    setIsOpening(true);
    setWonNft(null); 
    const newlyWonNft = selectNftForOpening(caseData);
    setWonNft(newlyWonNft);
    setWonItemProcessed(false);
    setSpinnerItems(prepareSpinnerItems(newlyWonNft, caseData));
  }, [balance, isOpening, selectNftForOpening, prepareSpinnerItems]);


  const handleSpinEnd = useCallback(() => setShowResultModal(true), []);

  const handleCloseModal = useCallback(() => {
    if (wonNft && !wonItemProcessed && selectedCase) {
      const newInventoryItem: InventoryNFTItem = { ...wonNft, instanceId: self.crypto.randomUUID() };
      setInventory(prev => [...prev, newInventoryItem]);
      addUserCaseOpeningRecord(selectedCase, wonNft); 
      setNotification(`${wonNft.name} added to inventory.`);
    }
    setShowResultModal(false);
    setIsOpening(false);
    setSelectedCase(null);
  }, [wonNft, wonItemProcessed, selectedCase, addUserCaseOpeningRecord]);

  const handleSellWonItem = useCallback(() => {
    if (!wonNft || typeof wonNft.sellPriceTon !== 'number' || !selectedCase) return;
    const sellPrice = wonNft.sellPriceTon || 0;
    setBalance(prev => prev + sellPrice);
    setNotification(`Sold ${wonNft.name} for ${sellPrice} TON!`);
    addUserCaseOpeningRecord(selectedCase, wonNft); 
    addUserSoldItemRecord(wonNft, sellPrice); 
    setWonItemProcessed(true);
    setShowResultModal(false); setIsOpening(false); setSelectedCase(null);
  }, [wonNft, selectedCase, addUserCaseOpeningRecord, addUserSoldItemRecord]);

  const handleKeepWonItem = useCallback(() => {
    if (!wonNft || !selectedCase) return;
    const newInventoryItem: InventoryNFTItem = { ...wonNft, instanceId: self.crypto.randomUUID() };
    setInventory(prev => [...prev, newInventoryItem]);
    addUserCaseOpeningRecord(selectedCase, wonNft); 
    setNotification(`${wonNft.name} added to inventory!`);
    setWonItemProcessed(true);
    setShowResultModal(false); setIsOpening(false); setSelectedCase(null);
  }, [wonNft, selectedCase, addUserCaseOpeningRecord]);

  const handleSellFromInventory = useCallback((itemInstanceId: string) => {
    const itemToSell = inventory.find(item => item.instanceId === itemInstanceId);
    if (itemToSell && typeof itemToSell.sellPriceTon === 'number') {
      const sellPrice = itemToSell.sellPriceTon || 0;
      setBalance(prev => prev + sellPrice);
      setInventory(prev => prev.filter(item => item.instanceId !== itemInstanceId));
      setNotification(`Sold ${itemToSell.name} for ${sellPrice} TON!`);
      addUserSoldItemRecord(itemToSell, sellPrice); 
    }
  }, [inventory, addUserSoldItemRecord]);

  // (весь код Crash Game остается здесь без изменений)
  const addUserCrashBetRecord = useCallback((record: Omit<UserCrashBetRecord, 'id' | 'timestamp'>) => {
    setUserCrashBetHistory(prev => {
      const newRecord: UserCrashBetRecord = {
        ...record,
        id: self.crypto.randomUUID(),
        timestamp: Date.now(),
      };
      return [newRecord, ...prev.slice(0, USER_CRASH_BET_HISTORY_MAX_LENGTH - 1)];
    });
  }, []);
  const generateCrashPoint = useCallback((): number => {
    if (Math.random() < CRASH_GAME_HOUSE_EDGE_PROBABILITY) return 1.00;
    const r = Math.random();
    const x = Math.pow(r, CRASH_POINT_SKEW_POWER);
    const scaledX = x * CRASH_POINT_MAX_RANDOM_FACTOR;
    const point = 1 / (1 - scaledX);
    return Math.max(1.00, parseFloat(point.toFixed(2)));
  }, []);
  const advanceCrashGame = useCallback((nextState: CrashGameState, duration: number) => {
    if (crashTimerRef.current) clearInterval(crashTimerRef.current);
    crashTimerRef.current = null;
    if (crashMultiplierIntervalRef.current) clearInterval(crashMultiplierIntervalRef.current);
    crashMultiplierIntervalRef.current = null;
    setCrashGameState(nextState);
    setCrashCountdown(duration);
    setCrashPhaseTotalTime(duration);
    if (duration > 0) {
      crashTimerRef.current = window.setInterval(() => {
        setCrashCountdown(prevCountdown => {
          const newCountdown = prevCountdown - CRASH_GAME_PHASE_TIMINGS.MULTIPLIER_INCREMENT_INTERVAL;
          if (newCountdown <= 0) {
            if (crashTimerRef.current) clearInterval(crashTimerRef.current);
            crashTimerRef.current = null;
            if (triggerNextCrashPhaseRef.current) {
              triggerNextCrashPhaseRef.current(nextState); 
            }
            return 0;
          }
          return newCountdown;
        });
      }, CRASH_GAME_PHASE_TIMINGS.MULTIPLIER_INCREMENT_INTERVAL);
    } else {
        if (triggerNextCrashPhaseRef.current) {
          triggerNextCrashPhaseRef.current(nextState); 
        }
    }
  }, [setCrashGameState, setCrashCountdown, setCrashPhaseTotalTime]);
  const triggerNextCrashPhase = useCallback((currentPhaseEnded: CrashGameState) => {
    switch (currentPhaseEnded) {
      case CrashGameState.IDLE: 
        setCrashUserBetAmount(null);
        setCrashUserCashedOutAt(null);
        setCrashBetAmountInput("");
        setCrashAutoCashoutAtInput(""); 
        setCrashUserAutoCashoutTarget(null); 
        setCrashErrorMessage(null);
        setCrashCurrentMultiplier(1.00);
        setCrashRoundDataPoints([{ time: Date.now(), multiplier: 1.00 }]); 
        if(advanceCrashGameRef.current) advanceCrashGameRef.current(CrashGameState.BETTING, CRASH_GAME_PHASE_TIMINGS.BETTING_DURATION);
        break;
      case CrashGameState.BETTING: 
        const newTargetPoint = generateCrashPoint();
        setCrashTargetPoint(newTargetPoint); 
        setCrashRoundDataPoints([{ time: Date.now(), multiplier: 1.00 }]); 
        if(advanceCrashGameRef.current) advanceCrashGameRef.current(CrashGameState.STARTING_ROUND, CRASH_GAME_PHASE_TIMINGS.STARTING_ROUND_DURATION);
        break;
      case CrashGameState.STARTING_ROUND: 
        setCrashGameState(CrashGameState.RUNNING);
        setCrashCountdown(0); 
        setCrashRoundDataPoints(prev => prev.length === 0 ? [{ time: Date.now(), multiplier: 1.00 }] : prev); 
        if (crashMultiplierIntervalRef.current) clearInterval(crashMultiplierIntervalRef.current);
        crashMultiplierIntervalRef.current = null;
        crashMultiplierIntervalRef.current = window.setInterval(() => {
          setCrashCurrentMultiplier(prevMultiplier => {
            const currentActualCrashTarget = crashTargetPointRef.current; 
            let increment = 0.01; 
            if (prevMultiplier >= 5.00) increment = 0.01 * 1.45; 
            else if (prevMultiplier >= 2.00) increment = 0.01 * 1.30; 
            let newMultiplier = parseFloat((prevMultiplier + increment).toFixed(4)); 
            setCrashRoundDataPoints(prevPoints => [...prevPoints, { time: Date.now(), multiplier: newMultiplier }]);
            const currentBet = crashUserBetAmountRef.current;
            const autoCashoutTarget = crashUserAutoCashoutTargetRef.current;
            const alreadyCashedOut = crashUserCashedOutAtRef.current;
            if (currentBet && !alreadyCashedOut && autoCashoutTarget && newMultiplier >= autoCashoutTarget) {
              if (!currentActualCrashTarget || autoCashoutTarget <= currentActualCrashTarget) {
                const winnings = currentBet * autoCashoutTarget; 
                setBalance(prevBal => prevBal + winnings);
                setCrashUserCashedOutAt(autoCashoutTarget); 
                setNotification(`Auto-cashed out ${winnings.toFixed(2)} TON at ${autoCashoutTarget.toFixed(2)}x!`);
                addUserCrashBetRecord({
                    betAmount: currentBet,
                    outcome: UserCrashBetOutcome.WIN,
                    cashOutMultiplier: autoCashoutTarget,
                    crashPoint: currentActualCrashTarget || autoCashoutTarget, 
                    profit: winnings - currentBet,
                });
              }
            }
            if (currentActualCrashTarget && newMultiplier >= currentActualCrashTarget) {
              if (crashMultiplierIntervalRef.current) clearInterval(crashMultiplierIntervalRef.current);
              crashMultiplierIntervalRef.current = null;
              setCrashCurrentMultiplier(currentActualCrashTarget); 
              setCrashRoundDataPoints(prevPoints => [...prevPoints, { time: Date.now(), multiplier: currentActualCrashTarget }]);
              const finalBetAmount = crashUserBetAmountRef.current;
              const finalCashedOutAt = crashUserCashedOutAtRef.current; 
              if (finalBetAmount && !finalCashedOutAt) { 
                setNotification(`CRASH! You lost your ${finalBetAmount.toFixed(2)} TON bet.`);
                 addUserCrashBetRecord({
                    betAmount: finalBetAmount,
                    outcome: UserCrashBetOutcome.LOSS,
                    crashPoint: currentActualCrashTarget,
                    profit: -finalBetAmount,
                });
              } else if (!finalBetAmount && !finalCashedOutAt) { 
                 setNotification(`CRASHED @ ${currentActualCrashTarget.toFixed(2)}x`);
              }
              const newHistoryItem: CrashRound = { id: self.crypto.randomUUID(), crashPoint: currentActualCrashTarget, timestamp: Date.now() };
              setCrashHistory(prev => [newHistoryItem, ...prev.slice(0, CRASH_GAME_MAX_HISTORY - 1)]);
              if(advanceCrashGameRef.current) advanceCrashGameRef.current(CrashGameState.CRASHED, CRASH_GAME_PHASE_TIMINGS.CRASHED_DISPLAY_DURATION);
              return currentActualCrashTarget; 
            }
            return newMultiplier;
          });
        }, CRASH_GAME_PHASE_TIMINGS.MULTIPLIER_INCREMENT_INTERVAL);
        break;
      case CrashGameState.CRASHED: 
        if(advanceCrashGameRef.current) advanceCrashGameRef.current(CrashGameState.IDLE, CRASH_GAME_PHASE_TIMINGS.IDLE_DURATION);
        break;
      default: 
        if(advanceCrashGameRef.current) advanceCrashGameRef.current(CrashGameState.IDLE, CRASH_GAME_PHASE_TIMINGS.IDLE_DURATION);
        break;
    }
  }, [
      generateCrashPoint, 
      setCrashUserBetAmount, setCrashUserCashedOutAt, setCrashBetAmountInput, setCrashErrorMessage,
      setCrashCurrentMultiplier, setCrashTargetPoint, setCrashHistory, setNotification,
      setCrashGameState, setCrashCountdown, setCrashAutoCashoutAtInput, setCrashUserAutoCashoutTarget,
      setBalance, setCrashRoundDataPoints, addUserCrashBetRecord
  ]);
  useEffect(() => {
    advanceCrashGameRef.current = advanceCrashGame;
    triggerNextCrashPhaseRef.current = triggerNextCrashPhase;
  }, [advanceCrashGame, triggerNextCrashPhase]);
  useEffect(() => {
    if (currentView === 'crash') {
      if (!crashTimerRef.current && !crashMultiplierIntervalRef.current) {
        setCrashGameState(CrashGameState.IDLE);
        setCrashCurrentMultiplier(1.00);
        setCrashCountdown(0);
        setCrashUserBetAmount(null);
        setCrashUserCashedOutAt(null);
        setCrashBetAmountInput("");
        setCrashAutoCashoutAtInput("");
        setCrashUserAutoCashoutTarget(null);
        setCrashErrorMessage(null);
        setCrashRoundDataPoints([{ time: Date.now(), multiplier: 1.00 }]);
        if (triggerNextCrashPhaseRef.current) {
          triggerNextCrashPhaseRef.current(CrashGameState.CRASHED); 
        }
      }
    } else {
      if (crashTimerRef.current) clearInterval(crashTimerRef.current);
      crashTimerRef.current = null;
      if (crashMultiplierIntervalRef.current) clearInterval(crashMultiplierIntervalRef.current);
      crashMultiplierIntervalRef.current = null;
    }
    return () => {
      if (crashTimerRef.current) clearInterval(crashTimerRef.current);
      crashTimerRef.current = null;
      if (crashMultiplierIntervalRef.current) clearInterval(crashMultiplierIntervalRef.current);
      crashMultiplierIntervalRef.current = null;
    };
  }, [currentView]); 
  const handlePlaceCrashBet = useCallback(() => {
    if (crashGameState !== CrashGameState.BETTING) {
      setCrashErrorMessage("Betting phase is over.");
      return;
    }
    const amount = parseFloat(crashBetAmountInput);
    if (isNaN(amount) || amount <= 0) {
      setCrashErrorMessage("Invalid bet amount.");
      return;
    }
    if (amount > balance) {
      setCrashErrorMessage("Insufficient balance.");
      return;
    }
    let autoTarget: number | null = null;
    let notificationMessage = `Bet of ${amount.toFixed(2)} TON placed!`;
    if (crashAutoCashoutAtInput) {
        const parsedAutoTarget = parseFloat(crashAutoCashoutAtInput);
        if (!isNaN(parsedAutoTarget) && parsedAutoTarget > 1.00) { 
            autoTarget = parsedAutoTarget;
            notificationMessage += ` Auto cashout @ ${autoTarget.toFixed(2)}x.`;
        } else {
            setCrashErrorMessage("Invalid auto cashout target (must be > 1.00x). Bet placed without auto cashout.");
        }
    }
    setCrashUserAutoCashoutTarget(autoTarget);
    setBalance(prev => prev - amount);
    setCrashUserBetAmount(amount);
    setCrashErrorMessage(null); 
    setNotification(notificationMessage);
  }, [crashGameState, crashBetAmountInput, balance, crashAutoCashoutAtInput, setNotification, setBalance, setCrashUserBetAmount, setCrashErrorMessage, setCrashUserAutoCashoutTarget]);
  const handleCashOutCrash = useCallback(() => {
    if (crashGameState !== CrashGameState.RUNNING || !crashUserBetAmountRef.current || crashUserCashedOutAtRef.current) return;
    const betAmount = crashUserBetAmountRef.current;
    if(!betAmount) return; 
    const currentMultiplierForCashout = crashCurrentMultiplier; 
    const winnings = betAmount * currentMultiplierForCashout;
    setBalance(prev => prev + winnings);
    setCrashUserCashedOutAt(currentMultiplierForCashout); 
    setNotification(`Cashed out ${winnings.toFixed(2)} TON at ${currentMultiplierForCashout.toFixed(2)}x!`);
    addUserCrashBetRecord({
        betAmount: betAmount,
        outcome: UserCrashBetOutcome.WIN,
        cashOutMultiplier: currentMultiplierForCashout,
        crashPoint: crashTargetPointRef.current || currentMultiplierForCashout, 
        profit: winnings - betAmount,
    });
  }, [crashGameState, crashCurrentMultiplier, balance, setNotification, setBalance, setCrashUserCashedOutAt, addUserCrashBetRecord]); 
  const renderMainContent = () => {
    if (isOpening && selectedCase && wonNft) {
      return (
        <div className="w-full flex flex-col items-center mt-2 sm:mt-8">
            <h2 className="text-3xl font-bold mb-4 text-slate-100">Opening {selectedCase.name}...</h2>
            <Spinner items={spinnerItems} winningItem={wonNft} onSpinEnd={handleSpinEnd} />
        </div>
      );
    }
    if (currentView === 'profile') {
      return <UserProfile 
                inventory={inventory} 
                onSellNft={handleSellFromInventory} 
                userCrashBetHistory={userCrashBetHistory}
                userCaseOpeningHistory={userCaseOpeningHistory}
                userSoldItemsHistory={userSoldItemsHistory} 
              />;
    }
    if (currentView === 'crash') {
      return <CrashGameView
                gameState={crashGameState}
                currentMultiplier={crashCurrentMultiplier}
                countdown={crashCountdown}
                betAmountInput={crashBetAmountInput}
                onBetAmountInputChange={setCrashBetAmountInput}
                autoCashoutAtInput={crashAutoCashoutAtInput} 
                onAutoCashoutAtInputChange={setCrashAutoCashoutAtInput} 
                onPlaceBet={handlePlaceCrashBet}
                onCashOut={handleCashOutCrash}
                crashHistory={crashHistory}
                userBetInCurrentRound={crashUserBetAmount}
                userCashedOutAt={crashUserCashedOutAt}
                userAutoCashoutTarget={crashUserAutoCashoutTarget} 
                balance={balance}
                maxBet={balance} 
                errorMessage={crashErrorMessage}
                phaseTimeTotal={crashPhaseTotalTime}
                roundDataPoints={crashRoundDataPoints} 
             />;
    }
    if (currentView === 'cases') {
      if (viewingCaseDetails) {
        return <CaseDetailView 
                  caseData={viewingCaseDetails}
                  onOpenCase={handleOpenCaseFromDetail}
                  onBack={handleCloseCaseDetailView}
                  balance={balance}
                  isOpening={isOpening}
                />;
      }
      return (
        <>
          <h2 className="text-3xl font-bold my-4 sm:my-8 text-slate-100">Choose a Gift Box</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
            {CASES.map(caseItem => (
              <CaseCard 
                key={caseItem.id} 
                caseData={caseItem} 
                onViewDetails={() => handleSelectCaseForViewing(caseItem)}
                disabled={isOpening}
              />
            ))}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <Header 
        balance={balance} 
        onShowProfile={() => { setCurrentView('profile'); setViewingCaseDetails(null); }}
        onShowCases={() => { setCurrentView('cases'); setViewingCaseDetails(null); }}
        onShowCrashGame={() => { setCurrentView('crash'); setViewingCaseDetails(null); }}
        currentView={currentView}
        onOpenAddFundsModal={handleOpenAddFundsModal}
      />

      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-6 py-3 rounded-lg shadow-lg z-[1001]" role="alert" aria-live="assertive">
          {notification}
        </div>
      )}

      {renderMainContent()}

      {showResultModal && wonNft && (
        <Modal onClose={handleCloseModal} title="Congratulations!">
          <div className="flex flex-col items-center">
            <p className="text-lg text-slate-300 mb-4">You've received:</p>
            <NftItemCard nft={wonNft} />
            <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full">
              {typeof wonNft.sellPriceTon === 'number' && wonNft.sellPriceTon > 0 && (
                 <button
                  onClick={handleSellWonItem}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  Sell for {wonNft.sellPriceTon} TON
                </button>
              )}
              <button
                onClick={handleKeepWonItem}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                Keep Item
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddFundsModal && (
        <AddFundsModal
          onClose={handleCloseAddFundsModal}
          onConfirmDeposit={handleConfirmDeposit}
          currentBalance={balance}
        />
      )}
    </div>
  );
};

export default App;