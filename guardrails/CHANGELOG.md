# Changelog

All notable changes to Guardrails will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-02-01

### Added

- Interactive guardrails configuration with three modes: setup, review, monitor
- Environment discovery script (`discover.sh`) for workspace scanning
- Risk classification engine (`classify-risks.js`) with 8 risk categories:
  - Destructive, External Communications, Data Read, Data Write
  - Data Exfiltration, Impersonation, System Modification, Financial
- Contextual question bank (`questions.json`) with 30 questions across 7 categories
- GUARDRAILS.md template generator (`generate-guardrails.js`)
- Change detection and monitoring (`monitor.sh`)
- JSON schema validation for risk and config outputs
- No external dependencies - runs on Node.js and Bash built-ins
