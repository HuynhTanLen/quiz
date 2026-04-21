import http.server
import socketserver
import socket
import os

PORT = 8000
MAX_PORT = 8100

def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Connect to a public DNS server to determine the default routing interface
        s.connect(('8.8.8.8', 80))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class Handler(http.server.SimpleHTTPRequestHandler):
    # Disable logging to keep the console clean
    def log_message(self, format, *args):
        pass


def find_available_port(start_port, end_port):
    for port in range(start_port, end_port + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    raise OSError(f"Khong tim duoc cong trong trong khoang {start_port}-{end_port}")

os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = find_available_port(PORT, MAX_PORT)

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    ip = get_ip()
    print("\n" + "=" * 60)
    print(" 🚀 APP BO TRAC NGHIEM DA KHOI DONG THANH CONG!")
    print("=" * 60)
    print(f" 💻 Su dung truc tiep tren may nay:\n    👉  http://localhost:{PORT}")
    print("-" * 60)
    print(f" 🌐 Cho nguoi khac dung (cung mang WiFi/LAN), gui link nay:\n    👉  http://{ip}:{PORT}")
    print("=" * 60)
    print(" Nhan Ctrl + C de tat server.")
    print("=" * 60 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDa tat server. Hen gap lai!")
