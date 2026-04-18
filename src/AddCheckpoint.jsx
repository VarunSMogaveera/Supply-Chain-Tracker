import { useState } from "react";
import { getWriteContract } from "./blockchain";
import { recordActivity } from "./productStore";

const quickLocations = [
  "Packed at manufacturer",
  "Reached warehouse",
  "In transit",
  "Out for delivery",
  "Delivered to customer",
];

function AddCheckpoint() {
  const [id, setId] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAdd = async () => {
    const cleanId = id.trim();
    const cleanLocation = location.trim();

    if (!cleanId || !cleanLocation) {
      setMessage("Enter both Product ID and checkpoint details.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const contract = await getWriteContract();
      const tx = await contract.addCheckpoint(cleanId, cleanLocation);
      await tx.wait();

      recordActivity({
        title: "Checkpoint updated",
        description: `${cleanId} -> ${cleanLocation}`,
      });
      setMessage("Checkpoint added successfully.");
      setLocation("");
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.message || "Failed to add checkpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-slate-950/90 to-slate-900/80 p-6 shadow-xl shadow-black/20">
        <h3 className="text-2xl font-semibold text-white">Add Checkpoint</h3>
        <p className="mt-2 text-sm text-slate-400">
          Update where the product currently is so the tracker shows the latest
          journey to your users and examiners.
        </p>

        <div className="mt-6 space-y-4">
          <input
            value={id}
            onChange={(event) => setId(event.target.value)}
            placeholder="Product ID"
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900"
          />

          <textarea
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Example: In transit from Delhi warehouse to Bengaluru retailer"
            rows={4}
            className="w-full rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900"
          />

          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-200 to-orange-200 px-4 py-3 font-medium text-slate-950 shadow-lg shadow-amber-500/10 transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
          >
            {loading ? "Saving checkpoint..." : "Add Checkpoint"}
          </button>
        </div>

        {message && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-200">
            {message}
          </div>
        )}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-slate-950/90 to-slate-900/80 p-6 shadow-xl shadow-black/20">
        <h3 className="text-2xl font-semibold text-white">Suggested Stages</h3>

        <div className="mt-6 flex flex-wrap gap-3">
          {quickLocations.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLocation(item)}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-white/[0.07]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AddCheckpoint;
