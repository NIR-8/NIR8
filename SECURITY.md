# Security Policy

## Overview

NIR8 Calculators is committed to maintaining the security and integrity of this open-source project. This document outlines our security practices and vulnerability reporting procedures.

## Security Practices

### Code Security
- ✅ **Client-side only**: All calculations run entirely in the browser
- ✅ **No data storage**: Results are not saved to any server
- ✅ **No tracking**: No personal data collection or transmission
- ✅ **Input validation**: All user inputs are validated and sanitized
- ✅ **Encryption-ready**: HTTPS-only deployment
- ✅ **Dependency management**: Regular updates to third-party libraries

### Libraries & Dependencies

| Dependency | Version | Purpose | Security Notes |
|------------|---------|---------|-----------------|
| Decimal.js | v10.4.3+ | High-precision arithmetic | Maintained & secure |
| MathJax | v3 (CDN) | Mathematical rendering | Using official CDN |

### Data Privacy
- ❌ No cookies (except optional session analytics)
- ❌ No personal information collected
- ❌ No server-side data storage
- ❌ No third-party data sharing

## Supported Versions

| Version | Status | Security Updates |
|---------|--------|------------------|
| Latest (v2.x) | ✅ Active | Yes |
| v1.x | ⚠️ Limited | Critical fixes only |
| < v1.0 | ❌ Unsupported | No |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Option 1: GitHub Security Advisory (Preferred)**
1. Go to: https://github.com/NIR-8/NIR8/security/advisories
2. Click "Report a vulnerability"
3. Provide detailed information

**Option 2: Direct Communication**
- Use the "Write Us" form in the application
- Include the prefix `[SECURITY]` in your message
- Provide clear description and steps to reproduce

**Option 3: Private Discussion**
- Open a private security discussion on GitHub
- URL: https://github.com/NIR-8/NIR8/security/discussions

### What to Include

When reporting a vulnerability, please provide:

```
- Description of the vulnerability
- Affected version(s)
- Steps to reproduce
- Potential impact
- Your contact information (optional)
- Proof of concept (if available, without being destructive)
```

### Response Timeline

- **Initial Response**: Within 48 hours
- **Investigation**: 2-5 business days
- **Fix/Patch**: Based on severity
- **Public Disclosure**: After fix is deployed

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|----------------|
| 🔴 Critical | Immediate threat to data/functionality | 24 hours |
| 🟠 High | Significant security impact | 48 hours |
| 🟡 Medium | Moderate security concern | 1 week |
| 🟢 Low | Minor security issue | 2 weeks |

## Security Best Practices for Users

### Browser Security
- ✅ Use a modern, updated browser (Chrome, Firefox, Safari, Edge)
- ✅ Enable browser security features
- ✅ Keep your OS and browser updated

### Usage Tips
- ✅ Always verify calculations manually before critical operations
- ✅ Use strong authentication on your device
- ✅ Don't share calculation results via insecure channels
- ✅ Ensure your internet connection is secure (use VPN if on public WiFi)

### Form Submissions
The "Write Us" form uses Web3Forms for secure email delivery:
- ✅ HTTPS encrypted transmission
- ✅ No data stored on our servers
- ✅ Processed through secure third-party service
- ⚠️ Avoid sending sensitive pharmaceutical data through contact form

## Compliance & Standards

- ✅ **HIPAA-friendly**: No PHI collection (comply with your own policies)
- ✅ **GDPR-compliant**: No personal data processing
- ✅ **Open Source**: Full source code available for audit
- ✅ **MIT Licensed**: Transparent, permissive licensing

## Secure Headers

The application implements the following security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdnjs.cloudflare.com fonts.googleapis.com www.googletagmanager.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: https:; font-src fonts.gstatic.com data:; connect-src 'self' www.googletagmanager.com
```

## Dependency Updates

- 🔄 **Regular Reviews**: Monthly security audits
- 🔄 **Automated Monitoring**: GitHub Dependabot enabled
- 🔄 **Rapid Patching**: Critical updates applied immediately
- 🔄 **Transparency**: All updates documented in changelog

## Security Audit Checklist

Regular security verification:

- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs
- [ ] XSS prevention measures in place
- [ ] CSRF tokens for form submissions
- [ ] Secure HTTPS deployment
- [ ] Security headers properly configured
- [ ] Dependencies up-to-date
- [ ] No console errors in production
- [ ] No external third-party scripts with full access
- [ ] Rate limiting on API endpoints (if applicable)

## Incident Response

In case of a security incident:

1. **Assess**: Evaluate severity and scope
2. **Contain**: Stop ongoing malicious activity
3. **Communicate**: Notify affected users (if applicable)
4. **Remediate**: Implement fix and deploy
5. **Review**: Post-incident analysis

## Contact

**Security Contact**: Use the GitHub Security Advisory process above

**General Inquiries**: Use the "Write Us" form in the application

## Acknowledgments

We appreciate the security research community and responsible disclosure. Special thanks to all security researchers who help improve NIR8 Calculators.

---

**Last Updated**: June 2026

**Next Review**: December 2026

---

### Disclaimer

While we take every precaution to ensure security, no system is 100% secure. Users are responsible for:
- Verifying pharmaceutical calculations independently
- Following all regulatory requirements
- Securing their own devices and networks
- Complying with applicable laws and regulations
