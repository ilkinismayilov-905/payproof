"""Golden: R-001..R-009 messages (az + en) of every fixture package equal
fixtures/check-messages.json — the mock engine asserts the same file (packages/mocks).
After a deliberate wording change: `uv run python -m tests.golden.test_check_messages`."""

import json

from payproof.seed.fixtures import FIXTURES, PACKAGES, outcome_of

FILE = FIXTURES / "check-messages.json"


def messages() -> dict[str, dict[str, dict[str, str]]]:
    return {
        number: {c.rule_id: {"az": c.message, "en": c.message_en} for c in outcome_of(p)[1]}
        for number, p in sorted(PACKAGES.items())
    }


def test_messages_match_the_golden_file() -> None:
    assert json.loads(FILE.read_text()) == messages()


def test_every_message_has_both_languages() -> None:
    for checks in messages().values():
        for m in checks.values():
            assert m["az"] and m["en"] and m["az"] != m["en"]


if __name__ == "__main__":
    FILE.write_text(json.dumps(messages(), ensure_ascii=False, indent=2) + "\n")
