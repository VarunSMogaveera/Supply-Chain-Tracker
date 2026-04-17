# Blockchain Supply Chain Tracker

A React + Solidity based project that tracks products across the supply chain and verifies authenticity using blockchain records and QR codes.

## Problem Statement

Traditional supply chains often face:

- Lack of transparency
- Counterfeit products
- Poor traceability
- Trust issues between stakeholders

This project solves that by storing product lifecycle events on blockchain and verifying products through QR-based lookup.

## Core Features

- Create products on blockchain
- Transfer ownership between stakeholders
- Add supply-chain checkpoints
- Track a product using its product ID
- Generate QR codes for products
- Verify a QR through camera scan or uploaded image
- Dashboard showing tracked products and verification stats

## Technology Stack

- Frontend: React + Vite + Tailwind CSS
- Blockchain access: ethers.js
- Wallet: MetaMask
- QR generation: qrcode.react
- QR scanning: html5-qrcode

## Project Flow

1. Create a product with Product ID and Product Name.
2. Store it on the blockchain through MetaMask.
3. Generate a QR code containing the product identifier.
4. Add checkpoints as the product moves through the supply chain.
5. Transfer ownership to the next stakeholder.
6. Track the product or verify it through the QR scanner.

## Important Improvements Added

- Read-only blockchain verification without forcing wallet approval
- Standardized QR payload format
- Camera scan and image upload scan support
- Better dashboard metrics and recent activity
- Cleaner UI for demo and PPT presentation
- Auto transfer checkpoint attempt after ownership transfer
- Stronger status detection for Created, In Transit, and Delivered

## Functional Requirements Covered

- Product creation
- Ownership transfer
- Checkpoint updates
- Product tracking by ID
- QR code generation
- QR-based verification
- Dashboard analytics

## Non-Functional Requirements Covered

- Security through blockchain immutability
- Transparency through visible product history
- Usability through simple module-based UI
- Scalability for multiple products in local demo usage

## How to Run

```bash
npm install
npm run dev
```

## MetaMask Requirement

Write operations need MetaMask:

- Create Product
- Add Checkpoint
- Transfer Ownership

Read operations can work without requesting wallet connection, but the browser still needs access to the injected provider if your current setup depends on MetaMask's network.

## QR Scanner: Correct Usage

The scanner now supports two modes:

### 1. Camera Scan

Use this when:

- One phone scans a QR shown on another phone
- A laptop webcam scans a QR shown on a phone
- A camera scans a printed QR label

### 2. Upload QR Image

Use this when:

- You already have a screenshot of the QR
- The QR is inside a PPT or report image
- You are testing on the same phone that displays the QR

### Important Note

The same mobile phone cannot use its own rear camera to scan a QR code displayed on its own screen. For same-device testing, use the upload option with a screenshot of the QR.

## Suggested Demo Script

1. Create a product.
2. Show the generated QR.
3. Add a checkpoint like `Reached warehouse`.
4. Transfer ownership to another wallet.
5. Track the product using Product ID.
6. Open QR Scanner and verify the product using either:
   - another device camera, or
   - uploaded screenshot of the QR

## Suggested Future Improvements

- Role-based access control for manufacturer, distributor, and retailer
- Event-based analytics directly from smart contract logs
- Backend or subgraph for richer dashboard metrics
- QR verification share link for public users without MetaMask
- Deployment guide for Sepolia or local Hardhat network

## Viva One-Liner

We built a blockchain-based supply chain tracker that securely records product creation, ownership transfer, and journey checkpoints, and verifies authenticity using QR-based blockchain lookup.
