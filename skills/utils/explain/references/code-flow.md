# Code flow

Use the smallest code examples needed to explain behavior:

1. Show the smallest complete runtime chain in execution order. Preserve function and variable names, branch order, and error boundaries. Omit unrelated setup, types, logging, framework plumbing, and secondary branches. Mark material omissions with short comments. Use exact code and file paths when verified. Otherwise label it pseudocode.
2. Trace a concrete input through that chain. Show important values, derived paths or queries, the decisive branch, and the result. For regressions or proposed changes, show the exact before/after divergence.

Prefer code comments to prose and link exact source lines when known. Keep the file tree separate. Explain the decisive behavior and any decision the user needs to make without imposing a fixed block or sentence count. Omit raw logs and unrelated timelines.
