class SecurityHeadersMiddleware:
    """
    Middleware to add security headers for OAuth and API requests
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Remove Cross-Origin-Opener-Policy for OAuth endpoints
        if '/api/auth/google/' in request.path:
            response['Cross-Origin-Opener-Policy'] = 'unsafe-none'
            response['Cross-Origin-Embedder-Policy'] = 'unsafe-none'
        
        # Add CORS headers for API endpoints
        if request.path.startswith('/api/'):
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
            response['Access-Control-Allow-Credentials'] = 'true'
        
        return response