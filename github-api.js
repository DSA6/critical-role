// ─── GitHub API helpers ───

async function githubGet(path) {
    const res = await fetch(`${CONFIG.API_BASE}/contents/${path}?ref=${CONFIG.GITHUB_BRANCH}`, {
        headers: { "Authorization": `token ${CONFIG.GITHUB_TOKEN}`, "Accept": "application/vnd.github.v3+json" }
    });
    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`GitHub GET ${path}: ${res.status}`);
    }
    return res.json();
}

async function githubPut(path, content, message, sha) {
    const body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: CONFIG.GITHUB_BRANCH
    };
    if (sha) body.sha = sha;
    const res = await fetch(`${CONFIG.API_BASE}/contents/${path}`, {
        method: "PUT",
        headers: { "Authorization": `token ${CONFIG.GITHUB_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`GitHub PUT ${path}: ${res.status} ${await res.text()}`);
    return res.json();
}

async function loadApplications() {
    const file = await githubGet(CONFIG.DATA_FILE);
    if (!file) return { data: [], sha: null };
    const content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
    return { data: JSON.parse(content), sha: file.sha };
}

async function saveApplications(apps, sha, message) {
    const content = JSON.stringify(apps, null, 2);
    const result = await githubPut(CONFIG.DATA_FILE, content, message, sha);
    return result.content.sha;
}

async function loadRoles() {
    const file = await githubGet(CONFIG.ROLES_FILE);
    if (!file) return [];
    const content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
    return JSON.parse(content);
}


async function loadRoster() {
    const file = await githubGet("data/roster.json");
    if (!file) return {};
    const content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
    return JSON.parse(content);
}
