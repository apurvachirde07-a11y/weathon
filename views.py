from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from . import rag


@ensure_csrf_cookie
def home(request):
    return render(request, "index.html", {"chunks": len(rag.load_store())})


@csrf_exempt
@require_POST
def upload_doc(request):
    files = request.FILES.getlist("docs")
    if not files:
        return JsonResponse({"ok": False, "error": "Koi file select nahi ki."}, status=400)

    total, names = 0, []
    for f in files:
        name = f.name.lower()
        if not (name.endswith(".pdf") or name.endswith(".txt")):
            continue
        try:
            text = rag.extract_text(f)
            n = rag.add_document(f.name, text)
            total += n
            names.append(f.name)
        except Exception as e:
            return JsonResponse({"ok": False, "error": f"{f.name}: {e}"}, status=500)

    if not names:
        return JsonResponse({"ok": False, "error": "Sirf PDF ya TXT file upload karo."}, status=400)
    return JsonResponse({"ok": True, "files": names, "chunks": total})


@csrf_exempt
@require_POST
def ask(request):
    code = request.POST.get("code", "").strip()
    question = request.POST.get("question", "").strip()
    level = request.POST.get("level", "Beginner")

    if not code and not question:
        return JsonResponse({"ok": False, "error": "Code ya question likho."}, status=400)
    try:
        result = rag.generate_answer(code, question, level)
        result["ok"] = True
        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)


@csrf_exempt
@require_POST
def clear_kb(request):
    rag.clear_store()
    return JsonResponse({"ok": True})