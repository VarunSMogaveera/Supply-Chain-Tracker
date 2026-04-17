import { ethers } from "ethers";

export const contractAddress =
  "0x8a4bB90e384b74014ade3A85510fF12E609A0eFa";

export const abi = [
  {
    inputs: [
      { internalType: "string", name: "_id", type: "string" },
      { internalType: "string", name: "_location", type: "string" },
    ],
    name: "addCheckpoint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint8", name: "role", type: "uint8" },
    ],
    name: "assignRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_id", type: "string" },
      { internalType: "string", name: "_name", type: "string" },
    ],
    name: "createProduct",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_id", type: "string" },
      { internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_id", type: "string" }],
    name: "getProduct",
    outputs: [
      { internalType: "string", type: "string" },
      { internalType: "string", type: "string" },
      { internalType: "address", type: "address" },
      { internalType: "address", type: "address" },
      { internalType: "string[]", type: "string[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", type: "address" }],
    name: "roles",
    outputs: [{ internalType: "uint8", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
];

export function ensureEthereum() {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask first.");
  }
}

export function getReadProvider() {
  ensureEthereum();
  return new ethers.BrowserProvider(window.ethereum);
}

export async function connectWallet() {
  const provider = getReadProvider();
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

export async function getReadContract() {
  const provider = getReadProvider();
  return new ethers.Contract(contractAddress, abi, provider);
}

export async function getWriteContract() {
  const signer = await connectWallet();
  return new ethers.Contract(contractAddress, abi, signer);
}

export async function getCurrentWalletAddress() {
  const signer = await connectWallet();
  return signer.getAddress();
}

export function normalizeProduct(result) {
  if (!result) return null;

  const history = Array.isArray(result[4]) ? result[4] : [];
  const lastStep = history[history.length - 1] || "";
  const lastStepText = lastStep.toLowerCase();

  let status = "Created";
  if (lastStepText.includes("deliver")) {
    status = "Delivered";
  } else if (
    lastStepText.includes("transit") ||
    lastStepText.includes("warehouse") ||
    history.length > 1
  ) {
    status = "In Transit";
  }

  return {
    id: result[0],
    name: result[1],
    manufacturer: result[2],
    owner: result[3],
    history,
    status,
  };
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
