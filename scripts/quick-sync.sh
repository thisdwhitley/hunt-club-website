# quick-sync.sh - Quick sync without commit prompts
#!/bin/bash
./scripts/sync-db.sh "$1" && git add -A && git commit -m "db: ${1:-database updates}" && git push
