# Content Analysis Agent System

A multi-agent system for analyzing website content, checking grammar, detecting repetition, and ensuring content coherence.

## Overview

This system uses two AI agents that work together:

- **ContentWriterAgent**: Extracts and organizes content from website files
- **ContentEditorAgent**: Reviews content for grammar, punctuation, repetition, and coherence issues

## Features

✅ **Grammar & Punctuation Checking**
- Missing punctuation detection
- Capitalization errors
- Double space detection
- Passive voice identification

✅ **Repetition Detection**
- Exact sentence repetition
- Phrase repetition (5+ words)
- Semantic similarity analysis

✅ **Coherence Analysis**
- Content flow checking
- Transition word suggestions
- Paragraph length analysis

✅ **Bilingual Support**
- Analyzes both English and Spanish content
- Consistency checking between translations

## Installation

1. Install Python dependencies:
```bash
pip3 install -r requirements.txt
```

2. Verify the configuration in `config.yaml`

## Usage

Run the content analysis:

```bash
python3 run_analysis.py
```

The system will:
1. Extract content from `website/index.html` and `website/translations.js`
2. Analyze both English and Spanish content
3. Generate detailed reports in the `reports/` directory

## Output

The analysis generates two types of reports:

### Markdown Report
- Human-readable analysis report
- Categorized by issue type
- Includes suggestions and recommendations
- Located in `reports/analysis_report_[timestamp].md`

### JSON Report
- Machine-readable data
- Complete issue details
- Located in `reports/analysis_[timestamp].json`

## Configuration

Edit `config.yaml` to customize:

- **Analysis thresholds**: Adjust sensitivity for repetition detection
- **Sections to analyze**: Choose which content sections to check
- **Report settings**: Configure output format and detail level

## Example Output

```
📋 Total Issues Found: 126
🌐 Languages Analyzed: EN, ES

📊 Issues by Severity:
  🔴 High: 0
  🟡 Medium: 74
  🟢 Low: 43
  ℹ️ Info: 9

📂 Issues by Category:
  • Missing Punctuation: 71
  • Double Space: 43
  • Missing Transitions: 7
  • Phrase Repetition: 3
```

## Agent Workflow

```
┌─────────────────────┐
│ ContentWriterAgent  │
│ Extracts content    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ContentEditorAgent  │
│ Analyzes & reviews  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Recommendations     │
│ Sent back to writer │
└─────────────────────┘
```

## Files

- `run_analysis.py` - Main script to run the analysis
- `content_extractor.py` - Content extraction utilities
- `content_agents.py` - Agent system implementation
- `config.yaml` - Configuration settings
- `requirements.txt` - Python dependencies

## Support

For issues or questions, please review the generated reports in the `reports/` directory.

---

**Keep Her Light Alive Foundation**  
*Content Analysis Agent System v1.0*
