# Agentics Diligence Artifacts

---

## Overview

This private repository stores immutable, verifiable artifacts produced during Agentics benchmark and evaluation runs. It is designed exclusively for enterprise sales, broker-led transactions, and technical due diligence conducted by private equity firms, acquirers, or their designated reviewers.

**This repository is not a product.** It contains no source code, no tooling, and no executable components. It serves solely as a versioned archive of benchmark outputs and supporting metadata.

---

## Purpose and Scope

### What This Repository Contains

- Versioned benchmark results from controlled evaluation runs
- Reference runs representing canonical, reproducible executions
- Cryptographic checksums for artifact integrity verification
- Metadata describing execution parameters, environment, and provenance

### What This Repository Does Not Contain

- Source code, libraries, or dependencies (tooling resides in separate repositories)
- Live credentials, API keys, or access tokens
- Customer-specific data or personally identifiable information
- Marketing materials, promotional content, or sales collateral

---

## Why Artifacts Are Separated From Tooling

Diligence artifacts are maintained separately from the tooling that produces them for several reasons:

1. **Immutability**: Artifacts must remain frozen at the point of execution. Keeping them in a separate repository prevents accidental modification during tooling updates.

2. **Auditability**: Reviewers can verify that results were not altered after the fact. A separate repository with append-only governance provides a clear audit trail.

3. **Access Control**: Diligence artifacts may be shared with parties who should not have access to proprietary tooling or implementation details.

4. **Reproducibility**: By preserving the exact outputs alongside execution metadata, reviewers can understand precisely what was measured and how, without needing to re-run benchmarks.

---

## Directory Structure

```
benchmarks/
└── {benchmark-name}-v{version}/
    └── reference-run/
        ├── METADATA.md
        ├── SHA256SUMS.txt
        └── {benchmark-name}-v{version}-reference.zip
```

### Versioned Benchmarks

Each benchmark is versioned (e.g., `enterprise-proof-v1`). Version numbers reflect the benchmark definition, not the execution date. A new version indicates a material change to the evaluation methodology, test suite, or scoring criteria.

### Reference Runs

A **reference run** is a canonical execution of a benchmark under controlled conditions. It represents the authoritative result set for that benchmark version. Reference runs are:

- Executed once and frozen
- Not regenerated per customer or per transaction
- Used as the basis for diligence review across all engagements

### Why Results Are Zipped

Benchmark outputs are packaged as compressed archives (`.zip`) for the following reasons:

- **Integrity**: A single archive simplifies checksum verification; reviewers verify one hash rather than dozens or hundreds.
- **Completeness**: Archives preserve directory structure, file relationships, and internal references.
- **Portability**: Archives can be transferred, stored, and extracted consistently across platforms.
- **Immutability**: Once created, the archive content cannot be partially modified without detection.

### Why Hashes Are Included

Each reference run includes a `SHA256SUMS.txt` file containing cryptographic hashes of all artifacts. These hashes serve as proof of integrity:

- Reviewers can independently verify that artifacts have not been modified since publication.
- Any change to the archive, however small, produces a different hash.
- Hashes provide a chain of custody from execution to review.

---

## Verification Instructions

Reviewers should verify artifact integrity before relying on results for diligence purposes.

### Verifying SHA256 Checksums

On Linux or macOS:

```bash
cd benchmarks/{benchmark-name}-v{version}/reference-run/
sha256sum -c SHA256SUMS.txt
```

On Windows (PowerShell):

```powershell
cd benchmarks\{benchmark-name}-v{version}\reference-run\
Get-Content SHA256SUMS.txt | ForEach-Object {
    $parts = $_ -split '  '
    $expected = $parts[0]
    $file = $parts[1]
    $actual = (Get-FileHash $file -Algorithm SHA256).Hash.ToLower()
    if ($expected -eq $actual) { Write-Host "OK: $file" }
    else { Write-Host "MISMATCH: $file" }
}
```

A successful verification produces output indicating each file is `OK`. Any mismatch should be reported immediately.

---

## Interpreting Reference Materials

### For CTOs and Technical Buyers

Reference runs demonstrate the capabilities and behavior of Agentics tooling under controlled conditions. When reviewing:

- Examine `METADATA.md` for execution parameters (providers used, temperature settings, concurrency levels)
- Review aggregate results within the archive for pass/fail rates and scenario coverage
- Use checksums to confirm artifact authenticity before making procurement decisions

### For Brokers and Transaction Advisors

This repository provides verifiable evidence of product capability for inclusion in information memoranda or data rooms. When referencing:

- Cite specific benchmark versions (e.g., `enterprise-proof-v1`) for precision
- Include the SHA256 hash of the reference archive as a fingerprint
- Direct technical reviewers to this repository for independent verification

### For Private Equity and Acquirer Technical Teams

Artifacts support technical due diligence by providing reproducible, verifiable evaluation results. When conducting diligence:

- Verify checksums independently before analysis
- Review metadata for execution context and environmental factors
- Compare results against stated product claims
- Note that artifacts are frozen and represent a point-in-time evaluation

---

## Governance Model

### Append-Only Policy

This repository follows an **append-only** governance model:

- New benchmark versions and reference runs may be added
- Existing artifacts are never modified or deleted once published
- Corrections or updates result in new versions, not overwrites

This policy ensures that any reference to a specific benchmark version and artifact hash remains stable over time.

### Change Control

All additions to this repository follow a documented change control process:

1. Benchmark execution is completed using controlled tooling
2. Results are packaged and checksums are generated
3. Artifacts are committed with descriptive metadata
4. The commit is reviewed and merged
5. Once merged, artifacts are considered immutable

### Versioning

- Benchmark definitions are versioned semantically (e.g., `v1`, `v2`)
- Each version has exactly one reference run
- Historical versions are retained indefinitely

---

## Access Model

This repository is **private**. Access is granted on a need-to-know basis to:

- Prospective enterprise customers under NDA
- Brokers and transaction advisors engaged by Agentics
- Private equity firms, acquirers, and their designated technical reviewers
- Agentics personnel responsible for diligence support

Access requests should be directed through established business channels.

---

## Security and Compliance

### No Credentials or Live Systems

This repository contains no credentials, API keys, secrets, or access tokens. All benchmark executions use isolated environments with ephemeral credentials that are revoked after execution.

No artifacts in this repository provide access to live systems, customer environments, or production infrastructure.

### Data Classification

All artifacts in this repository are classified as confidential business information. Reviewers with access should handle materials in accordance with applicable NDAs and data handling agreements.

---

## Contact

For questions regarding artifact interpretation, verification assistance, or access requests, contact Agentics through established business channels.

---

*This repository is maintained as part of Agentics enterprise diligence infrastructure.*
