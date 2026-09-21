import http.server
import socketserver
import threading
import time
import pytest
from pathlib import Path

PORT = 8000
ROOT_DIR = Path(__file__).parent.parent

class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

@pytest.fixture(scope="session")
def server():
    handler = lambda *args, **kwargs: QuietHTTPRequestHandler(*args, directory=str(ROOT_DIR), **kwargs)
    
    # Try binding to PORT or fallback if in use
    httpd = None
    port = PORT
    for try_port in range(PORT, PORT + 10):
        try:
            httpd = socketserver.TCPServer(("127.0.0.1", try_port), handler)
            port = try_port
            break
        except OSError:
            continue
            
    if httpd is None:
        pytest.fail("Could not bind HTTP server to any port")

    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    
    server_url = f"http://127.0.0.1:{port}"
    yield server_url
    
    httpd.shutdown()
    httpd.server_close()
