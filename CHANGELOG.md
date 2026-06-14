# Changelog

All notable changes to this project will be documented in this file.

The format is based on **[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)**, and this project adheres to **[Semantic Versioning](https://semver.org/spec/v2.0.0.html)**.

---

## [Unreleased]

- **Added**
  - (placeholder)

- **Changed**
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.2] - 2026-06-14


  - Added `@plasius/scene-object` contracts for transforms, bounds, attachment points, and snapshot state.
  - Added deterministic object validation and state lookup helpers for runtime composition.

- **Changed**
  - Created the public `@plasius/scene-object` package scaffold from the package baseline.

- **Fixed**
  - Added closed-form validation paths for malformed transforms, attachment references, and snapshot consistency.
  - Fixed scene object validation so malformed object entries do not crash state reference checks and missing bounds report a validation issue.

- **Security**
  - Validation remains fail-closed for malformed or untrusted object contracts before runtime consumption.

---

[Unreleased]: https://github.com/Plasius-LTD/scene-object/compare/v0.1.2...HEAD


[0.1.2]: https://github.com/Plasius-LTD/scene-object/releases/tag/v0.1.2
