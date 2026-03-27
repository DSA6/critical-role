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

async function notifyManagerNewApp(app, allApps) {
    var poolSummary = "";
    if (allApps && allApps.length > 0) {
        poolSummary = buildPoolSummary(allApps);
    }

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
    if (app.status === "waiting_list") {
        // Nice acceptance message — send to manager channel (AA + manager see it)
        var msg = "🎉 *Congratulations " + app.aa_name + "!*\n\n" +
            "Your application for *" + app.critical_role + "* has been reviewed and *accepted* by the L&D team.\n\n" +
            "You are now on the *Waiting List* for this role. " +
            "Our team will reach out to you when a training slot becomes available.\n\n" +
            "Keep up the great work! 💪\n\n" +
            "_L&D Notes: " + (app.ld_notes || "No additional notes") + "_";
        sendSlack(CONFIG.SLACK_WEBHOOK_MANAGER, msg);

        // Also notify L&D channel
        var ldMsg = "✅ *" + app.aa_name + "* added to Waiting List for *" + app.critical_role + "*";
        sendSlack(CONFIG.SLACK_WEBHOOK_LD, ldMsg);

    } else if (app.status === "ld_rejected") {
        var msg = "📋 *Application Update for " + app.aa_name + "*\n\n" +
            "Unfortunately, your application for *" + app.critical_role + "* was not approved at this time.\n\n" +
            "Don't be discouraged — you're welcome to reapply in the future. " +
            "Speak with your manager or L&D team for feedback on how to strengthen your next application.\n\n" +
            "_L&D Notes: " + (app.ld_notes || "No additional notes") + "_";
        sendSlack(CONFIG.SLACK_WEBHOOK_MANAGER, msg);

    } else if (app.status === "manager_rejected") {
        var msg = "📋 *Application Update for " + app.aa_name + "*\n\n" +
            "Your application for *" + app.critical_role + "* was not approved by your manager at this time.\n\n" +
            "Please speak with your manager for feedback and feel free to reapply when ready.\n\n" +
            "_Manager Notes: " + ((app.manager_review && app.manager_review.notes) || "No additional notes") + "_";
        sendSlack(CONFIG.SLACK_WEBHOOK_MANAGER, msg);
    }
}
