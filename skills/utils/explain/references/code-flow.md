# Code flow

Use exactly two code blocks unless the user requests another format:

1. Show the smallest complete runtime chain in execution order. Preserve function and variable names, branch order, and error boundaries. Omit unrelated setup, types, logging, framework plumbing, and secondary branches. Mark material omissions with short comments. Use exact code and file paths when verified. Otherwise label it pseudocode.
2. Trace a concrete input through that chain. Show important values, derived paths or queries, the decisive branch, and the result. For regressions or proposed changes, show the exact before/after divergence.

Prefer code comments to prose. The blocks may appear in separate chunks with short orientation notes between them. After the blocks, use at most three sentences for the decisive behavior, unchanged boundaries, and what the user should review or decide. Link exact source lines when known. Omit raw logs, timelines, and file inventories.
