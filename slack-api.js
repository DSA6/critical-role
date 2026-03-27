// ─── Slack notification helpers ───

async function sendSlack(webhookUrl, message) {
    try {
        await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            mode: "no-cors",
            body: JSON.stringify({ summary: message, details: message })
        });
        console.log("[Slack] Sent:", message.substring(0, 80));
    } catch (e) {
        console.warn("[Slack] Failed:", e);
    }
}

function notifyManagerNewApp(app) {
    const reviewUrl = `${CONFIG.BASE_URL}/review.html?id=${app.id}`;
    const msg = `📋 *New Critical Role Application*\n` +
        `*${app.aa_name}* (${app.aa_login}) applied for *${app.critical_role}*\n` +
        `Department: ${app.department}\n` +
        `Justification: ${app.justification}\n\n` +
        `👉 Review: ${reviewUrl}`;
    sendSlack(CONFIG.SLACK_WEBHOOK_MANAGER, msg);
}

function notifyLDManagerApproved(app) {
    const adminUrl = `${CONFIG.BASE_URL}/admin.html`;
    const criteria = app.manager_review || {};
    const assess = ["adapt", "behavior", "safety", "performance"]
        .map(c => `${c}: ${criteria[c] === "pass" ? "✅" : criteria[c] === "needs_improvement" ? "⚠️" : "❌"}`)
        .join(" | ");
    const msg = `✅ *Manager Approved: ${app.aa_name}* for *${app.critical_role}*\n` +
        `Manager: ${app.manager_name}\n` +
        `Assessment: ${assess}\n` +
        `Notes: ${criteria.notes || "N/A"}\n\n` +
        `👉 L&D Review: ${adminUrl}`;
    sendSlack(CONFIG.SLACK_WEBHOOK_LD, msg);
}

function notifyFinalDecision(app) {
    const statusLabels = {
        waiting_list: "✅ WAITING LIST (Accepted)",
        ld_rejected: "❌ Rejected by L&D",
        manager_rejected: "❌ Rejected by Manager"
    };
    const label = statusLabels[app.status] || app.status;
    const msg = `📢 *Critical Role Update: ${label}*\n` +
        `*${app.aa_name}* — ${app.critical_role}\n` +
        `L&D Notes: ${app.ld_notes || "N/A"}`;
    sendSlack(CONFIG.SLACK_WEBHOOK_MANAGER, msg);
}
