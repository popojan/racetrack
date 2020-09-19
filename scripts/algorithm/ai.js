function AI (player) {
    this.player = player;
    this.dist =player.steeringRadius;
}

AI.prototype._randomMove = function(model, n) {
    let c = this.player.trajectory.c(n-1);
    let angle = 2 * (Math.random() - 0.5) * Math.PI;
    let dir = new P(Math.cos(angle), -Math.sin(angle));
    let acc = this.player.trajectory.steeringRadius(n-1);
    return new P().mov(c).add(new P().mov(dir).mul(0.99*acc));
}
/**
 *   constant speed naive path
 */
AI.prototype._goodMove = function(model, n0) {
    let n = n0 - 1;//this.player.trajectory.moves.length-1;
    let last = this.player.trajectory.moves[n].point;
    let before = this.player.trajectory.moves[Math.max(0,n-1)].point;
    let d = model.track.design;
    let p = d.getProgress(last,100);
    let len = d.length();
    let target = d.at((p*len+3*this.dist+new P().mov(last).sub(before).len()*2)%len);
    let c = this.player.trajectory.c(n);
    let R = this.player.trajectory.steeringRadius(n);
    //console.log(JSON.stringify([R, model.track.defaultSteeringRadius]));
    return this.player.trajectory.b2t(new P().mov(c).add(new P().mov(target).sub(last).n().mul(0.99*R)),n);
}
/*
function rw(traj, heur, iter) {
    let tries = 0;
    let bestk = 0;
    while(traj.score() >= Infinity && traj.length < iter && tries < 20) {

        var c = traj.c();
        var dx = track.R*(2*Math.random() - 1.0);
        var dy = track.R*(2*Math.random() - 1.0);
        var len = Math.sqrt(dx*dx + dy*dy);
        if(len > track.R) {
            dx *= track.R/(len+1);
            dy *= track.R/(len+1);
        }
        var q = traj.c(dx, dy);
        var p = traj[traj.length -1];
        var pqx = q.x - p.x;
        var pqy = q.y - p.y;
        len = Math.sqrt(pqx*pqx + pqy*pqy);
        if(len > track.R) {
            pqx *= track.R/(len+1);
            pqy *= track.R/(len+1);
        }
        q = {x: Math.round(p.x + pqx), y: Math.round(p.y + pqy)};
        if(heur) {
            var idx = bestk;
            var min = Infinity;
            var dx1, dy1, dx2, dy2;
            for(var k = bestk; k < heur.length; ++k) {
                dx1 = q.x - heur[k].x;
                dy1 = q.y - heur[k].y;
                if(!(new Traj(track).m(q).crash(heur[k]))) {
                    idx = k;
                }
            }
            bestk = idx;
            dx1 = q.x - heur[idx].x;
            dy1 = q.y - heur[idx].y;
            dx2 = p.x - heur[idx].x;
            dy2 = p.y - heur[idx].y;
            if(dx1*dx1+dy1*dy1 > dx2*dx2 + dy2*dy2)
                continue;
        }
        if(traj.legal(q) && !traj.crash(q)) {
            traj.m(q);
            tries = 0;
        }
        tries +=1;
    }
    return traj;
}*/
AI.prototype.improveAt = function (i) {
    let improved = false;
    let origMoves = this.player.trajectory.moves;
    //this.player.trajectory.moves = Array.from(origMoves);

    let f = function (moves, i) {
        return new P().mov(moves[i].point).sub(moves[Math.max(0,i-1)].point).len()
    }
    let g = function (trajectory, i) {
        return new P().mov(trajectory.c(Math.max(0, i-1))).sub(trajectory.moves[i].point).len();
    }
    let trajectory = this.player.trajectory;
    let a = origMoves[i];
    let b = origMoves[i+1];
    let c = origMoves[i+2];
    let ap = new P().mov(a.point);
    let bp = null;
    if(b) bp = new P().mov(b.point);
    let cp = null;
    if(c) cp = new P().mov(c.point);
    let man1 = Infinity, man2 = Infinity;
    if(b) man1 = g(trajectory, i+1);
    if(c) man2 = g(trajectory, i+2);
    for(let j = 0; j < 1; ++j) {
        let cc = trajectory.c(i-1);
        let q =  new P().mov(cc).add(new P(Math.random(), Math.random()).n().mul(Math.random() *model.track.defaultSteeringRadius));
        trajectory.move(q, i);
        improved = true;
        let r = trajectory.moves[i].result;
        if(r.offTrackFraction > 0.0 || !r.legal
            /*|| f(trajectory.moves, i) <= f(origMoves, i)*/) {
            improved = false;
        }
        if(improved && !(b === undefined)) {
            trajectory.move(bp, i+1);
            let r = trajectory.moves[i+1].result;
            if(r.offTrackFraction > 0.0 || !r.legal
                /*|| g(trajectory, i+1) < man1*/
                /*|| f(trajectory.moves, i+1) >= f(origMoves, i+1)*/) {
                improved = false;
            }
        }
        if(improved && !(c === undefined)) {
            trajectory.move(cp, i+2);
            let r = trajectory.moves[i+2].result;
            if(r.offTrackFraction > 0.0 || !r.legal
                /*|| (f(trajectory.moves, i+2) >= f(origMoves, i+2))*/)
                /*&& g(trajectory, i+2) < man2)*/{
                improved = false;
            }

        }

        if(improved) {
            return true;
        } else {
            trajectory.move(ap, i);
            if (b) trajectory.move(bp, i + 1);
            if (c) trajectory.move(cp, i + 2);
        }
    }
    return false;
}

AI.prototype.randomMove = function(model) {
    let n0 = this.player.trajectory.moves.length;
    let origMoves = this.player.trajectory.moves;
    let bestProgress = Infinity;
    let best = null;
    this.player.trajectory.moves = JSON.parse(JSON.stringify(origMoves));
    let K = 2;
    for (let i = 0; i < K; ++i) {
        let p = this._goodMove(model, n0 + i);
        this.player.trajectory.move(p, n0 + i);
        //console.log("legal(" + i + ") = " + this.player.trajectory.moves[n0 + i].result.legal);
    }
    /*let newMoves = JSON.parse(JSON.stringify(this.player.trajectory.moves));
    for(let iter = 0; iter < 100; ++iter) {
        this.player.trajectory.moves = newMoves;
        for (let i = 2*K; i >= 0; --i) {
            let j = Math.floor(i%(K-1));//Math.random()*K);
            this.improveAt(n0 + j);
        }
        let lm = this.player.trajectory.moves[n0 + K-1].point;
        let ln = this.player.trajectory.moves[n0 + K -2].point;
        let progress = new P().mov(lm).sub(ln).len();
        if (progress < bestProgress) {
            let newMoves = this.player.trajectory.moves;
            let p = this.player.trajectory.t2b(newMoves[n0].point, n0);
            best = p;
            console.log("Better = " + progress + " < " + bestProgress);
            bestProgress = progress;
        }
    }*/
    let newMoves = this.player.trajectory.moves;
    best = this.player.trajectory.t2b(newMoves[n0].point, n0);
    this.player.trajectory.moves = origMoves;
    model.initializeMove(best);
    model.finalizeMove(best);
    //console.log(newMoves[n0].result.legal + " ___ " + newMoves[n0].result.offTrackFraction);
}