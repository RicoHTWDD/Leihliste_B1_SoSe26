import json
from pathlib import Path
from django.conf import settings
from .models import Note

def export_notes_to_json() -> Path:
    """
    Exportiert alle Notes aus der DB nach <BASE_DIR>/data/notes.json
    und gibt den Pfad zur Datei zurück.
    """
    out_dir = Path(settings.BASE_DIR) / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    out_file = out_dir / "notes.json"

    payload = list(
        Note.objects.order_by("id").values("id", "text", "created_at")
    )

    # created_at ist ein datetime -> in ISO-String umwandeln
    for n in payload:
        n["created_at"] = n["created_at"].isoformat()

    out_file.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    return out_file