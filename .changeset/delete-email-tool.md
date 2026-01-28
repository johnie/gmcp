---
"gmcp": minor
---

Add `gmcp_gmail_delete_email` tool for permanently deleting emails from Gmail.

**Commits:**
- feat(gmail): add delete email tool
- chore(deps): update pino, biome, lefthook, ultracite
- docs: add delete email tool to README

**What's new:**
- New `gmcp_gmail_delete_email` tool that permanently deletes emails (bypasses trash)
- Requires `gmail.modify` scope
- Marked as destructive operation with appropriate MCP annotations
