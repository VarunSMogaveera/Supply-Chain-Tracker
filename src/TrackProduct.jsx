import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  getReadContract,
  normalizeProduct,
  shortenAddress,
} from "./blockchain";
import { recordActivity, rememberProduct } from "./productStore";

const statusTone = {
  Created: "bg-cyan-400/15 text-cyan-200",
  "In Transit": "bg-amber-400/15 text-amber-100",
  Delivered: "bg-emerald-400/15 text-emerald-100",
};

function TrackProduct() {
  const [id, setId] = useState("");
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async () => {
    const cleanId = id.trim();
    if (!cleanId) {
      setError("Enter a product ID to fetch blockchain details.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const contract = await getReadContract();
      const result = await contract.getProduct(cleanId);
      const normalized = normalizeProduct(result);

      setProduct(normalized);
      rememberProduct(normalized);
      recordActivity({
        title: "Product tracked",
        description: `${normalized.name} (${normalized.id}) was viewed in the tracker.`,
      });
    } catch (err) {
      console.error(err);
      setProduct(null);
      setError(err.reason || err.message || "Product not found on the blockchain.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <h3 className="text-2xl font-semibold text-white">Track a Product</h3>
        <p className="mt-2 text-sm text-slate-400">
          Enter the product ID to read the current owner, manufacturer, history,
          and live delivery status from the blockchain.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="Example: MED-BOX-001"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={handleTrack}
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {loading ? "Loading blockchain data..." : "Track Product"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        {!product ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-white/10 text-center text-sm text-slate-400">
            Search for a product to see its blockchain identity and journey.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                  Verified Product
                </p>
                <h3 className="mt-2 text-3xl font-semibold text-white">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-slate-400">Product ID: {product.id}</p>
              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${
                  statusTone[product.status] || "bg-white/10 text-white"
                }`}
              >
                {product.status}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Manufacturer</p>
                <p className="mt-2 break-all text-sm text-white">
                  {product.manufacturer}
                </p>
                <button
                  type="button"
                  onClick={() => copyText(product.manufacturer)}
                  className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/40"
                >
                  Copy address
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Current Owner</p>
                <p className="mt-2 break-all text-sm text-white">{product.owner}</p>
                <button
                  type="button"
                  onClick={() => copyText(product.owner)}
                  className="mt-3 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/40"
                >
                  Copy address
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Supply Chain History</h4>
                <span className="text-sm text-slate-400">
                  {product.history.length} checkpoints
                </span>
              </div>

              <div className="mt-4 space-y-4">
                {product.history.map((step, index) => (
                  <div key={`${step}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-emerald-300" />
                      {index !== product.history.length - 1 && (
                        <div className="mt-1 h-full min-h-8 w-px bg-white/10" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm text-slate-300">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Quick Summary</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>Manufacturer: {shortenAddress(product.manufacturer)}</li>
                  <li>Owner: {shortenAddress(product.owner)}</li>
                  <li>Status: {product.status}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Share Verification QR</p>
                <div className="mt-4 flex flex-col items-center gap-3">
                  <div className="rounded-3xl bg-white p-4">
                    <QRCodeCanvas
                      value={JSON.stringify({
                        type: "supply-chain-product",
                        version: 1,
                        id: product.id,
                        name: product.name,
                      })}
                      size={150}
                    />
                  </div>
                  <p className="text-center text-xs text-slate-400">
                    This QR contains the product ID. The scanner verifies live
                    blockchain details when scanned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackProduct;
