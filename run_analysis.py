#!/usr/bin/env python3
"""
Run Content Analysis
Main script to analyze website content using the multi-agent system
Keep Her Light Alive Foundation
"""

import sys
from pathlib import Path
from content_extractor import ContentExtractor
from content_agents import AgentOrchestrator


def main():
    """Run the content analysis"""
    print("\n" + "="*70)
    print("  KEEP HER LIGHT ALIVE FOUNDATION")
    print("  Content Analysis Agent System")
    print("="*70 + "\n")
    
    # Paths
    base_dir = Path(__file__).parent
    html_path = base_dir / "website" / "index.html"
    translations_path = base_dir / "website" / "translations.js"
    config_path = base_dir / "config.yaml"
    
    # Verify files exist
    if not html_path.exists():
        print(f"❌ Error: HTML file not found at {html_path}")
        return 1
    
    if not translations_path.exists():
        print(f"❌ Error: Translations file not found at {translations_path}")
        return 1
    
    if not config_path.exists():
        print(f"❌ Error: Config file not found at {config_path}")
        return 1
    
    try:
        # Step 1: Extract content
        print("STEP 1: Content Extraction")
        print("-" * 70)
        extractor = ContentExtractor(
            html_path=str(html_path),
            translations_path=str(translations_path)
        )
        content = extractor.extract_all()
        
        # Show statistics
        stats = extractor.get_statistics()
        print("\n📊 Content Statistics:")
        for lang, data in stats.items():
            print(f"  {lang.upper()}: {data['sections']} sections, {data['items']} items, {data['words']} words")
        
        # Step 2: Run agent analysis
        print("\n" + "-" * 70)
        print("STEP 2: Agent Analysis")
        print("-" * 70)
        
        orchestrator = AgentOrchestrator(config_path=str(config_path))
        analysis_results = orchestrator.run_analysis(content)
        
        # Step 3: Display summary
        print("\n" + "-" * 70)
        print("STEP 3: Analysis Summary")
        print("-" * 70)
        
        summary = analysis_results['summary']
        print(f"\n📋 Total Issues Found: {summary['total_issues']}")
        print(f"🌐 Languages Analyzed: {', '.join(summary['languages_analyzed']).upper()}")
        
        print("\n📊 Issues by Severity:")
        for severity, count in summary['by_severity'].items():
            if count > 0:
                emoji = {'high': '🔴', 'medium': '🟡', 'low': '🟢', 'info': 'ℹ️'}[severity]
                print(f"  {emoji} {severity.title()}: {count}")
        
        print("\n📂 Issues by Category:")
        for category, count in sorted(summary['by_category'].items(), key=lambda x: x[1], reverse=True):
            print(f"  • {category.replace('_', ' ').title()}: {count}")
        
        # Step 4: Save reports
        print("\n" + "-" * 70)
        print("STEP 4: Generating Reports")
        print("-" * 70)
        
        report_path = orchestrator.save_report(output_dir="reports")
        
        print(f"\n✅ Analysis complete! Review the detailed report at:")
        print(f"   {report_path}")
        
        # Show top recommendations
        print("\n" + "="*70)
        print("TOP RECOMMENDATIONS")
        print("="*70 + "\n")
        
        for lang, result in analysis_results['results'].items():
            if result['recommendations']:
                print(f"{lang.upper()} Content:")
                high_priority = [r for r in result['recommendations'] if r['priority'] == 'high'][:3]
                for i, rec in enumerate(high_priority, 1):
                    print(f"  {i}. [{rec['category'].upper()}] {rec['issue']}")
                    if 'action' in rec:
                        print(f"     → {rec['action']}")
                print()
        
        print("="*70)
        print("✨ Content analysis complete!")
        print("="*70 + "\n")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
