---
name: incident-triage
description: Architecture, domain rules, AI classification, rules fallback, and availability blocking for incident management in Campus Control.
---

# Incident Triage & Availability Skill

## 1. Allowed Enumerations
All enum values are strictly lowercase strings:
- **`Role`**: `admin`, `teacher`, `support`
- **`IncidentCategory`**: `technology`, `network`, `electrical`, `infrastructure`, `furniture`, `cleaning`, `safety`, `other`
- **`IncidentPriority`**: `low`, `medium`, `high`, `critical`
- **`IncidentStatus`**: `open`, `in_progress`, `resolved`
- **`ResponsibleTeam`**: `it_support`, `maintenance`, `cleaning`, `security`, `administration`
- **`ClassificationSource`**: `ai`, `rules`

## 2. Availability Blocking Rules
An incident can only block space/resource availability if:
1. `category` is in `{safety, electrical, infrastructure}`.
2. `priority` is in `{high, critical}`.
3. The reporting or updating user has role `support` or `admin`.
4. The user explicitly sets `confirm_blocking: true`.

*Note:* If a `teacher` reports a critical issue, `suggests_blocking` is marked as `True`, but `is_blocking` remains `False` until authorized staff confirms.

## 3. Availability Restoration
When an incident is resolved (`POST /incidents/{id}/resolve` or `status: "resolved"`):
- The system checks if other open incidents still block the same space or resource.
- Only when no other active blocking incidents exist is availability restored.

## 4. Fallback Classification
If the external AI provider is unreachable or returns invalid JSON:
- `classification_source` is set to `"rules"` (**never pretended as AI**).
- Fallback reason is recorded: `not_configured`, `timeout`, `http_error`, or `invalid_response`.
- Deterministic Spanish keyword heuristic (`KEYWORD_RULES`) produces categories, priorities, and explanations.
