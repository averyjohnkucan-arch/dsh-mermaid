# Mermaid for DeepSeek Harness

Standalone Cordis plugin for DSH 0.2.1-rc.2. The `mermaid_render` tool creates PNG diagrams, returns Markdown for normal inline assistant images, and adds a replayable tool card with diagram preview and source. Disabling removes the registrations. Completed images remain available after restart while installed.

The old Local AI v2 implementation patched DSH's AssistantMarkdown renderer. This plugin does not patch DSH, replace assistant rows, mutate another plugin's DOM, or add session event types. Raw Mermaid code fences stay code because this DSH version has no fence-rendering extension point. The model uses the tool for actual inline diagrams.

## Install in DSH

Paste `https://github.com/averyjohnkucan-arch/dsh-mermaid` into DSH’s Add plugin dialog. Chromium is required: either allow the Puppeteer browser installation when prompted, install it with the command below, or configure `browserPath` to an existing compatible Chromium.

## Development installation

Run `pnpm install --ignore-scripts --config.strictDepBuilds=false` in this directory, then install Chromium with `pnpm exec puppeteer browsers install chrome`. Or set this plugin's `browserPath` to a compatible installed Chromium. Keep browser sandboxing enabled; `disableBrowserSandbox` is an explicit deployment option for restricted systems only.

Install with DSH's plugin manager using this absolute directory, or the official CLI: `dsh plugin --profile web add /absolute/path/to/dsh-mermaid`. It links the source. Rebuild is unnecessary for this plain JavaScript plugin; host changes require a plugin reload/restart, client changes a browser refresh. Do not interrupt an active Knowledge import to reload.

Generated diagrams are stored under `$DSH_HOME/dsh-mermaid/images` (default `~/.dsh/dsh-mermaid/images`) and served as PNGs from authenticated DSH. Image names contain 192 random bits; do not share source-bearing links outside authorized viewers. Storage is retained on disable/removal; there is no automatic cleanup, so review this directory periodically. No model weights or Local AI v2 files are required.

Only PNG raster images are served. External resources, links, frontmatter and configuration directives are rejected; Mermaid runs in strict mode. Work is serialized, queued at most eight deep, bounded to 30,000 source characters, 500 edges, 45 seconds and an 8 MiB image. Invalid diagrams return a tool error rather than modifying chat rendering. Chromium is a runtime dependency; it is not launched against external pages.

Dependencies: Mermaid CLI (MIT), Mermaid and their upstream dependencies; the plugin integration is MIT. No upstream Local AI v2 code was copied.

## Validation

Five tests pass: source limits/security checks, actual tool execution through Mermaid CLI, PNG image serving and replay metadata, registration disposal, and recovery after invalid syntax. Flowchart and sequence samples rendered with Chromium sandboxing enabled. The live installed image route returned HTTP 200 with image/png; the DSH Plugins page showed Mermaid diagrams enabled. Model-driven chat testing was blocked by the currently selected NInfer engine failing GPU allocation, so that path is not claimed as verified.
