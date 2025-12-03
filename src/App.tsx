import { useState } from "react";
import "./App.css";
import { BrowserProvider, formatEther, parseEther } from "ethers";

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

interface TransactionStatus {
  type: "success" | "error" | "pending" | null;
  message: string;
  txHash?: string;
}

const INJECTIVE_EVM_PARAMS = {
  chainId: "0x59f", // 1439 in hexadecimal
  chainName: "Injective EVM",
  rpcUrls: ["https://k8s.testnet.json-rpc.injective.network/"],
  nativeCurrency: {
    name: "Injective",
    symbol: "INJ",
    decimals: 18,
  },
  blockExplorerUrls: ["https://testnet.blockscout.injective.network/"],
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState(0);
   const [isTransferring, setIsTransferring] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    type: null,
    message: "",
  });
  const [state, setState] = useState<VaultState>({
    totalBalance: 0.03,
    injBalance: 0,
    winjBalance: 0.03,
    address: "",
    amount: "",
  });

  const connectMetaMask = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not installed!");
      return;
    }

    const provider = new BrowserProvider(window.ethereum);

    try {
      // First, request accounts
      const accounts = await provider.send("eth_requestAccounts", []);
      console.log("Connected accounts:", accounts);
      // Check current chain ID
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      // Only switch/add network if not already on Injective EVM
      if (currentChainId !== INJECTIVE_EVM_PARAMS.chainId) {
        try {
          // Try to switch to the network first
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: INJECTIVE_EVM_PARAMS.chainId }],
          });
        } catch (switchError: any) {
          // If network doesn't exist (error code 4902), add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [INJECTIVE_EVM_PARAMS],
            });
          } else {
            throw switchError;
          }
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);
      const actualbalance = Number(balance) / 10 ** 18;

      setBalance(actualbalance);
      console.log("Balance:", balance);
      console.log("Actual balance:", actualbalance);
      console.log("Connected address:", address);

      return { provider, signer, address };
    } catch (err) {
      console.error("MetaMask connection failed:", err);
    }
  };

  const handleConnect = async () => {
    try {
      const result = await connectMetaMask();
      if (result && result.address) {
        setIsConnected(true);
        setWalletAddress(result.address);
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

 const handleTransfer = async () => {
    if (!isConnected) {
      setTxStatus({ type: "error", message: "Please connect your wallet first" });
      return;
    }

    if (!state.address || !state.amount) {
      setTxStatus({ type: "error", message: "Please enter both address and amount" });
      return;
    }

    try {
      const amount = parseFloat(state.amount);
      if (isNaN(amount) || amount <= 0) {
        setTxStatus({ type: "error", message: "Please enter a valid amount" });
        return;
      }

      if (amount > balance) {
        setTxStatus({ type: "error", message: "Insufficient balance" });
        return;
      }

      setIsTransferring(true);
      setTxStatus({ type: "pending", message: "Transaction pending..." });

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      console.log("Sending transaction...");
      const tx = await signer.sendTransaction({
        to: state.address,
        value: parseEther(state.amount),
      });

      console.log("Transaction sent:", tx.hash);
      setTxStatus({
        type: "pending",
        message: "Waiting for confirmation...",
        txHash: tx.hash,
      });

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setTxStatus({
        type: "success",
        message: "Transaction confirmed!",
        txHash: tx.hash,
      });

      const newBalance = await provider.getBalance(await signer.getAddress());
      setBalance(Number(formatEther(newBalance)));

      setState({ ...state, address: "", amount: "" });
    } catch (error: any) {
      console.error("Transfer failed:", error);
      setTxStatus({
        type: "error",
        message: error.message || "Transaction failed",
      });
    } finally {
      setIsTransferring(false);
    }
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
            {balance} inj | {truncateAddress(walletAddress)}
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

             <button
              disabled={isTransferring || !state.address || !state.amount}
              className="transfer-button"
              onClick={handleTransfer}
            >
              {isTransferring ? "Transferring..." : "Transfer"}
            </button>

            {txStatus.type && (
              <div className={`tx-status tx-status-${txStatus.type}`}>
                <p>{txStatus.message}</p>
                {txStatus.txHash && txStatus.type === "success" && (
                  <a
                    href={`${INJECTIVE_EVM_PARAMS.blockExplorerUrls[0]}/tx/${txStatus.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tx-link"
                  >
                    View on Explorer →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
