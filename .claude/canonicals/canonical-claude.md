# canonical-claude.md

## 1\. Header (identity + scope)
*   Repo name
*   Product name
*   Domain
*   Last updated
*   One-line purpose
## 2\. System Definition
*   What the system is
*   What it is NOT
*   Audience
*   Stack (explicit)
*   Backend dependencies (explicit ownership)
## 3\. Hard Constraints (top-level, early)
*   No backend changes in this repo
*   Do not modify source CSV columns
*   Never output invalid email values
*   Never invent endpoints or contracts
* * *
## 4\. Terminology (Canonical Language Layer)
*   Defines **allowed vs forbidden terms**
*   Maps legacy → canonical
Example:
*   audit → asset
*   audit\_page → asset\_page
* * *
## 5\. Repo Structure (Source of Truth Map)
*   Directory tree
*   What each folder does
*   What is authoritative vs generated
* * *
## 6\. Data Contracts (Strict)
### 6.1 Source of Truth
*   File paths
*   Ownership
### 6.2 Schema Definitions
*   Columns
*   Types
*   Rules (uppercase, lowercase, optional, etc.)
### 6.3 Append-Only / Mutation Rules
*   What can be changed
*   What cannot
* * *
## 7\. Execution Logic (Deterministic Flows)
### 7.1 Selection Logic (ordered, mandatory)
*   Filters
*   Sort
*   Limits
### 7.2 Processing Steps
*   Step-by-step flow
*   No ambiguity
*   No branching unless defined
### 7.3 Output Definitions
*   Path
*   Format
*   Required fields
*   Constraints
* * *
## 8\. External Interfaces
*   R2 keys
*   API dependencies
*   Worker responsibilities
*   Cron ownership
* * *
## 9\. Personalization / Business Logic Layer
Where applicable:
*   Email rules
*   Subject patterns
*   Dynamic variables
Requirements:
*   deterministic
*   templated
*   role-aware
* * *
## 10\. Routing / URL Rules
*   URL structure
*   Slug rules
*   Dedup logic
*   Key mapping (R2, DB, etc.)
* * *
## 11\. Lifecycle / Scheduling
*   Cron timing
*   Event triggers
*   State transitions
Example:
*   Email 1 → prepared
*   Email 2 → scheduled
*   Worker → sends
* * *
## 12\. Operational Loop (Daily/Batch Flow)
This is your **runbook**:
1. Generate
2. Push
3. Schedule
4. Update state
Executable by:
*   human
*   script
*   Claude
* * *
## 13\. Metrics / Business Context (Optional but Strong)
*   Time savings
*   Revenue impact
*   Positioning
* * *
## 14\. Reference Docs Priority
Example:
*   [CLAUDE.md](http://claude.md/) overrides [SCALE.md](http://scale.md/)
* * *
## 15\. Hard Constraints (Repeat / Reinforce)
Re-state critical constraints at bottom.
* * *
## 16\. Related Systems / Repos
*   Paths
*   Responsibilities
*   Boundaries