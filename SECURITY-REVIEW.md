# Star Dewedar Phase 3 Upload Protection Review

## Scope and disposition

This is the read-only independent review of the Phase 3 upload-protection implementation. No application code, dependency, or configuration changes were made as part of the review. The only confirmed exploitable exposure identified is the vulnerable Sharp dependency when processing attacker-controlled image content. Other findings below are reliability defects, conditional dependency exposure, or test-coverage gaps.

## Findings

### Confirmed defects

| Severity | Location | Finding and impact | Reproduction / evidence | Confidence |
|---|---|---|---|---|
| High | [`backend/package.json:34`](./backend/package.json), [`backend/src/utils/uploadValidation.js:65-77`](./backend/src/utils/uploadValidation.js) | Sharp `0.34.5` is affected by advisories in bundled libheif/librsvg. The image validator passes untrusted bytes into Sharp before checking the detected format, so a client can label other decoder-supported content as JPEG/PNG and reach those parsers. The `^0.34.5` range cannot select the reported patched `0.35.5` release. | Submit content recognized as SVG or HEIF using an accepted `.png` name and `image/png` MIME type; Sharp format detection and metadata parsing occur before the format comparison. | 8/10 |
| Low | [`backend/src/utils/uploadValidation.js:90-99`](./backend/src/utils/uploadValidation.js), [`backend/test/uploadProtection.test.js:627-636`](./backend/test/uploadProtection.test.js) | XLS validation accepts any CFB container with a non-empty stream named `Workbook` or `Book`; it does not validate BIFF records. This can classify arbitrary non-Excel CFB content as XLS and allow it through content validation. | The existing test creates a CFB container whose `Workbook` stream contains only `workbook-stream`, then expects validation to succeed. | 10/10 |
| Low | [`backend/src/utils/uploadValidation.js:177-225,267-340`](./backend/src/utils/uploadValidation.js), [`backend/test/uploadProtection.test.js:92-108`](./backend/test/uploadProtection.test.js) | XLSX validation checks archive integrity and sheet relationships, but does not parse referenced worksheet XML or verify its content-type declaration. A present relationship target is treated as sufficient even if its contents are not a valid worksheet. | The accepted synthetic workbook omits a worksheet content-type declaration; replacing its referenced worksheet entry with arbitrary bytes while preserving ZIP metadata is not rejected by worksheet validation. | 9/10 |

### Conditional dependency exposure

| Severity | Location | Finding and impact | Reachability / evidence | Confidence |
|---|---|---|---|---|
| Informational (critical upstream advisory) | [`backend/package-lock.json`](./backend/package-lock.json); Express setup in [`backend/src/app.js`](./backend/src/app.js) | The installation audit reported a critical advisory for transitive `proxy-addr@2.0.7`; the advisory is conditional on vulnerable proxy-trust configuration. The repository does not configure Express `trust proxy`, so the reviewed application does not currently expose the attacker-controlled forwarded-IP path required by that condition. The advisory identifies `2.0.8` as patched. | No current `trust proxy` configuration was found in the reviewed app. Reassess if deployment code or runtime configuration enables proxy trust. | 8/10 |

The same audit reported high advisories affecting direct dependencies `multer`, `nodemailer`, `prisma`, `sharp`, and `zod`, and transitive dependencies `@prisma/config`, `body-parser`, `brace-expansion`, `deepmerge-ts`, `fast-uri`, `hono`, `ip-address`, and `mysql2`. The Sharp image-decoder exposure is detailed above. The review did not establish that the other reported package advisories are reachable through this upload path. The Multer advisories were predominantly denial-of-service issues; the reported file-size-limit-bypass condition involves an asynchronous `fileFilter`, while the reviewed filters are synchronous. Advisory identifiers and individual patch versions for the remaining packages were not captured in the available audit summary, so no patched-version claim is made for them.

## Test-coverage gaps

These are not confirmed defects by themselves; they limit confidence in the behaviors described:

| Severity | Location | Missing coverage | Why it matters | Confidence |
|---|---|---|---|---|
| Low | [`backend/test/uploadProtection.test.js:357-414`](./backend/test/uploadProtection.test.js) | The disconnect test covers a client abort, but not request-size overflow after a file stream has partially buffered data. | The combination of request-limit error propagation and storage-buffer cleanup is not directly verified. | 9/10 |
| Low | [`backend/test/uploadProtection.test.js`](./backend/test/uploadProtection.test.js) | No real Excel-generated XLS/XLSX fixtures cover multiple sheets, unusual sheet names, formulas, shared strings, or styles. | Synthetic ZIP/CFB fixtures do not establish interoperability with representative Excel workbooks. | 9/10 |
| Low | [`backend/test/uploadProtection.test.js`](./backend/test/uploadProtection.test.js) | Image tests cover small valid and malformed JPEG/PNG files, but not animated PNGs, multi-page behavior, or a pixel-limit boundary/decompression-bomb case. | Decoder limits and frame handling are not confirmed by regression tests. | 9/10 |
| Low | Frontend BOQ upload selection in [`frontend/src/components/sections/BOQFormSection.jsx`](./frontend/src/components/sections/BOQFormSection.jsx); no upload-selection test file | There are no automated frontend tests for preserving existing valid files after an invalid selection, the five-file cap, or localized error text. | These behaviors are implemented, but regressions are not automatically detected. | 9/10 |
| Low | Request controllers and service-call assertions in [`backend/test/uploadProtection.test.js`](./backend/test/uploadProtection.test.js) | No focused test proves that invalid BOQ supporting content prevents all Cloudinary calls. | Code inspection shows validation precedes service calls, but this critical ordering is not protected by a test. | 8/10 |

## Verified as sound in the reviewed paths

- Visit/Quote and BOQ use per-file, aggregate-file, field/part, and total-request limits. The request-wide counter covers chunked bodies and multipart overhead as well as declared `Content-Length`.
- The request and file-size boundary tests cover exact limits and overflow; the existing test suite also covers a client disconnect.
- Visit/Quote controllers validate the uploaded content before invoking their services. BOQ validates its main file and supporting files before starting service uploads, so a validation error in the inspected flow precedes Cloudinary upload calls.
- The Phase 2 service cleanup path remains in the request services; no change to that behavior was made by this review.
- XLSX parsing streams ZIP entries and checks expanded-size and entry-count caps, CRC values, local/central metadata consistency, duplicate names, required package parts, DTD rejection, and referenced worksheet target existence. No ZIP-slip or XXE path was identified.
- The frontend BOQ selection code preserves earlier valid selections when processing later selections, caps supporting files at five, supports removal, and provides English and Arabic messages.
- Backend tests passed 25/25 during the implementation work. The frontend production build passed. Frontend lint was unavailable because ESLint was not installed.
