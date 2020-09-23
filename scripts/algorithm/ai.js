function AI (track, player) {
    this.player = player;
    track.initAI(512,13, 12);
    this.track = track;
    this.depth0 = 3;
    this.MAGIC = 16;
    this.samples = [16];
}
AI.prototype.getProgress = function(p) {
    /*   let bestd = Infinity;
    let best = null;
    for(let i = 0; i < this.track.points.length; ++i) {
        let d = new P().mov(this.track.points[i]).sub(p).len();
        if(d < bestd) {
            bestd = d;
            best = p;
            if(bestd < 0.1*this.track.defaultSteeringRadius)
                break;
        }
    }
    return best.lat;*/
    let nearest = this.track.cover.getNearest(p, 1, []);
    return nearest[0].lat;
}

AI.prototype._randomMove = function(traj, n) {
    let c = traj.c(n-1);
    let angle = 2*(Math.random() - 0.5) * Math.PI;
    let dir = new P(Math.cos(angle), -Math.sin(angle));
    let acc = traj.steeringRadius(n-1);
    return new P().mov(c).add(new P().mov(dir).mul(0.99*acc));
}
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

AI.prototype._goodMove = function(traj, n0, depth0, depth, advance0) {
    let n = n0 - 1;
    let A = traj.t2b(traj.get(n), n);
    let R = traj.steeringRadius(n);
    let c = traj.t2b(traj.c(n), n);

    let bestd = -Infinity;
    let best = null;
    let bestCollision = null;
    let bestdCollision = -Infinity;
    let N = this.samples;
    let K = N[Math.min(N.length-1, depth0 - depth)];
    advance0 = advance0 === undefined ? this.getProgress(A) : advance0;
    let mult = K/this.MAGIC;
    for (let ii = 0; ii < K; ++ii) {
        let RR = null;
        let kk = null;
        let ll = null;
        if(ii < 1*mult) {
            RR = 0.5;//Math.random() * 0.05;
            kk = 1*mult;
            ll = 1*mult;
        }
        else if(ii < 4*mult) {
            RR = 0.66;// + Math.random() * 0.05;
            kk = 4*mult;
            ll = 3*mult;
        }
        else if(ii < 9*mult) {
            RR = 0.75;// + Math.random() * 0.05;;
            kk = 9*mult;
            ll = 5*mult;
        }
        else {
            RR = 0.99;
            kk = 16*mult;
            ll = 7*mult;
        }
        let da = Math.max(Math.min((ii-(kk-ll))/ll,1),0);
       // console.log(da);
        let dv = new P(Math.sin(2*Math.PI*(da)), Math.cos(2*Math.PI*(da))).mul(RR* R);
        //let dv = new P(-0.5+Math.random(), -0.5+Math.random()).n().mul(0.99 * R);
        let from = c;
        //if(ii >= K && best != null) {
        //    from = best;
           // dv = dv.add(new P(randn_bm(), randn_bm()).mul(0.3 * 0.2 * R));
        //}
        let Bt = new P().mov(from).add(dv);
        let B = traj.b2t(new P().mov(Bt), n)
        traj.move(B, n0);
        let res = traj.getMove(n0).result;
        //if (res.offTrackFraction > 0.0) {
        //    continue;
        //}
        if(!res.legal) {
            //--ii;
            continue;
        }

        let advance = this.getProgress(Bt) - advance0;
        if(advance > 0.5) advance -= 1.0;
        if(advance < -0.5) advance += 1.0;
        let dis = null;
        let disCollision = null;
        let collision = res.offTrackFraction > 0.0;
        //if(collision)
        //    continue;
        if(depth <= 0) {
            dis = advance;
            disCollision = advance;
        } else {
            let rec = this._goodMove(traj, n0 + 1, depth0, depth - 1, advance0);
            collision |= (rec[0] == null);
            dis = rec[1];
            disCollision = rec[3];
        }
        if (!collision && dis > bestd) {
            bestd = dis;
            best = Bt;
        }
        if(collision && disCollision > bestdCollision) {
            bestdCollision = disCollision;
            bestCollision = Bt;
        }
    }
    traj.moves = traj.moves.slice(0, n0);
    return [best, bestd, bestCollision, bestdCollision];
}


function distance(a, b) {
    let x = a.x - b.x;
    let y = a.y - b.y;
    return Math.sqrt(x*x + y*y);
}

function cross(a, b) {
    return a.x*b.y-b.x*a.y;
}

function vector(a, b) {
    return new P(b.x - a.x, b.y - a.y);
}

function online(a, u, t) {
    return new P(a.x + t*u.x, a.y + t*u.y);
}

AI.prototype.think = //function(ai, callback) {
    function (ai) {
        let n0 = ai.player.trajectory.moves.length;
        let m = ai._goodMove(ai.player.trajectory, n0, ai.depth0, ai.depth0);
        return m[0] === null ? m[2] : m[0];//callback(m);
    };
//};

AI.prototype.randomMove = function(callback) {
    return this.think(this);
    //setTimeout(this.think(this, callback), 0);
    //console.log(newMoves[n0].result.legal + " ___ " + newMoves[n0].result.offTrackFraction);
}
