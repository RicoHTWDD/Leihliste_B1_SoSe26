# Welches Python nutzen wir als Basis
FROM python:3.12-slim

# Arbeitsverzeichnis im Container
WORKDIR /app

# Erst requirements.txt kopieren und installieren
# (separater Schritt damit Docker das cachen kann)
COPY requirements.txt .
RUN pip install -r requirements.txt

# Dann den restlichen Code kopieren
COPY . .

# Port auf dem Django läuft
EXPOSE 8000

# Befehl der beim Container-Start ausgeführt wird
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]