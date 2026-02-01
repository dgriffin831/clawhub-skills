# Changelog

All notable changes to Input Guard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-02-01

### Added

- Core scanner (`scan.py`) with 16 detection categories:
  - Instruction Override, Role Manipulation, System Mimicry, Jailbreak Attempts
  - Guardrail Bypass, Data Exfiltration, Dangerous Commands, Authority Impersonation
  - Context Hijacking, Token Smuggling, Safety Bypass, Agent Sovereignty Manipulation
  - Call to Action, Emotional Manipulation, JSON Injection, Prompt Extraction
- Multi-language pattern detection for English, Korean, Japanese, and Chinese
- Four sensitivity levels: `low`, `medium`, `high`, `paranoid`
- Multiple output formats: human-readable, JSON (`--json`), quiet (`--quiet`)
- Multiple input methods: inline text, file (`--file`), stdin (`--stdin`)
- Unicode homoglyph detection (Cyrillic lookalikes, fullwidth characters, zero-width characters)
- Base64 payload detection with keyword analysis
- Repetition/flooding attack detection
- Shell wrapper script (`scan.sh`)
- MoltThreats community threat reporting integration (`report-to-molthreats.sh`)
- Skill documentation (`SKILL.md`)
- Integration guide (`INTEGRATION.md`)
