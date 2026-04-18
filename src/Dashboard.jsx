import { useEffect, useState } from "react";
import { getReadContract, normalizeProduct, shortenAddress } from "./blockchain";
import { analyzeProductAlerts } from "./alerts";
import {
  getRecentActivity,
  getScanLogs,
  getStoredProductIds,
  getStoredProductMeta,
  rememberProduct,
} from "./productStore";

const riskTone = {
  Low: "bg-emerald-400/10 text-emerald-100",
  Medium: "bg-amber-400/10 text-amber-100",
  High: "bg-rose-400/10 text-rose-100",
};

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    verificationAlerts: 0,
    trackingAlerts: 0,
    delivered: 0,
  });
  const [products, setProducts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [scanLogs, setScanLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const ids = getStoredProductIds();
      const meta = getStoredProductMeta();
      const currentScanLogs = getScanLogs();

      setActivity(getRecentActivity());
      setScanLogs(currentScanLogs);

      if (ids.length === 0) {
        setStats({
          total: 0,
          verified: 0,
          verificationAlerts: currentScanLogs.filter(
            (log) => log.status === "failed" || log.status === "invalid"
          ).length,
          trackingAlerts: 0,
          delivered: 0,
        });
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const contract = await getReadContract();
        const loadedProducts = [];
        let verified = 0;
        let delivered = 0;
        let verificationAlerts = 0;
        let trackingAlerts = 0;

        for (const id of ids) {
          let product;

          try {
            const result = await contract.getProduct(id);
            product = normalizeProduct(result);
            rememberProduct(product);
            verified += 1;
            if (product.status === "Delivered") delivered += 1;
          } catch {
            product = {
              id,
              name: meta[id]?.name || "Unavailable",
              manufacturer: "",
              owner: meta[id]?.owner || "",
              history: [],
              status: "Unverified",
            };
          }

          const alerts = analyzeProductAlerts(product);
          verificationAlerts += alerts.verificationAlerts.length;
          trackingAlerts += alerts.trackingAlerts.length;

          loadedProducts.push({
            ...product,
            alerts,
          });
        }

        setProducts(loadedProducts);
        setStats({
          total: ids.length,
          verified,
          verificationAlerts:
            verificationAlerts +
            currentScanLogs.filter(
              (log) => log.status === "failed" || log.status === "invalid"
            ).length,
          trackingAlerts,
          delivered,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
        const fallbackProducts = ids.map((id) => {
          const product = {
            id,
            name: meta[id]?.name || "Unknown product",
            manufacturer: "",
            owner: meta[id]?.owner || "",
            history: [],
            status: "Stored Locally",
          };

          return {
            ...product,
            alerts: analyzeProductAlerts(product),
          };
        });

        setProducts(fallbackProducts);
        setStats({
          total: ids.length,
          verified: 0,
          verificationAlerts:
            fallbackProducts.reduce(
              (count, product) =>
                count + product.alerts.verificationAlerts.length,
              0
            ) +
            currentScanLogs.filter(
              (log) => log.status === "failed" || log.status === "invalid"
            ).length,
          trackingAlerts: fallbackProducts.reduce(
            (count, product) => count + product.alerts.trackingAlerts.length,
            0
          ),
          delivered: 0,
        });
        setError(
          "Blockchain read is unavailable right now. Local dashboard data is still shown."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const cards = [
    {
      label: "Tracked Products",
      value: stats.total,
      tone: "from-cyan-500/20 to-cyan-200/5",
    },
    {
      label: "Verified on Chain",
      value: stats.verified,
      tone: "from-emerald-500/20 to-emerald-200/5",
    },
    {
      label: "Verification Alerts",
      value: stats.verificationAlerts,
      tone: "from-rose-500/20 to-rose-200/5",
    },
    {
      label: "Tracking Alerts",
      value: stats.trackingAlerts,
      tone: "from-amber-500/20 to-amber-200/5",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-3xl border border-white/10 bg-gradient-to-br ${card.tone} p-5`}
          >
            <p className="text-sm text-slate-300">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold text-white">
              {loading ? "--" : card.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Product Registry Snapshot
                </h3>
                <p className="text-sm text-slate-400">
                  Each product now includes risk detection based on blockchain
                  verification and checkpoint sequence.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {!loading && products.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                  No products created yet. Start from the Create page to register
                  your first product.
                </div>
              )}

              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-medium text-white">
                          {product.name}
                        </h4>
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                          {product.status}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                            riskTone[product.alerts.riskLevel]
                          }`}
                        >
                          {product.alerts.riskLevel} Risk
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        Product ID: {product.id}
                      </p>
                    </div>

                    {product.owner && (
                      <p className="text-sm text-slate-300">
                        Owner: {shortenAddress(product.owner)}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-400 sm:grid-cols-3">
                    <p>
                      Manufacturer:{" "}
                      <span className="text-slate-200">
                        {product.manufacturer
                          ? shortenAddress(product.manufacturer)
                          : "Not verified"}
                      </span>
                    </p>
                    <p>
                      History Steps:{" "}
                      <span className="text-slate-200">
                        {product.history.length}
                      </span>
                    </p>
                    <p>
                      Delivered:{" "}
                      <span className="text-slate-200">
                        {product.status === "Delivered" ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>

                  {(product.alerts.verificationAlerts.length > 0 ||
                    product.alerts.trackingAlerts.length > 0) && (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {product.alerts.verificationAlerts.length > 0 && (
                        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3">
                          <p className="text-sm font-medium text-rose-100">
                            Verification Alerts
                          </p>
                          <div className="mt-2 space-y-2 text-sm text-rose-50">
                            {product.alerts.verificationAlerts.map((alert) => (
                              <p key={alert}>{alert}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {product.alerts.trackingAlerts.length > 0 && (
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3">
                          <p className="text-sm font-medium text-amber-100">
                            Tracking Alerts
                          </p>
                          <div className="mt-2 space-y-2 text-sm text-amber-50">
                            {product.alerts.trackingAlerts.map((alert) => (
                              <p key={alert}>{alert}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <h3 className="text-xl font-semibold text-white">Recent QR Verification Log</h3>
            <div className="mt-4 space-y-3">
              {scanLogs.length === 0 && (
                <p className="text-sm text-slate-400">
                  Scan attempts will appear here. Failed scans help demonstrate
                  verification alerts in your project.
                </p>
              )}

              {scanLogs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-white">
                      {log.productId || "Unknown QR"}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                        log.status === "verified"
                          ? "bg-emerald-400/10 text-emerald-100"
                          : "bg-rose-400/10 text-rose-100"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    Source: {log.source}
                  </p>
                  {log.reason && (
                    <p className="mt-1 text-sm text-slate-300">{log.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <h3 className="text-xl font-semibold text-white">How Alerts Work</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Verification alerts appear when a product cannot be fetched from the blockchain.</li>
              <li>Tracking alerts appear when checkpoints are missing or move in a suspicious order.</li>
              <li>High risk means your demo has a strong counterfeit or mistracking example to explain.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <h3 className="text-xl font-semibold text-white">Demo Ideas</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>Create a valid product and scan its QR to show successful verification.</li>
              <li>Try scanning a QR with a fake ID to generate a verification alert.</li>
              <li>Add a strange checkpoint after delivery wording to explain mistracking logic.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
            <div className="mt-4 space-y-3">
              {activity.length === 0 && (
                <p className="text-sm text-slate-400">
                  Activity will appear here after create, transfer, checkpoint,
                  track, and QR verification actions.
                </p>
              )}

              {activity.map((item, index) => (
                <div
                  key={`${item.timestamp}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
