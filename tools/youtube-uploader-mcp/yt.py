#!/usr/bin/env python3
"""Tiny command-line client for the locally built youtube-uploader-mcp (speaks MCP over stdio).
Lets a script (or Claude in a cloud session) log in, upload and list videos without any MCP config.

Environment:
  YT_CLIENT_SECRET_FILE  path to the Google OAuth client_secret JSON (required)
  YT_WORKDIR             where the token cache and log live (default ~/.yt-mcp, created with mode 700)
  YT_MCP_BIN             path to the binary (default: youtube-uploader-mcp-linux-amd64 next to this file)

Commands:
  tools
  auth-url [--redirect URI]          -> prints the Google consent URL to open in a browser
  auth-code CODE_OR_REDIRECTED_URL   -> exchanges the one-time code, stores the token, prints channel id
  channels
  upload --file F --channel ID --title T --description D [--tags a,b] [--category 27]
         [--status private|unlisted|public] [--publish-at 2026-10-10T08:00:00Z] [--made-for-kids]
  list --channel ID [--max 10]
"""
import argparse, json, os, subprocess, sys, time, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
BIN = os.environ.get('YT_MCP_BIN', os.path.join(HERE, 'youtube-uploader-mcp-linux-amd64'))
SECRET = os.environ.get('YT_CLIENT_SECRET_FILE', '')
WORKDIR = os.environ.get('YT_WORKDIR', os.path.expanduser('~/.yt-mcp'))


class Server:
    def __init__(self):
        if not SECRET or not os.path.isfile(SECRET):
            sys.exit('Set YT_CLIENT_SECRET_FILE to your Google OAuth client_secret JSON.')
        os.makedirs(WORKDIR, mode=0o700, exist_ok=True)
        env = dict(os.environ, YOUTUBE_UPLOADER_MCP_LOG_DIR=WORKDIR)
        self.p = subprocess.Popen([BIN, '-client_secret_file', SECRET, '-working_dir', WORKDIR],
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, env=env, bufsize=1)
        self.n = 0
        self.rpc('initialize', {'protocolVersion': '2024-11-05', 'capabilities': {}, 'clientInfo': {'name': 'yt.py', 'version': '1'}})
        self.send({'jsonrpc': '2.0', 'method': 'notifications/initialized'})

    def send(self, msg):
        self.p.stdin.write(json.dumps(msg) + '\n'); self.p.stdin.flush()

    def rpc(self, method, params=None):
        self.n += 1; want = self.n
        self.send({'jsonrpc': '2.0', 'id': want, 'method': method, 'params': params or {}})
        while True:
            line = self.p.stdout.readline()
            if not line:
                sys.exit('server exited unexpectedly')
            try:
                d = json.loads(line)
            except ValueError:
                continue
            if d.get('id') == want:
                if 'error' in d:
                    sys.exit('MCP error: %s' % d['error'])
                return d['result']

    def tool(self, name, args=None):
        r = self.rpc('tools/call', {'name': name, 'arguments': args or {}})
        text = '\n'.join(c.get('text', '') for c in r.get('content', []) if c.get('type') == 'text')
        if r.get('isError'):
            sys.exit('ERROR: ' + text)
        return text

    def close(self):
        try:
            self.p.stdin.close(); self.p.wait(timeout=5)
        except Exception:
            self.p.kill()


def clean_code(s):
    s = s.strip()
    if s.startswith('http'):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(s).query)
        s = q.get('code', [''])[0]
    return urllib.parse.unquote(s)       # the code in the address bar is URL-encoded (%2F -> /)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('tools')
    a = sub.add_parser('auth-url'); a.add_argument('--redirect', default='https://localhost:8080')
    c = sub.add_parser('auth-code'); c.add_argument('code')
    sub.add_parser('channels')
    u = sub.add_parser('upload')
    u.add_argument('--file', required=True); u.add_argument('--channel', required=True)
    u.add_argument('--title', required=True); u.add_argument('--description', required=True)
    u.add_argument('--tags', default='vikings,history,shorts'); u.add_argument('--category', default='27')
    u.add_argument('--status', default='private', choices=['private', 'unlisted', 'public'])
    u.add_argument('--publish-at', default=''); u.add_argument('--made-for-kids', action='store_true')
    u.add_argument('--language', default='en')
    l = sub.add_parser('list'); l.add_argument('--channel', required=True); l.add_argument('--max', type=int, default=10)
    args = ap.parse_args()

    s = Server()
    try:
        if args.cmd == 'tools':
            for t in s.rpc('tools/list')['tools']:
                print(t['name'], '-', ', '.join(t.get('inputSchema', {}).get('properties', {})))
        elif args.cmd == 'auth-url':
            print(s.tool('authenticate', {'redirect_uri': args.redirect}))
        elif args.cmd == 'auth-code':
            print(s.tool('accesstoken', {'code': clean_code(args.code)}))
        elif args.cmd == 'channels':
            print(s.tool('channels'))
        elif args.cmd == 'list':
            print(s.tool('list_videos', {'channel_id': args.channel, 'max': args.max}))
        elif args.cmd == 'upload':
            if not os.path.isfile(args.file):
                sys.exit('file not found: ' + args.file)
            payload = {'file_path': os.path.abspath(args.file), 'channel_id': args.channel, 'title': args.title,
                       'description': args.description, 'tags': args.tags, 'category_id': args.category,
                       'status': args.status, 'video_language': args.language, 'made_for_kids': args.made_for_kids}
            if args.publish_at:
                payload['publish_at'] = args.publish_at
            out = s.tool('upload_video', payload)
            # the server returns early (after 30 s) with a job key; the job lives in this process, so keep polling here
            for _ in range(130):
                try:
                    d = json.loads(out)
                except ValueError:
                    break
                if d.get('status') != 'running':
                    break
                time.sleep(5)
                out = s.tool('check_job_status', {'job_key': d['job_key']})
            print(out)
    finally:
        s.close()


if __name__ == '__main__':
    main()
