const trackingOrder = [
  "manufacturer",
  "packed",
  "warehouse",
  "transit",
  "delivery",
  "delivered",
  "customer",
];

function getStepRank(step) {
  const normalized = step.toLowerCase();
  const index = trackingOrder.findIndex((keyword) => normalized.includes(keyword));
  return index === -1 ? null : index;
}

function getHistorySignals(history) {
  const steps = history || [];

  return steps.reduce(
    (signals, step) => {
      const normalized = step.toLowerCase();

      if (normalized.includes("transfer") || normalized.includes("owner")) {
        signals.explicitTransfer = true;
      }

      if (normalized.includes("distributor")) {
        signals.distributor = true;
      }

      if (normalized.includes("retailer")) {
        signals.retailer = true;
      }

      if (
        normalized.includes("customer") ||
        normalized.includes("delivered to customer") ||
        normalized.includes("customer received")
      ) {
        signals.customer = true;
      }

      if (normalized.includes("warehouse") || normalized.includes("transit")) {
        signals.logisticsOnly = true;
      }

      return signals;
    },
    {
      explicitTransfer: false,
      distributor: false,
      retailer: false,
      customer: false,
      logisticsOnly: false,
    }
  );
}

export function analyzeProductAlerts(product) {
  const alerts = [];

  if (!product) {
    return {
      verificationAlerts: ["No product data available."],
      trackingAlerts: [],
      riskLevel: "High",
    };
  }

  if (product.status === "Unverified" || product.status === "Stored Locally") {
    alerts.push({
      type: "verification",
      severity: "high",
      message: "Product exists locally but could not be verified on-chain.",
    });
  }

  if (!product.id || !product.name) {
    alerts.push({
      type: "verification",
      severity: "high",
      message: "Product identity is incomplete.",
    });
  }

  if (!product.history?.length) {
    alerts.push({
      type: "tracking",
      severity: "medium",
      message: "No checkpoints found. Product movement cannot be confirmed.",
    });
  }

  const ranks = (product.history || [])
    .map((step) => ({ step, rank: getStepRank(step) }))
    .filter((entry) => entry.rank !== null);

  for (let index = 1; index < ranks.length; index += 1) {
    if (ranks[index].rank < ranks[index - 1].rank) {
      alerts.push({
        type: "tracking",
        severity: "high",
        message: `Suspicious route order: "${ranks[index].step}" appears after a later-stage checkpoint.`,
      });
      break;
    }
  }

  const deliveredCheckpoint = (product.history || []).some((step) =>
    step.toLowerCase().includes("deliver")
  );
  const historySignals = getHistorySignals(product.history);
  const ownerIsManufacturer =
    product.owner &&
    product.manufacturer &&
    product.owner.toLowerCase() === product.manufacturer.toLowerCase();

  if (product.status === "Delivered" && !deliveredCheckpoint) {
    alerts.push({
      type: "tracking",
      severity: "medium",
      message: "Status shows Delivered, but no delivery checkpoint text was found.",
    });
  }

  if (
    ownerIsManufacturer &&
    (historySignals.explicitTransfer ||
      historySignals.distributor ||
      historySignals.retailer)
  ) {
    alerts.push({
      type: "tracking",
      severity: "high",
      message:
        "History suggests handoff to another stakeholder, but current owner is still the manufacturer.",
    });
  }

  if (ownerIsManufacturer && historySignals.customer && deliveredCheckpoint) {
    alerts.push({
      type: "tracking",
      severity: "high",
      message:
        "Product is marked delivered to the customer, but blockchain ownership still remains with the manufacturer.",
    });
  } else if (
    ownerIsManufacturer &&
    deliveredCheckpoint &&
    !historySignals.logisticsOnly
  ) {
    alerts.push({
      type: "tracking",
      severity: "medium",
      message:
        "Product is marked delivered while ownership never changed from the manufacturer. If delivery ends with the customer, add a transfer or stakeholder checkpoint.",
    });
  }

  const verificationAlerts = alerts
    .filter((alert) => alert.type === "verification")
    .map((alert) => alert.message);
  const trackingAlerts = alerts
    .filter((alert) => alert.type === "tracking")
    .map((alert) => alert.message);

  let riskLevel = "Low";
  if (alerts.some((alert) => alert.severity === "high")) {
    riskLevel = "High";
  } else if (alerts.length > 0) {
    riskLevel = "Medium";
  }

  return {
    verificationAlerts,
    trackingAlerts,
    riskLevel,
  };
}
