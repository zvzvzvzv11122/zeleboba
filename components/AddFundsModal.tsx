import React, { useState } from 'react';
import { Modal } from './Modal';
import { TonIcon } from './icons/TonIcon';

interface AddFundsModalProps {
  onClose: () => void;
  onConfirmDeposit: (amount: number) => void;
  currentBalance: number;
}

export const AddFundsModal: React.FC<AddFundsModalProps> = ({ onClose, onConfirmDeposit, currentBalance }) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleSubmit = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid positive amount.");
      return;
    }
    setError(null);
    onConfirmDeposit(numericAmount);
  };

  return (
    <Modal onClose={onClose} title="Deposit TON">
      <div className="flex flex-col space-y-6">
        <div>
          <label htmlFor="deposit-amount" className="block text-sm font-medium text-slate-300 mb-1">
            Amount to Deposit (TON)
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <TonIcon className="h-5 w-5 text-sky-400" aria-hidden="true" />
            </div>
            <input
              type="text" // Using text to better control input, validation is manual
              name="deposit-amount"
              id="deposit-amount"
              className="block w-full rounded-md border-slate-600 bg-slate-700 py-2 pl-10 pr-4 text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              aria-describedby="amount-error"
            />
          </div>
          {error && <p id="amount-error" className="mt-2 text-sm text-red-400">{error}</p>}
        </div>

        <div className="text-sm text-slate-400">
          <p>Current Balance: {currentBalance.toFixed(2)} TON</p>
          {parseFloat(amount) > 0 && <p>New Balance After Deposit: {(currentBalance + parseFloat(amount)).toFixed(2)} TON</p>}
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full justify-center rounded-md border border-transparent bg-slate-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800 sm:text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full justify-center rounded-md border border-transparent bg-sky-500 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-800 sm:text-sm transition-colors disabled:opacity-50"
            disabled={!amount || parseFloat(amount) <= 0}
          >
            Confirm Deposit
          </button>
        </div>
      </div>
    </Modal>
  );
};
