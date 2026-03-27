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

function buildPoolSummary(apps) {
    // Count applications by role and status
    var summary = {};
    apps.forEach(function(a) {
        if (!summary[a.critical_role]) {
            summary[a.critical_role] = { pending_manager: 0, pending_ld: 0, waiting_list: 0, rejected: 0 };
        }
        if (a.status === "pending_manager") summary[a.critical_role].pending_manager++;
        else if (a.status === "pending_ld") summary[a.critical_role].pending_ld++;
        else if (a.status === "waiting_list") summary[a.critical_role].waiting_list++;
        else if (a.status === "manager_rejected" || a.status === "ld_rejected") summary[a.critical_role].rejected++;
    });

    var lines = [];
    for (var role in summary) {
        var s = summary[role];
        var parts = [];
        if (s.waiting_list > 0) parts.push(s.waiting_list + " accepted");
        if (s.pending_ld > 0) parts.push(s.pending_ld + " pending L&D");
        if (s.pending_manager > 0) parts.push(s.pending_manager + " pending mgr");
        if (parts.length > 0) {
            lines.push("  • " + role + ": " + parts.join(", "));
        }
    }
    return lines.length > 0 ? "\n📊 *Pool Status Summary:*\n" + lines.join("\n") : "";
}

async function notifyManagerNewApp(app) {
    // Load all apps for pool summary
    var poolSummary = "";
    try {
        var result = await loadApplications();
        poolSummary = buildPoolSummary(result.data);
    } catch(e) { /* ignore */ }

    var reviewUrl = CONFIG.BASE_URL + "/review.html?id=" + app.id;
    var msg = "📋 *New Critical Role Application*\n" +
        "*" + app.aa_name + "* (" + app.aa_login + ") applied for *" + app.critical_role + "*\n" +
        "Manager: " + app.manager_name + "\n" +
        "Department: " + app.department + "\n" +
        "Justification: " + app.justification + "\n\n" +
        "👉 Review: " + reviewUrl + "\n" +
        "📈 FTSE Dashboard: " + CONFIG.FTSE_DASHBOARD +
        poolSummary;
    sendSlack(CONFIG.SLACK_WEBHOOK_MANAGER, msg);
}

function notifyLDManagerApproved(app) {
    var adminUrl = CONFIG.BASE_URL + "/admin.html";
    var criteria = app.manager_review || {};
    var assess = ["adapt", "behavior", "safety", "performance"]
        .map(function(c) { return c + ": " + (criteria[c] === "pass" ? "✅" : criteria[c] === "needs_improvement" ? "⚠️" : "❌"); })
        .join(" | ");
    var msg = "✅ *Manager Approved: " + app.aa_name + "* for *" + app.critical_role + "*\n" +
        "Manager: " + app.manager_name + "\n" +
        "Assessment: " + assess + "\n" +
        "Notes: " + (criteria.notes || "N/A") + "\n\n" +
        "👉 L&D Review: " + adminUrl;
    sendSlack(CONFIG.SLACK_WEBHOOK_LD, msg);
}

function notifyFinalDecision(app) {
    var statusLabels = {
        waiting_list: "✅ WAITING LIST (Accepted)",
        ld_rejected: "❌ Rejected by L&D",
        manager_rejected: "❌ Rejected by Manager"
    };
    var label = statusLabels[app.status] || app.status;
    var msg = "📢 *Critical Role Update: " + label + "*\n" +
        "*" + app.aa_name + "* — " + app.critical_role + "\n" +
        "L&D Notes: " + (app.ld_notes || "N/A");
    sendSlack(CONFIG.SLACK_WEBHOOK_MANAGER, msg);
}
