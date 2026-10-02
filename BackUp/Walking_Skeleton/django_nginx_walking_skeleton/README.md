# Django nginx Walking Skeleton

Dieser Prototyp zeigt, dass ein Django-Backend hinter einem nginx Reverse Proxy erreichbar ist.

## Architektur

Client -> nginx Reverse Proxy -> Django Backend

Der Client ruft nicht direkt das Django-Backend auf. Stattdessen wird die Anfrage an nginx gesendet. nginx leitet die Anfrage über `proxy_pass` an den internen Backend-Service weiter.

## Start

```bash
docker compose up --build
```

## Test

```bash
curl http://localhost:8080/api/health/
```

Alternativ kann die URL im Browser geöffnet werden:

```text
http://localhost:8080/api/health/
```

## Erwartetes Ergebnis

Das Django-Backend antwortet mit einer JSON-Antwort, zum Beispiel:

```json
{
  "status": "ok",
  "service": "django-backend",
  "message": "Request successfully reached Django backend",
  "host": "localhost",
  "x_forwarded_for": "172.18.0.1",
  "x_forwarded_proto": "http"
}
```

## Nachweis

Der Backend-Service wird nicht direkt nach außen veröffentlicht, sondern nur intern über Docker Compose bereitgestellt:

```yaml
backend:
  expose:
    - "8000"
```

Nur der nginx-Service ist von außen erreichbar:

```yaml
reverse-proxy:
  ports:
    - "8080:80"
```

nginx leitet Anfragen an den internen Django-Service weiter:

```nginx
location /api/ {
    proxy_pass http://django_backend/api/;
}
```

Damit ist gezeigt, dass das Backend mit einem Reverse Proxy interagieren kann.

## Dateien

```text
.
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   └── core/
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## Stoppen

Die laufenden Container können mit `Ctrl + C` gestoppt werden.