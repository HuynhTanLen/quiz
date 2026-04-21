from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass, field
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent.parent
PDF_PATH = ROOT / "450c-phap-luat-dai-cuong-cau-hoi-va-dap-an-on-tap.pdf"
OUTPUT_PATH = ROOT / "data" / "questions.json"

QUESTION_RE = re.compile(r"^(?P<number>\d{1,3})\s+(?P<text>.+)$")
OPTION_RE = re.compile(r"^(?P<label>[A-D])[\.\):,]+\s*(?P<text>.+)$")


@dataclass
class Question:
    id: int
    question: str = ""
    options: dict[str, str] = field(default_factory=dict)
    answer: str | None = None
    source: str = "450c-phap-luat-dai-cuong-cau-hoi-va-dap-an-on-tap.pdf"


def normalize_line(line: str) -> str:
    line = line.replace("\u00a0", " ")
    line = re.sub(r"\s+", " ", line)
    return line.strip()


def should_skip(line: str) -> bool:
    return (
        not line
        or line.isdigit()
        or line.startswith("Downloaded by ")
        or line.startswith("lOMoARcPSD|")
        or line.startswith("STT Nội dung câu hỏi")
        or line.startswith("450c Pháp luật đại cương")
        or line.startswith("Pháp luật đại cương (")
        or line.startswith("Scan to open on Studeersnel")
        or line.startswith("Studocu is not sponsored")
    )


def parse_questions(pdf_path: Path) -> list[Question]:
    reader = PdfReader(str(pdf_path))
    questions: list[Question] = []
    current: Question | None = None
    current_option: str | None = None

    for page in reader.pages[1:]:
        text = page.extract_text() or ""
        for raw_line in text.splitlines():
            line = normalize_line(raw_line)
            if should_skip(line):
                continue

            question_match = QUESTION_RE.match(line)
            if question_match and (
                current is None or int(question_match.group("number")) > current.id
            ):
                if current:
                    questions.append(current)
                current = Question(
                    id=int(question_match.group("number")),
                    question=question_match.group("text").strip(),
                )
                current_option = None
                continue

            option_match = OPTION_RE.match(line)
            if option_match and current:
                current_option = option_match.group("label")
                current.options[current_option] = option_match.group("text").strip()
                continue

            if current and current_option:
                current.options[current_option] = (
                    f"{current.options[current_option]} {line}".strip()
                )
            elif current:
                current.question = f"{current.question} {line}".strip()

    if current:
        questions.append(current)

    # Keep only plausible multiple-choice items.
    parsed = [q for q in questions if len(q.options) >= 2]
    for item in parsed:
        item.question = re.sub(r"\s+", " ", item.question).strip()
        item.options = {
            key: re.sub(r"\s+", " ", value).strip() for key, value in item.options.items()
        }
    return parsed


def main() -> None:
    questions = parse_questions(PDF_PATH)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "title": "Pháp luật đại cương",
        "sourcePdf": PDF_PATH.name,
        "questionCount": len(questions),
        "hasAnswerKey": any(question.answer for question in questions),
        "questions": [asdict(question) for question in questions],
    }
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(questions)} questions to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
