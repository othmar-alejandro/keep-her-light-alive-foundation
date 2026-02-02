"""
Content Analysis Agent System
Multi-agent system for analyzing website content
Keep Her Light Alive Foundation
"""

import re
import yaml
from pathlib import Path
from typing import Dict, List, Tuple, Set
from datetime import datetime
from collections import Counter
import json


class ContentWriterAgent:
    """
    Content Writer Agent
    Extracts and organizes content from website files
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.name = config['agents']['writer']['name']
        self.role = config['agents']['writer']['role']
        self.content = {}
        print(f"✨ {self.name} initialized - {self.role}")
    
    def load_content(self, content: Dict[str, Dict[str, List[str]]]):
        """Load extracted content"""
        self.content = content
        print(f"📚 Loaded content: {len(content.get('en', {}))} EN sections, {len(content.get('es', {}))} ES sections")
    
    def get_content_by_section(self, section: str, language: str = 'en') -> List[str]:
        """Get content for a specific section"""
        return self.content.get(language, {}).get(section, [])
    
    def get_all_sentences(self, language: str = 'en') -> List[Tuple[str, str]]:
        """Get all sentences with their section labels"""
        sentences = []
        for section, texts in self.content.get(language, {}).items():
            for text in texts:
                # Split into sentences while PRESERVING punctuation
                parts = re.split(r'([.!?]+)', text)
                
                # Re-assemble sentences with their punctuation
                current_sentence = ""
                for part in parts:
                    if re.match(r'[.!?]+', part):
                        current_sentence += part
                        if current_sentence.strip() and len(current_sentence.split()) >= 3:
                            sentences.append((section, current_sentence.strip()))
                        current_sentence = ""
                    else:
                        current_sentence += part
                
                # Handle any remaining text (e.g. no punctuation at end)
                if current_sentence.strip() and len(current_sentence.split()) >= 3:
                    sentences.append((section, current_sentence.strip()))
                    
        return sentences
    
    def apply_recommendations(self, recommendations: List[Dict]) -> Dict[str, List[str]]:
        """Apply editor recommendations to content"""
        applied = []
        for rec in recommendations:
            if rec.get('auto_fixable', False):
                applied.append(rec['issue'])
        
        return {
            'applied': applied,
            'manual_review': [r for r in recommendations if not r.get('auto_fixable', False)]
        }


class ContentEditorAgent:
    """
    Content Editor Agent
    Reviews content for grammar, repetition, and coherence issues
    """
    
    def __init__(self, config: Dict):
        self.config = config
        self.name = config['agents']['editor']['name']
        self.role = config['agents']['editor']['role']
        self.issues = []
        print(f"✨ {self.name} initialized - {self.role}")
    
    def analyze_content(self, writer_agent: ContentWriterAgent, language: str = 'en') -> Dict:
        """Perform comprehensive content analysis"""
        print(f"\n🔍 {self.name} analyzing {language.upper()} content...")
        
        results = {
            'language': language,
            'grammar_issues': [],
            'repetition_issues': [],
            'coherence_issues': [],
            'recommendations': []
        }
        
        # Get all sentences
        sentences = writer_agent.get_all_sentences(language)
        
        # 1. Check for repetition
        if self.config['analysis']['repetition']['enabled']:
            results['repetition_issues'] = self._check_repetition(sentences)
        
        # 2. Check grammar and punctuation
        if self.config['analysis']['grammar']['enabled']:
            results['grammar_issues'] = self._check_grammar(sentences, language)
        
        # 3. Check coherence
        if self.config['analysis']['coherence']['enabled']:
            results['coherence_issues'] = self._check_coherence(sentences)
        
        # 4. Generate recommendations
        results['recommendations'] = self._generate_recommendations(results)
        
        return results
    
    def _check_repetition(self, sentences: List[Tuple[str, str]]) -> List[Dict]:
        """Check for sentence and phrase repetition"""
        issues = []
        seen_sentences = {}
        
        # Check exact and near-exact repetition
        for idx, (section, sentence) in enumerate(sentences):
            # Normalize sentence
            normalized = sentence.lower().strip()
            
            # Check for exact duplicates
            if normalized in seen_sentences:
                issues.append({
                    'type': 'exact_repetition',
                    'severity': 'high',
                    'section': section,
                    'sentence': sentence,
                    'first_occurrence': seen_sentences[normalized],
                    'message': f'Exact sentence repetition detected'
                })
            else:
                seen_sentences[normalized] = {'section': section, 'index': idx}
            
            # Check for repeated phrases (5+ words)
            words = sentence.split()
            if len(words) >= 5:
                for other_idx, (other_section, other_sentence) in enumerate(sentences[idx+1:], start=idx+1):
                    other_words = other_sentence.split()
                    if len(other_words) >= 5:
                        # Find common phrases
                        common = self._find_common_phrases(words, other_words, min_length=5)
                        if common:
                            issues.append({
                                'type': 'phrase_repetition',
                                'severity': 'medium',
                                'section': section,
                                'sentence': sentence,
                                'repeated_phrase': common,
                                'also_in': other_section,
                                'message': f'Repeated phrase: "{common}"'
                            })
        
        return issues
    
    def _find_common_phrases(self, words1: List[str], words2: List[str], min_length: int = 5) -> str:
        """Find common phrases between two word lists"""
        words1_lower = [w.lower() for w in words1]
        words2_lower = [w.lower() for w in words2]
        
        for length in range(min_length, min(len(words1), len(words2)) + 1):
            for i in range(len(words1) - length + 1):
                phrase = words1_lower[i:i+length]
                phrase_str = ' '.join(phrase)
                
                # Check if this phrase exists in words2
                for j in range(len(words2) - length + 1):
                    if words2_lower[j:j+length] == phrase:
                        return ' '.join(words1[i:i+length])
        
        return ""
    
    def _check_grammar(self, sentences: List[Tuple[str, str]], language: str) -> List[Dict]:
        """Check grammar and punctuation"""
        issues = []
        
        for section, sentence in sentences:
            # Basic punctuation checks
            
            # 1. Check for missing punctuation at end
            if sentence and sentence[-1] not in '.!?':
                issues.append({
                    'type': 'missing_punctuation',
                    'severity': 'medium',
                    'section': section,
                    'sentence': sentence,
                    'message': 'Sentence missing ending punctuation',
                    'suggestion': f'{sentence}.'
                })
            
            # 2. Check for double spaces
            if '  ' in sentence:
                issues.append({
                    'type': 'double_space',
                    'severity': 'low',
                    'section': section,
                    'sentence': sentence,
                    'message': 'Double spaces detected',
                    'suggestion': re.sub(r'\s+', ' ', sentence)
                })
            
            # 3. Check for capitalization after period
            parts = re.split(r'([.!?]\s+)', sentence)
            for i in range(1, len(parts), 2):
                if i + 1 < len(parts):
                    next_part = parts[i + 1]
                    if next_part and next_part[0].islower():
                        issues.append({
                            'type': 'capitalization',
                            'severity': 'medium',
                            'section': section,
                            'sentence': sentence,
                            'message': 'Missing capitalization after period',
                            'position': next_part
                        })
            
            # 4. Check for common grammar patterns
            # Passive voice detection (simple)
            passive_indicators = [' was ', ' were ', ' been ', ' being ']
            if any(indicator in sentence.lower() for indicator in passive_indicators):
                # This is just a flag, not necessarily an error
                if sentence.lower().count(' by ') > 0:
                    issues.append({
                        'type': 'passive_voice',
                        'severity': 'info',
                        'section': section,
                        'sentence': sentence,
                        'message': 'Possible passive voice - consider active voice for clarity'
                    })
        
        return issues
    
    def _check_coherence(self, sentences: List[Tuple[str, str]]) -> List[Dict]:
        """Check content coherence and flow"""
        issues = []
        
        # Group sentences by section
        sections = {}
        for section, sentence in sentences:
            if section not in sections:
                sections[section] = []
            sections[section].append(sentence)
        
        # Check each section
        for section, sents in sections.items():
            # 1. Check for very short paragraphs
            total_words = sum(len(s.split()) for s in sents)
            if total_words < self.config['analysis']['coherence']['paragraph_min_length']:
                issues.append({
                    'type': 'short_content',
                    'severity': 'info',
                    'section': section,
                    'word_count': total_words,
                    'message': f'Section has only {total_words} words - consider expanding'
                })
            
            # 2. Check for transition words
            transition_words = ['however', 'therefore', 'moreover', 'furthermore', 
                              'additionally', 'consequently', 'meanwhile', 'nevertheless']
            
            has_transitions = any(
                any(tw in sent.lower() for tw in transition_words)
                for sent in sents
            )
            
            if len(sents) > 3 and not has_transitions:
                issues.append({
                    'type': 'missing_transitions',
                    'severity': 'info',
                    'section': section,
                    'message': 'Consider adding transition words for better flow'
                })
        
        return issues
    
    def _generate_recommendations(self, results: Dict) -> List[Dict]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        # High priority: Grammar issues
        for issue in results['grammar_issues']:
            if issue['severity'] in ['high', 'medium']:
                rec = {
                    'priority': 'high' if issue['severity'] == 'high' else 'medium',
                    'category': 'grammar',
                    'issue': issue['message'],
                    'section': issue['section'],
                    'auto_fixable': 'suggestion' in issue
                }
                if 'suggestion' in issue:
                    rec['suggestion'] = issue['suggestion']
                recommendations.append(rec)
        
        # High priority: Exact repetition
        for issue in results['repetition_issues']:
            if issue['type'] == 'exact_repetition':
                recommendations.append({
                    'priority': 'high',
                    'category': 'repetition',
                    'issue': f"Sentence repeated in {issue['section']}",
                    'section': issue['section'],
                    'sentence': issue['sentence'],
                    'action': 'Remove duplicate or rephrase',
                    'auto_fixable': False
                })
        
        # Medium priority: Phrase repetition
        for issue in results['repetition_issues']:
            if issue['type'] == 'phrase_repetition':
                recommendations.append({
                    'priority': 'medium',
                    'category': 'repetition',
                    'issue': f"Phrase repeated: '{issue['repeated_phrase']}'",
                    'section': issue['section'],
                    'action': 'Consider using synonyms or restructuring',
                    'auto_fixable': False
                })
        
        # Low priority: Coherence suggestions
        for issue in results['coherence_issues']:
            recommendations.append({
                'priority': 'low',
                'category': 'coherence',
                'issue': issue['message'],
                'section': issue['section'],
                'auto_fixable': False
            })
        
        return sorted(recommendations, key=lambda x: {'high': 0, 'medium': 1, 'low': 2}[x['priority']])


class AgentOrchestrator:
    """
    Orchestrates the workflow between Writer and Editor agents
    """
    
    def __init__(self, config_path: str = "config.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.writer = ContentWriterAgent(self.config)
        self.editor = ContentEditorAgent(self.config)
        self.results = {}
    
    def run_analysis(self, content: Dict[str, Dict[str, List[str]]]) -> Dict:
        """Run complete content analysis workflow"""
        print("\n" + "="*60)
        print("🚀 CONTENT ANALYSIS AGENT SYSTEM")
        print("="*60)
        
        # Step 1: Writer loads content
        self.writer.load_content(content)
        
        # Step 2: Editor analyzes each language
        self.results = {}
        for language in ['en', 'es']:
            if language in content and content[language]:
                self.results[language] = self.editor.analyze_content(self.writer, language)
        
        # Step 3: Generate summary
        summary = self._generate_summary()
        
        print("\n" + "="*60)
        print("✅ ANALYSIS COMPLETE")
        print("="*60)
        
        return {
            'results': self.results,
            'summary': summary,
            'timestamp': datetime.now().isoformat()
        }
    
    def _generate_summary(self) -> Dict:
        """Generate analysis summary"""
        summary = {
            'total_issues': 0,
            'by_severity': {'high': 0, 'medium': 0, 'low': 0, 'info': 0},
            'by_category': {},
            'languages_analyzed': list(self.results.keys())
        }
        
        for lang, result in self.results.items():
            # Count all issues
            all_issues = (
                result['grammar_issues'] +
                result['repetition_issues'] +
                result['coherence_issues']
            )
            
            summary['total_issues'] += len(all_issues)
            
            for issue in all_issues:
                severity = issue.get('severity', 'info')
                summary['by_severity'][severity] += 1
                
                category = issue.get('type', 'other')
                summary['by_category'][category] = summary['by_category'].get(category, 0) + 1
        
        return summary
    
    def save_report(self, output_dir: str = "reports"):
        """Save analysis report to files"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON report
        json_file = output_path / f"analysis_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        # Save Markdown report
        md_file = output_path / f"analysis_report_{timestamp}.md"
        self._generate_markdown_report(md_file)
        
        print(f"\n📄 Reports saved:")
        print(f"   JSON: {json_file}")
        print(f"   Markdown: {md_file}")
        
        return str(md_file)
    
    def _generate_markdown_report(self, filepath: Path):
        """Generate detailed markdown report"""
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write("# Content Analysis Report\n")
            f.write(f"**Keep Her Light Alive Foundation**\n\n")
            f.write(f"*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n")
            f.write("---\n\n")
            
            # Summary
            summary = self._generate_summary()
            f.write("## Executive Summary\n\n")
            f.write(f"- **Total Issues Found**: {summary['total_issues']}\n")
            f.write(f"- **Languages Analyzed**: {', '.join(summary['languages_analyzed']).upper()}\n\n")
            
            f.write("### Issues by Severity\n\n")
            for severity, count in summary['by_severity'].items():
                if count > 0:
                    emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢', 'info': 'ℹ️'}[severity]
                    f.write(f"- {emoji} **{severity.title()}**: {count}\n")
            
            f.write("\n### Issues by Category\n\n")
            for category, count in sorted(summary['by_category'].items(), key=lambda x: x[1], reverse=True):
                f.write(f"- **{category.replace('_', ' ').title()}**: {count}\n")
            
            f.write("\n---\n\n")
            
            # Detailed findings for each language
            for language, result in self.results.items():
                f.write(f"## {language.upper()} Content Analysis\n\n")
                
                # Grammar Issues
                if result['grammar_issues']:
                    f.write(f"### Grammar & Punctuation ({len(result['grammar_issues'])} issues)\n\n")
                    for issue in result['grammar_issues'][:10]:  # Top 10
                        f.write(f"**{issue['section']}** - {issue['message']}\n")
                        f.write(f"> {issue['sentence']}\n\n")
                        if 'suggestion' in issue:
                            f.write(f"💡 *Suggestion: {issue['suggestion']}*\n\n")
                
                # Repetition Issues
                if result['repetition_issues']:
                    f.write(f"### Repetition ({len(result['repetition_issues'])} issues)\n\n")
                    for issue in result['repetition_issues'][:10]:
                        f.write(f"**{issue['type'].replace('_', ' ').title()}** in {issue['section']}\n")
                        f.write(f"> {issue['sentence']}\n\n")
                        f.write(f"*{issue['message']}*\n\n")
                
                # Coherence Issues
                if result['coherence_issues']:
                    f.write(f"### Coherence & Flow ({len(result['coherence_issues'])} suggestions)\n\n")
                    for issue in result['coherence_issues']:
                        f.write(f"- **{issue['section']}**: {issue['message']}\n")
                
                # Recommendations
                if result['recommendations']:
                    f.write(f"\n### Recommendations ({len(result['recommendations'])})\n\n")
                    
                    for priority in ['high', 'medium', 'low']:
                        priority_recs = [r for r in result['recommendations'] if r['priority'] == priority]
                        if priority_recs:
                            emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢'}[priority]
                            f.write(f"\n#### {emoji} {priority.title()} Priority\n\n")
                            for rec in priority_recs[:5]:  # Top 5 per priority
                                f.write(f"- **{rec['category'].title()}**: {rec['issue']}\n")
                                if 'action' in rec:
                                    f.write(f"  - *Action: {rec['action']}*\n")
                
                f.write("\n---\n\n")


if __name__ == "__main__":
    print("Content Analysis Agent System")
    print("This module should be run via the main analysis script")
