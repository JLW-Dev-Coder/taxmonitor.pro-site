# canonical-skill.md

# 1\. Header (Identity)
*   Skill name
*   Version
*   Owner (repo/system)
*   One-line purpose
* * *
# 2\. Purpose (Strict)
What this skill does — in one sentence.
No fluff.
* * *
# 3\. Inputs (Contract)
Define EXACTLY:
*   fields
*   types
*   required vs optional
*   validation rules
Example:

```cs
email_found: string (required, non-empty)
domain_clean: string (lowercase)
firm_bucket: enum (solo_brand | local_firm | national_firm)


```

* * *
# 4\. Preconditions (Gatekeeping)
What MUST be true before execution:
*   required fields exist
*   values valid
*   dependencies available
If not → FAIL (not “try to handle”)
* * *
# 5\. Execution Logic (Deterministic)
This is the core.
Must be:
*   ordered
*   explicit
*   step-by-step
*   no interpretation
Example:
1. Validate input
2. Normalize domain
3. Generate slug
4. Apply personalization rules
5. Construct output object
* * *
# 6\. Output (Contract)
Define EXACT output shape:
*   fields
*   structure
*   constraints
Example:

```yaml
{
  slug: string,
  email: string,
  asset_page: object,
  email_1: { subject, body }
}


```

No optional ambiguity unless defined.
* * *
# 7\. Side Effects (Explicit)
If anything is written/updated:
*   CSV updates
*   R2 writes
*   logs
Define:
*   where
*   when
*   format
* * *
# 8\. Failure Handling
Define EXACT behavior:
*   skip record
*   log error
*   halt process
Never leave undefined.
* * *
# 9\. Constraints
Skill-specific rules:
*   no external calls
*   no schema mutation
*   no fallback logic unless defined
* * *
# 10\. Example (Golden Case)
Provide one full:
*   input
*   output
Claude uses this heavily for alignment.
* * *
# 11\. Non-Goals
What the skill explicitly does NOT do.
Prevents scope creep.