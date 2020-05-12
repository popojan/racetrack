function Designer(name) {
    this.name = name;
    this.sl = [];
    this.sm = [];
    this.sr = [];
    this.sorig = null;
    this.segments = [];
    this.circuit = false;
    this.bbox = {x:0,y:0,width:0,height:0};
    this.checks = [];
    return this;
}

Designer.prototype.copy = function() {
    let b = new Designer(this.name);
    b.sl = this.sl.slice();
    b.sm = this.sm.slice();
    b.sr = this.sr.slice();
    b.sorig = this.sorig;
    b.segments = this.segments.slice();
    b.circuit = this.circuit;
    b.ex = this.ex;
    b.ey = this.ey;
    b.sx = this.sx;
    b.sy = this.sy;
    b.cx = this.cx;
    b.cy = this.cy;
    b.w = this.w;
    b.a = this.a;
    b.a0 = this.a0;
    b.bbox = this.bbox;
    return b;
};

Designer.prototype.parse = function(s) {
    this.circuit = false;
    this.sorig = s;
    let a =  s.split(" ");
    let i = 0;
    while(i < a.length) {
        switch(a[i]) {
            case "T": case "t":
                this.start(parseFloat(a[i+1]), parseFloat(a[i+2]),
                    parseFloat(a[i+3]), parseFloat(a[i+4]));
                i += 5;
                break;
            case "S": case "s":
                this.straight(parseFloat(a[i+1]));
                i += 2;
                break;
            case "C": case "c":
                this.curve(parseFloat(a[i+1]), parseFloat(a[i+2]));
                i += 3;
                break;
            case "G":
                this.grid(parseFloat(a[i+1]), parseFloat(a[i+2]), parseFloat(a[i+3]));
                i += 3;
                break;
            case "P":
            case "F":
                this.check(parseFloat(a[i+1]));
                i += 2;
                break;
            case "z":
                this.close();
            default:
                i += 1;
                break;
        }
    }
    return this;
};


Designer.prototype._start = function(alpha, sx, sy, lr) {
    let a = (alpha+90)/180*Math.PI;
    let dx = sx+lr*this.w*Math.cos(a);
    let dy = sy+lr*this.w*Math.sin(a);
    //this.s(dx, dy);
    return "M "+dx +" " + dy;
};

Designer.prototype._straight = function(alpha, l) {
    let a = (alpha)/180*Math.PI;
    let dx = l*Math.cos(a);
    let dy = l*Math.sin(a);
    this.ex += dx;
    this.ey += dy;
    //this.bbup(this.ex, this.ey);
    return "l "+dx +" " + dy;
};

Designer.prototype._curve = function(a, r, dalpha, central) {
    let dir = -Math.sign(dalpha);
    dalpha = Math.abs(dalpha);
    let da = dalpha/180*Math.PI;
    let aa = a/180*Math.PI;
    let dy = dir*r*(Math.cos(da)-1);
    let dx = r*Math.sin(da);
    let ex = Math.cos(aa)*dx - Math.sin(aa)*dy;
    let ey = Math.sin(aa)*dx + Math.cos(aa)*dy;
    let large = (dalpha >= 180 ? 1:0);
    let sweep = (dir >=0?0:1);
    let tx = dir*Math.sin(aa)*r;
    let ty = -dir*Math.cos(aa)*r;
    this.cx = tx + this.ex;
    this.cy = ty + this.ey;
    let oex = this.ex;
    let oey = this.ey;
    if(central) {
        this.ex += ex;
        this.ey += ey;
    }
    return "a "+r+" "+r+" "+0+" "+ large + " " + sweep +" "+ ex + " " + ey;
};

function randomDesign(N, w, h) {
            let attempts = 0;
            let ls = 1;
            let i = 0;
            let isvalid = false;
            let ccc = 360;
            design = new Designer("pokus");
            design.start(25, 0, 250, 350);
            let stack = [];
            let backed = false;
            while(design.segments.length < N) {
                ccc = 360;
                design = new Designer("pokus");
                design.start(25, Math.floor(Math.random()*360), 350, 350);
            stack = [];
            backed = false;
            outer:for(let i = 0; i < 2*N && design.segments.length < N; ++i){
                    let backup = design.copy();
                    let angle = 0;
                        stack.push(backup);
                if((design.segments.length > 1 && design.segments.length < N-2 && (ls==0 || Math.random() < 0.2))) { //curve
                    angle = (ls != 0 ? -ls : 1) * (0.5-Math.random())*360;
                    angle = Math.max(angle < 0 ? -45: 45, angle);
                        let r = design.w * (2 + 6* Math.pow(Math.random(),4));
                        ccc += angle;
                        design.curve(angle, r);
                    } else {
                        let mult = 2 - 1.5*(design.a%180)/180;
                        let len = mult*(1+2*design.w* Math.pow(Math.random(),0.5) + 5*design.w*Math.pow(Math.random(), 2));
                        design.straight(len);
                    }
                        let k = design.segments.length-1;
                                let s1 = design.segments[k];
                            for(let j = 1; j < design.segments.length-2; ++j) {
                                let s2 = design.segments[j];
                                if(s2.phi && s1.phi && icc(new Point2D(s1.cx,s1.cy),s1.r,new Point2D(s2.cx,s2.cy),s2.r).t < 2) {
                                    design = stack.pop();
                                    if(stack.length == 0)
                                        stack.push(design);
                                    backed = true;
                                    continue outer;
                                }
                                else if (s1.phi && icl(new Point2D(s1.cx,s1.cy),s1.r,new Point2D(s2.sx,s2.sy),new Point2D(s2.ex,s2.ey)).t < 2) {
                                    design = stack.pop();
                                    if(stack.length == 0)
                                        stack.push(design);
                                    backed = true;
                                    continue outer;
                                }
                                else if (s2.phi && icl(new Point2D(s2.cx,s2.cy),s2.r,new Point2D(s1.sx,s1.sy),new Point2D(s1.ex,s1.ey)).t < 2) {
                                    design = stack.pop();
                                    if(stack.length == 0)
                                        stack.push(design);
                                    backed = true;
                                    continue outer;
                                }
                                else if(ill(new Point2D(s2.sx,s2.sy),new Point2D(s2.ex,s2.ey),new Point2D(s1.sx,s1.sy),new Point2D(s1.ex,s1.ey)).t < 2) {
                                    design = stack.pop();
                                    if(stack.length == 0)
                                        stack.push(design);
                                    backed = true;
                                    continue outer;
                                }
                                else if(design.bbox.x < 0 || design.bbox.y < 0 || design.bbox.width > w || design.bbox.height > h) {
                                    design = stack.pop();
                                    if(stack.length == 0)
                                        stack.push(design);
                                    backed = true;
                                    continue outer;
                                }
                            }
                                    backed = false;
                ls = angle == 0 ? 0 : angle > 0? 1: -1;
                /*if(design.closable() && valid(design) && design.segments.length > 5){
                        stack = [];
                        design.close();
                        break;
                    }*/
            }
            }
    return design;
};
Designer.prototype.bbup = function(x, y) {
    this.bbox.width = Math.max(this.bbox.x + this.bbox.width, x);
    this.bbox.height = Math.max(this.bbox.y + this.bbox.height, y);
    this.bbox.x = Math.min(x, this.bbox.x);
    this.bbox.y = Math.min(y, this.bbox.y);
    this.bbox.width -=  this.bbox.x;
    this.bbox.height -= this.bbox.y;
};

Designer.prototype.start = function(w, a, sx, sy) {
    this.w = w;
    this.a0 = a;
    this.a = a;
    this.sl.push(this._start(this.a, sx, sy, -1));
    this.sm.push(this._start(this.a, sx, sy,  0));
    this.sr.push(this._start(this.a, sx, sy,  1));
    this.sx = sx;
    this.sy = sy;
    this.ex = sx;
    this.ey = sy;
    this.segments.push({a:this.a,sx:sx,sy:sy,ex:sx,ey:sy,len:0});
    return this;
};
Designer.prototype.straight = function(l) {
    let sx = this.ex;
    let sy = this.ey;
    let s = this._straight(this.a, l);
    this.sl.push(s);
    this.sm.push(s);
    this.sr.push(s);
    this.segments.push({a:this.a,sx:sx,sy:sy,ex:this.ex,ey:this.ey,len:l});
    return this;
};
Designer.prototype.curve = function(phi, r) {
    let sx = this.ex;
    let sy = this.ey;
    this.sl.push(this._curve(this.a, r + Math.sign(phi) * this.w, phi, 0));
    this.sr.push(this._curve(this.a, r - Math.sign(phi) * this.w, phi, 0));
    this.sm.push(this._curve(this.a, r, phi, 1));
    this.segments.push({a:this.a,sx:sx,sy:sy,ex:this.ex,ey:this.ey,len:Math.abs(phi)/180*Math.PI*r,r:r,cx:this.cx, cy:this.cy,phi:phi});
    this.a += phi;
    return this;
};
Designer.prototype.close = function() {
    let ma = (180 + this.a + this.a0) / 2;
    let dx = Math.cos(ma/180*Math.PI);
    let dy = Math.sin(ma/180*Math.PI);
    let c = (dx*this.ex +dy*this.ey);
    let phi = this.a0 - this.a;
    let dd = -(dx*this.sx + dy*this.sy - c)/Math.cos((ma-this.a0)/180*Math.PI);
    if(dd > 0) {
        this.straight(dd);
        dx = this.ex  - this.sx;
        dy = this.ey  - this.sy;
        let d = Math.sqrt(dx*dx + dy*dy);
        let r = 0.5*d/Math.sin(phi/360*Math.PI);
        this.curve(phi-360,r);
        this.sl.push(" z");
        this.sr.push(" z");
    } else {
        dx = this.ex -dd*Math.cos(this.a0/180*Math.PI) - this.sx;
        dy = this.ey -dd*Math.sin(this.a0/180*Math.PI) - this.sy;
        let d = Math.sqrt(dx*dx + dy*dy);
        let r = 0.5*d/Math.sin(phi/360*Math.PI);
        this.curve(phi-360,r);
        this.straight(-dd);
        this.sl.push(" z");
        this.sr.push(" z");
    }
    this.circuit = true;
    return this;
};
function ill(a1, a2, b1, b2) {
    let result;
    let ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    let ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    let u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (u_b != 0) {
        let ua = ua_t / u_b;
        let ub = ub_t / u_b;
        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
            result = {t:ua};//new Intersection("Intersection");
            //result.points.push(new Point2D(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)));
        } else {
            result = {t:2};//new Intersection("No Intersection");
        }
    } else {
        if (ua_t == 0 || ub_t == 0) {
            result = {t:2};//new Intersection("Coincident");
        } else {
            result = {t:2};//new Intersection("Parallel");
        }
    }
    return result;
};

function icc(c1, r1, c2, r2) {
    let result;
    let r_max = r1 + r2;
    let r_min = Math.abs(r1 - r2);
    let c_dist = c1.distanceFrom(c2);
    if (c_dist > r_max) {
        result = {t:2};//new Intersection("Outside");
    } else if (c_dist < r_min) {
        result = {t:2};//new Intersection("Inside");
    } else {
        result = {t:0};//new Intersection("Intersection");
        let a = (r1 * r1 - r2 * r2 + c_dist * c_dist) / (2 * c_dist);
        let h = Math.sqrt(r1 * r1 - a * a);
        let p = c1.lerp(c2, a / c_dist);
        let b = h / c_dist;
        //result.t = 0;//points.push(new Point2D(p.x - b * (c2.y - c1.y), p.y + b * (c2.x - c1.x)));
        //result.points.push(new Point2D(p.x + b * (c2.y - c1.y), p.y - b * (c2.x - c1.x)));
    }
    return result;
}
function icl(c, r, a1, a2) {
    let result;
    let a = (a2.x - a1.x) * (a2.x - a1.x) + (a2.y - a1.y) * (a2.y - a1.y);
    let b = 2 * ((a2.x - a1.x) * (a1.x - c.x) + (a2.y - a1.y) * (a1.y - c.y));
    let cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y - 2 * (c.x * a1.x + c.y * a1.y) - r * r;
    let deter = b * b - 4 * a * cc;
    if (deter < 0) {
        result = {t:2};//new Intersection("Outside");
    } else if (deter == 0) {
        result = {t:2};//new Intersection("Tangent");
    } else {
        let e = Math.sqrt(deter);
        let u1 = (-b + e) / (2 * a);
        let u2 = (-b - e) / (2 * a);
        if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
            if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
                result = {t:2};//new Intersection("Outside");
            } else {
                result = {t:2};//new Intersection("Inside");
            }
        } else {
            result = {t:2};//new Intersection("Intersection");
            if (0 <= u1 && u1 <= 1) result.t = u1;//points.push(a1.lerp(a2, u1));
            if (0 <= u2 && u2 <= 1) result.t = u2;//result.points.push(a1.lerp(a2, u2));
        }
    }
    return result;
};

Designer.prototype.closable = function() {
    let ma = (180 + this.a + this.a0) / 2;
    let dx = Math.cos(ma/180*Math.PI);
    let dy = Math.sin(ma/180*Math.PI);
    let c = (dx*this.ex +dy*this.ey);
    let phi = this.a0 - this.a;
    let dd = -(dx*this.sx + dy*this.sy - c)/Math.cos((ma-this.a0)/180*Math.PI);
    let TOL = 10*this.w;
    if(Math.abs(this.sx - this.ex) < TOL && Math.abs(this.sy-this.ey) < TOL && dd > this.w) {
        let dx = dd*Math.cos(this.a);
        let dy = dd*Math.sin(this.a);
        dx = this.ex + dx - this.sx;
        dy = this.ey + dy - this.sy;
        let d = Math.sqrt(dx*dx + dy*dy);
        let r = 0.5*d/Math.sin(phi/360*Math.PI);
        if(r > this.w && r < TOL)
            return true;
    }
    return false;
};

Designer.prototype.i = function() {
    let p = this.sl;
    let sx = 0;
    let sy = 0;
    for(let i = 0; i < p.length; ++i) {
        let a = p[i].trim().split(" ");
        if(i == 0) {
            sx = parseFloat(a[a.length-2]);
            sy = parseFloat(a[a.length-1]);
        }
        else if (a.length > 1) {
            sx += parseFloat(a[a.length-2]);
            sy += parseFloat(a[a.length-1]);
        }
    }
    let r = ["M " + sx + " " + sy];
    for(let i = p.length-1; i > 0; --i) {
        let a = p[i].trim().split(" ");
        if (a.length > 1) {
            a[a.length - 1] = -parseFloat(a[a.length - 1]);
            a[a.length - 2] = -parseFloat(a[a.length - 2]);
            if (a[0] == "a") {
                a[5] = 1 - a[5];
            }
            r.push(a.join(" "));
        }
    }
    r.push("z");
    return r.join(" ");
}

Designer.prototype.o = function() {
    return this.sr.join(" ");
}
Designer.prototype.m = function() {
    return this.sm.join(" ");
}

Designer.prototype.length = function() {
    let len = 0.0;
    for(let i = 0; i < this.segments.length; i++) {
        len += this.segments[i].len;
    }
    return len;
}

Designer.prototype.at = function(len) {
    for(let i = 0; i < this.segments.length; i++) {
        let seg = this.segments[i];
        if(len > seg.len) {
            len -= seg.len;
        } else {
            if(!seg.r) { //straight
                let part = len/(seg.len||1);
                return {
                    x:seg.sx + part*(seg.ex-seg.sx),
                    y:seg.sy + part*(seg.ey-seg.sy),
                    a:seg.a, seg:seg};
            } else { //curve
                let part = len/seg.len;
                let s = this._curve(seg.a, seg.r, seg.phi*part).trim().split(" ");
                let dx = parseFloat(s[6]);
                let dy = parseFloat(s[7]);
                return {x:seg.sx+dx, y:seg.sy+dy, a:seg.a+seg.phi*part, seg:seg};
            }
            break;
        }
    }
    return len;
}

Designer.prototype.grid = function(count, t, R) {
    this.gridcount = count;
    this.gridat = t;
    this.R = R;
};
Designer.prototype.check = function(t) {
    this.checks.push(t);
};

Designer.prototype.finishline = function(i) {
    if(i === undefined) 
        i = this.check.length - 1;
    let len = this.length();
    let at = this.checks[i];
    if(at < len)
        at += len;
    let p = this.at(at % len);
    let b = (p.a+90)/180*Math.PI;
    let side = this.w;
    let s = {x1: p.x+side*Math.cos(b), y1: p.y + side*Math.sin(b),
        x2: p.x-side*Math.cos(b), y2: p.y - side*Math.sin(b), order: i +1, direction:1, finish: (i === this.checks.length - 1)
    };
    return s;
};

Designer.prototype.startpos = function(sid) {
    let len = this.length();
    let at = (this.gridat-Math.floor(sid/2)*this.R*3 - (sid%2)*this.R);
    if(at < len)
        at += len;
    let p = this.at(at % len);
    let a = p.a/180*Math.PI;
    let b = (p.a+90)/180*Math.PI;
    let side = 3*(0.5-sid%2)*Math.min(this.R/2, this.w/3);
    let s = {x: p.x+side*Math.cos(b), y: p.y + side*Math.sin(b),
        vx: Math.cos(a),
        vy: Math.sin(a)};
    return s;
};
