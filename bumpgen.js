var globalId=100

function pathvar (r) {
    this.n = r['n'];
    this.attr = {'class' : ['selpathvar']};
    this.path = r.path;
    this.stopregister = r['stopregister'];
    this.c = [];
    this.gid = ++globalId;
}
pathvar.prototype.id = function() {
    return this.n;
};

function repovar (r) {
    this.n = r['n'];
    this.path = r['path'];
    this.gn = r['gid'];
    this.sha = r['sha'];
    this.attr = {'class' : ['selrepovar','sha'+r['sha']]};
    this.c = [];
    this.gid = ++globalId;
    this.events = [];
}
repovar.prototype.id = function() {
    return this.n;
};
repovar.prototype.gid = function() {

    return this.gn;
};
repovar.prototype.propagate_event = function(e,htmlobj,obj) {
    if (e in this.events) {
        this.events[e].apply(htmlobj, obj);
    }
};

function threadpath(r, a, p, upto) {
    var h = {};
    // create lookup of already present subfolders
    for (var idx in r) {
        h[r[idx].n] = r[idx];
    }
    // next path element
    var cn = a.shift();
    upto.push(cn);
    var e = undefined;
    // create new element
    if (!(cn in h)) {
        if (a.length != 0) {
            e = new pathvar({'n': cn, path: upto.join("/")});
            r.push(e);
        } else {
            e = p;
            if (!(e instanceof repovar)) {
                e = new repovar({'n': cn, 'gid': p.n, 'sha': p.sha, 'path': p.path})
            } else {
                e.n = cn;
                e.gid = p.path;
            }
            r.push(e);
        }
        r.sort(function(a, b) { return ('' + a.n).localeCompare(b.n); });
    } else {
        e = h[cn];
    }
    if (a.length != 0)
    {
        threadpath(e.c, a, p, upto);
    }
}

function expandAll(fn, ln) {
    $('.menu-tree li > ul').each(function(i) {
        $(this).show();
    });
    $(".menu-tree").find("span").addClass("expanded");
}

function collapseAll(fn, ln) {
    $('.menu-tree li > ul').each(function(i) {
        $(this).hide();
    });
    $(".menu-tree").find("span").removeClass("expanded");
}

function viewOnlyChanged()
{
    var a = $("#d2_a");
}

function gen_tree(n)
{
    this.c = [];
    this.n = n;
    this.e = {'color':0,'attr':{'class':[]}};
    this.color = 0;
    this.issort = 1;
}

function ismember(a,n)
{
    for (var i in a)
    {
        if (a[i] == n)
            return 1;
    }
    return 0;
}

gen_tree.prototype.genar = function(a)
{
    var n = [];
    for (var e of a) {
        var c = new gen_tree(e['n']);
        n.push(c);
        c.e = e;
        if ('c' in e) {
            c.genar(e.c);
        }
    }
    this.c = this.c.concat(n);
}

gen_tree.prototype.gen = function(na,e)
{
    var _n = [...na]
    var n = _n.shift();
    var c = this.c.find(function(a) { return a.n == n });
    if (c == undefined)
    {
        c = new gen_tree(n);
        this.c.push(c);
    }
    if (this.issort) {
        this.c.sort(function(a, b) { return ('' + a.n).localeCompare(b.n); });
    }
    if (_n.length != 0)
    {
        c.gen(_n,e);
        if (e != undefined)
            c.e.color |= e.color;
    } else {
        c.e = e;
    }
}

function converthexcolor(a)
{
    var k = ""; var i;
    for (i = 0; i < 6;  i++ )
    {
        var j = a & 0xf; a >>= 4;
        k = j.toString(16)+k;
    }
    return k;
}

var index = 1;
gen_tree.prototype.htmlid = function(na)
{
    var id = "idnum"+(index++);
    if (this.e != undefined &&
        'path' in this.e)
    {
        id = this.e['path'];
        id = id.replace(/[\/\s\.@:\-]/ig, "_");
    }
    return id;
}

gen_tree.prototype.gid = function(na)
{
    var id = 0;
    if (this.e != undefined &&
        'gid' in this.e)
    {
        id = this.e['gid'];
    }
    return id;
}

gen_tree.prototype.selector = function(na)
{
    var id = this.htmlid();
    if (!id.startsWith("#"))
    {
        id = "#" + id;
    }
    return id;
}

gen_tree.prototype.getli = function(na)
{
    var id = this.selector();
    var e = $(id);
}

gen_tree.prototype.htmlchilds = function(na)
{
    var c = [];
    for (var i in this.c)
    {
        var e = this.c[i];
        c.push(e.html(na));
    }
    var l = c.join("\n");
    var ul = "<ul> " + l + "</ul>";
    var id = this.selector();
    var e = $(id+" ul").replaceWith(ul);
}

gen_tree.prototype.isinstantiated = function(na)
{
    var id = this.selector();
    var e = $(id);
    return (e.length);
}

gen_tree.prototype.reinstantiate = function(na)
{
    var dirty = 0;
    for (var i in this.c)
    {
        var e = this.c[i];
        if (! e.isinstantiated()) {
            dirty = 1;
        }
    }
    if (dirty)
    {
        console.log("Need instance of child "+this.htmlid());
        this.htmlchilds(na);
    }
    else
    {
        console.log("Instance "+this.htmlid());
    }
    for (var i in this.c)
    {
        var e = this.c[i];
        e.reinstantiate(na);
    }
}


gen_tree.prototype.html = function(parent, na)
{
    var c = [];
    for (var i in this.c) {
        var e = this.c[i];
        c.push(e.html(this, na));
    }
    var func = 'selgroup'; var arg0 = ""; var arg1 = "file";
    var a = ['expanded'];
    if (this.e != undefined &&
        'attr' in this.e &&
        'class' in this.e['attr'])
    {
        var toadd = this.e['attr']['class'];
        if (toadd[0] != undefined)
            func = toadd[0];
        if ('dir' in toadd) {
            arg1 = 'dir';
        }
        arg0 = this.e['path'];
        if ('arg0' in this.e)
            arg0 = this.e['arg0']
        if ('arg1' in this.e)
            arg1 = this.e['arg1']
        a = a.concat(toadd);
    }
    var col = "";

    if (this.e != undefined && (this.e.color && !ismember(this.e.attr.class,'file')))
    {
        col = 0xffffff;
        if (this.e.color & 0x2) { // grey
            col -= 0x101010;
        } else if (this.e.color & 0x4) { // green
            col -= 0x300030;
        } else if (this.e.color & 0x1) { // red
            col -= 0x003030;
        }
        col = converthexcolor(col);
        //console.log(col);
        col = "background-color:#"+col;
    }

    var l = c.join("\n");
    var id = this.htmlid();
    var gid = this.gid();
    var pgid = "";
    if (parent != undefined) {
        pgid = " data-tt-parent-id=\""+parent.gid()+"\" ";
    }
    //var pgid = this.htmlid();
    if (arg0 == undefined)
        arg0 = id;
    var args = [arg0, arg1, id].map(function(a) { return "\""+a+"\""; }).join(",");

    // closure handlers
    var onoffcheckbox = "";
    var repobranchselect = "";
    var reposhaselect = "";
    if ((this.e instanceof repovar)) {
        var e = this.e;
        var onoffid = "onoff-"+id;
        onoffcheckbox = "<input type=\"checkbox\" id=\""+onoffid+"\"/>";
        defered_event_handler.push([onoffid, "change", function() {
            e.propagate_event("onoff", this, e);
        } ]);

        var repobranchid = "repobranch-"+id;
        repobranchselect = "<select id=\""+repobranchid+"\" class=\"bumpselectbox repoelem\"></select>";
        defered_event_handler.push([repobranchid, "click", function() {
            e.propagate_event("repobranch", this, e);
        } ]);

        var reposhaid = "reposha-"+id;
        reposhaselect = "<select id=\""+reposhaid+"\" class=\"shaselectbox repoelem\"></select>";
        defered_event_handler.push([reposhaid, "click", function() {
            e.propagate_event("reposha", this, e);
        } ]);
    }

    return "<tr data-tt-id=\""+gid+"\" "+pgid+" id=\""+id+"\" ><td>"+onoffcheckbox+"<span class=\""+a.join(" ")+"\"><a style=\""+col+"\" onclick='"+func+"("+args+")' >" + this.n + "</a></span></td><td width=\"20\"></td><td width=\"\">"+repobranchselect+reposhaselect+"</td></tr> " + l + "";

}


function propagate(e,r,g,b) {

}

/* ------------------ idify ------------------*/

function idify(a) {
    var r = [];
    for (var i of a) {
        //console.log(i);
        var j = i.id();
        r.push(j);
    }
    return r;
}

function unidify(d, a, b) {
    var a_i = 0;
    var b_i = 0;
    var r = [];
    for (i of d) {
        if (i.added && ! i.removed) {
            for (var j = 0; j < i.items.length; j++)
                r.push([undefined,b[b_i++]]);
        } else if (!i.added &&i.removed) {
            for (var j = 0; j < i.items.length; j++)
                r.push([a[a_i++],undefined]);
        } else if  (!i.added && !i.removed) {
            for (var j = 0; j < i.items.length; j++)
                r.push([a[a_i++],b[b_i++]]);
        } else {
            throw Error("Undef");
        }
    }
    return r;
}

function propagate(e,c) {
    e.attr.class.push(c);
    for (var i of e.c) {
        propagate(i,c);
    }
}

function diffhirarchy(a,b,order=[],register=[]) {
    var a_i = idify(a);
    var b_i = idify(b);
    //console.log(a_i);
    //console.log(b_i);
    var d = diff(a_i, b_i);
    //console.log(d);
    var u = unidify(d, a, b);
    //console.log(u);
    var result = [];
    for (var e of u) {
        if (e[0] == undefined && e[1] != undefined) {
            propagate(e[1], "diffremoved");
            result.push(e[1]);
            try { if (e[1].gid()) register.push(e); } catch(e) {};
        }
        if (e[0] != undefined && e[1] == undefined) {
            propagate(e[0], "diffnew");
            result.push(e[0]);
            try { if (e[0].gid()) register.push(e); } catch(e) {};
        }
        if (e[0] != undefined && e[1] != undefined) {
            var e0 = e[0];
            var e1 = e[1];
            if (e0.stopregister || e1.stopregister)
                register = [];
            var c = diffhirarchy(e0.c, e1.c,order,register);
            try {
                e1 = e1.clone();
            } catch(e) {};
            e1.c = c;
            result.push(e1);
            try { if (e[0].gid()) register.push(e); } catch(e) {};
        }
    }
    if (order.length) {
        var head = []
        for (var i of order) {
            var _r = []
            for (var j of result) {
                if (j.n == i) {
                    head.push(j);
                } else {
                    _r.push(j);
                }
            }
            result = _r;
        }
        result = head.concat(result);
    }
    return result;
}

/* -------------------- click handler --------------------- */

function treeCodeClickSetup() {
    // Find list items representing folders and
    // style them accordingly.  Also, turn them
    // into links that can expand/collapse the
    // tree leaf.
    $('.menu-tree li > ul').each(function(i) {
        // Find this list's parent list item.
        var parent_li = $(this).parent('li');

        // Temporarily remove the list from the
        // parent list item, wrap the remaining
        // text in an anchor, then reattach it.
        var sub_ul = $(this).remove();
        parent_li.find('a').click(function() {
            // Make the anchor toggle the leaf display.
            sub_ul.toggle(300);

            //Add class to change folder image when clicked on
            $(this).find('span:first-child').toggleClass('expanded');

        });
        parent_li.append(sub_ul);
    });
    // Hide all lists except the outermost.
    //$('.menu-tree ul ul').hide();
};
