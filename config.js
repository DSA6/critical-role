// ─── Configuration ───
var CONFIG = {
    GITHUB_ORG: "DSA6",
    GITHUB_REPO: "critical-role",
    GITHUB_BRANCH: "main",
    DATA_FILE: "data/applications.json",
    ROLES_FILE: "data/roles.json",
    GITHUB_TOKEN: "",

    SLACK_WEBHOOK_MANAGER: "https://hooks.slack.com/triggers/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",
    SLACK_WEBHOOK_LD: "https://hooks.slack.com/triggers/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",

    FTSE_DASHBOARD: "https://eu-west-1.quicksight.aws.amazon.com/sn/account/amazonbi/dashboards/a230bae5-418a-4c42-bf8b-d21bd0693a7e/sheets/a230bae5-418a-4c42-bf8b-d21bd0693a7e_49155e88-a0e4-4db5-ab0c-e4cacea18da4"
};
CONFIG.BASE_URL = "https://" + CONFIG.GITHUB_ORG + ".github.io/" + CONFIG.GITHUB_REPO;
CONFIG.API_BASE = "https://api.github.com/repos/" + CONFIG.GITHUB_ORG + "/" + CONFIG.GITHUB_REPO;
