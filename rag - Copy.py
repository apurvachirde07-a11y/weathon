import json
import numpy as np
import requests
from pathlib import Path
from django.conf import settings
from pypdf import PdfReader

API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
EMBED_MODEL = "gemini-embedding-001"
GEN_MODELS = ["gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"]
STORE_FILE = Path(settings.BASE_DIR) / "kb_store.json"
MIN_SCORE = 0.68   # isse kam match ho to "not found" maanenge


def _headers():
    return {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.GEMINI_API_KEY,
    }


# ---------- 1. Text nikalna ----------
def extract_text(uploaded_file):
    name = uploaded_file.name.lower()
    if name.endswith(".pdf"):
        reader = PdfReader(uploaded_file)
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    return uploaded_file.read().decode("utf-8", errors="ignore")


# ---------- 2. Chunking ----------
def chunk_text(text, size=800, overlap=150):
    text = " ".join(text.split())
    chunks, start = [], 0
    while start < len(text):
        chunks.append(text[start:start + size])
        start += size - overlap
    return [c for c in chunks if len(c.strip()) > 30]


# ---------- 3. Embeddings ----------
def embed_texts(texts, task_type):
    vectors = []
    for i in range(0, len(texts), 50):
        batch = texts[i:i + 50]
        body = {"requests": [{
            "model": f"models/{EMBED_MODEL}",
            "content": {"parts": [{"text": t}]},
            "taskType": task_type,
        } for t in batch]}
        r = requests.post(f"{API_BASE}/{EMBED_MODEL}:batchEmbedContents",
                          headers=_headers(), json=body, timeout=60)
        r.raise_for_status()
        vectors += [e["values"] for e in r.json()["embeddings"]]
    return vectors


# ---------- 4. Knowledge base store ----------
def load_store():
    if STORE_FILE.exists():
        return json.loads(STORE_FILE.read_text(encoding="utf-8"))
    return []


def add_document(filename, text):
    chunks = chunk_text(text)
    if not chunks:
        return 0
    vectors = embed_texts(chunks, "RETRIEVAL_DOCUMENT")
    store = [s for s in load_store() if s["source"] != filename]
    for idx, (c, v) in enumerate(zip(chunks, vectors)):
        store.append({"source": filename, "chunk_no": idx + 1,
                      "text": c, "embedding": v})
    STORE_FILE.write_text(json.dumps(store), encoding="utf-8")
    return len(chunks)


def clear_store():
    if STORE_FILE.exists():
        STORE_FILE.unlink()


# ---------- 5. Retrieval (RAG ka asli retrieval) ----------
def search(query, k=3):
    store = load_store()
    if not store:
        return []
    q = np.array(embed_texts([query], "RETRIEVAL_QUERY")[0])
    mat = np.array([s["embedding"] for s in store])
    scores = mat @ q / (np.linalg.norm(mat, axis=1) * np.linalg.norm(q))
    top = np.argsort(scores)[::-1][:k]
    return [{"source": store[i]["source"], "chunk_no": store[i]["chunk_no"],
             "text": store[i]["text"], "score": round(float(scores[i]), 3)}
            for i in top]


# ---------- 6. Generation ----------
def generate_answer(code, question, level):
    passages = search(f"{question}\n{code}")
    relevant = [p for p in passages if p["score"] >= MIN_SCORE]
    found = len(relevant) > 0

    if found:
        context = "\n\n".join(
            f"[Passage {i+1} | {p['source']}]\n{p['text']}"
            for i, p in enumerate(relevant))
        rule = "Use ONLY the passages below as your documentation basis and mention which passage you used."
    else:
        context = "(no relevant documentation found)"
        rule = ("The knowledge base has NO relevant documentation. Start the explanation with: "
                "'Not found in knowledge base. The following is general guidance, not documentation-backed.'")

    prompt = f"""You are a programming code explainer and debugging assistant.
{rule}
Explanation level: {level}.

DOCUMENTATION CONTEXT:
{context}

USER QUESTION: {question}

USER CODE:
{code}

Reply ONLY as JSON with these keys:
"explanation": string (clear explanation of the code),
"issues": list of strings (errors or potential problems, empty list if none),
"corrected_code": string (fixed code),
"fix_notes": string (what was changed and why)"""

    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}}
    import time
    r = None
    for model in GEN_MODELS:
        for attempt in range(2):
            r = requests.post(f"{API_BASE}/{model}:generateContent",
                              headers=_headers(), json=body, timeout=90)
            if r.status_code == 200:
                break
            time.sleep(2)
        if r.status_code == 200:
            break
    r.raise_for_status()
    text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        data = {"explanation": text, "issues": [], "corrected_code": "", "fix_notes": ""}

    data["found"] = found
    data["sources"] = relevant
    return data