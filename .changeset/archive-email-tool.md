---
"gmcp": minor
---

Add `gmcp_gmail_archive_email` tool for archiving emails by removing them from the inbox.

**Commits:**
- feat(gmail): add archive email tool

**What's new:**
- New `gmcp_gmail_archive_email` tool that archives emails by removing the INBOX label
- Archived emails remain accessible in "All Mail" and can be unarchived
- Requires `gmail.modify` scope
- Marked with MODIFY_ANNOTATIONS (not destructive, since operation is reversible)
