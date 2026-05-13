# SerpDino MCP Server & API

Connect AI agents and your own code to [SerpDino](https://serpdino.com) SEO tools.

Your SerpDino API key works in two ways:
1. **MCP Server** — plug into Claude Desktop, Cursor, or any MCP client
2. **REST API** — call endpoints directly from any language/script

---

## Quick Start

### 1. Get your API key

Go to **SerpDino Dashboard → Settings → API Keys** and create a new key.

### 2a. Use as MCP Server

```bash
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

### 2b. Use as REST API

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

## Environment Variables

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

### Ranking Data

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects/keyword-updates?projectId=&startDate=&endDate=&aggregation=` | Keyword position history |
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

The MCP server exposes 28 tools. See the tool list via `tools/list` or ask your agent *"What tools do you have from SerpDino?"*

### Example Prompts

- *"Show me all my projects and their current rankings"*
- *"Research keywords related to 'best running shoes' in the US"*
- *"Compare my site's traffic against competitor.com"*
- *"What are the Core Web Vitals for my domain?"*
- *"Generate a full SEO report for my project"*

## Development

```bash
npm run dev    # watch mode
npm run build  # production build
```
