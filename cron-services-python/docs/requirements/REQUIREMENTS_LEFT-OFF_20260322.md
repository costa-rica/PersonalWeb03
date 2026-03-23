# LEFT-OFF summarizing flow

This document contains the high level requirements for replacing the exiting LEFT-OFF.docx download with using the Obsidian markdown.

From now on this service will not longer use the LEFT-OFF.docx from OneDrive. Instead there will be a subdirectory in the path stored in the PATH_PROJECT_RESOURCES value called obsidian. This will contain a LEFT-OFF.md amongst other files.

## Markdown instaed of .docx

Since the file structure will be different we need the parsing to accomodate. We still want the same "7 day" logic for sending to the OpenAI api to analyze but instead of parsing a .docx file we'll need to replace the logic with parsing a .md file.
