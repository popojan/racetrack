function AI (player) {
    this.player = player;
    this.dist =player.steeringRadius;
}

AI.prototype._randomMoveBak = function(model, n) {
    let c = this.player.trajectory.c(n-1);
    let angle = 2 * (Math.random() - 0.5) * Math.PI;
    let dir = new P(Math.cos(angle), -Math.sin(angle));
    let acc = this.player.trajectory.steeringRadius(n-1);
    return new P().mov(c).add(new P().mov(dir).mul(0.99*acc));
}

AI.prototype._goodMove = function(model, n0) {
    let n = n0 - 1;//this.player.trajectory.moves.length-1;
    let last = this.player.trajectory.moves[n].point;
    let before = this.player.trajectory.moves[Math.max(0,n-1)].point;
    let d = model.track.design;
    let p = d.getProgress(last, 200);
    let len = d.length();
    let target = d.at((p*len+this.dist+new P().mov(last).sub(before).len()*2)%len);
    let c = this.player.trajectory.c(n);
    let R = this.player.trajectory.steeringRadius(n);
    console.log(JSON.stringify([R, model.track.defaultSteeringRadius]));
    return new P().mov(c).add(new P().mov(target).sub(last).n().mul(0.99*R));
}

AI.prototype.randomMoveOld = function(model) {
    let m = this._goodMove(model);
    model.initializeMove(m);
    model.finalizeMove(m);
}

AI.prototype.improveAt = function (i) {
    let improved = false;
    let trajectory = this.player.trajectory;
    let a = new P(trajectory.moves[i].point);
    console.log("COMMENCING " + trajectory.moves[i].result.legal);
    let b = new P(trajectory.moves[i+1].point);
    let c = new P(trajectory.moves[i+2].point);
    for(let j = 0; j < 200; ++j) {
        let q = new P(Math.random()-0.5, Math.random()-0.5).n().mul(0.1*trajectory.steeringRadius(i)).add(a);
        trajectory.move(q, i);
        improved = true;
        let r = trajectory.moves[i].result;
        if(r.offTrackFraction > 0.0 || !r.legal)
            improved = false;
        if(improved && !(b === undefined)) {
            trajectory.move(b, i+1);
            let r = trajectory.moves[i+1].result;
            if(r.offTrackFraction > 0.0 || !r.legal)
                improved = false;
        }
        if(improved && !(c === undefined)) {
            trajectory.move(c, i+2);
            let r = trajectory.moves[i+2].result;
            if(r.offTrackFraction > 0.0 || !r.legal)
                improved = false;

        }
        if(improved) {
            return true;
        } else {
            trajectory.move(a, i);
            console.log("REVERTING " + trajectory.moves[i].result.offTrackFraction);
            if(!(b.x)) trajectory.move(b, i + 1);
            if(!(c.x)) trajectory.move(c, i + 2);
        }
    }
    return false;
}

AI.prototype.randomMove = function(model) {
    let n0 = this.player.trajectory.moves.length;
/*
    let success = false;
    while(!success) {
        success = true;
        for (let i = 0; i < 5; ++i) {
            let m = this._randomMoveBak(model, n0 + i);*/
            let origMoves = this.player.trajectory.moves;
            this.player.trajectory.moves = Array.from(origMoves);
            for(let i = 0; i < 5; ++i) {
                let p = this._goodMove(model, n0 + i);
                //model.initializeMove(m);
                //let p = this.player.trajectory.b2t(this.player.adjustedMove);
                this.player.trajectory.move(p, n0 + i);
                console.log("legal(" + i + ") = " + this.player.trajectory.moves[n0+i].result.legal);
            }
            /*this.player.trajectory.move(m, n0 + i);
            let m0 = this.player.trajectory.moves[n0 + i - 1];
            let m1 = this.player.trajectory.moves[n0 + i];
            let r = m1.result;
            if ((new P().mov(m0.point).sub(m1.point).len() < 0.5*model.track.defaultSteeringRadius
                || !r.legal || r.intersections.length > 0)) {
                if (i > 1)
                    i -= 2;
                else {
                    success = false;
                    break;
                }
            }
        }

        if(success) {
            let m = this.player.trajectory.moves[n0].point;
            this.player.trajectory.moves = this.player.trajectory.moves.slice(0, n0);*/
            let newMoves = this.player.trajectory.moves;
            this.player.trajectory.moves = origMoves;
            model.initializeMove(newMoves[n0].point);
            model.finalizeMove(newMoves[n0].point);
            console.log(newMoves[n0].result.legal);
        /*} else
            this.player.trajectory.moves = this.player.trajectory.moves.slice(0, n0);
    }*/
}