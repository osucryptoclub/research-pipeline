#!/usr/bin/env bash
# Merge reviewed PRs one at a time. Leads (pipeline-leads team) only.
#
#   ./scripts/merge_prs.sh 12 13 19
#
# For each PR: approve, pull in the latest main, wait for the checks, squash-merge.
# One at a time because each merge moves main, and main only accepts PRs that are up to date.

set -uo pipefail

REPO="osucryptoclub/research-pipeline"
me=$(gh api user --jq .login)

state=$(gh api "orgs/osucryptoclub/teams/pipeline-leads/memberships/$me" --jq .state 2>/dev/null)
if [ "$state" != "active" ]; then
  echo "Only pipeline-leads can merge. You're logged in as $me."
  exit 1
fi

for n in "$@"; do
  echo
  echo "==> PR #$n"

  author=$(gh pr view "$n" --repo "$REPO" --json author --jq .author.login)
  if [ "$author" = "$me" ]; then
    echo "You opened #$n, so someone else has to merge it. Skipping."
    continue
  fi

  gh pr review "$n" --repo "$REPO" --approve
  gh pr update-branch "$n" --repo "$REPO" || true   # fine if it's already up to date

  sleep 20   # give the new checks time to start, or --watch sees the old ones
  if ! gh pr checks "$n" --repo "$REPO" --watch; then
    echo "Checks failed on #$n. Not merging."
    continue
  fi

  gh pr merge "$n" --repo "$REPO" --squash --delete-branch || echo "Couldn't merge #$n. See the message above."
done
