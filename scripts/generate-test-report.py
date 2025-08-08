#!/usr/bin/env python3
"""
Comprehensive test reporting system for HealthLinc.
Generates healthcare-specific test reports with compliance metrics.
"""

import json
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import argparse

@dataclass
class TestResult:
    """Individual test result."""
    name: str
    status: str  # passed, failed, skipped
    duration: float
    error_message: Optional[str] = None
    category: str = "general"
    compliance_check: bool = False

@dataclass
class TestSuite:
    """Test suite results."""
    name: str
    tests: List[TestResult]
    total_duration: float
    passed: int
    failed: int
    skipped: int
    category: str

@dataclass
class HealthcareMetrics:
    """Healthcare-specific compliance metrics."""
    nphies_compliance_tests: int = 0
    nphies_compliance_passed: int = 0
    performance_tests: int = 0
    performance_tests_passed: int = 0
    claim_processing_tests: int = 0
    claim_processing_passed: int = 0
    auth_security_tests: int = 0
    auth_security_passed: int = 0
    average_response_time_ms: float = 0.0
    max_response_time_ms: float = 0.0
    compliance_threshold_violations: int = 0

@dataclass
class TestReport:
    """Complete test report."""
    timestamp: str
    total_tests: int
    total_passed: int
    total_failed: int
    total_skipped: int
    total_duration: float
    suites: List[TestSuite]
    healthcare_metrics: HealthcareMetrics
    coverage_percentage: float = 0.0
    performance_benchmark: Dict[str, float] = None

class TestReportGenerator:
    """Generate comprehensive test reports."""
    
    def __init__(self, output_dir: str = "test-reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def parse_junit_xml(self, xml_file: Path) -> TestSuite:
        """Parse JUnit XML test results."""
        tree = ET.parse(xml_file)
        root = tree.getroot()
        
        suite_name = root.get('name', xml_file.stem)
        tests = []
        
        for testcase in root.findall('.//testcase'):
            test_name = testcase.get('name', 'unknown')
            duration = float(testcase.get('time', 0))
            
            # Determine test status
            if testcase.find('failure') is not None:
                status = 'failed'
                error_msg = testcase.find('failure').text
            elif testcase.find('error') is not None:
                status = 'failed'
                error_msg = testcase.find('error').text
            elif testcase.find('skipped') is not None:
                status = 'skipped'
                error_msg = None
            else:
                status = 'passed'
                error_msg = None
            
            # Categorize test
            category = self._categorize_test(test_name, suite_name)
            compliance_check = self._is_compliance_test(test_name, suite_name)
            
            tests.append(TestResult(
                name=test_name,
                status=status,
                duration=duration,
                error_message=error_msg,
                category=category,
                compliance_check=compliance_check
            ))
        
        # Calculate suite statistics
        passed = len([t for t in tests if t.status == 'passed'])
        failed = len([t for t in tests if t.status == 'failed'])
        skipped = len([t for t in tests if t.status == 'skipped'])
        total_duration = sum(t.duration for t in tests)
        
        return TestSuite(
            name=suite_name,
            tests=tests,
            total_duration=total_duration,
            passed=passed,
            failed=failed,
            skipped=skipped,
            category=self._categorize_suite(suite_name)
        )
    
    def parse_vitest_json(self, json_file: Path) -> TestSuite:
        """Parse Vitest JSON test results."""
        with open(json_file, 'r') as f:
            data = json.load(f)
        
        tests = []
        for test_file in data.get('testResults', []):
            for assertion in test_file.get('assertionResults', []):
                test_name = assertion.get('title', 'unknown')
                status = 'passed' if assertion.get('status') == 'passed' else 'failed'
                duration = assertion.get('duration', 0) / 1000  # Convert to seconds
                
                category = self._categorize_test(test_name, test_file.get('name', ''))
                compliance_check = self._is_compliance_test(test_name, test_file.get('name', ''))
                
                tests.append(TestResult(
                    name=test_name,
                    status=status,
                    duration=duration,
                    category=category,
                    compliance_check=compliance_check
                ))
        
        passed = len([t for t in tests if t.status == 'passed'])
        failed = len([t for t in tests if t.status == 'failed'])
        skipped = len([t for t in tests if t.status == 'skipped'])
        total_duration = sum(t.duration for t in tests)
        
        return TestSuite(
            name="Frontend Tests",
            tests=tests,
            total_duration=total_duration,
            passed=passed,
            failed=failed,
            skipped=skipped,
            category="frontend"
        )
    
    def _categorize_test(self, test_name: str, suite_name: str) -> str:
        """Categorize test based on name and suite."""
        test_name_lower = test_name.lower()
        suite_name_lower = suite_name.lower()
        
        if any(keyword in test_name_lower for keyword in ['nphies', 'claim', 'insurance']):
            return 'healthcare'
        elif any(keyword in test_name_lower for keyword in ['auth', 'login', 'security']):
            return 'security'
        elif any(keyword in test_name_lower for keyword in ['performance', 'benchmark', 'speed']):
            return 'performance'
        elif 'frontend' in suite_name_lower or 'ui' in suite_name_lower:
            return 'frontend'
        elif 'backend' in suite_name_lower or 'api' in suite_name_lower:
            return 'backend'
        else:
            return 'general'
    
    def _categorize_suite(self, suite_name: str) -> str:
        """Categorize test suite."""
        suite_lower = suite_name.lower()
        
        if 'frontend' in suite_lower:
            return 'frontend'
        elif any(keyword in suite_lower for keyword in ['backend', 'api', 'auth', 'claim']):
            return 'backend'
        elif 'performance' in suite_lower:
            return 'performance'
        else:
            return 'general'
    
    def _is_compliance_test(self, test_name: str, suite_name: str) -> bool:
        """Check if test is related to healthcare compliance."""
        compliance_keywords = [
            'nphies', 'compliance', 'regulation', 'hipaa', 'phi', 
            'claim_validation', 'insurance_eligibility', 'privacy'
        ]
        
        text = f"{test_name} {suite_name}".lower()
        return any(keyword in text for keyword in compliance_keywords)
    
    def calculate_healthcare_metrics(self, suites: List[TestSuite]) -> HealthcareMetrics:
        """Calculate healthcare-specific metrics."""
        metrics = HealthcareMetrics()
        response_times = []
        
        for suite in suites:
            for test in suite.tests:
                # Count compliance tests
                if test.compliance_check:
                    if 'nphies' in test.name.lower():
                        metrics.nphies_compliance_tests += 1
                        if test.status == 'passed':
                            metrics.nphies_compliance_passed += 1
                    
                    if 'auth' in test.name.lower() or 'security' in test.name.lower():
                        metrics.auth_security_tests += 1
                        if test.status == 'passed':
                            metrics.auth_security_passed += 1
                
                # Count performance tests
                if test.category == 'performance':
                    metrics.performance_tests += 1
                    if test.status == 'passed':
                        metrics.performance_tests_passed += 1
                
                # Count claim processing tests
                if 'claim' in test.name.lower():
                    metrics.claim_processing_tests += 1
                    if test.status == 'passed':
                        metrics.claim_processing_passed += 1
                
                # Collect response times
                if test.duration > 0:
                    response_times.append(test.duration * 1000)  # Convert to ms
                
                # Check compliance threshold violations (5 seconds for healthcare operations)
                if test.duration > 5.0 and test.category in ['healthcare', 'performance']:
                    metrics.compliance_threshold_violations += 1
        
        # Calculate response time metrics
        if response_times:
            metrics.average_response_time_ms = sum(response_times) / len(response_times)
            metrics.max_response_time_ms = max(response_times)
        
        return metrics
    
    def generate_html_report(self, report: TestReport) -> str:
        """Generate HTML test report."""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>HealthLinc Test Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; }
                .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
                .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
                .metric-value { font-size: 2em; font-weight: bold; color: #1e40af; }
                .suite { margin: 20px 0; border: 1px solid #d1d5db; border-radius: 8px; }
                .suite-header { background: #f3f4f6; padding: 15px; border-bottom: 1px solid #d1d5db; }
                .test-item { padding: 10px 15px; border-bottom: 1px solid #f3f4f6; }
                .passed { color: #059669; }
                .failed { color: #dc2626; }
                .skipped { color: #d97706; }
                .compliance-badge { background: #10b981; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; }
                .violation-badge { background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🏥 HealthLinc Test Report</h1>
                <p>Generated on: {timestamp}</p>
            </div>
            
            <div class="metrics">
                <div class="metric-card">
                    <div class="metric-value">{total_tests}</div>
                    <div>Total Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value passed">{total_passed}</div>
                    <div>Passed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value failed">{total_failed}</div>
                    <div>Failed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{coverage_percentage:.1f}%</div>
                    <div>Code Coverage</div>
                </div>
            </div>
            
            <h2>🩺 Healthcare Compliance Metrics</h2>
            <div class="metrics">
                <div class="metric-card">
                    <div class="metric-value">{nphies_compliance_passed}/{nphies_compliance_tests}</div>
                    <div>NPHIES Compliance Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{performance_tests_passed}/{performance_tests}</div>
                    <div>Performance Tests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{average_response_time_ms:.0f}ms</div>
                    <div>Avg Response Time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">{compliance_threshold_violations}</div>
                    <div>Threshold Violations</div>
                </div>
            </div>
            
            <h2>📊 Test Suites</h2>
            {suites_html}
        </body>
        </html>
        """
        
        # Generate suites HTML
        suites_html = ""
        for suite in report.suites:
            suite_html = f"""
            <div class="suite">
                <div class="suite-header">
                    <h3>{suite.name}</h3>
                    <p>Duration: {suite.total_duration:.2f}s | Passed: {suite.passed} | Failed: {suite.failed} | Skipped: {suite.skipped}</p>
                </div>
            """
            
            for test in suite.tests:
                compliance_badge = '<span class="compliance-badge">Compliance</span>' if test.compliance_check else ''
                violation_badge = '<span class="violation-badge">Slow</span>' if test.duration > 5.0 else ''
                
                suite_html += f"""
                <div class="test-item">
                    <span class="{test.status}">{test.name}</span>
                    <span style="float: right;">
                        {test.duration:.3f}s {compliance_badge} {violation_badge}
                    </span>
                </div>
                """
            
            suite_html += "</div>"
            suites_html += suite_html
        
        return html_template.format(
            timestamp=report.timestamp,
            total_tests=report.total_tests,
            total_passed=report.total_passed,
            total_failed=report.total_failed,
            coverage_percentage=report.coverage_percentage,
            nphies_compliance_passed=report.healthcare_metrics.nphies_compliance_passed,
            nphies_compliance_tests=report.healthcare_metrics.nphies_compliance_tests,
            performance_tests_passed=report.healthcare_metrics.performance_tests_passed,
            performance_tests=report.healthcare_metrics.performance_tests,
            average_response_time_ms=report.healthcare_metrics.average_response_time_ms,
            compliance_threshold_violations=report.healthcare_metrics.compliance_threshold_violations,
            suites_html=suites_html
        )
    
    def generate_report(self, test_result_paths: List[str], coverage_file: Optional[str] = None) -> TestReport:
        """Generate comprehensive test report from multiple sources."""
        suites = []
        
        # Parse test result files
        for path_str in test_result_paths:
            path = Path(path_str)
            if not path.exists():
                print(f"Warning: {path} does not exist")
                continue
            
            if path.suffix == '.xml':
                suite = self.parse_junit_xml(path)
                suites.append(suite)
            elif path.suffix == '.json':
                suite = self.parse_vitest_json(path)
                suites.append(suite)
        
        # Calculate overall statistics
        total_tests = sum(suite.passed + suite.failed + suite.skipped for suite in suites)
        total_passed = sum(suite.passed for suite in suites)
        total_failed = sum(suite.failed for suite in suites)
        total_skipped = sum(suite.skipped for suite in suites)
        total_duration = sum(suite.total_duration for suite in suites)
        
        # Calculate healthcare metrics
        healthcare_metrics = self.calculate_healthcare_metrics(suites)
        
        # Parse coverage if available
        coverage_percentage = 0.0
        if coverage_file and Path(coverage_file).exists():
            coverage_percentage = self._parse_coverage(Path(coverage_file))
        
        report = TestReport(
            timestamp=datetime.now().isoformat(),
            total_tests=total_tests,
            total_passed=total_passed,
            total_failed=total_failed,
            total_skipped=total_skipped,
            total_duration=total_duration,
            suites=suites,
            healthcare_metrics=healthcare_metrics,
            coverage_percentage=coverage_percentage
        )
        
        return report
    
    def _parse_coverage(self, coverage_file: Path) -> float:
        """Parse coverage percentage from coverage file."""
        try:
            if coverage_file.suffix == '.xml':
                tree = ET.parse(coverage_file)
                root = tree.getroot()
                coverage_elem = root.find('.//coverage')
                if coverage_elem is not None:
                    return float(coverage_elem.get('line-rate', 0)) * 100
            elif coverage_file.suffix == '.json':
                with open(coverage_file, 'r') as f:
                    data = json.load(f)
                    total = data.get('total', {})
                    return total.get('lines', {}).get('pct', 0)
        except Exception as e:
            print(f"Warning: Could not parse coverage file {coverage_file}: {e}")
        
        return 0.0
    
    def save_report(self, report: TestReport) -> Dict[str, str]:
        """Save report in multiple formats."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save JSON report
        json_file = self.output_dir / f"test_report_{timestamp}.json"
        with open(json_file, 'w') as f:
            json.dump(asdict(report), f, indent=2, default=str)
        
        # Save HTML report
        html_file = self.output_dir / f"test_report_{timestamp}.html"
        html_content = self.generate_html_report(report)
        with open(html_file, 'w') as f:
            f.write(html_content)
        
        # Save summary for CI
        summary_file = self.output_dir / "summary.json"
        summary = {
            'total_tests': report.total_tests,
            'total_passed': report.total_passed,
            'total_failed': report.total_failed,
            'success_rate': report.total_passed / report.total_tests * 100 if report.total_tests > 0 else 0,
            'compliance_violations': report.healthcare_metrics.compliance_threshold_violations,
            'coverage_percentage': report.coverage_percentage,
            'timestamp': report.timestamp
        }
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        return {
            'json': str(json_file),
            'html': str(html_file),
            'summary': str(summary_file)
        }

def main():
    parser = argparse.ArgumentParser(description='Generate HealthLinc test reports')
    parser.add_argument('test_results', nargs='+', help='Test result files (XML or JSON)')
    parser.add_argument('--coverage', help='Coverage file (XML or JSON)')
    parser.add_argument('--output-dir', default='test-reports', help='Output directory')
    
    args = parser.parse_args()
    
    generator = TestReportGenerator(args.output_dir)
    report = generator.generate_report(args.test_results, args.coverage)
    files = generator.save_report(report)
    
    print(f"✅ Test report generated:")
    print(f"   HTML: {files['html']}")
    print(f"   JSON: {files['json']}")
    print(f"   Summary: {files['summary']}")
    
    # Exit with error code if tests failed
    if report.total_failed > 0:
        print(f"❌ {report.total_failed} tests failed")
        sys.exit(1)
    else:
        print(f"✅ All {report.total_passed} tests passed")

if __name__ == "__main__":
    main()