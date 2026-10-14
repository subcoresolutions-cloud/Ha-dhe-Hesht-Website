import http.server,sys,os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
CSP=[l.split(': ',1)[1].strip() for l in open('_headers') if 'Content-Security-Policy' in l][0]
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Content-Security-Policy',CSP); self.send_header('X-Content-Type-Options','nosniff'); super().end_headers()
    def log_message(self,*a): pass
http.server.ThreadingHTTPServer(('127.0.0.1',int(os.environ.get('PORT','8766'))),H).serve_forever()
