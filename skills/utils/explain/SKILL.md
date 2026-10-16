---
name: explain
description: Use when explaining current context or results.
---

## Rules

- Keep explanations concise without omitting context, tradeoffs, or required visuals needed to understand or decide.
- Keep visuals compact and readable.
- For proposed changes, help the user picture the result and how they will use it.

For file changes, show the expected file tree with a short comment explaining each change's purpose. Exclude internal workflow records. Use [code flow](references/code-flow.md) when behavior needs explanation.

## Steps

1. Explain the current context or result so someone without conversation history can understand it.
   - Lead with the main point, then include only the background, cause, and consequence needed to understand it.
   - Use familiar words and a concrete example when helpful.
2. Choose the views needed to understand or decide. Omit inapplicable views.
   - Use Mermaid for meaningful structure, relationships, or work sequences. Keep essential nodes, connections, and plain-language labels.
   - For frontend or UI changes, preview the proposed interface. Show screenshots when the actual result matters.
   - Use HTML or interactive visualization only when it adds useful understanding. Follow the available visualization skill when using it.
   - Show visuals in chat and label proposed or unverified examples.
3. Finish the explanation and show its required views before asking for an answer or approval.
   - Make the explanation sufficient to answer or approve without reading a linked document.
   - Ask the decision question or approval request last, then stop and wait for the user's answer.
   - When called by another skill, use that skill's closing question instead of offering a quiz.
4. If the user requests a quiz, ask a total of 3–10 questions suited to the explanation's scope, one question per response.
   - Ask about the main idea, cause and effect, and applying the idea to a concrete situation.
   - Wait for their answer before revealing the solution or asking the next question.
   - Assess each answer, briefly explain any gaps, and check the corrected understanding.
5. Before responding, check that the summary and applicable views are present. Ask a closing question only when an answer or decision is needed.
