"""Text extraction for PDF / DOCX / TXT bytes downloaded from Supabase."""
from __future__ import annotations


def extract_pdf_bytes(data: bytes) -> str:
    import fitz  # pymupdf

    text_parts: list[str] = []
    with fitz.open(stream=data, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text())
    return "\n".join(text_parts)


def extract_pdf(file_path: str) -> str:
    """Legacy helper kept for backwards-compat (path based)."""
    with open(file_path, "rb") as f:
        return extract_pdf_bytes(f.read())


def extract_docx_bytes(data: bytes) -> str:
    try:
        from docx import Document  # python-docx
    except ImportError as exc:
        raise RuntimeError("python-docx is required for .docx files") from exc
    import io

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text(data: bytes, filename: str, content_type: str = "") -> str:
    name = (filename or "").lower()
    ctype = (content_type or "").lower()
    if name.endswith(".pdf") or "pdf" in ctype:
        return extract_pdf_bytes(data)
    if name.endswith(".docx") or "officedocument.wordprocessingml" in ctype:
        return extract_docx_bytes(data)
    # txt / md / fallback: decode best-effort
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="ignore")


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """Char splitter with overlap. Keeps parity with TS worker defaults."""
    cleaned = " ".join((text or "").split())
    if not cleaned:
        return []
    if overlap >= chunk_size:
        overlap = chunk_size // 5
    chunks: list[str] = []
    step = chunk_size - overlap
    for i in range(0, len(cleaned), step):
        piece = cleaned[i : i + chunk_size].strip()
        if piece:
            chunks.append(piece)
    return chunks
