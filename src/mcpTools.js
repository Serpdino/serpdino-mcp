/**
 * Shared MCP tool definitions for SerpDino.
 *
 * Used by:
 *   - pages/api/mcp.js        (remote Streamable HTTP endpoint)
 *   - serpdino-mcp/src/index.ts (local stdio package — keep in sync)
 *
 * Interface contract:
 *   client must expose: .get(path, params?), .post(path, body?),
 *                        .del(path, body?), .request(method, path, {body}), .apiKey
 */

function text(t, isError = false) {
    return { content: [{ type: "text", text: t }], isError };
}
function json(d) { return text(JSON.stringify(d, null, 2)); }
async function safe(fn) {
    try { return json(await fn()); }
    catch (e) { return text(`Error: ${e.message || e}`, true); }
}

export default function registerTools(server, c, z, baseUrl) {
    // Projects
    server.tool("list_projects", "List all your SEO tracking projects", {},
        () => safe(() => c.get("/api/projects")));

    server.tool("get_project", "Get details of a specific project including its keywords, domain, competitors, and settings",
        { projectId: z.string().describe("Project ID") },
        ({ projectId }) => safe(() => c.get(`/api/projects/${projectId}`)));

    server.tool("create_project", "Create a new SEO tracking project for a domain", {
        name: z.string().describe("Project name"),
        domain: z.string().describe("Domain to track (e.g. example.com)"),
        folder: z.string().optional().describe("Folder ID to place project in"),
        updateFrequency: z.enum(["daily", "every3days", "weekly", "biweekly"]).optional().describe("How often to check rankings (default: daily)"),
        serpTop: z.number().optional().describe("SERP depth: 50 or 100 (default: 50)"),
    }, ({ name, domain, folder, updateFrequency, serpTop }) =>
        safe(() => c.post("/api/projects", { name, domain, folder, updateFrequency, serpTop })));

    server.tool("update_project", "Update project settings (name, domain, competitors, frequency, etc.)", {
        projectId: z.string().describe("Project ID"),
        name: z.string().optional().describe("New project name"),
        domain: z.string().optional().describe("New domain"),
        competitors: z.array(z.string()).optional().describe("List of competitor domains"),
        updateFrequency: z.enum(["daily", "every3days", "weekly", "biweekly"]).optional().describe("Ranking check frequency"),
        serpTop: z.number().optional().describe("SERP depth: 50 or 100"),
    }, ({ projectId, name, domain, competitors, updateFrequency, serpTop }) =>
        safe(() => c.request("PUT", "/api/projects", { body: { _id: projectId, name, domain, competitors, updateFrequency, serpTop } })));

    server.tool("delete_project", "Delete a project and all its tracking data",
        { projectId: z.string().describe("Project ID") },
        ({ projectId }) => safe(() => c.del("/api/projects", { _id: projectId })));

    // Folders
    server.tool("list_folders", "List all project folders", {},
        () => safe(() => c.get("/api/projects/folders")));

    server.tool("create_folder", "Create a folder to organize projects",
        { name: z.string().describe("Folder name") },
        ({ name }) => safe(() => c.post("/api/projects/folders", { name })));

    // Keywords
    server.tool("add_keywords", "Add keywords to track in a project. Keywords will start getting position data on the next scheduled check.", {
        projectId: z.string().describe("Project ID"),
        keywords: z.array(z.string()).describe("Keywords to track (max 3500 per project)"),
        geoCode: z.string().optional().describe("Country code, e.g. 'US', 'GB', 'DE' (default: US)"),
        langCode: z.string().optional().describe("Language code, e.g. 'en', 'de', 'fr' (default: en)"),
    }, ({ projectId, keywords, geoCode, langCode }) =>
        safe(() => c.post("/api/projects/keywords", { projectId, keywords, geoCode: geoCode || "US", langCode: langCode || "en" })));

    server.tool("remove_keywords", "Remove tracked keywords from a project", {
        projectId: z.string().describe("Project ID"),
        keywordIds: z.array(z.string()).describe("Keyword IDs to remove"),
    }, ({ projectId, keywordIds }) => safe(() => c.del("/api/projects/keywords", { projectId, keywordIds })));

    server.tool("refresh_keywords", "Trigger a fresh SERP check for keywords in a project. Can refresh all keywords or specific ones by ID. Costs balance credits.", {
        projectId: z.string().describe("Project ID"),
        keywordIds: z.array(z.string()).optional().describe("Specific keyword IDs to refresh. If omitted, refreshes all keywords in the project."),
    }, ({ projectId, keywordIds }) => safe(async () => {
        if (!keywordIds) {
            const p = await c.get(`/api/projects/${projectId}`);
            const ids = p?.project?.keywords?.map(k => typeof k === "string" ? k : k._id) || [];
            if (!ids.length) return { success: false, message: "No keywords in project" };
            return c.post("/api/scrape/new-keywords", { projectId, keywordIds: ids });
        }
        return c.post("/api/scrape/new-keywords", { projectId, keywordIds });
    }));

    // Rankings
    server.tool("get_keyword_rankings", "Get keyword position/ranking history for a project. Returns daily position data per keyword.", {
        projectId: z.string().describe("Project ID"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
        aggregation: z.enum(["daily", "weekly", "monthly"]).optional().describe("Aggregation level (default: daily)"),
        search: z.string().optional().describe("Filter keywords containing this text"),
        geoCode: z.string().optional().describe("Filter by country code (e.g. US)"),
        langCode: z.string().optional().describe("Filter by language code (e.g. en)"),
        sortBy: z.enum(["keyword", "position", "volume"]).optional().describe("Sort results by field"),
        sortOrder: z.enum(["asc", "desc"]).optional().describe("Sort direction (default: desc)"),
    }, ({ projectId, startDate, endDate, aggregation, search, geoCode, langCode, sortBy, sortOrder }) =>
        safe(() => c.get("/api/projects/keyword-updates", {
            projectId, ...(startDate && { startDate }), ...(endDate && { endDate }),
            ...(aggregation && { aggregation }), ...(search && { search }),
            ...(geoCode && { geoCode }), ...(langCode && { langCode }),
            ...(sortBy && { sortBy }), ...(sortOrder && { sortOrder }),
        })));

    server.tool("get_serp_results", "Get the full SERP snapshot for a specific keyword check. Shows top 30+ results, positions, URLs, and AI overview data.", {
        keywordUpdateId: z.string().describe("Keyword update ID (from get_keyword_rankings response)"),
    }, ({ keywordUpdateId }) => safe(() => c.get("/api/projects/position-history", { keywordUpdateId })));

    server.tool("get_keyword_volumes", "Get search volume, CPC, and competition data for all keywords in a project", {
        projectId: z.string().describe("Project ID"),
        keywordId: z.string().optional().describe("Specific keyword ID for detailed volume history"),
    }, ({ projectId, keywordId }) => safe(() => c.get("/api/projects/keyword-volumes", { projectId, ...(keywordId && { keywordId }) })));

    // Competitors
    server.tool("get_competitor_rankings", "Get a competitor's ranking positions across all your tracked keywords", {
        projectId: z.string().describe("Project ID"),
        competitorDomain: z.string().describe("Competitor domain to check"),
        startDate: z.string().optional().describe("Start date (YYYY-MM-DD)"),
        endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
    }, ({ projectId, competitorDomain, startDate, endDate }) =>
        safe(() => c.get("/api/projects/competitor-positions", { projectId, competitorDomain, ...(startDate && { startDate }), ...(endDate && { endDate }) })));

    server.tool("compare_competitors", "Compare traffic and performance of a domain against its competitors (uses SimilarWeb data)", {
        domain: z.string().describe("Main domain"),
        competitors: z.array(z.string()).describe("Competitor domains to compare"),
    }, ({ domain, competitors }) => safe(() => c.get("/api/projects/competitors-filtered", { domain, competitors: competitors.join(",") })));

    // Pages & Performance
    server.tool("get_project_pages", "Get page-level ranking data: which URLs rank, avg position, and trend sparklines",
        { projectId: z.string().describe("Project ID") },
        ({ projectId }) => safe(() => c.get("/api/projects/pages", { projectId })));

    server.tool("get_pagespeed", "Get PageSpeed Insights data (Core Web Vitals) for a domain",
        { domain: z.string().describe("Domain to check") },
        ({ domain }) => safe(() => c.get("/api/projects/pagespeed", { domain })));

    server.tool("get_page_pagespeed", "Get per-page Lighthouse lab metrics (LCP, FCP, CLS, TBT) for all tracked pages in a project",
        { projectId: z.string().describe("Project ID") },
        ({ projectId }) => safe(() => c.get("/api/projects/pages-pagespeed", { projectId })));

    server.tool("get_crux_history", "Get Chrome UX Report (CrUX) real-user performance history for a domain",
        { domain: z.string().describe("Domain to check") },
        ({ domain }) => safe(() => c.get("/api/projects/crux-history", { domain })));

    // Traffic
    server.tool("get_traffic_stats", "Get SimilarWeb traffic stats and monthly visit history for a domain",
        { domain: z.string().describe("Domain to check") },
        ({ domain }) => safe(() => c.get("/api/projects/similarweb", { domain })));

    // Keyword Research
    server.tool("keyword_research", "Research keyword ideas with volumes, CPC, competition, and trends. Supports seed keyword, URL, or domain as input.", {
        seed: z.string().describe("Seed keyword, URL, or domain to research"),
        mode: z.enum(["keyword", "url", "domain"]).optional().describe("Research mode (default: keyword)"),
        geo: z.string().optional().describe("Country code, e.g. 'US', 'GB' (default: US)"),
        lang: z.string().optional().describe("Language code (default: en)"),
        pageSize: z.number().optional().describe("Number of results, 10-500 (default: 100)"),
    }, ({ seed, mode, geo, lang, pageSize }) =>
        safe(() => c.post("/api/tools/keyword-research", { seed, mode: mode || "keyword", geo: geo || "US", lang: lang || "en", pageSize: pageSize || 100 })));

    server.tool("get_keyword_suggestions", "Get AI-generated keyword suggestions for a project (generated when the project is created)",
        { projectId: z.string().describe("Project ID") },
        ({ projectId }) => safe(() => c.get("/api/projects/keyword-suggestions", { projectId })));

    server.tool("get_keyword_ideas", "Get keyword ideas based on a project's domain (related keywords, questions, etc.)", {
        projectId: z.string().describe("Project ID"),
        geo: z.string().optional().describe("Country code (default: US)"),
        lang: z.string().optional().describe("Language code (default: en)"),
    }, ({ projectId, geo, lang }) => safe(() => c.post("/api/projects/keyword-ideas", { projectId, ...(geo && { geo }), ...(lang && { lang }) })));

    // Notes
    server.tool("list_notes", "List all timeline notes/annotations for a project",
        { projectId: z.string().describe("Project ID") },
        ({ projectId }) => safe(() => c.get("/api/projects/notes", { projectId })));

    server.tool("add_note", "Add a note/annotation to a project timeline (useful for marking algorithm updates, site changes, etc.)", {
        projectId: z.string().describe("Project ID"),
        date: z.string().describe("Date for the note (YYYY-MM-DD)"),
        text: z.string().describe("Note content"),
        color: z.enum(["info", "warning", "success", "danger"]).optional().describe("Note color/severity (default: info)"),
    }, ({ projectId, date, text, color }) => safe(() => c.post("/api/projects/notes", { projectId, date, text, color })));

    server.tool("delete_note", "Delete a note from a project timeline",
        { noteId: z.string().describe("Note ID to delete") },
        ({ noteId }) => safe(() => c.del("/api/projects/notes", { noteId })));

    // Account
    server.tool("get_capacity", "Check your account capacity: total tokens, booked tokens, available tokens, and keyword/project counts",
        {}, () => safe(() => c.get("/api/user/capacity")));

    // Export
    server.tool("export_project_report", "Generate a comprehensive Markdown report for a project including rankings, traffic, competitors, and performance data.", {
        projectId: z.string().describe("Project ID"),
    }, ({ projectId }) => safe(async () => {
        const url = new URL("/api/projects/export-agent", baseUrl);
        url.searchParams.set("projectId", projectId);
        const r = await fetch(url, { headers: { Authorization: `Bearer ${c.apiKey}` } });
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.text();
    }));
}
