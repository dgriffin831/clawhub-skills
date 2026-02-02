# ClawHub Skills

Security skills for AI agent platforms. Scan skill packages before installation, filter external inputs at runtime, monitor agent memory for tampering, and configure security policies through guided interviews.

Built for [OpenClaw](https://github.com/openclaw) agents. Each skill is self-contained with its own documentation, scripts, and evaluation suite.

## Skills

### [skill-scan](skill-scan/) — Skill Package Security Auditor

Multi-layer security scanner for agent skill packages. Analyzes code for execution risks, data exfiltration, prompt injection, obfuscation, and evasion techniques before a skill is installed.

**Analysis pipeline:**

```
Pattern matching → AST/evasion detection → Prompt injection analysis → LLM threat analysis → Alignment verification → Meta-analysis
```

- 25+ threat categories across static and semantic analysis
- AST-based detection of obfuscated code, string construction chains, encoded payloads, aliasing, time bombs
- Alignment verification compares SKILL.md claims against actual code behavior (catches trojan skills)
- Meta-analysis correlates findings, filters false positives, and identifies missed threats
- 100% precision, 86% recall on 26 evaluation fixtures
- Supports OpenAI, Anthropic, Azure, AWS Bedrock, Google Vertex AI

```bash
# Quick scan (static analysis only, no API key needed)
python3 -m skill_scan /path/to/skill

# Full scan with LLM analysis
python3 -m skill_scan /path/to/skill --llm
```

---

### [input-guard](input-guard/) — External Input Injection Scanner

Pattern-based scanner that checks untrusted text for prompt injection before an agent processes it. Scans web pages, API responses, search results, social media posts, and any externally-sourced content.

- 16 detection categories: instruction override, role manipulation, system mimicry, jailbreak, data exfiltration, prompt extraction, emotional manipulation, and more
- Multi-language patterns for English, Korean, Japanese, and Chinese
- Optional LLM second layer for evasive attacks that bypass pattern matching
- Zero dependencies for pattern scanning (Python 3 only)
- 4 sensitivity levels: low, medium, high, paranoid

```bash
# Inline scan
python3 scripts/scan.py "text to check"

# JSON output for automation
python3 scripts/scan.py --json "text to check"

# Pattern + LLM scan
python3 scripts/scan.py --llm "text to check"

# From pipe
curl -s https://example.com | python3 scripts/scan.py --stdin
```

---

### [memory-scan](memory-scan/) — Agent Memory Security Scanner

LLM-powered scanner for agent memory files. Detects malicious instructions, prompt injection, credential leakage, and prompt stealing attacks embedded in MEMORY.md, daily logs, and workspace configuration files.

- 8 threat categories including prompt stealing / system prompt extraction
- Scans MEMORY.md, daily logs (last 30 days), and 10 workspace config files
- Quarantine system with automatic backup and redaction (opt-in)
- Scheduled monitoring via cron (daily scans, alerts only on threats)

```bash
# Scan all memory files
python3 scripts/memory-scan.py

# Scan specific file
python3 scripts/memory-scan.py --file memory/2026-02-01.md

# Quarantine a threat
python3 scripts/quarantine.py memory/2026-02-01.md 42
```

---

### [guardrails](guardrails/) — Interactive Security Policy Configuration

Guided interview process that discovers your workspace environment, classifies risks, and generates a comprehensive `GUARDRAILS.md` security policy.

- Automatic environment discovery (installed skills, integrations, channels)
- Risk classification across 8 categories (destructive, external comms, data exfiltration, impersonation, etc.)
- 30-question contextual interview adapted to discovered risks
- Generates both human-readable policy (GUARDRAILS.md) and machine-readable config
- Review and monitor modes to detect policy drift

```bash
# Setup: interactive interview → generates GUARDRAILS.md
# Review: check existing policy against current environment
# Monitor: detect changes requiring policy updates
```

## How They Work Together

```
                    ┌─────────────┐
                    │  guardrails │  Configure security policies
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                 ▼
   ┌────────────┐  ┌─────────────┐  ┌─────────────┐
   │ skill-scan │  │ input-guard │  │ memory-scan │
   └────────────┘  └─────────────┘  └─────────────┘
    Pre-install      Runtime          Continuous
    audit            filtering        monitoring
```

- **skill-scan** audits skill packages *before* they're installed
- **input-guard** filters external content *during* agent operation
- **memory-scan** monitors agent memory *after* operations complete
- **guardrails** defines the security policies that govern all of the above

## Getting Started

### Prerequisites

| Dependency | Required by | Check |
|------------|------------|-------|
| Python 3.10+ | skill-scan, input-guard, memory-scan | `python3 --version` |
| pip | skill-scan, input-guard (LLM mode) | `pip3 --version` |
| Node.js | guardrails | `node --version` |
| jq | guardrails | `jq --version` |
| Bash | guardrails, memory-scan | standard on Linux/macOS |

If pip is not installed:
```bash
# Option 1: System package manager
sudo apt-get install python3-pip        # Debian/Ubuntu
brew install python3                     # macOS (includes pip)

# Option 2: Bootstrap pip without sudo
python3 -m ensurepip --upgrade
```

If jq is not installed:
```bash
sudo apt-get install jq                  # Debian/Ubuntu
brew install jq                          # macOS
```

Each skill is self-contained. Clone the repo and use any skill independently:

```bash
git clone https://github.com/cisco/clawhub-skills.git
cd clawhub-skills
```

### Environment Setup

Copy the root `.env.example` for skill-scan LLM configuration:

```bash
cp .env.example .env
# Edit with your API keys
```

Each skill that needs API keys also has its own `.env.template`:

```bash
cp input-guard/.env.template input-guard/.env
cp memory-scan/.env.template memory-scan/.env
```

### LLM Providers

Skills that use LLM analysis support multiple providers:

| Provider | Configuration |
|----------|---------------|
| OpenAI | `OPENAI_API_KEY` |
| Anthropic | `ANTHROPIC_API_KEY` |
| Azure OpenAI | `SKILL_SCANNER_LLM_API_KEY` + `SKILL_SCANNER_LLM_BASE_URL` |
| AWS Bedrock | `AWS_PROFILE` + `AWS_REGION` or bearer token |
| Google Vertex AI | `GOOGLE_APPLICATION_CREDENTIALS` |

skill-scan uses the `SKILL_SCANNER_LLM_*` variables. input-guard and memory-scan use `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` directly.

## Testing

Every skill includes an evaluation suite. No API keys are needed for static/pattern-based tests.

```bash
# skill-scan: unit tests + 26 evaluation fixtures
cd skill-scan && python3 -m pytest tests/ -v
cd skill-scan && python3 evals/eval_runner.py

# input-guard: 35 test cases (safe, pattern, evasive)
cd input-guard && python3 evals/run.py

# memory-scan: 15 test cases (safe, malicious, prompt stealing)
cd memory-scan && python3 evals/run.py
```

Each skill has a `TESTING.md` with detailed eval methodology and latest results.

## Project Structure

```
clawhub-skills/
├── skill-scan/          Skill package security auditor
│   ├── skill_scan/      Python module (scanner, analyzers, CLI)
│   ├── test-fixtures/   26 evaluation fixtures (safe + malicious)
│   ├── tests/           Unit tests per module
│   ├── evals/           Evaluation runner
│   └── rules/           Pattern rules
├── input-guard/         External input injection scanner
│   ├── scripts/         Scanner, LLM module, taxonomy tools
│   └── evals/           35 test cases + runner
├── memory-scan/         Agent memory security scanner
│   ├── scripts/         Scanner, quarantine, scheduling
│   ├── docs/            LLM detection prompt
│   └── evals/           15 test cases + runner
├── guardrails/          Security policy configuration
│   ├── scripts/         Discovery, classification, generation
│   ├── templates/       Policy templates, question bank
│   └── schemas/         Validation schemas
├── .env.example         LLM provider configuration template
├── LICENSE              Apache 2.0
└── README.md            This file
```

## Contributing

Each skill is independently developed and tested. To contribute:

1. Pick a skill directory
2. Read its `SKILL.md` for full specification
3. Read its `TESTING.md` for eval methodology
4. Make changes and run the eval suite
5. Submit a PR with passing tests

## License

Apache 2.0 - Copyright 2026 Cisco Systems, Inc. and its affiliates. See [LICENSE](LICENSE).
