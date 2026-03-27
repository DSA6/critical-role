// ─── GitHub API helpers ───

function _headers(needsAuth) {
    var h = { "Accept": "application/vnd.github.v3+json" };
    if (needsAuth && CONFIG.GITHUB_TOKEN) {
        h["Authorization"] = "token " + CONFIG.GITHUB_TOKEN;
    }
    return h;
}

async function githubGet(path) {
    var res = await fetch(CONFIG.API_BASE + "/contents/" + path + "?ref=" + CONFIG.GITHUB_BRANCH, {
        headers: _headers(false)
    });
    if (!res.ok) {
        if (res.status === 404) return null;
        // Try with auth if public read fails (rate limit)
        if (CONFIG.GITHUB_TOKEN) {
            res = await fetch(CONFIG.API_BASE + "/contents/" + path + "?ref=" + CONFIG.GITHUB_BRANCH, {
                headers: _headers(true)
            });
            if (!res.ok && res.status === 404) return null;
            if (!res.ok) throw new Error("GitHub GET " + path + ": " + res.status);
        } else {
            throw new Error("GitHub GET " + path + ": " + res.status);
        }
    }
    return res.json();
}

async function githubPut(path, content, message, sha) {
    if (!CONFIG.GITHUB_TOKEN) {
        throw new Error("Write access requires authentication. Please contact L&D admin.");
    }
    var body = {
        message: message,
        content: btoa(unescape(encodeURIComponent(content))),
        branch: CONFIG.GITHUB_BRANCH
    };
    if (sha) body.sha = sha;
    var res = await fetch(CONFIG.API_BASE + "/contents/" + path, {
        method: "PUT",
        headers: _headers(true),
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("GitHub PUT " + path + ": " + res.status + " " + (await res.text()));
    return res.json();
}

async function loadApplications() {
    var file = await githubGet(CONFIG.DATA_FILE);
    if (!file) return { data: [], sha: null };
    var content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
    return { data: JSON.parse(content), sha: file.sha };
}

async function saveApplications(apps, sha, message) {
    var content = JSON.stringify(apps, null, 2);
    var result = await githubPut(CONFIG.DATA_FILE, content, message, sha);
    return result.content.sha;
}

async function loadRoles() {
    var file = await githubGet(CONFIG.ROLES_FILE);
    if (!file) return [];
    var content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
    return JSON.parse(content);
}

async function loadRoster() {
    var file = await githubGet("data/roster.json");
    if (!file) return {};
    var content = decodeURIComponent(escape(atob(file.content.replace(/\n/g, ""))));
    return JSON.parse(content);
}
