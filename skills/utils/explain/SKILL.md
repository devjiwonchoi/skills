---
name: explain
description: Use when explaining current context or results.
---

## Rules

- Keep explanations concise without omitting context, tradeoffs, or required visuals needed to understand or decide.
- Keep visuals compact and readable.

## Steps

1. Explain the current context or result so someone without conversation history can understand it.
   - Lead with the main point, then include only the background, cause, and consequence needed to understand it.
   - Use familiar words and a concrete example when helpful.
2. Use all available visual methods that help understanding, combining them instead of choosing just one.
   - Read and follow the available `visualize` skill to create and display the required visuals.
   - Always create and render an HTML visualization when HTML visualization is available.
   - For frontend or UI changes, preview how the proposed or changed interface will look.
   - Capture and show screenshots when the actual interface or result matters.
   - Whenever source files or user deliverables are needed to explain the task, always show their file tree with a short comment explaining each file's role.
     - Exclude internal workflow records.
   - Whenever a work sequence applies, always show a Mermaid diagram of how the work will proceed.
   - Render Mermaid as a simple diagram with only the essential nodes, connections, and plain-language labels.
   - Present the visual itself instead of raw visualization source.
3. Finish the explanation and render its required visuals before asking for an answer or approval.
   - Make the explanation sufficient to answer or approve without reading a linked document.
   - Ask the decision question or approval request last, then stop and wait for the user's answer.
   - When called by another skill, use that skill's closing question instead of offering a quiz.
   - For standalone explanations, ask whether the user wants a quiz to check their understanding.
4. If the user accepts the quiz, ask a total of 3–10 questions suited to the explanation's scope, one question per response.
   - Ask about the main idea, cause and effect, and applying the idea to a concrete situation.
   - Wait for their answer before revealing the solution or asking the next question.
   - Assess each answer, briefly explain any gaps, and check the corrected understanding.
5. Before responding, check that the opening summary, required visuals, and closing question are present, and add any missing required output.
