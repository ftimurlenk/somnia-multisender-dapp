'use client';

import { ConnectKitButton } from 'connectkit';
import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, isAddress, BaseError, decodeEventLog, formatEther } from 'viem';
import MultisenderABI from '../abis/MultisenderABI.json';

const multisenderContractAddress = '0xf5934921684f6f581A5C3198EB4f62a9FA37D6b4';

type InternalTx = {
  to: string;
  amount: string;
}

type DecodedLogArgs = readonly unknown[] & {
  to: `0x${string}`;
  amount: bigint;
}

export default function Home() {
  const [recipientList, setRecipientList] = useState('');
  const [amountPerRecipient, setAmountPerRecipient] = useState('');
  const { isConnected } = useAccount();
  const { data: hash, isPending, writeContract, error, reset } = useWriteContract();
  const [internalTxs, setInternalTxs] = useState<InternalTx[]>([]);
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (receipt) {
      const decodedLogs = receipt.logs.map(log => {
        try {
          return decodeEventLog({
            abi: MultisenderABI,
            eventName: 'IndividualTransfer',
            data: log.data,
            topics: log.topics,
          }).args;
        } catch {
          return null;
        }
      }).filter(Boolean);

      const transfers = decodedLogs
        .filter(
          (log): log is DecodedLogArgs =>
            log !== null &&
            typeof (log as DecodedLogArgs).to === 'string' &&
            typeof (log as DecodedLogArgs).amount === 'bigint'
        )
        .map(log => ({
          to: log.to,
          amount: formatEther(log.amount),
        }));

      setInternalTxs(transfers);
    }
  }, [receipt]);

  const handleSend = async (_e: React.FormEvent) => {
    _e.preventDefault();
    reset(); 
    setInternalTxs([]);

    const addresses = recipientList.split('\n').map(addr => addr.trim()).filter(addr => isAddress(addr));
    if (addresses.length === 0) {
      alert('Please enter at least one valid recipient address.');
      return;
    }
    if (!amountPerRecipient || parseFloat(amountPerRecipient) <= 0) {
      alert('Please enter a valid amount per recipient.');
      return;
    }
    const amountPerRecipientInWei = parseEther(amountPerRecipient);
    const totalValueInWei = amountPerRecipientInWei * BigInt(addresses.length);
    writeContract({
      address: multisenderContractAddress as `0x${string}`,
      abi: MultisenderABI,
      functionName: 'send',
      args: [addresses],
      value: totalValueInWei,
    });
  };

  return (
    <main className="content-wrapper">
      <header className="header">
        <h1>Somnia STT Multisender</h1>
        <ConnectKitButton />
      </header>

      <p className="description">
        This tool allows you to send STT (Somnia Test Token) to multiple addresses on the Somnia network in a single transaction.
        To use it, paste the recipient addresses into the field below (one per line), specify the amount to send per recipient, and confirm the transaction.
      </p>
      
      {isConnected ? (
        <section className="card">
          <form onSubmit={handleSend} className="form">
             <div className="form-group">
                <label htmlFor="recipientList">Recipient Addresses (One Per Line):</label>
                <textarea
                  id="recipientList"
                  className="input textarea"
                  value={recipientList}
                  onChange={(e) => setRecipientList(e.target.value)}
                  placeholder="0xAddress1...&#10;0xAddress2...&#10;0xAddress3..."
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="amount">Amount Per Recipient (STT):</label>
                <input
                  id="amount"
                  type="text"
                  className="input"
                  value={amountPerRecipient}
                  onChange={(e) => setAmountPerRecipient(e.target.value)}
                  placeholder="e.g., 0.1"
                  required
                />
              </div>
            <button type="submit" disabled={isPending || isConfirming} className="button">
              {isPending ? 'Sending...' : isConfirming ? 'Confirming...' : 'Send to All Addresses'}
              {(isPending || isConfirming) && <div className="spinner"></div>}
            </button>
          </form>

          {hash && (
            <div className="message success">
              <p><b>Transaction Submitted!</b></p>
              <p className="hash-text">
                Hash: <a href={`https://shannon-explorer.somnia.network/tx/${hash}`} target="_blank" rel="noopener noreferrer">{hash}</a>
              </p>
              {isConfirming && <p>Waiting for confirmation...</p>}
            </div>
          )}
          
          {isConfirmed && internalTxs.length > 0 && (
            <div className="internal-txs-container">
              <h4>Internal Transfers:</h4>
              <ul className="tx-list">
                {internalTxs.map((tx, index) => (
                  <li key={index}>
                    <span>Sent <b>{tx.amount} STT</b> to </span>
                    <a href={`https://shannon-explorer.somnia.network/address/${tx.to}`} target="_blank" rel="noopener noreferrer">{tx.to}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <div className="message error">
              <p><b>Error</b></p>
              <p>{(error as BaseError).shortMessage || error.message}</p>
            </div>
          )}
        </section>
      ) : (
        <div className="connect-prompt">
          <p>Please connect your wallet to continue.</p>
        </div>
      )}

      <style jsx global>{`
        body {
          background-color: #f4f7f9;
          color: #333;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          margin: 0;
          display: grid;
          place-items: center;
          min-height: 100vh;
          padding: 2rem;
          box-sizing: border-box;
        }
      `}</style>
      <style jsx>{`
        .content-wrapper {
          width: 100%;
          max-width: 600px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }
        .header h1 {
          font-size: 1.75rem;
          margin: 0;
          color: #1a202c;
        }
        .description {
            text-align: center;
            color: #4a5568;
            margin-bottom: 2rem;
            font-size: 1rem;
            line-height: 1.6;
            max-width: 550px;
            margin-left: auto;
            margin-right: auto;
        }
        .card {
          background-color: #ffffff;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
        }
        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #4a5568;
        }
        .input {
          padding: 0.75rem 1rem;
          border: 1px solid #cbd5e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .input:focus {
          outline: none;
          border-color: #4299e1;
          box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
        }
        .textarea {
          min-height: 120px;
          font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
          resize: vertical;
        }
        .button {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          background-color: #3182ce;
          color: white;
          border: none;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        .button:hover:not(:disabled) {
          background-color: #2b6cb0;
        }
        .button:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .message {
          margin-top: 1.5rem;
          padding: 1rem;
          border-radius: 8px;
          border-width: 1px;
          border-style: solid;
        }
        .message p {
          margin: 0;
        }
        .message p:first-child {
          margin-bottom: 0.5rem;
        }
        .success {
          background-color: #f0fff4;
          border-color: #9ae6b4;
          color: #2f855a;
        }
        .error {
          background-color: #fff5f5;
          border-color: #feb2b2;
          color: #c53030;
        }
        .hash-text {
          word-break: break-all;
          font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
          font-size: 0.9rem;
        }
        .hash-text a {
            color: #2b6cb0;
        }
        .connect-prompt {
          text-align: center;
          padding: 3rem;
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .internal-txs-container {
          margin-top: 1.5rem;
          padding: 1rem;
          background-color: #fafafa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        .internal-txs-container h4 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #1a202c;
        }
        .tx-list {
          list-style: none;
          padding: 0;
          margin: 0;
          max-height: 200px;
          overflow-y: auto;
        }
        .tx-list li {
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
          font-size: 0.9rem;
          color: #4a5568;
        }
        .tx-list li:last-child {
          border-bottom: none;
        }
        .tx-list li a {
          font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
          color: #3182ce;
          text-decoration: none;
        }
        .tx-list li a:hover {
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}