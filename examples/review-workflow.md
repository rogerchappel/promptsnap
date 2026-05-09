# Review Workflow Example

```sh
# Refresh snapshots after an intentional prompt edit.
promptsnap update prompts skills

# Check the prompt contract before review.
promptsnap check --format markdown

# Print changed content for a PR comment or agent handoff.
promptsnap diff --format markdown
```

Reviewers should inspect both the prompt source and its snapshot. A changed snapshot is the explicit record of contract drift.
