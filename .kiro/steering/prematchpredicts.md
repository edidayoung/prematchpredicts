---
inclusion: always
---

# AstroServices Project - AI Agent Steering Rules

## Core Workflow Rules

### 1. Command Execution Policy
**CRITICAL: Never execute commands automatically!**
- Before running ANY command, you MUST show me the command first
- Wait for my explicit approval before execution
- Format: Show the command clearly, explain what it does, then ask for permission
- Example: "I need to run: `npm install package-name` - This will install X. Should I proceed?"

### 2. Debugging Workflow
When encountering bugs, follow this exact sequence:

1. **Log the Bug**
   - Document error message/behavior
   - Identify which files are involved
   - Note when the bug was introduced (if known)

2. **Root Cause Analysis**
   - Trace through the code to find the source
   - Examine logs, console errors, or stack traces
   - Identify WHY the bug exists (not just symptoms)

3. **Propose Fix**
   - Provide a 100% working solution
   - Explain what the fix does
   - Show the exact code changes
   - No partial fixes or "try this" suggestions

4. **Update Changes Log**
   - Add entry to changes.md with status "Fixed"
   - Include all modified files

## Project Context

### Tech Stack
- React with TanStack Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- Express backend

### Key Directories
- `/src/components/site/` - Public-facing components
- `/src/components/admin/` - Admin panel components
- `/src/routes/` - Route files
- `.kiro/steering/` - Project documentation and rules

## Design Guidelines

This project uses two specialized design skills located in `.kiro/skills/`:
1. **frontend-design** - Anthropic's frontend design guidance
2. **ui-ux-pro-max** - Advanced UI/UX design intelligence toolkit

Refer to these skills when making design decisions or implementing UI components.

## Communication Style

- Be concise and direct
- Don't repeat yourself unnecessarily
- Ask clarifying questions before making assumptions
- Always explain your reasoning for significant changes
- If something is unclear, ASK before proceeding

## Session Continuity

This steering file ensures you understand the project context from the start of each new session. Read `changes.md` immediately to understand what has been done recently.