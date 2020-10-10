function AI (track, player, sid) {
    this.player = player;
    this.lcount = 512;
    this.wcount = 15;
    track.initAI(this.lcount, this.wcount, 12);
    this.track = track;
    this.result = new State();
    this.sid = sid;
    this.ahead = 150.0;
    this.shorten = 0.05;
    this.randomize = -0.1;
    this.enhance = false;
    this.annulus = 0.85;
    this.progress_count = null;
    this.progress_current = null;
    this.lastState = undefined;
    this.lastBatch = 0;
    this.circle = new QT.Circle();
    this.tt = new Trajectory(track);
    this.eax = new P();
}

function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function State(n) {
    this.val = Infinity;
    this.n = n;
    this.n0 = n;
    this.bestd = 1000000; //Infinity stringifies as null
    this.moves = [];
    this.bmoves = [];
    this.target = [];
}

AI.prototype._getSortedCandidates = function(cover, cb, R, closeTo, mult) {
    cb = closeTo||cb;
    this.circle.x = cb.x;
    this.circle.y = cb.y;
    this.circle.r = closeTo ? R * mult : R;
    this.circle.rPow2 = this.circle.r*this.circle.r;
    let ps = cover.query(this.circle);
    console.log(JSON.stringify(this.circle));
    if(ps.length < 1)
        return [];
    if(!closeTo)
        return ps;
    let p = closeTo;
    ps.sort(function (a, b) {
        let db = Math.sqrt((p.x - b.x)*(p.x - b.x) + (p.y - b.y)*(p.y - b.y));
        let da = Math.sqrt((p.x - b.x)*(p.x - b.x) + (p.y - b.y)*(p.y - b.y));
        return da - db;
    });
    return ps;
}

AI.prototype.getSortedCandidates = function(traj, cover, i, precision, pp, mult) {
    let cb = traj.t2b(traj.c(i), i);
    let R = traj.steeringRadius(i);
    let ps = this._getSortedCandidates(cover, cb, R, pp, mult);
    if(!this.annulus)
        return ps;
    let ret = [];
    for (const psi of ps) {
        this.eax.mov(psi.data).sub(cb);
        let r = this.eax.len()
        if(this.randomize) {
            if(this.randomize > 0) {
                psi.x += randn_bm() / 3.0 * this.randomize * R;
                psi.y += randn_bm() / 3.0 * this.randomize * R;
                psi.data.x = psi.x;
                psi.data.y = psi.y;
            }
        }
        if(this.enhance && (R-r/R <= precision)) {
            let q = copy(psi);
            q.x = q.data.x = cb.x + this.eax.x * 0.99 * R;
            q.y = q.data.y = cb.y + this.eax.y * 0.99 * R;
            ret.push(q);
        }
        if(r/R >= this.annulus)
            ret.push(psi);
    }
    return ret;
}

function _getWeightedLat(ps, p0, k) {
    k = Math.min(ps.length, k);
    let sumw = 1.0;
    let lat = p0.lat;
    for(const p of ps.slice(0, k)) {
        let d = distance(p, p0);
        let w = Math.min(1000, 1 / d/d );
        sumw += w;
        lat += w * p.data.lat;
    }
    return lat/sumw;
}

function batchAI(ai, traj, states, N, finalCallback) {
    return function() {

        let state = null;
        let end = false;
        let len = traj.track.design.length();
        let precision = 2*Math.max(len/ai.lcount, traj.track.design.w/ai.wcount);
        let ahead = ai.ahead;
        if(ai.result.best && ai.result.best.v) {
            let R = traj.track.defaultSteeringRadius;
            let v = ai.result.best.v;
            ahead = Math.max(ai.ahead, 0.5*v*v/R -R);
        }
        let target = traj.target[Math.min(traj.moves.length-1, 3)]*len + ahead;
        target = target % len;
        ai.currentTarget = target;
        while(N > 0 && (states.length > 0 || ai.lastState) && !end) {
            if(ai.lastState)
                state = ai.lastState;
            else {
                state = states.pop();
            }
            if (!ai.lastState && state.finished > 1) {
                end = true;
                let tt = ai.tt;
                tt.moves = copy(traj.moves);
                tt.moves = tt.moves.concat(state.moves.slice(traj.moves.length, state.moves.length));
                let finalScore = tt.score();
                if(finalScore < Infinity)
                    console.log("FINAL SCORE = ", finalScore);
                ai.result.best = state;
                ai.result.bestd = state.val;
                traj.target = copy(state.target);
                break;
            } else {
                let tt = ai.tt;
                tt.moves = state.moves;
                let candidates = ai.getSortedCandidates(tt, traj.track.cover, state.n, precision);
                let end = Math.min(ai.lastBatch + N, candidates.length);
                let length = candidates.length;
                candidates = candidates.slice(ai.lastBatch||0, end);
                if(end === length) {
                    ai.lastState = undefined;
                    ai.lastBatch = 0;
                    N -= candidates.length;
                } else {
                    ai.lastState = state;
                    ai.lastBatch += candidates.length;
                }
                for (const candidate of candidates){
                    let dstate = copy(state);
                    dstate.n = state.n + 1;

                    let Bb = candidate.data;
                    if(ai.randomize > 0 && Math.random() < ai.randomize)
                        continue;
                    if(ai.randomize > 0 || ai.enhance) {
                        let ps = ai._getSortedCandidates(traj.track.cover, Bb, precision, Bb);
                        Bb.lat = _getWeightedLat(ps, Bb, 4);
                    }
                    tt.moves = dstate.moves;


                    let Bt = tt.b2t(Bb, state.n);
                    let Ab = tt.t2b(tt.get(state.n), state.n);
                    let speed = distance(Bb, Ab);
                    if(speed < traj.track.defaultSteeringRadius * 0.5)
                        continue;
                    tt.move(Bt, dstate.n, tt.moves, 0);
                    let result = tt.getMove(dstate.n).result;
                    let startingOffTrack = (result.parity - result.intersections.count) % 2 === 1;
                    if (!result.legal || (result.offTrackFraction > 0 && !startingOffTrack))
                        continue;
                    tt.move(tt.t2b(tt.c(state.n+1),state.n+1),dstate.n+1, tt.moves, 0);
                    result = tt.getMove(dstate.n+1).result;
                    if (result.offTrackFraction > 0)
                        continue;
                    let v = tt.track.points2D[(Bb.ix+1)%tt.track.points2D.length][Bb.iy];
                    dstate.bmoves[state.n-state.n0] = copy(Bb);
                    v = speed/tt.track.defaultSteeringRadius;
                    if(state.n === state.n0)
                        dstate.v = speed;
                    let ret = tt.scoreAt(dstate.n, undefined, target, ai.shorten);
                    let gScore = dstate.moves.length - 1;
                    dstate.gScore = gScore;
                    let lat = Bb.lat*len;
                    if(target < lat) {
                        lat -= len;
                    }
                    let rest = Math.max(0, (target - lat))/tt.track.defaultSteeringRadius;
                    let hScore = (Math.sqrt(v*v + 2*rest)-v);
                    let fScore = gScore + hScore;
                    if (ret.length > 0 && ret[0].point.t < 1 && state.finished === undefined) {
                        fScore = gScore - 1 + Math.random()*ai.randomize + ret[0].point.t;
                        dstate.finished = 2;
                    } else if (ret.length > 0 && ret[0].point.t < 1 && state.finished === 1) {
                        dstate.finished = 2;
                    } else {
                        dstate.target[dstate.n-dstate.n0+1] = Bb.lat;
                    }
                    dstate.val = fScore;
                    states.push(dstate);
                    ++ai.progress_current;
                    if (ai.progress_current > 0.75 * ai.progress_count)
                        ai.progress_count *= 2.0;
                }
                if(ai.lastState) {
                    break;
                }
            }
        }
        if ((states.length > 0 || ai.lastState) && !end) {
            process(ai, traj, states, finalCallback)();
            console.log("process");
        }
        else {
            finalCallback([ai.result.best.bmoves[0], ai.result.bestd, ai]);
        }
    }
}

function process(ai, traj, states, finalCallback) {
    return function () {
        setTimeout(batchAI(ai, traj, states,16, finalCallback), 0);
    };
}

AI.prototype._goodMove = function(traj, n0, finalCallback) {
    if(this.thinking)
        return false;
    this.legal = 0;
    let state0 = new State();
    this.progress_count = 10000;
    this.progress_current = 0;
    let moves = traj.moves.slice(Math.max(0,traj.moves.length-4), traj.moves.length);
    state0.moves = copy(moves);
    state0.n0 = moves.length - 1;
    state0.n = moves.length - 1;
    state0.collision = traj.collision||0;
    state0.estimate = 100000;
    let len = traj.track.design.length();
    if(traj.target)
        state0.target = copy(traj.target.slice(Math.max(0,traj.moves.length-4), traj.moves.length));
    else {
        state0.target = [traj.track.design.startposAt(this.sid) / len];
        traj.target = copy(state0.target);
    }
    let states = new TinyQueue([state0], function (a, b) { return a.val - b.val; });
    this.states = states;
    let lastBest = this.result ? this.result.best||undefined : undefined;
    if(lastBest!== undefined) lastBest.bmoves.shift();
    this.result = new State();
    this.result.bestd = 1000000;
    this.result.best = lastBest;
    this.thinking = true
    process(this, traj, states, finalCallback)();
    return true;
}

function distance(a, b) {
    let x = a.x - b.x;
    let y = a.y - b.y;
    return Math.sqrt(x*x + y*y);
}

function cross(a, b) {
    return a.x*b.y-b.x*a.y;
}

AI.prototype.think = function(ai, callback) {
    let n0 = ai.player.trajectory.moves.length;
    return ai._goodMove(ai.player.trajectory, n0, callback);
};

AI.prototype.randomMove = function(callback) {
    return this.think(this, callback);
}
