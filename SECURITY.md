# Security Policy

## Supported Versions

We support the latest stable release of our main branch. Security updates and fixes are only provided for active, maintained versions.

| Version    | Supported          |
|------------|-------------------|
| main       | :white_check_mark: |
| older tags | :x:               |

---

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately and responsibly. Do **not** open public issues for security matters.

- **How to report:**  
  Email: [security@brainsait.io]  
  or  
  Use GitHub’s [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)

We will respond as quickly as possible, usually within 5 business days.

---

## Security Practices

We are committed to secure software development using the following practices:

- **Automated Code Scanning:**  
  All code is scanned using GitHub CodeQL and other static analysis tools for supported languages (Swift, Python, TypeScript, etc).
- **Dependency Management:**  
  We keep dependencies up to date and monitor for known vulnerabilities.
- **Secrets Management:**  
  No secrets or credentials are committed to the repository; use `.env` files and GitHub Secrets.
- **Code Review:**  
  All code changes require at least one peer review.
- **Continuous Integration:**  
  Pull requests must pass security checks before merging.

---

## Handling Swift Code Scanning Build Failures

If automatic CodeQL analysis fails for Swift code due to build issues (e.g., Xcode project customizations), **manual build steps must be specified** in the workflow.

**Required Actions:**
1. **Change build mode to manual** in your workflow file:
    ```yaml
    - uses: github/codeql-action/init@v3
      with:
        languages: swift
        build-mode: manual
    ```
2. **Add custom build steps** to build the Swift project:
    ```yaml
    - name: Build Swift project for CodeQL
      run: |
        xcodebuild clean build \
          -project SmoothWalker.xcodeproj \
          -scheme SmoothWalker \
          -destination 'platform=iOS Simulator,name=iPhone 14,OS=17.2' \
          CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO
    ```
3. **Document special requirements** in the README or CONTRIBUTING.md.
4. **Review build and scan logs** after each run and fix errors promptly.
5. **Block merges** unless security analysis passes for all supported languages.

For more details, see:  
[GitHub Docs: Troubleshooting Code Scanning Automatic Build Failed](https://docs.github.com/en/code-security/code-scanning/troubleshooting-code-scanning/automatic-build-failed)

---

## Coding Standards

- Follow [BrainSAIT coding guidelines](CONTRIBUTING.md).
- Use `.editorconfig` for consistent formatting.
- Never hardcode secrets.
- Keep dependencies and tools up to date.

---

## Disclosure Policy

- Please do not disclose vulnerabilities publicly until they have been acknowledged and fixed.
- We will credit responsible disclosures in release notes or acknowledgements (unless you request anonymity).

---

## References

- [GitHub Security Advisories](https://github.com/Fadil369/HealthLinc/security/advisories)
- [GitHub Private Vulnerability Reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
- [CodeQL Documentation](https://docs.github.com/en/code-security/code-scanning/using-codeql-code-scanning-with-your-project)
- [BrainSAIT Custom Copilot Instructions](https://docs.github.com/en/copilot/customizing-copilot/adding-organization-custom-instructions-for-github-copilot)

---

_Last updated: 2025-07-09_

---

Let me know if you want any section customized further or want this file in a specific format!
