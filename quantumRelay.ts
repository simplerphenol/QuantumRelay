// app/quantumRelay.ts
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { Wallet } from "@coinbase/onchainkit/wallet";
import { Connected } from "@coinbase/onchainkit/connected";
import { createPublicClient, http, formatEther, type Address } from "viem";
import { base, baseSepolia } from "viem/chains";
import React, { useMemo, useState } from "react";

type NetworkKey = "base" | "baseSepolia";

const RPC = {
  base: "https://mainnet.base.org",
  baseSepolia: "https://sepolia.base.org",
};

const EXPLORER = {
  base: "https://basescan.org",
  baseSepolia: "https://sepolia.basescan.org",
};

const CHAIN_ID = {
  base: 8453,
  baseSepolia: 84532,
};

function isAddress(v: string): v is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(v.trim());
}

export default function QuantumRelay() {
  const [network, setNetwork] = useState<NetworkKey>("baseSepolia");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Idle");
  const [block, setBlock] = useState<bigint | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [rpcChainId, setRpcChainId] = useState<number | null>(null);

  const chain = network === "base" ? base : baseSepolia;

  const client = useMemo(
    () =>
      createPublicClient({
        chain,
        transport: http(RPC[network]),
      }),
    [chain, network]
  );

  async function runRead() {
    setStatus("Querying Base network…");

    const [cid, bn] = await Promise.all([
      client.getChainId(),
      client.getBlockNumber(),
    ]);

    setRpcChainId(cid);
    setBlock(bn);

    if (isAddress(address)) {
      const bal = await client.getBalance({ address });
      setBalance(bal);
    } else {
      setBalance(null);
    }

    setStatus("Completed");
  }

  return (
    <OnchainKitProvider chain={chain}>
      <div style={{ maxWidth: 840, margin: "40px auto", fontFamily: "system-ui" }}>
        <h1>QuantumRelay — Built for Base</h1>

        <label>
          Network:&nbsp;
          <select value={network} onChange={(e) => setNetwork(e.target.value as NetworkKey)}>
            <option value="baseSepolia">Base Sepolia (84532)</option>
            <option value="base">Base Mainnet (8453)</option>
          </select>
        </label>

        <Wallet />
        <Connected>
          <input
            placeholder="Address for balance read"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 10 }}
          />
        </Connected>

        <button onClick={runRead} style={{ marginTop: 14 }}>
          Run Read
        </button>

        <div style={{ marginTop: 18, lineHeight: 1.6 }}>
          <div>Status: {status}</div>
          <div>Expected chainId: {CHAIN_ID[network]}</div>
          <div>RPC chainId: {rpcChainId ?? "—"}</div>
          <div>Latest block: {block?.toString() ?? "—"}</div>
          <div>Native balance: {balance ? `${formatEther(balance)} ETH` : "—"}</div>
          <div>Explorer: {EXPLORER[network]}</div>
        </div>
      </div>
    </OnchainKitProvider>
  );
}
