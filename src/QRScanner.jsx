import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  getReadContract,
  normalizeProduct,
  shortenAddress,
} from "./blockchain";
import { recordActivity, recordScan, rememberProduct } from "./productStore";

const readerId = "qr-reader";

function parseQrPayload(decodedText) {
  const raw = decodedText.trim();

  try {
    const parsed = JSON.parse(raw);
    return parsed.id || parsed.productId || null;
  } catch {
    try {
      const url = new URL(raw);
      return url.searchParams.get("id") || url.searchParams.get("productId");
    } catch {
      return raw;
    }
  }
}

function QRScanner() {
  const scannerRef = useRef(null);
  const [mode, setMode] = useState("camera");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedId, setScannedId] = useState("");
  const [product, setProduct] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      await scannerRef.current.clear();
    } catch (err) {
      console.error("Scanner stop error:", err);
    } finally {
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const fetchProduct = async (productId, source) => {
    if (!productId) {
      setMessage("QR detected, but no product ID was found in it.");
      recordScan({
        productId: "",
        source,
        status: "invalid",
        reason: "QR payload had no product ID.",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setScannedId(productId);

      const contract = await getReadContract();
      const result = await contract.getProduct(productId);
      const normalized = normalizeProduct(result);

      setProduct(normalized);
      rememberProduct(normalized);
      recordActivity({
        title: "QR verified",
        description: `${normalized.name} (${normalized.id}) was verified using ${source}.`,
      });
      recordScan({
        productId: normalized.id,
        source,
        status: "verified",
      });
    } catch (err) {
      console.error(err);
      setProduct(null);
      setMessage(
        err.reason || err.message || "Product could not be verified from this QR."
      );
      recordScan({
        productId,
        source,
        status: "failed",
        reason:
          err.reason || err.message || "Product could not be verified from this QR.",
      });
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    setMessage("");
    setProduct(null);

    try {
      await stopScanner();

      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          const productId = parseQrPayload(decodedText);
          await stopScanner();
          await fetchProduct(productId, "camera scan");
        },
        () => {}
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Scanner start error:", err);
      setMessage(
        "Camera access failed. Allow camera permission or use the image upload option."
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (mode === "camera") {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [mode]);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage("");
      setProduct(null);

      await stopScanner();

      const scanner = new Html5Qrcode(readerId);
      const decodedText = await scanner.scanFile(file, true);
      await scanner.clear();

      const productId = parseQrPayload(decodedText);
      await fetchProduct(productId, "uploaded QR image");
    } catch (err) {
      console.error("File scan error:", err);
      setMessage("This image could not be read as a QR code. Try a sharper screenshot.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setMode("camera")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                mode === "camera"
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/10 bg-white/[0.03] text-slate-300"
              }`}
            >
              Scan with camera
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`rounded-full px-4 py-2 text-sm transition ${
                mode === "upload"
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/10 bg-white/[0.03] text-slate-300"
              }`}
            >
              Upload QR image
            </button>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-black/30 p-4">
            {mode === "camera" ? (
              <>
                <div
                  id={readerId}
                  className="mx-auto min-h-[300px] overflow-hidden rounded-2xl bg-slate-900"
                />
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={startScanner}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40"
                  >
                    {isScanning ? "Restart camera scan" : "Start camera scan"}
                  </button>
                </div>
              </>
            ) : (
              <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                <span className="text-lg font-medium text-white">
                  Upload a QR screenshot or photo
                </span>
                <span className="mt-2 max-w-xs text-sm text-slate-400">
                  Best option when the QR is shown on another phone screen, a PPT,
                  or a saved image.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-4 block text-sm text-slate-300"
                />
              </label>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="font-medium text-white">How to use it correctly</p>
            <ul className="mt-3 space-y-2">
              <li>Use camera scan when one device scans a QR shown on another device or printed label.</li>
              <li>Use upload scan when the QR is already saved as an image or screenshot.</li>
              <li>The same phone cannot reliably scan a QR that is displayed on its own screen using its own camera.</li>
              <li>Your QR should contain at least the product ID. This app now supports JSON, plain text IDs, and URLs with `id` in query params.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <h3 className="text-2xl font-semibold text-white">Verification Result</h3>
        <p className="mt-2 text-sm text-slate-400">
          The QR only identifies the product. The details shown here are fetched
          live from the blockchain for authenticity verification.
        </p>

        {loading && (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            Verifying product from blockchain...
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {message}
          </div>
        )}

        {!product && !loading && !message && (
          <div className="mt-6 flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-white/10 text-center text-sm text-slate-400">
            Scan or upload a QR code to verify product authenticity.
          </div>
        )}

        {product && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-sm uppercase tracking-[0.25em] text-emerald-200">
                Verified On Blockchain
              </p>
              <h4 className="mt-2 text-2xl font-semibold text-white">
                {product.name}
              </h4>
              <p className="mt-1 text-sm text-slate-200">
                Product ID: {scannedId || product.id}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Manufacturer</p>
                <p className="mt-2 break-all text-sm text-white">
                  {product.manufacturer}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-slate-400">Current Owner</p>
                <p className="mt-2 break-all text-sm text-white">{product.owner}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">Current Status</p>
                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                  {product.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Manufacturer: {shortenAddress(product.manufacturer)} | Owner:{" "}
                {shortenAddress(product.owner)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-400">History</p>
              <div className="mt-3 space-y-3">
                {product.history.map((step, index) => (
                  <div key={`${step}-${index}`} className="flex gap-3 text-sm text-slate-300">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRScanner;
