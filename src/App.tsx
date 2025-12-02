import { useState } from "react";
import "./App.css";
import { getInjectiveAddress } from "@injectivelabs/sdk-ts";

interface VaultState {
  totalBalance: number;
  injBalance: number;
  winjBalance: number;
  address: string;
  amount: string;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [state, setState] = useState<VaultState>({
    totalBalance: 0.03,
    injBalance: 0,
    winjBalance: 0.03,
    address: "",
    amount: "",
  });

  const getEthereum = () => {
    if (!window.ethereum) {
      throw new Error("Metamask extension not installed");
    }
    return window.ethereum;
  };

  const handleConnect = async () => {
    try {
      const ethereum = getEthereum();
      const addresses = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const injectiveAddresses = addresses.map(getInjectiveAddress);
      console.log(injectiveAddresses);

      if (injectiveAddresses.length > 0) {
        setIsConnected(true);
        setWalletAddress(injectiveAddresses[0]);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      alert(
        error instanceof Error ? error.message : "Failed to connect wallet"
      );
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-5)}`;
  };

  const [activeTab, setActiveTab] = useState<"INJ" | "wINJ">("INJ");

  const handleDeposit = () => {
    console.log("Deposit clicked");
  };

  const handleWithdraw = () => {
    console.log("Withdraw clicked");
  };

  const handleTransfer = () => {
    console.log("Transfer:", { address: state.address, amount: state.amount });
  };

  return (
    <div className="vault-container">
      <div className="vault-header">
        <h1 className="vault-title">Vault</h1>
        {!isConnected ? (
          <div className="wallet-info" onClick={handleConnect}>
            Connect
          </div>
        ) : (
          <div className="wallet-info" onClick={handleDisconnect}>
            {truncateAddress(walletAddress)}
          </div>
        )}
      </div>

      <div className="vault-content">
        <div className="left-panel">
          <div className="balance-section">
            <h2 className="total-title">Total in Vault</h2>
            <div className="total-amount">
              {state.totalBalance.toFixed(2)}wINJ
            </div>

            <div className="button-group">
              <button className="action-button" onClick={handleDeposit}>
                Deposit
              </button>
              <button className="action-button" onClick={handleWithdraw}>
                Withdraw
              </button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="tab-header">
            <button
              className={`tab ${activeTab === "INJ" ? "active" : ""}`}
              onClick={() => setActiveTab("INJ")}
            >
              INJ
            </button>
            <button
              className={`tab ${activeTab === "wINJ" ? "active" : ""}`}
              onClick={() => setActiveTab("wINJ")}
            >
              wINJ
            </button>
          </div>
          <div className="transfer-form">
            <label className="form-label">address</label>
            <input
              type="text"
              className="form-input"
              value={state.address}
              onChange={(e) => setState({ ...state, address: e.target.value })}
            />

            <label className="form-label">amount</label>
            <div className="amount-input-container">
              <input
                type="text"
                className="form-input amount-input"
                value={state.amount}
                onChange={(e) => setState({ ...state, amount: e.target.value })}
              />
              <span className="currency-label">{activeTab}</span>
            </div>

            <button className="transfer-button" onClick={handleTransfer}>
              Transfer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
