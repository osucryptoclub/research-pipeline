#!/usr/bin/env bash
# One-time GitHub setup for the research pipeline. Run from the repo root as an org owner:
#
#   gh auth login                      # once, if you haven't
#   ./scripts/setup_github.sh <org> [repo-name]
#
# Creates the public repo and pushes this code, creates one team per job, protects main,
# turns on secret scanning, and opens the milestone 1 issues. Safe to re-run.

set -euo pipefail

ORG="${1:?usage: setup_github.sh <org> [repo-name]}"
REPO="${2:-research-pipeline}"
FULL="$ORG/$REPO"

say() { printf '\n==> %s\n' "$*"; }

say "Checking gh login"
gh auth status >/dev/null

# 1. Point CODEOWNERS at the real org
if grep -q CLUB_ORG .github/CODEOWNERS; then
  say "Filling in org name in CODEOWNERS"
  sed -i.bak "s/CLUB_ORG/$ORG/g" .github/CODEOWNERS && rm .github/CODEOWNERS.bak
  git add .github/CODEOWNERS
  git commit -m "Point CODEOWNERS at $ORG teams"
fi

# 2. Create the repo and push
if gh repo view "$FULL" >/dev/null 2>&1; then
  say "Repo $FULL already exists, pushing"
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/$FULL.git"
  git push -u origin main
else
  say "Creating public repo $FULL"
  gh repo create "$FULL" --public --source=. --remote=origin --push \
    --description "Daily archive of trusted crypto sources for the Crypto Club Research cohort"
fi

# 3. Repo settings: squash merges only, auto-delete branches, secret scanning + push protection
say "Configuring repo settings"
gh api -X PATCH "repos/$FULL" --input - >/dev/null <<'JSON'
{
  "allow_squash_merge": true,
  "allow_merge_commit": false,
  "allow_rebase_merge": false,
  "delete_branch_on_merge": true,
  "has_wiki": false,
  "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" }
  }
}
JSON

# 4. Teams. Leads get maintain, everyone else gets write.
make_team() {
  local name="$1" slug="$2" perm="$3" desc="$4"
  if ! gh api "orgs/$ORG/teams/$slug" >/dev/null 2>&1; then
    gh api -X POST "orgs/$ORG/teams" -f name="$name" -f description="$desc" -f privacy=closed >/dev/null
    echo "  created team $slug"
  else
    echo "  team $slug exists"
  fi
  gh api -X PUT "orgs/$ORG/teams/$slug/repos/$FULL" -f permission="$perm" >/dev/null
}

say "Creating teams"
make_team "pipeline-leads"   pipeline-leads   maintain "Research pipeline leads"
make_team "archive"          archive          push     "Database structure and tagging"
make_team "collectors"       collectors       push     "Pull data from every source daily"
make_team "reader"           reader           push     "The digest and search Research uses"
make_team "source-curators"  source-curators  push     "Find sources and maintain the config"
make_team "research-liaison" research-liaison push     "Test from the Research side"

# 5. Protect main: PRs only, 1 approval from someone else, CI must pass
say "Protecting main"
gh api -X PUT "repos/$FULL/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["checks", "reader"] },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON

# 6. Labels
say "Creating labels"
lbl() { gh label create "$1" --repo "$FULL" --color "$2" --description "$3" --force >/dev/null; }
lbl task                  0e8a16 "A piece of work to claim"
lbl source                1d76db "New or changed source"
lbl needs-research-review fbca04 "Waiting on Research sign-off"
lbl milestone-1           5319e7 "Oct 14: one source end to end"
lbl good-first-issue      7057ff "Good for newcomers"
lbl team:archive          c5def5 ""
lbl team:collectors       c5def5 ""
lbl team:reader           c5def5 ""
lbl team:curators         c5def5 ""
lbl team:liaison          c5def5 ""

# 7. Milestone 1 and its issues (skipped if the milestone already exists)
say "Creating milestone 1"
if gh api "repos/$FULL/milestones" --jq '.[].title' | grep -qx "Milestone 1"; then
  echo "  milestone exists, skipping issues"
else
  gh api -X POST "repos/$FULL/milestones" -f title="Milestone 1" \
    -f description="One source collected daily into the database and shown on a basic page" \
    -f due_on="2026-10-14T23:59:00Z" >/dev/null

  issue() {
    gh issue create --repo "$FULL" --milestone "Milestone 1" \
      --label "milestone-1,task,$1" --title "$2" --body "$3" >/dev/null
    echo "  opened: $2"
  }
  issue team:curators "Pick the first source and get Research sign-off" \
"Choose one source for milestone 1, add it to \`config/sources.yaml\`, and get Research to approve it. Then set \`approved: true\`.

**Done when:** one approved source is merged into the config."
  issue team:archive "Create the items table in the club Supabase project" \
"Review \`supabase/migrations/0001_items.sql\`, change what you'd change, and apply it to the club-owned Supabase project.

**Done when:** the table exists and the anon key can read but not write."
  issue team:collectors "Collect the first source daily" \
"Make sure the collector handles the approved source (\`python run.py --dry-run\` locally), then confirm the Daily collect workflow writes rows.

**Done when:** the workflow has run successfully on its schedule at least once."
  issue team:reader "Basic page listing collected items" \
"Scaffold the Next.js app in \`reader/\` (see its README) and build one page: latest items, newest first, with title, source, date, tags, and a link.

**Done when:** the page shows real rows from Supabase."
  issue team:liaison "Review the page with Research" \
"Once the page shows real data, walk through it with Research and write up what's useful and what's missing as comments here.

**Done when:** feedback is posted."
fi

cat <<EOF

Done: https://github.com/$FULL

Still to do by hand:
  1. Add members to each team:  https://github.com/orgs/$ORG/teams
     (or: gh api -X PUT orgs/$ORG/teams/<team>/memberships/<username>)
  2. Once the club Supabase project exists, add Actions secrets:
       gh secret set SUPABASE_URL --repo $FULL
       gh secret set SUPABASE_SERVICE_ROLE_KEY --repo $FULL
       gh secret set CONTACT_EMAIL --repo $FULL
EOF
