"""
Past-paper ingestion for the Sanad demo.

Reads official Cambridge question-paper and mark-scheme PDFs from tools/papers/raw/<code>/,
renders every question to PNG under public/papers/<code>/<paper>/, crops the matching
mark-scheme rows, and writes src/lib/data/pastpapers/bank.json.

Usage: python tools/papers/slice.py [code ...]   (default: every folder under raw/)
Requires PyMuPDF.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "tools" / "papers" / "raw"
OUT_IMG = ROOT / "public" / "papers"
OUT_BANK = ROOT / "src" / "lib" / "data" / "pastpapers" / "bank.json"

ZOOM = 2.0  # 144 dpi
MARGIN_X = (40.0, 556.0)
HEADER_Y = 50.0
FOOTER_Y = 784.0
NUM_X_MAX = 62.0  # question numerals sit at x ~ 49.6
MARK_TAG = re.compile(r"\[(\d{1,2})\]")
SUBPART = re.compile(r"^(\d{1,2})(\([a-z]+\))*(\([ivx]+\))?$")

SESSION_LABEL = {"s": "May/June", "w": "Oct/Nov", "m": "Feb/March", "sp": "Specimen"}


def paper_meta(stem: str) -> dict:
    """4024_s24_qp_21 -> code 4024, session s24, kind qp, paper 21."""
    code, session, kind, paper = stem.split("_")
    m = re.match(r"([a-z]+)(\d+)", session)
    sess, yy = m.group(1), m.group(2)
    year = 2000 + int(yy)
    label = f"{code}/{paper} {SESSION_LABEL[sess]} {year}" if sess != "sp" else f"{code}/{paper} Specimen {year}"
    return {"code": code, "session": session, "kind": kind, "paper": paper, "year": year, "series": SESSION_LABEL[sess], "label": label}


def orient(page: fitz.Page) -> None:
    """Landscape mark-scheme tables are sometimes drawn as rotated text on a portrait page.
    Set a page rotation so that display coordinates read left to right."""
    if page.rotation:
        return
    d = page.get_text("dict")
    dirs = [ln["dir"] for b in d["blocks"] for ln in b.get("lines", [])]
    if not dirs or abs(dirs[0][0]) > 0.5:
        return
    page.set_rotation(90 if dirs[0][1] < 0 else 270)


def display_words(page: fitz.Page) -> list[tuple]:
    """Words with bboxes in display (rotated) coordinates."""
    m = page.rotation_matrix
    out = []
    for w in page.get_text("words"):
        r = fitz.Rect(w[:4]) * m
        out.append((r.x0, r.y0, r.x1, r.y1, w[4], w[5], w[6], w[7]))
    return out


def lines_of(page: fitz.Page) -> list[dict]:
    """Words grouped into lines: {y, x, text, words}."""
    words = display_words(page)  # x0, y0, x1, y1, word, block, line, wordno
    by_key: dict[int, list] = {}
    for w in words:  # table cells are separate blocks, so group by vertical position instead
        by_key.setdefault(int(w[1] // 4), []).append(w)
    out = []
    for ws in by_key.values():
        ws.sort(key=lambda w: w[0])
        out.append({"y": min(w[1] for w in ws), "y1": max(w[3] for w in ws), "x": ws[0][0], "text": " ".join(w[4] for w in ws), "words": ws})
    out.sort(key=lambda l: (round(l["y"]), l["x"]))
    return out


def question_starts(doc: fitz.Document) -> list[tuple[int, float, int]]:
    """(page index, y, number) for each question start, requiring sequential numbering."""
    starts: list[tuple[int, float, int]] = []
    expected = 1
    for pn in range(1, len(doc)):  # page 0 is the cover
        page = doc[pn]
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                span = line["spans"][0] if line.get("spans") else None
                if not span:
                    continue
                x0, y0 = span["bbox"][0], span["bbox"][1]
                if x0 > NUM_X_MAX or y0 < HEADER_Y or y0 > FOOTER_Y or "bold" not in span["font"].lower():
                    continue
                if span["text"].strip() in (str(expected), f"Question {expected}"):
                    starts.append((pn, y0, expected))
                    expected += 1
    return starts


def marks_between(doc: fitz.Document, start: tuple[int, float, int], end: tuple[int, float, int] | None) -> int:
    total = 0
    pn0, y0 = start[0], start[1]
    pn1, y1 = (end[0], end[1]) if end else (len(doc) - 1, FOOTER_Y + 1)
    for pn in range(pn0, pn1 + 1):
        for line in lines_of(doc[pn]):
            if pn == pn0 and line["y"] < y0 - 2:
                continue
            if pn == pn1 and line["y"] >= y1 - 2:
                continue
            for m in MARK_TAG.finditer(line["text"]):
                total += int(m.group(1))
    return total


def render_clip(page: fitz.Page, y0: float, y1: float, path: Path) -> None:
    top = max(HEADER_Y, y0 - 6)
    bottom = min(page.rect.height - 40, y1)
    if bottom - top < 12:
        return
    right = max(MARGIN_X[1], page.rect.width - 40)
    clip = fitz.Rect(MARGIN_X[0], top, right, bottom) & page.rect
    if clip.is_empty or clip.height < 12 or clip.width < 50:
        return
    pix = page.get_pixmap(matrix=fitz.Matrix(ZOOM, ZOOM), clip=clip, alpha=False)  # clip is in display space
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        pix.save(str(path))
    except Exception as exc:  # degenerate clip on rotated pages
        print(f"  skip {path.name}: {exc}")


def slice_questions(qp: Path, out_dir: Path, rel: str) -> list[dict]:
    doc = fitz.open(qp)
    starts = question_starts(doc)
    items = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else None
        imgs: list[str] = []
        pn0, y0, num = start
        pn1, y1 = (end[0], end[1]) if end else (len(doc) - 1, FOOTER_Y)
        if i == 0 and pn0 > 1:
            for pn in range(1, pn0):
                name = f"q{num}-ctx{pn}.png"
                render_clip(doc[pn], HEADER_Y, FOOTER_Y, out_dir / name)
                if (out_dir / name).exists():
                    imgs.append(f"{rel}/{name}")
        for pn in range(pn0, pn1 + 1):
            top = y0 if pn == pn0 else HEADER_Y
            bottom = y1 if pn == pn1 else FOOTER_Y
            # skip blank continuation pages ("BLANK PAGE" / no text)
            text = doc[pn].get_text().strip()
            if pn != pn0 and ("BLANK PAGE" in text or len(text) < 40):
                continue
            name = f"q{num}.png" if pn == pn0 else f"q{num}-{pn - pn0 + 1}.png"
            render_clip(doc[pn], top, bottom, out_dir / name)
            if (out_dir / name).exists():
                imgs.append(f"{rel}/{name}")
        items.append({"qnum": num, "img": imgs, "marks": marks_between(doc, start, end), "page": pn0 + 1})
    return items


def parse_ms(ms: Path, rel: str, out_dir: Path) -> dict[int, dict]:
    """Per question number: MCQ answer letter, or structured rows (text) and an image crop."""
    doc = fitz.open(ms)
    rows: list[tuple[int, float, float, int, str]] = []  # page, y, y1, qnum, text
    for pn in range(len(doc)):
        orient(doc[pn])
        in_table = False
        for line in lines_of(doc[pn]):
            if line["text"].startswith("Question") and "Answer" in line["text"] and "Marks" in line["text"]:
                in_table = True
                continue
            if not in_table:
                continue
            first = line["words"][0][4]
            m = SUBPART.match(first)
            if not m or line["x"] > 110:
                continue
            rows.append((pn, line["y"], line["y1"], int(m.group(1)), line["text"]))
    out: dict[int, dict] = {}
    by_q: dict[int, list] = {}
    for r in rows:
        by_q.setdefault(r[3], []).append(r)
    for q, rs in by_q.items():
        rs.sort(key=lambda r: (r[0], r[1]))
        texts = [r[4] for r in rs]
        mcq = len(rs) == 1 and re.match(rf"^{q}\s+([A-D])\s+1$", rs[0][4])
        entry: dict = {"rows": texts}
        if mcq:
            entry["answer"] = mcq.group(1)
        else:
            imgs = []
            for pn in sorted({r[0] for r in rs}):
                page_rows = [r for r in rs if r[0] == pn]
                y0 = min(r[1] for r in page_rows)
                y1 = max(r[2] for r in page_rows) + 4
                # extend to the next row of a different question or the footer so multi-line cells are kept
                later = [r for r in rows if r[0] == pn and r[1] > y1 - 4 and r[3] != q]
                if later:
                    y1 = min(r[1] for r in later) - 2
                else:
                    y1 = doc[pn].rect.height - 40
                name = f"ms-q{q}.png" if not imgs else f"ms-q{q}-{len(imgs) + 1}.png"
                render_clip(doc[pn], y0, y1, out_dir / name)
                if (out_dir / name).exists():
                    imgs.append(f"{rel}/{name}")
            entry["msImg"] = imgs
        out[q] = entry
    return out


def ingest(code: str) -> list[dict]:
    folder = RAW / code
    bank: list[dict] = []
    for qp in sorted(folder.glob(f"{code}_*_qp_*.pdf")):
        meta = paper_meta(qp.stem)
        ms = folder / qp.name.replace("_qp_", "_ms_")
        paper_key = f"{meta['session']}_{meta['paper']}"
        rel = f"/papers/{code}/{paper_key}"
        out_dir = OUT_IMG / code / paper_key
        items = slice_questions(qp, out_dir, rel)
        insert = folder / qp.name.replace("_qp_", "_in_")
        insert_imgs: list[str] = []
        if insert.exists():
            idoc = fitz.open(insert)
            for pn in range(1, len(idoc)):
                if len(idoc[pn].get_text().strip()) < 40:
                    continue
                name = f"insert-{pn}.png"
                render_clip(idoc[pn], HEADER_Y, FOOTER_Y, out_dir / name)
                if (out_dir / name).exists():
                    insert_imgs.append(f"{rel}/{name}")
        scheme = parse_ms(ms, rel, out_dir) if ms.exists() else {}
        is_mcq = all("answer" in scheme.get(it["qnum"], {}) for it in items) and bool(items)
        for it in items:
            s = scheme.get(it["qnum"], {})
            if "answer" not in s and not s.get("rows"):
                continue  # no published mark scheme for this question
            bank.append({
                "id": f"pp-{code}-{paper_key}-q{it['qnum']}",
                "code": code,
                "paper": meta["paper"],
                "paperKey": paper_key,
                "paperLabel": meta["label"],
                "series": meta["series"],
                "year": meta["year"],
                "qnum": it["qnum"],
                "type": "mcq" if is_mcq else "structured",
                "marks": 1 if is_mcq else max(it["marks"], 1),
                "img": it["img"],
                "answer": s.get("answer"),
                "msImg": s.get("msImg", []),
                "msRows": s.get("rows", []),
                "insertImg": insert_imgs,
                "ref": f"{code}/{meta['paper']}/{'SP' if meta['session'].startswith('sp') else meta['session'][0].upper() + '/'}{'' if meta['session'].startswith('sp') else ''}{meta['year']} Q{it['qnum']}",
            })
        found = len(items)
        with_ms = sum(1 for it in items if it["qnum"] in scheme)
        print(f"{qp.name}: {found} questions, {with_ms} with mark scheme, mcq={is_mcq}, marks={sum(b['marks'] for b in bank if b['paperKey'] == paper_key and b['code'] == code)}")
    return bank


def main(codes: list[str]) -> None:
    bank: list[dict] = []
    for code in codes:
        bank.extend(ingest(code))
    OUT_BANK.parent.mkdir(parents=True, exist_ok=True)
    OUT_BANK.write_text(json.dumps(bank, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"wrote {len(bank)} items to {OUT_BANK.relative_to(ROOT)}")


if __name__ == "__main__":
    args = sys.argv[1:] or sorted(p.name for p in RAW.iterdir() if p.is_dir())
    main(args)
