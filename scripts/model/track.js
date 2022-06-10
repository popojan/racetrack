function Track() {
    this.width = 0;
    this.height = 0;
    this.S = 1.0;
    return this;
}

Track.prototype.createFrom = function(designString) {
    let design = new Designer("").parse(designString);
    let path;
    if(design.circuit) {
        path = design.i() + "  " + design.o();
    } else {
        path = design.o() + " L" + design.i().substring(1) + " z";
    }
    this.renderPath = path;

    //TODO get rid of Raphael dependency
    //console.log(path);

    this.sPath = Raphael.transformPath(path,"t" + 0 + "," + 0 + " s" + 1 + "," + 1);
    //Raphael.transformPath(path,"t" + 0 + "," + 0 + " s" + 1 + "," + 1)
    //console.log(this.sPath);
    //console.log(Raphael.transformPath(path,"t" + 0 + "," + 0 + " s" + 1 + "," + 1));

    this.collisionPath = new Path();
    this.collisionPath.parseData(this.sPath.toString());

    this.defaultSteeringRadius = design.R;
    this.defaultCollisionRadius = 0.25 * design.R;
    this.startPositions = [];
    for(let i = 0; i < design.gridcount; ++i) {
        this.startPositions.push(design.startpos(i));
    }
    this.design = design;
    this.cover = null;
    this.point = null;
    return this;
};
Track.prototype.fmm_update_exp = function(nearest, hash, a, i, j) {
    let left = (a[i-1] ? a[i-1][j].u : Infinity);
    let right =(a[i+1] ? a[i+1][j].u : Infinity);
    let uh, hh;
    if(left < right) {
        uh = left
        hh = distance(a[i - 1][j], a[i][j]);
    } else if(right < left) {
        uh = right;
        hh = distance(a[i + 1][j], a[i][j]);;
    } else {
        uh = left;
        hh = 0.0;
        let k = 0;
        if(a[i-1]) {
            hh += distance(a[i - 1][j], a[i][j]);
            k += 1
        }
        if(a[i+1]) {
            hh += distance(a[i + 1][j], a[i][j]);
            k += 1
        }
        hh /= k;
    }
    let top = (a[i][j+1] ? a[i][j+1].u : Infinity);
    let bottom = (a[i][j-1] ? a[i][j-1].u : Infinity);
    let uv, hv;
    if(top < bottom) {
        uv = top;
        hv = distance(a[i][j+1], a[i][j]);
    } else if(bottom < top) {
        uv = bottom;
        hv = distance(a[i][j-1], a[i][j]);
    } else  {
        uv = top;
        hv = 0.0;
        let k = 0;
        if(a[i][j-1]) {
            hv += distance(a[i][j-1], a[i][j]);
            k += 1;
        }
        if(a[i][j+1]) {
            hv += distance(a[i][j + 1], a[i][j]);
            k += 1;
        }
        hv /= k;
    }
    let val;
    let D = hh*hh + hv*hv - Math.pow(uh - uv, 2);
    if(D >= 0) {
        val = Math.min(a[i][j].u,((uh/hh/hh + uv/hv/hv) + Math.sqrt(D)/hh/hv)/(1/hh/hh+1/hv/hv));
    } else {
        val = Math.min(a[i][j].u, uh < uv ? uh + hh : uv + hv);
    }
    if(val < a[i][j].u) {
        a[i][j].u = val;
        //console.log("u = " + val);
        a[i][j].state = "considered";
        nearest.push(a[i][j]);
    }
    let key = i  + "," + j;
    //if(!hash[key]) {

    //    hash[key] = true;
    //}

}
Track.prototype.fmm_update = function(nearest, a, i, j) {
    //console.log(this.wcount, this.lcount, i, j);
    let uh = Math.min((a[i-1] ? a[i-1][j].u : Infinity), (a[i+1] ? a[i+1][j].u : Infinity));
    let uv = Math.min((a[i][j-1] ? a[i][j-1].u : Infinity),(a[i][j+1] ? a[i][j+1].u : Infinity));
    let h = 0.0;
    let k = 0.0;
    if(a[i-1]) {
        h += distance(a[i - 1][j], a[i][j]);
        k += 1;
    }
    if(a[i+1]) {
        h += distance(a[i + 1][j], a[i][j]);
        k += 1;
    }
    if(a[i][j-1]) {
        h += distance(a[i][j-1], a[i][j]);
        k += 1;
    }
    if(a[i][j+1]) {
        h += distance(a[i][j + 1], a[i][j]);
        k += 1;
    }
    //console.log(h, uh, uv);
    if(k == 0)
        return;
    h /= k;

    let val;
    let speed = 0.95;
    if(Math.abs(uh -uv) < h) {
        val = Math.min(a[i][j].u,0.5 * (uh + uv) + 0.5 * Math.sqrt(Math.pow(uh + uv, 2) - 2 * (uh * uh + uv * uv - h * h /  speed / speed)));
    } else {
        val = Math.min(a[i][j].u, Math.min(uh, uv) + h/speed);
    }
    if(val < a[i][j].u) {
        a[i][j].u = val;
        //console.log("u = " + val);
        a[i][j].state = "considered";
        nearest.push(a[i][j]);
    }
    //let key = i  + "," + j;
    //if(!hash[key]) {

    //    hash[key] = true;
    //}

}

Track.prototype.vfa = function(a, lcount, wcount, dir) {
    this.wcount = wcount;
    this.lcount = lcount;
    let v = {};
    for (let i = lcount - 1; i >= 0; --i) {
        for (let j = 0; j < wcount; ++j) {
            v[[i, j, 0, 0].join(",")] = -1000;
        }
    }
    for(let iter = 0; iter < 5; ++iter) {
        for(const key in v) {
            let ar = key.split(",");
            let x = parseInt(ar[0]);
            let y = parseInt(ar[1]);
            let vx = parseInt(ar[2]);
            let vy = parseInt(ar[3]);
            let cur = a[x][y];
            for (let ax = -1; ax <= 1; ++ax) {
                for (let ay = -1; ay <= 1; ++ay) {
                    let previ = [x - vx + ax, y - vy + ay, vx - ax,  vy - ay].join(',');
                    let kevinLine = new Path();
                    let prev = a[x-vx+ax];
                    if(!prev) continue;
                    prev = prev[y-vy+ay];
                    if(!prev) continue;
                    kevinLine.parseData("M" + prev.x + "," + prev.y + "L" + cur.x + "," + cur.y);
                    kevinLine.getIntersectionParams();

                    let inter = new Intersection("I", 20);
                    inter.t = 2;
                    let ret = intersectShapes(this.collisionPath, kevinLine, inter);
                    if (ret.points.length > 0)
                        v[previ] = v[key] - 1000;
                    else
                        v[previ] = v[key] - 1;
                    if(vx - ax == 0 && vy - ay == 0) {
                        a[x-vx+ax][y-vy+ay].lat = -v[previ];
                    }
                }
            }
        }
        console.log(iter);
    }
};

Track.prototype.fmm = function(a, lcount, wcount, dir, ioff) {
    if(ioff === undefined) ioff = a.length-1;
    let maxu = [-Infinity, -Infinity];
    this.wcount = wcount;
    this.lcount = lcount;
    let len = Infinity;
    for(let lap = 0; lap < 1; ++lap) {
        let nearest = new TinyQueue([], function (a, b) {
            return a.u - b.u;
        });
        let hash = {};

        let i = ioff; //dir > 0 ? off : a.length - 1;
        dir = -1;
        let starts = [];
        if (lap == 0) {
            for (let b of a) {
                for (let p of b) {
                    p.u = Infinity;
                }
            }
            for (let p of a[i]) {
                p.u = 0.0;
                p.state = "accepted";
                starts.push(p);
                //hash[p.ix + "," + p.iy] = true;
            }
        } else {
            for (let b of a) {
                for (let p of b) {
                    if (p.u > 0.98*maxu[0]) {
                        p.u = 0.0;
                        p.state = "accepted";
                    } else {
                        p.u = Infinity;
                        p.state = "far";
                    }
                    starts.push(p);
                    //hash[p.ix + "," + p.iy] = true;
                }
            }
        }
        for(let p of starts) {
            this.fmm_update(nearest, a, (p.ix + dir + lcount)%lcount, p.iy);
        }
        for (let it = 0; nearest.length > 0; ++it) {
            let p = nearest.pop();

            if (p.state === "accepted") continue;

            this.fmm_update(nearest, a, (p.ix + dir + lcount) % lcount, p.iy);
            if (p.iy >= 1)
                this.fmm_update(nearest, a, (p.ix + dir + lcount) % lcount, p.iy - 1);
            if (p.iy < wcount - 1)
                this.fmm_update(nearest, a, (p.ix + dir + lcount) % lcount, p.iy + 1);

            p.state = "accepted";
            if(p.ix == ioff % lcount){
                len = Math.min(len, p.u);
            }
            maxu[lap] = Math.max(maxu[lap], p.u);
        }
    }

    for(let b of a) {
        for(let p of b) {
            if(dir > 0)
                p.lat = -p.u;
            else
                p.lat = maxu[0]-p.u;
        }
    }
    return maxu[0];
}

Track.prototype.initAI = function(lcount, wcount, maxK, limit, alpha, beta) {

    let ret =  this.design.optimal(lcount, wcount);
    this.points = ret[0];
    this.points2D = ret[1];
    this.maxu = this.fmm(this.points2D, lcount, wcount, -1, lcount-1);

    let bounds = this.getBoundingBox(0.0);

    this.cover = new QT.QuadTree(new QT.Box(bounds.x, bounds.y,bounds.width, bounds.height));
    for(let i = 0; i < this.points.length; ++i) {
        this.cover.insert(new QT.Point(this.points[i].x, this.points[i].y, JSON.parse(JSON.stringify(this.points[i]))));
    }
}

Track.prototype.getBoundingBox = function(margin) {
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    let ub = function(x, y) {
        x1 = Math.min(x, x1);
        y1 = Math.min(y, y1);
        x2 = Math.max(x, x2);
        y2 = Math.max(y, y2);
    }
    for(let j = 0; j < this.sPath.length; ++j) {
        for(let k = 1; k < this.sPath[j].length; k+=2) {
            ub(this.sPath[j][k], this.sPath[j][k+1]);
        }
    }
    return {x:x1-margin, y:y1-margin, width: (x2-x1)+2*margin, height: (y2-y1) + 2*margin};
};
