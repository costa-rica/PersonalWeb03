# LEFT-OFF markdown migration TODO

This checklist breaks the LEFT-OFF migration into phases so the engineer can implement and verify the change with low risk. Check off tasks as they are completed. Commit changes before proceeding to the next phase.

## Phase 1. Confirm scope and document assumptions

- [x] Review `/Users/nick/Documents/_project_resources/PersonalWeb03/obsidian/LEFT-OFF.md` and confirm the file matches the agreed structure.
- [x] Confirm date headings use only `# YYYYMMDD`.
- [x] Confirm `#` headings are date headings only, with no non-date top-level headings.
- [x] Confirm the file is ordered newest first and oldest last.
- [x] Confirm all content for a date lives under that date heading until the next `# YYYYMMDD` heading.
- [x] Confirm currently supported markdown content includes plain text, `- [ ]` task items, and backtick code snippets.
- [ ] Note in code comments or docs that links may appear in the future and should not break parsing.
- [ ] Commit changes for Phase 1 before moving to Phase 2.

## Phase 2. Refactor configuration and service flow

- [x] Update the LEFT-OFF service configuration so it no longer requires OneDrive credentials or file IDs.
- [x] Add a path helper for the new markdown source file at `PATH_PROJECT_RESOURCES/obsidian/LEFT-OFF.md`.
- [x] Keep the existing output path for `last-7-days-activities.md` unless there is a strong reason to change it.
- [x] Update the LEFT-OFF execution flow in `src/main.py` to remove the OneDrive download step.
- [x] Replace the old three-step logging with the new local-file flow so logs reflect the actual process.
- [x] Remove any imports and setup code that are no longer needed once OneDrive is no longer part of the LEFT-OFF flow.
- [ ] Commit changes for Phase 2 before moving to Phase 3.

## Phase 3. Replace the parser

- [x] Replace the `.docx` parser implementation with markdown-based parsing for `LEFT-OFF.md`.
- [x] Preserve the current 7-day behavior by finding the first `# YYYYMMDD` heading that is 8 or more days old and stopping extraction there.
- [x] Treat every line under a `# YYYYMMDD` heading as part of that day until the next top-level date heading.
- [x] Preserve markdown content when writing `last-7-days-activities.md`.
- [x] Ensure unchecked task items such as `- [ ]` pass through without being altered.
- [x] Ensure inline code and fenced code content are preserved as written.
- [x] Make the parser tolerant of blank lines and normal markdown spacing.
- [x] Decide and document behavior when no cutoff heading is found. The likely default is to extract the entire file.
- [x] Decide and document behavior when the file is missing or headings are malformed.
- [x] Rename parser classes, methods, docstrings, and log messages if needed so they no longer describe `.docx` behavior.
- [x] Add `unittest` coverage for the markdown parser before considering the parser migration complete.
- [x] Add a parser test for extracting only the rolling 7-day window from newest-first `# YYYYMMDD` headings.
- [x] Add a parser test for the no-cutoff-found case so full-file extraction is intentional and protected.
- [x] Add a parser test that preserves markdown content such as `- [ ]` task items, backticks, blank lines, and plain text.
- [x] Add a parser test for malformed or unexpected headings so failure behavior is explicit.
- [ ] Commit changes for Phase 3 before moving to Phase 4.

## Phase 4. Update prompt, docs, and references

- [x] Update the LEFT-OFF summarizer prompt so it no longer says the source text came from a Microsoft Word document.
- [x] Update README output and workflow descriptions to reflect Obsidian markdown as the source.
- [x] Update engineering notes and requirements references that still describe OneDrive and `.docx` as the active flow.
- [x] Keep archived requirements untouched unless there is a clear reason to annotate them as historical.
- [x] Review any comments, help text, and CLI descriptions that still mention `LEFT-OFF.docx`.
- [ ] Commit changes for Phase 4 before moving to Phase 5.

## Phase 5. Verify behavior

- [x] Run the `unittest` test suite for the LEFT-OFF service before running manual verification.
- [ ] Run the LEFT-OFF service against the real file at `/Users/nick/Documents/_project_resources/PersonalWeb03/obsidian/LEFT-OFF.md`.
- [ ] Verify the generated `last-7-days-activities.md` contains only the expected date range.
- [x] Verify the extracted markdown keeps task items, code snippets, and plain text intact.
- [ ] Verify the summarizer still returns valid JSON and writes `left-off-7-day-summary.json`.
- [ ] Verify the service works without OneDrive environment variables present.
- [ ] Review logs for outdated `.docx` or OneDrive wording and clean up any remaining references.
- [ ] If manual verification reveals an edge case, add or update a `unittest` case before closing the phase.
- [ ] Commit changes for Phase 5 before moving to Phase 6.

## Phase 6. Cleanup and future-proofing

- [ ] Remove unused OneDrive LEFT-OFF code only if it is no longer needed elsewhere.
- [ ] Remove unused Python dependencies related only to the retired LEFT-OFF `.docx` flow if they are no longer needed by the project.
- [ ] Add or refine shared `unittest` fixtures and sample markdown inputs so future LEFT-OFF parser changes are easy to test.
- [ ] Add a `unittest` case that includes future-safe markdown links so parser behavior is protected when links are introduced.
- [x] Document how to run the `unittest` suite for this service in the active project docs.
- [x] Add a short note describing the expected `LEFT-OFF.md` structure so future edits do not accidentally break the parser.
- [ ] Commit changes for Phase 6 after cleanup is complete.

## Definition of done

1. The LEFT-OFF service reads from `/Users/nick/Documents/_project_resources/PersonalWeb03/obsidian/LEFT-OFF.md`.
2. The service extracts the same rolling 7-day window using `# YYYYMMDD` headings.
3. The summarizer continues to generate valid JSON output.
4. Active docs describe the markdown-based flow instead of the OneDrive `.docx` flow.
5. Each phase has been checked off and committed before proceeding.
