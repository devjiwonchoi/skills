---
name: explain
description: Use when explaining current context or results.
---

## Rules

- Keep every response within three short paragraphs, including the closing question and quiz feedback.
- Keep visuals compact instead of using them to bypass the paragraph limit.

## Steps

1. Explain the current context or result so someone without conversation history can understand it.
   - Lead with the main point, then include only the background, cause, and consequence needed to understand it.
   - Use familiar words and a concrete example when helpful.
2. Use all available visual methods that help understanding, combining them instead of choosing just one.
   - Always create and render an HTML visualization when HTML visualization is available.
   - For frontend or UI changes, preview how the proposed or changed interface will look.
   - Capture and show screenshots when the actual interface or result matters.
   - Render Mermaid as a simple diagram with only the essential nodes, connections, and plain-language labels.
   - Show a focused file tree with a short comment explaining each file's role when file locations or responsibilities matter.
   - Present the visual itself instead of raw visualization source.
3. End the explanation by asking whether the user wants a quiz to check their understanding.
4. If they agree, ask a total of 3–10 questions suited to the explanation's scope, one question per response.
   - Ask about the main idea, cause and effect, and applying the idea to a concrete situation.
   - Wait for their answer before revealing the solution or asking the next question.
   - Assess each answer, briefly explain any gaps, and check the corrected understanding.
