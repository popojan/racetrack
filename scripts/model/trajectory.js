function MoveResult() {
    this.offTrackFraction = null;
    this.intersections = null;
    this.checkpoints = null;
    this.legal = null;
}

function Move(p) {
    this.point = p;
    this.result = new MoveResult();
    this.cache = {
        c: new P(), C: new P(), P: new P(), p: new P(), bez: [null, null, null]
    }
}

function Trajectory (track) {
    this.track = track;
    this.move0 = new Move();
    this.moves = [];
    this.altmoves = [undefined];
    this.animationMove = 1;
    this.animationMoveFraction = 0;
    this.animationPeriod = 250;
    return this;
}

Trajectory.prototype.advanceAnimation = function (timeDelta, currentMove) {
    this.animationMoveFraction += timeDelta / this.animationPeriod;
    if(this.animationMoveFraction > 1.0) {
        if (this.animationMove < currentMove) {
            this.animationMove += 1;
            this.animationMoveFraction -= 1.0;
        } else {
            let delta = (this.animationMoveFraction % 1.0);
            this.animationMove = 1;
            this.animationMoveFraction = delta;
        }
    }
};

Trajectory.prototype.length = function(){
  return this.moves.length;
};

Trajectory.prototype.push = function(m){
    this.moves.push(m);
    this.altmoves.push(undefined);
    return this;
};

Trajectory.prototype.getMove = function(i){
    if(i < 0) {
        this.move0.point = this.moves[0].point;
        return this.move0;
    }
    i = Math.max(0, Math.min(this.moves.length, i));
    return (this.altmoves[i] || this.moves[i]);
};

Trajectory.prototype.move = function(p, i, moves) {
    moves = moves || this.moves;
    if(i >= moves.length) {
        moves.push(new Move(p));
        i = moves.length - 1;
    }
    else {
        moves[i].point.x = p.x;
        moves[i].point.y = p.y;
    }
    this.evaluate(i, moves);
    return this;
};

Trajectory.prototype.evaluate = function(i, moves) {
    moves = moves || this.moves;
    let kevinLine = this.asKevinLine(i);
    let intersections = this.crash(i, kevinLine);
    let count = intersections.count;
    let points = intersections.points;
    points.sort(function(a, b) {return (a.x!== null && b.x!==null && a.t - b.t);});
    let parity = 0;
    for (let j = 0; j < i; ++j) {
        parity += this.getMove(j).result.intersections.count;
    }
    let offTrackFraction = 0.0;
    let ts = [];
    if (parity % 2 === 1) {
        ts.push(0.0);
    }
    for (let j = 0; j < count; ++j) {
        ts.push(points[j].t);
    }
    if ((parity + count) % 2 === 1) {
        ts.push(1.0);
    }
    for (let j = 1; j < ts.length; j += 2) {
        offTrackFraction += ts[j] - ts[j - 1];
    }
    let result = moves[i].result;
    result.offTrackFraction = offTrackFraction;
    result.intersections = intersections;
    result.checkpoints = this.finished(i, kevinLine);
    result.legal = this.legal(i);
    return this;
};

/*Trajectory.prototype.str = function() {
    let ret = [];
    for(let i = 0; i < this.moves.length; ++i) {
        ret.push(this[i].x + " " + this[i].y);
    }
    return ret.join(", ");
};*/

Trajectory.prototype.c = function(i, b) {
    if(i === undefined) i = this.moves.length - 1;
    let ma = this.getMove(i-1);
    if(b === undefined) {
        let mb = this.getMove(i);
        b = mb.point;
    }
    let a = ma.point;
    ma.cache.c.x = b.x + this.speedMomentum(i - 1) * (b.x - a.x);
    ma.cache.c.y = b.y + this.speedMomentum(i - 1) * (b.y - a.y);
    return ma.cache.c;
};

Trajectory.prototype.ic = function(ci, i) {
    if(i === undefined) i = this.moves.length - 1;
    let mi = this.getMove(i);
    let a = mi.point;
    let S = this.speedMomentum(i);//i+1
    mi.cache.p.x = (ci.x + S * a.x)/(1 + S);
    mi.cache.p.y = (ci.y + S * a.y)/(1 + S);
    return mi.cache.p;
};

Trajectory.prototype.legal = function(i) {
    if(i === undefined) i = this.moves.length - 1;
    let c = this.c(i-1);
    let p = this.getMove(i).point;
    let dx = p.x - c.x;
    let dy = p.y - c.y;
    let R = this.steeringRadius(i-1);
    return dx*dx + dy*dy <= R*R;
};

Trajectory.prototype.crash = function(i, kevinLine) {
    if(i === undefined){
        i = this.moves.length -1;
    }
    kevinLine = kevinLine || this.asKevinLine(i);
    let inter = new Intersection("I", 10);
    inter.t = 2;
    return intersectShapes(this.track.collisionPath, kevinLine, inter);
};

Trajectory.prototype.plan = function(b, i) {
    if(i === undefined) i = this.moves.length -1;
    this.move(b, i, this.altmoves);
    return this;
};


Trajectory.prototype.bez = function(i) {
    if(i === undefined){
        i = this.moves.length -1;
    }
    let mi = this.getMove(i);
    let a = this.c(i - 2);
    let b = this.c(i - 1);
    let c = this.c(i);

    a.x = (a.x + b.x) / 2;
    a.y = (a.y + b.y) / 2;
    c.x = (b.x + c.x) / 2;
    c.y = (b.y + c.y) / 2;
    mi.cache.bez[0] = a;
    mi.cache.bez[1] = b;
    mi.cache.bez[2] = c;
    return mi.cache.bez;
};

Trajectory.prototype.t2b = function(p, i) {
    if(i === undefined){
        i = this.moves.length -1;
    }
    let a = this.c(i);
    let b = this.c(i+1, p);
    let mi = this.getMove(i);
    mi.cache.P.x = (a.x+b.x)/2;
    mi.cache.P.y = (a.y+b.y)/2;
    return mi.cache.P;
};

Trajectory.prototype.b2t = function(B, i) {
    if(i === undefined){
        i = this.moves.length - 1;
    }
    let ca = this.c(i);
    let mi = this.getMove(i);
    mi.cache.C.x = 2 * B.x - ca.x;
    mi.cache.C.y = 2 * B.y - ca.y;
    let ret = this.ic(mi.cache.C, i);
    return ret;
};

Trajectory.prototype.getOffTrackFraction = function(i) {
    if(i === undefined){
        i = this.moves.length - 1;
    }
    return this.getMove(i).result.offTrackFraction;
};

Trajectory.prototype.steeringRadius = function(i) {
    let w = this.getOffTrackFraction(i);
    return (1 - w) * this.track.defaultSteeringRadius + w * 0.5 * this.track.defaultSteeringRadius;
};

Trajectory.prototype.speedMomentum = function(i) {
    let w = this.getOffTrackFraction(i);
    return (1.0 - w) * this.track.S + w * 0.5 * this.track.S;
};

Trajectory.prototype.asKevinLine = function(i) {
    let bez = this.bez(i);
    let A = bez[0];
    let b = bez[1];
    let B = bez[2];
    let kevinLine = new Path();
    kevinLine.parseData("M0,0 S1,1,1,1");
    kevinLine.getIntersectionParams();
    kevinLine.segments[0].handles[0].point.x = A.x;
    kevinLine.segments[0].handles[0].point.y = A.y;
    kevinLine.segments[1].handles[0].point.x = b.x;
    kevinLine.segments[1].handles[0].point.y = b.y;
    kevinLine.segments[1].handles[1].point.x = B.x;
    kevinLine.segments[1].handles[1].point.y = B.y;
    return kevinLine;
};

Trajectory.prototype.finished = function(i, kevinLine) {
    let ret = [];
    kevinLine = kevinLine || this.asKevinLine(i);
    for(let j = 0; j < this.track.design.checks.length; ++j) {
        let finish = this.track.design.finishline(j);
        let inter = new Intersection("I", 10);
        inter.t = 2;
        let sPath = "M" + finish.x1 + "," + finish.y1 + "L" + finish.x2 + "," + finish.y2;
        let collisionPath = new Path();
        collisionPath.parseData(sPath);
        let intersections = intersectShapes(collisionPath, kevinLine, inter);
        for (let k = 0; k < intersections.count; ++k) {
            let p = intersections.points[k];
            let b = (finish.x2 - finish.x1);
            let a = -(finish.y2 - finish.y1);
            let c = - (a * finish.x1 + b * finish.y1)
            let h = kevinLine.segments[1].handles[1].point;
            let dir = a * h.x + b * h.y + c;
            ret.push({"point":p, "id":j, "direction": Math.sign(dir)});
        }
    }
    ret.sort(function(a, b) { return a.point.t - b.point.t; })
    //if(ret.length > 0)
    //    console.log(JSON.stringify(ret));
    return ret;
}

Trajectory.prototype.score = function() {
    let nextCheckpoint = 0;
    let lastCheckpoint = this.track.design.checks.length;
    for(let i = 2; i < this.moves.length; ++i) {
        let move = this.moves[i];
        //traditional strict rule (no cuts allowed)
        if(move.result == null) {
            continue;
        }
        if (move.result.offTrackFraction > 0.0) {
            console.log("offTrack");
            return Infinity;
        }
        for (let j = 0; j < move.result.checkpoints.length; ++j) {
            let check = move.result.checkpoints[j];
            if (check.dir < 0) {
                console.log("badDir");
                return Infinity;
            }
            if (check.id === nextCheckpoint)
                nextCheckpoint += 1;
            if (nextCheckpoint === lastCheckpoint)
                return i - 1 + check.point.t;
        }
    }
    console.log("noMoreMoves");
    return Infinity
}