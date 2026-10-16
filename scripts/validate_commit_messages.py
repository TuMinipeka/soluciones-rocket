"""Validate the repository's commit and pull request title convention."""

import argparse
import re
import subprocess
import sys


GITMOJI_BY_TYPE = {
    "feat": "sparkles",
    "fix": "bug",
    "docs": "memo",
    "refactor": "recycle",
    "test": "white_check_mark",
    "chore": "wrench",
    "ci": "green_heart",
    "build": "package",
    "perf": "zap",
    "style": "art",
}
TITLE_PATTERN = re.compile(r"^([a-z]+): :([a-z_]+): ([A-Z][a-zA-Z0-9]*)$")


def validate(title: str) -> str | None:
    match = TITLE_PATTERN.fullmatch(title)
    if not match:
        return "expected 'type: :gitmoji: EnglishActionInUpperCamelCase'"
    commit_type, gitmoji, description = match.groups()
    expected = GITMOJI_BY_TYPE.get(commit_type)
    if expected is None:
        return f"unsupported type '{commit_type}'"
    if gitmoji != expected:
        return f"expected :{expected}: for '{commit_type}'"
    if not any(char.islower() for char in description):
        return "description must contain lowercase letters"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", help="pull request title to validate")
    parser.add_argument("--range", dest="commit_range", help="Git revision range to validate")
    args = parser.parse_args()
    if not args.title and not args.commit_range:
        parser.error("provide --title and/or --range")

    subjects = []
    if args.title:
        subjects.append(("PR title", args.title))
    if args.commit_range:
        result = subprocess.run(
            ["git", "log", "--format=%s", args.commit_range],
            capture_output=True,
            text=True,
            check=False,
        )
        if result.returncode:
            print(result.stderr.strip(), file=sys.stderr)
            return result.returncode
        subjects.extend(("commit", subject) for subject in result.stdout.splitlines())

    failures = 0
    for source, subject in subjects:
        error = validate(subject)
        if error:
            print(f"Invalid {source}: {subject!r} ({error})", file=sys.stderr)
            failures += 1
    if failures:
        return 1
    print(f"Validated {len(subjects)} title(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
