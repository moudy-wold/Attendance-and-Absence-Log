from django.conf import settings


class LogErrorResponseMiddleware:
    """Dev-only: prints the actual response body for any 4xx/5xx to the runserver console,
    since the default request log line only shows the status code and byte count."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if settings.DEBUG and response.status_code >= 400:
            try:
                body = response.content.decode("utf-8")
            except UnicodeDecodeError:
                body = "<non-utf8 body>"
            print(f"  -> {request.method} {request.path} [{response.status_code}]: {body}")

        return response
