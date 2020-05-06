function Trajectory (track) {
    this.track = track;
    this.crashp = [];
    this.offTrackFraction = [];
    this.moves = [];
    this.animationMove = 1;
    this.animationMoveFraction = 0;
    this.animationPeriod = 200;
    return this;
}

Trajectory.prototype.copyFrom = function (t) {
    this.track = t.track;
    this.animationMove = t.animationMove;
    this.animationMoveFraction = t.animationMoveFraction;
    this.animationPeriod = t.animationPeriod;
    return this;
};

Trajectory.prototype.advanceAnimation = function (timeDelta, currentMove) {
    this.animationMoveFraction += timeDelta / this.animationPeriod;
    if(this.animationMoveFraction > 1.0) {
        if (this.animationMove <= currentMove) {
            this.animationMove += 1;
            this.animationMoveFraction -= 1.0;
        } else {
            let delta = this.animationMoveFraction - 1.0;
            this.animationMove = 1;
            this.animationMoveFraction = delta;
        }
    }
};

Trajectory.prototype.length = function(){
  return this.moves.length;
};

Trajectory.prototype.push = function(m){
    this.crashp.push({points:[]});
    this.offTrackFraction.push(0.0);
    this.moves.push(m);
    return this;
};

Trajectory.prototype.move = function(i){
    return this.moves[i];
};


Trajectory.prototype.m = function(x, y){
    if(y === undefined) {
        this.push(x);
    } else {
        this.push(new P(x, y));
    }
    let i = this.moves.length -1;
    //let isCrash = (c.points.length > 0 && c.points[0].t >=0.0 && c.points[0].t <= 1.0);
    this.crashp[i] = this.crash(i);
    this.crashp[i].points.sort(function(a, b) {return (a.t - b.t);});
    let parity = 0;
    for (let j = 0; j < i; ++j) {
        parity += this.crashp[j].points.length;
    }
    let offTrackFraction = 0.0;
    let ts = [];
    if (parity % 2 === 1) {
        ts.push(0.0);
    }
    for (let j = 0; j < this.crashp[i].points.length; ++j) {
        ts.push(this.crashp[i].points[j].t);
    }
    if ((parity + this.crashp[i].points.length) % 2 === 1) {
        ts.push(1.0);
    }
    for (let j = 1; j < ts.length; j += 2) {
        offTrackFraction += ts[j] - ts[j - 1];
    }
    this.offTrackFraction[i] = offTrackFraction;
    return this;
};

/*Trajectory.prototype.str = function() {
    let ret = [];
    for(let i = 0; i < this.moves.length; ++i) {
        ret.push(this[i].x + " " + this[i].y);
    }
    return ret.join(", ");
};*/

Trajectory.prototype.c = function(dx, dy, i, b) {
    if(i === undefined) i = this.moves.length - 1;
    if(!dx) dx = 0;
    if(!dy) dy = 0;
    let a = this.moves[Math.max(0, i-1)];
    b = b||this.moves[i];
    return new P(
        b.x + this.speedMomentum(i - 1) * (b.x - a.x) + dx,
        b.y + this.speedMomentum(i - 1) * (b.y - a.y) + dy
    );//i
};

Trajectory.prototype.ic = function(ci, i) {
    if(i === undefined) i = this.moves.length - 1;
    let a = this.moves[Math.max(0, i)];
    let S = this.speedMomentum(i);//i+1
    return new P(
        (ci.x + S * a.x)/(1 + S),
        (ci.y + S * a.y)/(1 + S)
    );
};

Trajectory.prototype.legal = function(i) {
    if(i === undefined) i = this.moves.length - 1;
    let c = this.c(0, 0, Math.max(0, i-1));
    let p = this.moves[i];
    let dx = p.x - c.x;
    let dy = p.y - c.y;
    let R = this.steeringRadius(i);
    return dx*dx + dy*dy <= R*R;
};

Trajectory.prototype.concat = function(t, cnt) {
    if(cnt === undefined) cnt = t.moves.length;
    for(let i = 0; i < cnt; ++i) {
        this.moves.push(t.moves[i]);
        this.crashp.push(t.crashp[i]);
        this.offTrackFraction.push(t.offTrackFraction[i]);
    }
    return this;
};

Trajectory.prototype.crash = function(i) {
    if(i === undefined){
        i = this.moves.length -1;
    }
    let bez = this.bez(i);
    let A = bez[0];
    let b = bez[1];
    let B = bez[2];
    //if(B.x < 0 || B.x >= track.w || B.y < 0 || B.y >= track.h)
    //    return true;
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
    return intersectShapes(this.track.collisionPath, kevinLine, inter);
};

Trajectory.prototype.plan = function(b, i) {
    if(i === undefined) i = this.moves.length -1;
    let ret = new Trajectory().copyFrom(this);
    ret.concat(this, i + 1);
    ret.m(b.x, b.y);
    return ret;
};


Trajectory.prototype.bez = function(i) {
    if(i === undefined){
        i = this.moves.length -1;
    }
    let a = this.c(0, 0, Math.max(0, i-2));
    let b = this.c(0, 0, Math.max(0, i-1));
    let c = this.c(0, 0, i);
    let A = new P((a.x + b.x)/2, (a.y+b.y)/2);
    let B = new P((b.x + c.x)/2, (b.y+c.y)/2);
    return [A, b, B];
};

Trajectory.prototype.t2b = function(b, i) {
    if(i === undefined){
        i = this.moves.length -1;
    }
    let a = this.c(0, 0, Math.max(0, i));
    b = this.c(0, 0, i+1, b);
    return new P((a.x+b.x)/2,(a.y+b.y)/2);
};

Trajectory.prototype.b2t = function(B, i) {
    if(i === undefined){
        i = this.moves.length - 1;
    }
    let ca = this.c(0, 0, Math.max(0, i));
    let cb = B.mul(2.0).sub(ca);
    return this.ic(cb, i);
};

Trajectory.prototype.getOffTrackFraction = function(i) {
    if(i === undefined){
        i = this.moves.length - 1;
    }
    return this.offTrackFraction[Math.min(this.moves.length-1, Math.max(0, i))];
};

Trajectory.prototype.steeringRadius = function(i) {
    let w = this.getOffTrackFraction(i);
    return (1 - w) * this.track.defaultSteeringRadius + w * 0.5 * this.track.defaultSteeringRadius;
};

Trajectory.prototype.speedMomentum = function(i) {
    let w = this.getOffTrackFraction(i);
    return (1 - w) * this.track.S + w * 0.5 * this.track.S;
};