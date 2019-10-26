import os, re, json, time, copy, argparse
from glob import glob
# apt install python-git
from git import Repo
# apt install python-flask
from flask import (
    Flask,
    request,
    render_template,
    send_from_directory
)
from repo.manifest import manifest, mh_project

cdir=os.path.dirname(os.path.abspath(__file__))

# git clone https://gitlab.com/noppo/gevent-websocket.git
from geventwebsocket.handler import WebSocketHandler
# git clone https://github.com/fgallaire/wsgiserver
from gevent.pywsgi import WSGIServer

parser = argparse.ArgumentParser(prog='dumpgen')
parser.add_argument('--verbose', action='store_true', help='verbose')
opt = parser.parse_args()

app = Flask(__name__, template_folder=".")

@app.route('/<path:path>')
def static_file(path):
    return send_from_directory(cdir, path)

repodir="/data/repo"
workdir="/tmp/repoto"

############################################
#
def listOfRepoBranches(rv):
    r={'origin' : []}
    for bn in rv.git.branch("-r").split("\n"):
        m = re.match("origin/(.+)", bn.strip())
        if (m):
            g = m.group(1);
            if (g.startswith("HEAD ->")):
                continue
            r['origin'].append(g)
    return r;

def listOfManifestRepoBranches():
    manifestrepo=Repo(repodir)
    return listOfRepoBranches(manifestrepo);

def serverUrlToPath(url):
    url = url.replace("/","_");
    url = url.replace(":","_");
    return url;

def repoBranches(repourl):
    d = os.path.join("/tmp/repo_work", serverUrlToPath(repourl));
    branches = [];
    try:
        rv=Repo(d)
    except Exception as e:
        print("try clone "+str(e));
        rv=Repo.clone_from(repourl, d)
    return listOfRepoBranches(rv);

def repoBranchComits(repourl, repobranch):
    d = os.path.join("/tmp/repo_work", serverUrlToPath(repourl));
    commits = [];
    rv=Repo(d)
    for c in rv.iter_commits(rev="refs/remotes/origin/"+repobranch, max_count=100):
        commits.append(c);
    c = [ { 'sha': c.hexsha, 'summary': c.summary } for c in commits ]
    return c;

def update(x, y):
    z = x.copy()   # start with x's keys and values
    z.update(y)    # modifies z with y's keys and values & returns None
    return z



#listOfManifestRepoBranches();
#exit(0);
# r.remotes[0].refs

selobj_ar = ['repodir', 'mrb', 'mfn', 'repo', 'repobranch', 'reposha', 'path' ];

class selobj:

    def __init__(self,v):
        global selobj_ar;
        self.v = v;
        for a in selobj_ar:
            if a in v:
                print(" > Select {}: '{}'".format(a,v[a]));

    def __getattr__(self, n):
        if n in self.v:
            return self.v[n]
        return None

    def tohash(self):
        global selobj_ar;
        r = {};
        for a in selobj_ar:
            if a in self.v and not (self.v[a] is None):
                r[a] = self.v[a];
        return r;

    def __str__(self):
        return repr(self.tohash());


# sub get remote
#r.git.branch('-r')

@app.route('/api')
def api():
    global opt;
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']
        while True:
            req = json.loads(ws.read_message())
            print(str(req));
            if (req['type'] == 'start'):
                startobj = {'repodir' : repodir };
                #r = Repo(repodir)
                #r.remotes[0].fetch();
                # 1: request repo branches
                repobranches = listOfManifestRepoBranches()
                ws.send(json.dumps({'type': 'mrbranches', 'data' : [ update(startobj, {'mrb' : e }) for e in repobranches['origin']]}));
            elif (req['type'] == 'mrbsel'):
                mrbsel = selobj(req['data'])
                r = Repo(mrbsel.repodir)
                r.git.checkout(mrbsel.mrb);
                manifestfiles = glob("%s/*xml"%(repodir));
                ws.send(json.dumps({'type': 'manifestfiles', 'data' : [ update(mrbsel.tohash(), {'mfn' : e }) for e in manifestfiles]}));

            elif (req['type'] == 'mfnsel'):
                mfnsel = selobj(req['data'])

                r = Repo(mrbsel.repodir)
                r.git.checkout(mfnsel.mrb);

                print("Load {}\n".format(mfnsel.mfn))
                m0 = manifest(opt, mfnsel.mfn);
                p0 = m0.get_projar();
                pa = []
                for e in p0.p:
                    server=e.xml.attrib['_gitserver_']
                    if (server.startswith("..")):
                        repofetchurl = [n for n in r.remotes[0].urls][0]
                        a = repofetchurl.split("/");
                        a.pop()
                        a[-1] = e.name;
                        server = "/".join(a);
                    else:
                        if (not server.endswith("/")):
                            server+="/"
                        server+=e.name;
                    p = e.path;
                    if p == None:
                        p = e.name;
                    print(server + ": " + p)
                    pa.append({ 'treepath' : p, 'server' : server});

                ws.send(json.dumps({'type': 'repolist', 'data' : pa}));

            elif (req['type'] == 'repoonoff'):

                repoonoff = selobj(req['data'])
                if (req['data']['onoff'] == "on"):
                        pa = repoBranches(repoonoff.repo);
                        ws.send(json.dumps({'type': 'repobranchlist', 'data' : update(repoonoff.tohash(), {'repobranches' : pa['origin'] })}));

                #ws.send(json.dumps({'type': 'manifestfiles', 'data' : manifestfiles}));

            elif (req['type'] == 'repobranch'):

                repobranch = selobj(req['data'])
                pa = repoBranchComits(repoonoff.repo, repobranch.repobranch);
                ws.send(json.dumps({'type': 'reposhalist', 'data' : update(repobranch.tohash(), {'sha' : pa })}));

            time.sleep(1);




    #         # 2: select repo branch
    #         rb = receive(b)
    #         r.checkout(rb);
    #         # 3: request repo list from manifest
    #         send(list(glob('xml')));
    #         mf = receive(b)
    #         m = manifest(mf);
    #         send(list(m.repos))
    #         while True:
    #         #    4: select repo
    #              mr = Repo(receive());
    #         #    5: request list of branches
    #              list(mr.branches)
    #         #    6: select branch
    #              mb = receive();
    #         #    7: request list of commits
    #              list(mb.commit)
    #         #    8: select commit
    #              mc = receive();
    #         #    9: add (repo-commit)
    #              add([mr, mc]);

    #         # 10: add bump request
    #         print(dir(ws))
    #         message = ws.read_message()
    #         ws.send(message)
    # return

if __name__ == '__main__':
    http_server = WSGIServer(('',5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
