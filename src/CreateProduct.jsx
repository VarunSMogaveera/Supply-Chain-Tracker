import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { getWriteContract } from "./blockchain";
import { recordActivity, rememberProduct } from "./productStore";

function CreateProduct() {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [createdData, setCreatedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleCreate = async () => {
    const cleanId = id.trim();
    const cleanName = name.trim();

    if (!cleanId || !cleanName) {
      setMessage("Enter both Product ID and Product Name.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const contract = await getWriteContract();
      const tx = await contract.createProduct(cleanId, cleanName);
      await tx.wait();

      const payload = {
        type: "supply-chain-product",
        version: 1,
        id: cleanId,
        name: cleanName,
      };

      setCreatedData(payload);
      rememberProduct({ id: cleanId, name: cleanName, status: "Created" });
      recordActivity({
        title: "Product created",
        description: `${cleanName} (${cleanId}) was registered on the blockchain.`,
      });

      setId("");
      setName("");
      setMessage("Product created successfully. The QR code is ready for verification.");
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.message || "Failed to create product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <h3 className="text-2xl font-semibold text-white">Register Product</h3>
        <p className="mt-2 text-sm text-slate-400">
          The manufacturer stores a product ID and product name on-chain. That
          record becomes the base for QR verification and tracking.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Product ID</span>
            <input
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder="Example: MED-BOX-001"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Product Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Vaccine Shipment"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {loading ? "Creating on blockchain..." : "Create Product"}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
            {message}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <h3 className="text-2xl font-semibold text-white">Verification QR</h3>
        <p className="mt-2 text-sm text-slate-400">
          Use this QR on product packaging. The scanner reads the product ID and
          fetches the latest blockchain data live.
        </p>

        <div className="mt-6 flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6">
          {createdData ? (
            <>
              <div className="rounded-3xl bg-white p-5 shadow-xl shadow-black/20">
                <QRCodeCanvas value={JSON.stringify(createdData)} size={190} />
              </div>
              <p className="mt-4 text-center text-sm text-slate-300">
                Scan with another phone, laptop webcam, or upload a screenshot
                in the QR Scanner page.
              </p>
            </>
          ) : (
            <p className="max-w-xs text-center text-sm text-slate-400">
              The QR code appears here after a product is successfully created.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateProduct;
