# README.md

# 1\. Header (Identity)
*   Repo name
*   Product name
*   Domain
*   One-line purpose
* * *
# 2\. System Overview
## What this repo is
## What this repo is NOT
## Where it fits in the system
* * *
# 3\. Architecture
Explicitly define:
*   frontend
*   backend
*   storage
*   external systems
* * *
# 4\. Responsibilities (Ownership Boundaries)
Clear separation:

| Responsibility | Owner |
| ---| --- |

Examples:
*   email sending → Worker
*   batch generation → this repo
Prevents duplication and bad edits.
* * *
# 5\. Repo Structure
*   Directory tree
*   What each folder does
*   Which are:
    *   source
    *   generated
    *   config
* * *
# 6\. Core Workflows
Describe EXACT flows:
Example:
*   generate batch
*   push to R2
*   Worker sends
Match [CLAUDE.md](http://CLAUDE.md) but note as detailed.
* * *
# 7\. Data Contracts (High-Level)
Not full schema (that’s [CLAUDE.md](http://CLAUDE.md)), but:
*   key files
*   what they represent
*   where they flow
* * *
# 8\. Setup / Local Development
ONLY what matters:
*   install
*   run
*   build
* * *
# 9\. Commands (Operational)
List actual commands used:
*   batch generation
*   push scripts
*   deploy
* * *
# 10\. Environment / Config
*   env vars (names only, no secrets)
*   external dependencies
* * *
# 11\. Deployment
*   where deployed
*   how triggered
*   what runs automatically
* * *
# 12\. Constraints / Rules
High-level guardrails:
*   no backend changes
*   no schema changes
* * *
# 13\. Related Systems
Map the ecosystem:
| System | Role |
* * *
# 14\. Glossary (Optional but Strong)
Especially useful for:
*   “asset page vs audit”
*   domain-specific language