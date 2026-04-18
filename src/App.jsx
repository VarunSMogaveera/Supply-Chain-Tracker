import { useMemo, useState } from "react";
import Dashboard from "./Dashboard";
import CreateProduct from "./CreateProduct";
import TrackProduct from "./TrackProduct";
import AddCheckpoint from "./AddCheckpoint";
import QRScanner from "./QRScanner";
import TransferOwnership from "./TransferOwnership";

const pages = [
  { id: "dashboard", label: "Dashboard", hint: "Project overview" },
  { id: "create", label: "Create", hint: "Register new product" },
  { id: "track", label: "Track", hint: "View blockchain history" },
  { id: "checkpoint", label: "Checkpoint", hint: "Update journey" },
  { id: "transfer", label: "Transfer", hint: "Change ownership" },
  { id: "scan", label: "Scan QR", hint: "Verify authenticity" },
];

function App() {
  const [page, setPage] = useState("dashboard");

  const pageTitle = useMemo(
    () => pages.find((item) => item.id === page) || pages[0],
    [page]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">
                Blockchain Supply Chain Tracker
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Trusted product journeys from manufacturer to customer.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Create products, move them through checkpoints, transfer
                ownership, and verify authenticity with QR-based tracking.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPage(item.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    page === item.id
                      ? "border-cyan-400 bg-cyan-400/15 text-white shadow-lg shadow-cyan-500/10"
                      : "border-white/10 bg-slate-900/60 text-slate-300 hover:border-cyan-400/40 hover:bg-slate-900"
                  }`}
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.hint}</div>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="mt-6 flex-1">
          <section className="rounded-3xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
            <div className="mb-6 flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">
                  Active Module
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                  {pageTitle.label}
                </h2>
              </div>
            </div>

            {page === "dashboard" && <Dashboard />}
            {page === "create" && <CreateProduct />}
            {page === "track" && <TrackProduct />}
            {page === "checkpoint" && <AddCheckpoint />}
            {page === "transfer" && <TransferOwnership />}
            {page === "scan" && <QRScanner />}
          </section>
        </main>

        <footer className="mt-6 flex flex-col gap-2 px-2 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>Built with React, ethers.js, Solidity, MetaMask, and QR verification.</span>
          <span>Demo-ready UI for report, PPT, and viva.</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
