# Research Pipeline

A daily archive of trusted crypto sources for the OSU Crypto Club Research cohort. Collectors pull from sources Research has approved, everything lands in one database tagged by topic, and the Reader lets researchers browse and search all of it.

Built by the Builders cohort.

## Stack

| Piece | What we use | Why |
| --- | --- | --- |
| Archive | Supabase (Postgres) | Free tier, real SQL, full-text search built in, and a REST API the reader can call directly |
| Collectors | Python, run daily by GitHub Actions | Short scripts with good libraries for feeds and APIs. Actions is free for public repos, so there's no server to manage |
| Reader | Next.js (TypeScript) | One app for pages and data fetching, and it deploys free on Vercel |
| Config | `config/sources.yaml` | Every source and topic in one file, so adding a source is a small PR that Research can review |

## Set up your computer

You need three things installed. Check each one in a terminal (on Windows, use PowerShell or Git Bash).

| Tool | Check with | Need | Get it |
| --- | --- | --- | --- |
| Git | `git --version` | any | https://git-scm.com/downloads |
| Python | `python3 --version` (Windows: `python --version`) | 3.11 or newer | https://www.python.org/downloads/ |
| Node.js | `node --version` | 20.9 or newer (22 LTS recommended) | https://nodejs.org/ |

You also need a GitHub account, and someone must add you to the `osucryptoclub` org. Send your username in #research-pipeline.

### 1. Clone the repo

```bash
git clone https://github.com/osucryptoclub/research-pipeline.git
cd research-pipeline
```

### 2. Collectors (Python)

Everyone should do this part. It's how you check that your setup works.

Mac / Linux:

```bash
cd collectors
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest
```

Windows (PowerShell):

```powershell
cd collectors
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest
```

If PowerShell refuses to run the activate script, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once and try again.

**You're set up when** pytest prints something like `5 passed`.

To see the collector pull real data (this needs internet but no database), copy `.env.example` in the repo root to `.env`, put your email after `CONTACT_EMAIL=`, then from `collectors/` run:

```bash
python run.py --dry-run --source sec-press-releases
```

It prints the first few items it found with their topic tags. Nothing is saved anywhere.

Next time you open a terminal, you only need `cd collectors` and the activate line.

### 3. Reader (Next.js)

Reader team must do this. Everyone else is welcome to.

```bash
cd reader
npm install
npm run dev
```

Open http://localhost:3000. You should see the Research Pipeline page with three sample items. It uses sample data until the club database is connected (see `reader/.env.example`).

### Something broke?

Post the exact command and the full error in #research-pipeline. Common fixes:

- `python3: command not found` on Windows: use `python` instead.
- `pip` installs into the wrong Python: make sure you activated `.venv` first. Your prompt should start with `(.venv)`.
- `npm install` fails on an old Node: upgrade Node to 20.9 or newer.

## How it fits together

```
config/sources.yaml  ->  collectors/ (GitHub Actions, daily)  ->  Supabase "items" table  ->  reader/ (Next.js)
```

- **config/sources.yaml** holds every topic and source. A source only runs once `approved: true`, which needs Research's sign-off.
- **collectors/** has one small module per source type in `collectors/pipeline/types/` (RSS first). `.github/workflows/collect.yml` runs them every morning.
- **supabase/migrations/** holds the database schema: one `items` table, one row per item, with a `tags` array for topics.
- **reader/** is the app Research uses.

## Teams

| Team | Owns |
| --- | --- |
| Archive | `supabase/` |
| Collectors | `collectors/`, `.github/workflows/collect.yml` |
| Reader | `reader/` |
| Source curators | `config/sources.yaml` |
| Research liaison | Testing from the Research side, feedback in Issues |

Leads: Cooper (product), Gagan (tech lead, final say on merges), Aiden (reader). Matthew advises.

## How we work

The ground rules:

1. Every change goes through a pull request (PR). Nobody can push straight to `main`.
2. Nobody merges their own code. Every PR needs one approval from someone else, and the automated checks have to pass.
3. No keys in code. The repo is public, so anything committed is visible to everyone, forever. Secrets go in `.env` (gitignored) and GitHub Actions secrets.
4. Numbers come from data, not AI. Every summary links to its source.

## How to contribute, step by step

If you've never used Git with a team before, follow this exactly. After two or three PRs it becomes automatic.

### One-time setup

1. **Get on a team.** Post your GitHub username in #research-pipeline. A lead adds you to your team (archive, collectors, reader, source-curators, or research-liaison). Your team has write access to this repo. Being in the org alone only gives read access.
2. **Accept the invite.** GitHub emails you an invitation to `osucryptoclub`. You can't push until you accept it. You can also accept at https://github.com/osucryptoclub.
3. **Tell Git who you are** (use the email on your GitHub account):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```
4. **Let Git push to GitHub.** The easiest way is the GitHub CLI: install it from https://cli.github.com, then run `gh auth login` and pick GitHub.com, HTTPS, and "Login with a web browser". If you prefer an app, [GitHub Desktop](https://desktop.github.com) works too.
5. **Clone the repo and set it up**, following [Set up your computer](#set-up-your-computer) above.

### Every task, start to finish

**1. Pick a task.** Open [Issues](https://github.com/osucryptoclub/research-pipeline/issues) and filter by your team's label (for example `team:collectors`). Choose one nobody is assigned to, click **Assignees → assign yourself**, and comment that you're on it. If you want to work on something that isn't an issue yet, open one first so the leads can weigh in before you build it.

**2. Start from the latest code.**
```bash
git checkout main
git pull
```

**3. Make a branch.** Name it after yourself and the task:
```bash
git checkout -b yourname/short-description
```
For example `satya/items-table` or `rudra/item-list-page`. One branch per issue.

**4. Make your change.** Keep it small. If an issue turns out to be bigger than a week, say so in the issue and we'll split it.

**5. Check your work before pushing.** Run whatever applies to what you changed:
```bash
# Python (from collectors/, with .venv activated)
python -m pytest
ruff check .
python ../scripts/validate_config.py   # if you touched config/sources.yaml

# Reader (from reader/)
npm run typecheck
npm run build
```
The same checks run automatically on your PR, so this just saves you a round trip.

**6. Commit.** Stage your files and describe what changed in a short sentence:
```bash
git status                 # see what changed
git add path/to/file       # or: git add .  (check git status first so you don't add anything secret)
git commit -m "Add items table migration"
```
Several small commits are fine. They get squashed into one when the PR merges.

**7. Push your branch.**
```bash
git push -u origin yourname/short-description
```
The first push needs `-u`. After that, plain `git push` works.

**8. Open a pull request.** GitHub shows a yellow **Compare & pull request** banner on the repo page right after you push. Click it, or go to **Pull requests → New pull request** and pick your branch. In the description:
- Say what the change does in a sentence or two.
- Write `Closes #12` (your issue number) so the issue closes automatically when the PR merges.
- Tick the checklist.

GitHub automatically asks the team that owns those files to review (see `.github/CODEOWNERS`). If you want a specific person, add them under **Reviewers**. If you want early feedback on unfinished work, open it as a **Draft pull request**.

**9. Wait for the checks.** A few minutes after you open the PR, the checks at the bottom turn green or red. If they're red, click **Details** to see what failed, fix it on your computer, commit, and `git push` again. The PR updates by itself.

**10. Respond to review.** Your reviewer may leave comments or click **Request changes**. Make the fixes on the same branch, commit, and push. Reply to each comment or click **Resolve conversation** when it's handled. Don't open a new PR for fixes.

**11. Merge.** Once the PR has an approval and green checks, the **reviewer** clicks **Squash and merge**. You never merge your own PR. If GitHub says the branch is out of date, click **Update branch** first. Changes to `supabase/` (the database) or `.github/workflows/` also need a lead's approval before merging.

**12. Clean up and grab the next task.**
```bash
git checkout main
git pull
git branch -d yourname/short-description
```
GitHub deletes the branch on its side automatically after merging.

### Reviewing someone else's PR

Everyone reviews, not just leads. Reviewing is how you learn the rest of the codebase.

1. Open the PR and go to the **Files changed** tab.
2. Read the change. Click the **+** next to any line to comment on it.
3. Things to look for: does it do what the issue asked? Could it break something that already works? Is there a key, password, or `.env` value anywhere in it? Would you understand this code in a month?
4. If you want to try it, check out their branch: `git fetch` then `git checkout their-branch-name`.
5. Click **Review changes** and pick **Approve**, **Request changes**, or **Comment**. Be specific and kind. "This breaks when `summary` is empty, maybe default to an empty string?" helps. "This is wrong" doesn't.
6. If you approved and the checks are green, click **Squash and merge**.

### Changing a file in the browser (no Git needed)

Small edits, especially adding a source to `config/sources.yaml`, can be done entirely on GitHub:

1. Open the file on GitHub and click the **pencil icon** (Edit).
2. Make your change.
3. Click **Commit changes**, choose **Create a new branch for this commit and start a pull request**, and give the branch a name.
4. Click **Propose changes**, then **Create pull request**. From here it's the same as step 8 above.

### When something goes wrong

- **`Permission denied` or `403` when pushing:** you haven't accepted the org invite yet, you aren't on a team, or Git isn't logged in (run `gh auth login`).
- **"This branch has conflicts":** someone changed the same lines as you. On your branch, run `git pull origin main`. Git marks the conflicting spots in the files with `<<<<<<<` and `>>>>>>>`. Edit them to what the code should be, remove the markers, then `git add`, `git commit`, and `git push`. Ask in #research-pipeline if you're unsure. A lead will walk you through it.
- **You committed to `main` by mistake:** run `git checkout -b yourname/fix` to move your work onto a new branch, then push that branch. `main` on GitHub is protected, so nothing broke.
- **You committed a key or password:** tell a lead immediately so it can be revoked. Deleting the file afterward doesn't remove it from the history.

More detail on adding sources and code style is in [CONTRIBUTING.md](CONTRIBUTING.md).

## First milestone (Oct 14)

One approved source is collected daily into the database and shows up on a basic page. See the issues in [Milestone 1](https://github.com/osucryptoclub/research-pipeline/milestones).
