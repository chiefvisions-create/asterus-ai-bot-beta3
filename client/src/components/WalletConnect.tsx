import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Wallet, Link2, Unlink, Copy, CheckCircle, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from "sonner";
import { motion } from "framer-motion";

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  connected: boolean;
}

interface WalletConnectProps {
  onWalletConnect?: (address: string) => void;
  onWalletDisconnect?: () => void;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export default function WalletConnect({ onWalletConnect, onWalletDisconnect }: WalletConnectProps) {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      try {
        setWallet(JSON.parse(savedWallet));
      } catch (e) {}
    }

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (wallet && accounts[0] !== wallet.address) {
      connectMetaMask();
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask not detected. Please install MetaMask extension.");
      return;
    }

    setConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      const balance = (parseInt(balanceHex, 16) / 1e18).toFixed(4);

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const network = getNetworkName(chainId);

      const walletInfo: WalletInfo = {
        address,
        balance: `${balance} ETH`,
        network,
        connected: true
      };

      setWallet(walletInfo);
      localStorage.setItem('connectedWallet', JSON.stringify(walletInfo));
      onWalletConnect?.(address);
      toast.success("Wallet connected successfully!");
      setShowDialog(false);
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error("Connection rejected by user");
      } else {
        toast.error("Failed to connect wallet");
      }
    }
    setConnecting(false);
  };

  const connectManualAddress = () => {
    if (!manualAddress || !manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Please enter a valid Ethereum address");
      return;
    }

    const walletInfo: WalletInfo = {
      address: manualAddress,
      balance: 'View Only',
      network: 'Unknown',
      connected: true
    };

    setWallet(walletInfo);
    localStorage.setItem('connectedWallet', JSON.stringify(walletInfo));
    onWalletConnect?.(manualAddress);
    toast.success("Wallet address saved for monitoring");
    setShowDialog(false);
    setManualAddress('');
  };

  const disconnectWallet = () => {
    setWallet(null);
    localStorage.removeItem('connectedWallet');
    onWalletDisconnect?.();
    toast.success("Wallet disconnected");
  };

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Address copied to clipboard");
    }
  };

  const getNetworkName = (chainId: string): string => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon',
      '0xa86a': 'Avalanche',
      '0x38': 'BNB Chain',
      '0xa4b1': 'Arbitrum One',
      '0xa': 'Optimism'
    };
    return networks[chainId] || `Chain ${parseInt(chainId, 16)}`;
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const refreshBalance = async () => {
    if (!wallet || !window.ethereum) return;
    
    try {
      const balanceHex = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [wallet.address, 'latest']
      });
      const balance = (parseInt(balanceHex, 16) / 1e18).toFixed(4);
      
      const updatedWallet = { ...wallet, balance: `${balance} ETH` };
      setWallet(updatedWallet);
      localStorage.setItem('connectedWallet', JSON.stringify(updatedWallet));
      toast.success("Balance updated");
    } catch (e) {
      toast.error("Failed to refresh balance");
    }
  };

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-400" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wallet ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-sm font-medium">Connected</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {wallet.network}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <code className="text-white font-mono text-sm bg-slate-900/50 px-2 py-1 rounded flex-1">
                    {truncateAddress(wallet.address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyAddress}
                    data-testid="copy-address-btn"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(`https://etherscan.io/address/${wallet.address}`, '_blank')}
                    data-testid="view-etherscan-btn"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Balance</p>
                    <p className="text-lg font-bold text-white">{wallet.balance}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshBalance}
                    className="text-slate-400 hover:text-white"
                    data-testid="refresh-balance-btn"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={disconnectWallet}
                data-testid="disconnect-wallet-btn"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect Wallet
              </Button>
            </motion.div>
          ) : (
            <div className="text-center py-6">
              <Wallet className="h-12 w-12 mx-auto mb-3 text-slate-500" />
              <p className="text-slate-400 mb-4">Connect your wallet to monitor balances and enable direct trading</p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowDialog(true)}
                data-testid="connect-wallet-btn"
              >
                <Link2 className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Connect Wallet</DialogTitle>
            <DialogDescription className="text-slate-400">
              Choose how you want to connect your crypto wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Button
              className="w-full h-14 bg-orange-500 hover:bg-orange-600 justify-start px-4"
              onClick={connectMetaMask}
              disabled={connecting}
              data-testid="connect-metamask-btn"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask" 
                className="h-8 w-8 mr-3"
              />
              <div className="text-left">
                <p className="font-semibold">MetaMask</p>
                <p className="text-xs opacity-80">Connect using browser extension</p>
              </div>
              {connecting && <RefreshCw className="h-4 w-4 ml-auto animate-spin" />}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or enter address manually</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletAddress" className="text-slate-300">Wallet Address</Label>
              <Input
                id="walletAddress"
                placeholder="0x..."
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                data-testid="manual-address-input"
              />
              <p className="text-xs text-slate-500">
                Enter an Ethereum address to monitor (view-only mode)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={connectManualAddress} disabled={!manualAddress} data-testid="save-address-btn">
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
