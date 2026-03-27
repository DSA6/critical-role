// ─── Configuration ───
const CONFIG = {
    GITHUB_ORG: "DSA6",
    GITHUB_REPO: "critical-role",
    GITHUB_BRANCH: "main",
    DATA_FILE: "data/applications.json",
    ROLES_FILE: "data/roles.json",

    // Token loaded from localStorage (set once via admin page)
    get GITHUB_TOKEN() {
        return localStorage.getItem("cr_github_token") || "";
    },

    // Slack webhooks (for trial: all go to firdaubonly)
    SLACK_WEBHOOK_MANAGER: "https://hooks.slack.com/triggers/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",
    SLACK_WEBHOOK_LD: "https://hooks.slack.com/triggers/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",

    get BASE_URL() {
        return "https://" + this.GITHUB_ORG + ".github.io/" + this.GITHUB_REPO;
    },
    get API_BASE() {
        return "https://api.github.com/repos/" + this.GITHUB_ORG + "/" + this.GITHUB_REPO;
    }
};

// Auto-prompt for token if not set
function ensureToken() {
    if (!CONFIG.GITHUB_TOKEN) {
        var token = prompt("Enter GitHub token (ask L&D admin for this):");
        if (token) {
            localStorage.setItem("cr_github_token", token.trim());
        }
    }
}
