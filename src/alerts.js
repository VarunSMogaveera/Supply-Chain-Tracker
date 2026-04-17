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

  if (product.status === "Delivered" && !deliveredCheckpoint) {
    alerts.push({
      type: "tracking",
      severity: "medium",
      message: "Status shows Delivered, but no delivery checkpoint text was found.",
    });
  }

  if (
    deliveredCheckpoint &&
    product.owner &&
    product.manufacturer &&
    product.owner.toLowerCase() === product.manufacturer.toLowerCase()
  ) {
    alerts.push({
      type: "tracking",
      severity: "medium",
      message:
        "Product is marked delivered but current owner is still the manufacturer.",
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
