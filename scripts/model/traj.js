function Traj (track) {
    this.track = track;
    this.crashp = [];
    this.wallfrac = [];
    return this;
}

Traj.prototype = new Array;

Traj.prototype.m = function(x, y){
    if(y === undefined) {
        this.push(x);
    } else {
        this.push(new P(x, y));
    }
    this.crashp.push({points:[]});
    this.wallfrac.push(0.0);
    let i = this.length -1;
    let c = this.crash(i);
    let isCrash = (c.points.length > 0 && c.points[0].t >=0.0 && c.points[0].t <= 1.0);
    let cross = !(this.legal(i) && !isCrash);
    //if(isCrash) {
        //if(crash.points.length > 0) {
        this.crashp[i] = c;
        this.crashp[i].points.sort(function(a, b) {return (a.t - b.t);});
        let parity = 0;
        for (let j = 0; j < i; ++j) {
            parity += this.crashp[j].points.length;
        }
        let wallfrac = 0.0;
        let ts = [];
        if (parity % 2 == 1) {
            ts.push(0.0);
        }
        for (let j = 0; j < this.crashp[i].points.length; ++j) {
            ts.push(this.crashp[i].points[j].t);
        }
        if ((parity + this.crashp[i].points.length) % 2 == 1) {
            ts.push(1.0);
        }
        for (let j = 1; j < ts.length; j += 2) {
            wallfrac += ts[j] - ts[j - 1];
        }
        this.wallfrac[i] = wallfrac;
    //}
    return this;
};

Traj.prototype.str = function() {
    var ret = [];
    for(var i = 0; i < this.length; ++i) {
        ret.push(this[i].x + " " + this[i].y);
    }
    return ret.join(", ");
};

Traj.prototype.c = function(dx, dy, i) {
    if(i === undefined) i = this.length - 1;
    if(!dx) dx = 0;
    if(!dy) dy = 0;
    let a = this[Math.max(0, i-1)];
    let b = this[i];
    return new P(
        b.x + this.R(i-1).s * (b.x - a.x) + dx,
        b.y + this.R(i-1).s * (b.y - a.y) + dy
    );//TODO i
};

Traj.prototype.ic = function(ci, i) {
    if(i === undefined) i = this.length-1;
    let a = this[Math.max(0, i)];
    let S = this.R(i).s;//TODO i+1
    return new P(
        (ci.x + S * a.x)/(1 + S),
        (ci.y + S * a.y)/(1 + S)
    );
};

Traj.prototype.legal = function(i) {
    if(i === undefined) i = this.length -1;
    let c = this.c(0, 0, Math.max(0, i-1));
    let p = this[i];
    let dx = p.x - c.x;
    let dy = p.y - c.y;
    let R = this.R(i).r;
    return dx*dx + dy*dy <= R*R;
};

Traj.prototype.concat = function(t,cnt) {
    if(cnt === undefined) cnt = t.length;
    for(var i = 0; i < cnt; ++i) {
        this.m(t[i]);
    }
    return this;
};

Traj.prototype.score = function() {
    var a = this[this.length - (this.length < 2 ? 1 : 2)];
    var b = this[this.length - 1];
    var t = intersectionSegmentCircle(a.x, a.y, b.x, b.y, this.track.fx, this.track.fy, this.track.F);
    var ret = Infinity;
    if(t != false) {
        ret = this.length - 1 + t;
    }
    return ret;
};

Traj.prototype.crash = function(i) {
    if(i === undefined){
        i = this.length -1;
    }
    let bez = this.bez(i);
    let A = bez[0];
    let b = bez[1];
    let B = bez[2];
    //if(B.x < 0 || B.x >= track.w || B.y < 0 || B.y >= track.h)
    //    return true;
    let mint = false;
    let kevinLine = new Path();
    kevinLine.parseData("M0,0 S1,1,1,1");
    kevinLine.getIntersectionParams();
    kevinLine.segments[0].handles[0].point.x = A.x;
    kevinLine.segments[0].handles[0].point.y = A.y;
    kevinLine.segments[1].handles[0].point.x = b.x;
    kevinLine.segments[1].handles[0].point.y = b.y;
    kevinLine.segments[1].handles[1].point.x = B.x;
    kevinLine.segments[1].handles[1].point.y = B.y;
    let inter = new Intersection("I");
    inter.t = 2;
    return intersectShapes(trackKevinPath, kevinLine, inter);
};

Traj.prototype.plan = function(b, i) {
    if(i === undefined) i = this.length -1;
    let ret = new Traj(this.track);
    ret.concat(this, i + 1);
    ret.m(b.x, b.y);
    return ret;
};


Traj.prototype.bez = function(i) {
    if(i === undefined){
        i = this.length -1;
    }
    let a = this.c(0, 0, Math.max(0, i-2));
    let b = this.c(0, 0, Math.max(0, i-1));
    let c = this.c(0, 0, i);
    let S1 = this.R(i-1).S;
    let S2 = this.R(i).S;
    let A = new P((a.x+S1*b.x)/(1+S1), (a.y+S1*b.y)/(1+S1));
    let B = new P((b.x + S2*c.x)/(1+S2), (b.y+S2*c.y)/(1+S2));
    return [A, b, B];
};

Traj.prototype.t2b = function(b, i) {
    if(i === undefined){
        i = this.length -1;
    }
    let a = this.c(0, 0, Math.max(0, i));
    b = this.plan(b, i).c();
    let S = this.plan(b, i).R().S;
    return new P((a.x+S*b.x)/(1+S), (a.y+S*b.y)/(1+S));
};

Traj.prototype.b2t = function(B, i) {
    if(i === undefined){
        i = this.length - 1;
    }
    let ca = this.c(0, 0, Math.max(0, i));
    let S = this.R(i).S;
    let cb = B.mul(1+S).sub(ca).mul(1.0/S);
    let b = this.ic(cb, i);
    return b;
};

Traj.prototype.R = function(i) {
    if(i === undefined){
        i = this.length - 1;
    }
    let w = this.wallfrac[Math.min(this.length-1, Math.max(0, i))];//TODO i
    let r = (1 - w) * track.r + w * 0.5 * track.r;
    let s = (1 - w) * track.S + w * 0.5 * track.S;
    return {r:r, s:s, S: 1.0, R:r/*r*(1+s)*/};
};