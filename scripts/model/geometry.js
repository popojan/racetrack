function P(x, y){
    this.x = x;
    this.y = y;
}
P.prototype = {x:0, y:0};

P.prototype.rot = function(a) {
    let nx = Math.cos(a) * this.x - Math.sin(a) * this.y;
    let ny = Math.sin(a) * this.x + Math.cos(a) * this.y;
    this.x = nx;
    this.y = ny;
    return this;
};


P.prototype.mov = function(b) {
    this.x = b.x;
    this.y = b.y;
    return this;
};

P.prototype.add = function(b) {
    this.x += b.x;
    this.y += b.y;
    return this;
};

P.prototype.sub = function(b) {
    this.x -= b.x;
    this.y -= b.y;
    return this;
};

P.prototype.mul = function(b) {
    this.x *= b;
    this.y *= b;
    return this;
};

P.prototype.len = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
P.prototype.n = function() {
    let len = this.len()||1.0;
    this.x /= len;
    this.y /= len;
    return this;
};

P.prototype.p = function() {
    let x = this.x;
    this.x = this.y;
    this.y = -x;
    return this;
};

function CircularArc(C, R, t0, t1, large) {
    this.C = C;
    this.R = R;
    this.t0 = Math.min(t0, t1);
    this.t1 = Math.max(t1, t0);
    this.direction = 2 * (t0 > t1) - 1;
    this.large = 2 * large - 1;
    if (this.large > 0) {
        this.direction *= -1;
    }
};

CircularArc.prototype.at = function(t) {
    t = t * Math.PI * 2;
    let x = this.C.x + this.R * Math.cos(t);
    let y = this.C.y + this.R * Math.sin(t);
    return {'x': x, 'y': y};
}

CircularArc.prototype.toBezier3 = function(div) {
    if(div === undefined) div = 0.25;
    let thetasum = Math.abs(this.t1 - this.t0);
    if(this.direction < 1) {
        thetasum = 1 - thetasum;
    }
    if(thetasum === 0) {
        thetasum += 1;
    }
    let split = Math.ceil(Math.abs(thetasum) / div);
    thetasum *= 2 * Math.PI;
    let ret = [];
    let frac = thetasum / split;
    let alpha0 = this.t0 * 2 * Math.PI - this.large * 0.5 * Math.PI;
    let self = this;
    function f(p, alpha) {
        let ret = (new P()).mov(p).rot(alpha).mul(self.R).add(self.C);
        return ret.x + ' ' + ret.y;
    }
    for(let i = 0; i < split; ++i) {
        let theta = -frac;
        let P0 = new P(Math.cos(theta / 2), Math.sin(theta / 2));
        let P1 = new P((4 - P0.x) / 3, (1 - P0.x) * (3 - P0.x) / 3 / P0.y);
        let P2 = new P(P1.x, -P1.y);
        let P3 = new P(P0.x, -P0.y);
        let alpha = alpha0 - this.direction * theta / 2;
        let a = [];
        if (this.large > 0) {
            a = [' C', f(P1, alpha), f(P2, alpha),  f(P3, alpha)].join(' ');
        } else {
            a = [ ' C', f(P3, alpha), f(P2, alpha),  f(P1, alpha)].join(' ');
        }
        ret.push(a);
        alpha0 -= this.direction * theta;
    }
    if(this.large <= 0) {
        ret.reverse();
    }
    return ret.join(' ');
}


function Bt(t, p0, p1, p2) {
    let a = (1-t)*(1-t);
    let b = 2*(1-t)*t;
    let c = t*t;
    let x = a*p0.x + b*p1.x + c*p2.x;
    let y = a*p0.y + b*p1.y + c*p2.y;
    return new P(x, y);
}
function Btd(t, p0, p1, p2) {
    let a = (-2+2*t);
    let b = 2-4*t;
    let c = 2*t;
    let x = a*p0.x + b*p1.x + c*p2.x;
    let y = a*p0.y + b*p1.y + c*p2.y;
    return new P(x, y);
}
function Btdd(t, p0, p1, p2) {
    let x = 2*p0.x -4*p1.x + 2*p2.x;
    let y = 2*p0.y -4*p1.y + 2*p2.y;
    return new P(x, y);
}

function telemetry(bez) {
    if(!bez || bez.length < 3) {
        return {a: 0, c: 0};
    }
    let p0 = bez[0];
    let p1 = bez[1];
    let p2 = bez[2];
    //if(p0 === null)
    //    return {a: 0, c: 0};
    //let lp = new P().mov(p0);
    //let lv = this.lv;
    //let la = this.la;
    //let suma = this.suma;
    //let p, lpd = this.lpd;
    let ret = [];
    let K = 4;
    let maxCurvature = 0.0;
    let maxAcc = 0.0;
    let pp = new P().mov(p0);
    for(let i = 1;i <= K; ++i) {
        let p = Bt(i/K, p0, p1, p2);
        let pd = Btd(i/K, p0, p1, p2);
        let pdd = Btdd(i/K, p0, p1, p2);
        let v = Math.sqrt(pd.x*pd.x + pd.y*pd.y);
        //let a = Math.atan2(pd.y, pd.x);
        let acc = (2*pdd.x*pd.x + 2*pdd.y*pd.y)/2/v;
        let sDen = (pd.x*pd.x + pd.y*pd.y);
        let sCurvature = (pd.x*pdd.y - pd.y*pdd.x)/Math.sqrt(sDen*sDen*sDen);
        //if(lv == null) lv = v;
        //if(la == null) la = a;
        //let len1 = Math.sqrt(pd.x*pd.x + pd.y*pd.y);
        //let len2 = Math.sqrt(this.lpd.x*this.lpd.x + this.lpd.y*this.lpd.y);
        //let da = la - a;
        //if(da > Math.PI) da -= 2*Math.PI;
        //if(da < -Math.PI) da += 2*Math.PI;
        //let suma -= da;
        if(Math.abs(sCurvature) > 0.01 || acc > 20 || acc < -15) {
            ret.push([new P().mov(pp), new P().mov(p)]);
        }
        //accel.push({v:v, a: acc, s:sCurvature, sa:suma});
        //this.lp = lp = p;
        //this.lpd = pd;
        //this.lv = lv = v;
        //this.la = la = a;
        pp.mov(p);
    }
    //this.suma = suma;
    //this.tele = this.tele.concat(accel);
    return ret;
};
