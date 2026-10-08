from django.http import JsonResponse


def health_check(request):
    """
    Simple health endpoint for the walking skeleton.

    It returns a JSON response to show that the Django backend
    was reached successfully through the nginx reverse proxy.
    """
    return JsonResponse({
        "status": "ok",
        "service": "django-backend",
        "message": "Request successfully reached Django backend",
        # These headers are forwarded by nginx and help demonstrate
        # that the request passed through the reverse proxy.
        "host": request.headers.get("Host"),
        "x_forwarded_for": request.headers.get("X-Forwarded-For"),
        "x_forwarded_proto": request.headers.get("X-Forwarded-Proto"),
    })