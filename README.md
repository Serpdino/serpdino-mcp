# SerpDino MCP Server & API

Connect AI agents and your own code to [SerpDino](https://serpdino.com) SEO tools.

Your SerpDino API key works in three ways:

| | Remote MCP | Local MCP | REST API |
|---|---|---|---|
| **Setup** | Paste a URL | Clone & build | `curl` / any language |
| **Install required** | No | Yes | No |
| **Works offline** | No | No (calls SerpDino API) | No |
| **Best for** | Claude, ChatGPT, quick start | Cursor, CI, custom agents | Scripts, integrations |

---

## Quick Start

### 1. Get your API key

Go to **SerpDino Dashboard → Settings → API Keys** and create a new key.

### 2a. Remote MCP (easiest — no install)

Just paste the URL into your MCP client. Nothing to install or build.

**ChatGPT:**
1. In ChatGPT web, open **Settings → Apps → Advanced settings**
2. Enable **Developer mode**
3. Go back to **Settings → Apps**
4. Click **Create app**
5. Name: `SerpDino`
6. URL: `https://serpdino.com/api/mcp`
7. Click **Create**
8. You will be redirected to the authorization page
9. Enter your API key to finish connecting the app

Developer mode availability depends on your ChatGPT plan and role.

**Claude:**
1. In the Claude web app, open **Customize** in the left sidebar
2. Go to **Connectors**
3. Click **+** and choose **Add custom connector**
4. In the popup, set **Name** to `SerpDino`
5. Set **Remote MCP** to `https://serpdino.com/api/mcp`
6. Open **Advanced settings**
7. In **OAuth Client ID**, paste your API key
8. After saving, click the three dots in the top-right and choose **Refresh tools list**

**Any MCP client** — point it to:
```
https://serpdino.com/api/mcp
```
with header `Authorization: Bearer sd_your_key_here`.

That's it. All 28 tools are available immediately.

### 2b. Local MCP (self-hosted)

Run the MCP server as a local process. Better for dev tools like Cursor that launch MCP servers as subprocesses.

```bash
git clone https://github.com/Serpdino/serpdino-mcp.git
cd serpdino-mcp
npm install
npm run build
```

Add to your MCP client config (Claude Desktop, Cursor, etc.):

```json
{
    "mcpServers": {
        "serpdino": {
            "command": "node",
            "args": ["/absolute/path/to/serpdino-mcp/build/index.js"],
            "env": {
                "SERPDINO_API_KEY": "sd_your_key_here"
            }
        }
    }
}
```

### 2c. REST API (direct calls)

All SerpDino API endpoints accept `Authorization: Bearer sd_your_key_here` header.

```bash
# List your projects
curl -H "Authorization: Bearer sd_your_key_here" \
  https://serpdino.com/api/projects

# Research keywords
curl -X POST -H "Authorization: Bearer sd_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"seed": "best running shoes", "geo": "US", "lang": "en"}' \
  https://serpdino.com/api/tools/keyword-research

# Check SERP results for a keyword
curl -X POST -H "Authorization: Bearer sd_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"keyword": "seo tools", "geo": "us", "lang": "en"}' \
  https://serpdino.com/api/tools/serp-check

# Check domain traffic
curl -X POST -H "Authorization: Bearer sd_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}' \
  https://serpdino.com/api/tools/traffic-check
```

## Environment Variables (local MCP only)

| Variable | Required | Description |
|---|---|---|
| `SERPDINO_API_KEY` | ✅ | Your SerpDino API key (starts with `sd_`) |
| `SERPDINO_BASE_URL` | ❌ | Custom API URL (default: `https://serpdino.com`) |

---

## API Reference

All endpoints return JSON. Authenticate with `Authorization: Bearer sd_...` header.

### Projects

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects` | List all projects |
| `GET` | `/api/projects/:id` | Get project details |
| `POST` | `/api/projects` | Create project. Body: `{ name, domain, folder?, updateFrequency?, serpTop? }` |
| `PUT` | `/api/projects` | Update project. Body: `{ _id, name?, domain?, competitors?, updateFrequency?, serpTop? }` |
| `DELETE` | `/api/projects` | Delete project. Body: `{ _id }` |

### Folders

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/folders` | List folders |
| `POST` | `/api/projects/folders` | Create folder. Body: `{ name }` |
| `PUT` | `/api/projects/folders?id=` | Rename folder. Body: `{ name }` |
| `DELETE` | `/api/projects/folders?id=` | Delete folder |

### Keywords

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/projects/keywords` | Add keywords. Body: `{ projectId, keywords[], geoCode, langCode }` |
| `DELETE` | `/api/projects/keywords` | Remove keywords. Body: `{ projectId, keywordIds[] }` |
| `POST` | `/api/scrape/new-keywords` | Refresh positions. Body: `{ projectId, keywordIds[] }` |

### Ranking Data

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/keyword-updates?projectId=&startDate=&endDate=&aggregation=&search=&sortBy=&sortOrder=` | Keyword position history |
| `GET` | `/api/projects/position-history?keywordUpdateId=` | Full SERP snapshot for a check |
| `GET` | `/api/projects/keyword-volumes?projectId=&keywordId=` | Search volume, CPC, competition |

### Keyword Research

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tools/keyword-research` | Research keywords. Body: `{ seed, mode?, geo?, lang?, pageSize? }` |
| `POST` | `/api/tools/serp-check` | Live SERP check. Body: `{ keyword, geo, lang }` |
| `POST` | `/api/tools/traffic-check` | Domain traffic check. Body: `{ domain }` |
| `GET` | `/api/projects/keyword-suggestions?projectId=` | AI keyword suggestions |
| `POST` | `/api/projects/keyword-ideas` | Keyword ideas. Body: `{ projectId, geo?, lang? }` |

### Competitors

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/competitor-positions?projectId=&competitorDomain=&startDate=&endDate=` | Competitor rankings |
| `GET` | `/api/projects/competitors-filtered?domain=&competitors=` | Traffic comparison |

### Performance

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/pages?projectId=` | Page-level ranking data |
| `GET` | `/api/projects/pagespeed?domain=` | PageSpeed / Core Web Vitals |
| `GET` | `/api/projects/pages-pagespeed?projectId=` | Per-page Lighthouse metrics |
| `GET` | `/api/projects/crux-history?domain=` | Chrome UX Report history |
| `GET` | `/api/projects/similarweb?domain=` | SimilarWeb traffic stats |

### Notes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/notes?projectId=` | List notes |
| `POST` | `/api/projects/notes` | Add note. Body: `{ projectId, date, text, color? }` |
| `DELETE` | `/api/projects/notes` | Delete note. Body: `{ noteId }` |

### Account

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/capacity` | Account usage & limits |
| `GET` | `/api/projects/export-agent?projectId=` | Full Markdown report |
| `GET` | `/api/projects/export?projectId=&format=full` | CSV export |

### API Keys

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/api-keys` | List your API keys |
| `POST` | `/api/user/api-keys` | Create key. Body: `{ name }` |
| `DELETE` | `/api/user/api-keys` | Revoke key. Body: `{ id }` |

---

## MCP Tools

Both remote and local MCP expose the same 28 tools:

| Category | Tools |
|---|---|
| **Projects** | `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project` |
| **Folders** | `list_folders`, `create_folder` |
| **Keywords** | `add_keywords`, `remove_keywords`, `refresh_keywords` |
| **Rankings** | `get_keyword_rankings`, `get_serp_results`, `get_keyword_volumes` |
| **Research** | `keyword_research`, `get_keyword_suggestions`, `get_keyword_ideas` |
| **Competitors** | `get_competitor_rankings`, `compare_competitors` |
| **Performance** | `get_project_pages`, `get_pagespeed`, `get_page_pagespeed`, `get_crux_history` |
| **Traffic** | `get_traffic_stats` |
| **Notes** | `list_notes`, `add_note`, `delete_note` |
| **Account** | `get_capacity`, `export_project_report` |

### Example Prompts

- *"Show me all my projects and their current rankings"*
- *"Research keywords related to 'best running shoes' in the US"*
- *"Compare my site's traffic against competitor.com"*
- *"What are the Core Web Vitals for my domain?"*
- *"Generate a full SEO report for my project"*
- *"Refresh all keyword positions for my project"*

## Development

```bash
npm run dev    # watch mode
npm run build  # production build
```
