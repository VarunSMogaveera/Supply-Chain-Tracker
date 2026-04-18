import { useState } from "react";
import { ethers } from "ethers";
import { getWriteContract, shortenAddress } from "./blockchain";
import { recordActivity } from "./productStore";

function TransferOwnership() {
  const [id, setId] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleTransfer = async () => {
    const cleanId = id.trim();
    const cleanAddress = address.trim();

    if (!cleanId || !cleanAddress) {
      setMessage("Enter both Product ID and the new owner wallet address.");
      return;
    }

    if (!ethers.isAddress(cleanAddress)) {
      setMessage("Enter a valid Ethereum wallet address.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const contract = await getWriteContract();
      const tx = await contract.transferOwnership(cleanId, cleanAddress);
      await tx.wait();

      try {
        const checkpointTx = await contract.addCheckpoint(
          cleanId,
          `Ownership transferred to ${shortenAddress(cleanAddress)}`
        );
        await checkpointTx.wait();
      } catch (checkpointError) {
        console.error("Auto checkpoint failed:", checkpointError);
      }

      recordActivity({
        title: "Ownership transferred",
        description: `${cleanId} moved to ${shortenAddress(cleanAddress)}.`,
      });
      setMessage("Ownership transferred successfully. A transfer checkpoint was also attempted.");
      setId("");
      setAddress("");
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.message || "Transfer failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <h3 className="text-2xl font-semibold text-white">Transfer Ownership</h3>
        <p className="mt-2 text-sm text-slate-400">
          Move a product from one stakeholder to another. This is typically used
          for manufacturer to distributor, distributor to retailer, or retailer
          to customer flow.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="Product ID"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />

          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="New owner wallet address (0x...)"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={handleTransfer}
            disabled={loading}
            className="w-full rounded-2xl bg-fuchsia-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-fuchsia-200 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {loading ? "Transferring ownership..." : "Transfer Ownership"}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
            {message}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <h3 className="text-2xl font-semibold text-white">Recommended Flow</h3>
        <ol className="mt-6 space-y-4 text-sm text-slate-300">
          <li>1. Manufacturer creates the product.</li>
          <li>2. Add a checkpoint before shipment.</li>
          <li>3. Transfer ownership to the next supply chain actor.</li>
          <li>4. Add another checkpoint when the product reaches the new stage.</li>
          <li>5. Use the tracker or QR scanner to verify the updated owner and history.</li>
        </ol>
      </div>
    </div>
  );
}

export default TransferOwnership;
