---
name: ticket-first
description: Every change starts as a ticket and lands through a pull request a person merges. Use before starting any change, including one asked for directly in a chat.
---

# Ticket first

## The rule
Every change gets a ticket before the work starts, even one asked for directly
in a chat. The ticket is the record of why the change was made.

## The steps
1. **Ticket.** Open an issue with the ask, the scope (what's in, what's out) and
   acceptance criteria someone can check.
2. **Branch.** Work on a branch, never on the default branch. The
   `protect-branch` guard enforces this.
3. **Pull request.** Open it as a draft. Link the ticket (`Closes #<n>`), list
   what changed, and show the evidence: commands and their output.
4. **Merge.** A person merges, unless the repo's config allows something else.
   Automation, workflow and config changes always need a person.
5. **Close the loop.** After the merge, clear the ticket's status and note
   anything left over as a new ticket.

## Good tickets
- One change per ticket. If it needs "and", it may be two tickets.
- Acceptance criteria are checks, not hopes: "`npm test` passes", not "works well".
- Size it. If it won't fit in one sitting, split it.
