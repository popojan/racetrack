function AI (track, player, sid, precision) {
    this.player = player;
    this.wcount = 31;
    this.lcount = Math.ceil(track.design.length() / (2*track.design.w/this.wcount));
    this.precision =  Math.max(track.design.length()/this.lcount, track.design.w/this.wcount);
    this.detail = [[8, 4, 4], [12, 6, 4], [32, 12, 6, 4], [60, 30, 15, 6, 4]][Math.min(3, precision)];

    track.initAI(this.lcount,  this.wcount, 8);

    this.track = track;
    this.result = new State();
    this.sid = sid;
    this.ahead = 10*track.defaultSteeringRadius;
    this.shorten = 1.0;
    this.progress_count = null;
    this.progress_current = null;
    this.lastState = undefined;
    this.lastBatch = 0;
    this.circle = new QT.Circle();
    this.tt = new Trajectory(track);
    this.eax = new P();
    this.anticipateAdjustment = true;
}

function State(n) {
    this.val = Infinity;
    this.n = n;
    this.n0 = n;
    this.bestd = 1000000;
    this.moves = [];
    this.bmoves = [];
}

AI.prototype._getSortedCandidates = function(cover, cb, R) {
    this.circle.x = cb.x;
    this.circle.y = cb.y;
    this.circle.r = R;
    this.circle.rPow2 = this.circle.r*this.circle.r;
    let ps = cover.query(this.circle);
    if(ps.length < 1)
        return [];
    return ps;
}

AI.prototype.getSortedCandidates = function(trajectory, cover, i, precision, k) {
    let cb = trajectory.t2b(trajectory.c(i), i);
    let ca = trajectory.t2b(trajectory.c(i-1), i-1);
    let phi0 = Math.atan2(cb.y - ca.y, cb.x-ca.x);
    let R = trajectory.steeringRadius(i);
    let ret = [];

    const M = 0.999;
    for (let i = -precision; i < precision; ++i) {
        let phi = phi0 + i/precision * Math.PI;
        this.eax.mov({x: Math.cos(phi), y: Math.sin(phi)}).mul(R*M).add(cb);
        ret.push({x: this.eax.x, y: this.eax.y});
    }
    if(k <= 2) {
        let precision_root = Math.ceil(Math.sqrt(precision));
        for (let i = 0; i < precision_root; ++i) {
            for (let j = 0; j < precision_root; ++j) {
                this.eax.mov({x: M*(2*R * (i + 0.5) / precision_root - R), y: M*(2*R * (j + 0.5) / precision_root - R)});
                if (this.eax.len() < R) {
                    this.eax.add(cb);
                    ret.push({x: this.eax.x, y: this.eax.y});
                }
            }
        }
    }

    return ret;
}

function _getWeightedLat(ps, p0, len) {
    let weight_sum = 0.0;
    let lat = 0.0;
    let lad = 0.0;
    let lad0 = p0.lad;
    for(const p of ps) {
        if(Math.abs(p.lad - lad0) > 0.5*len)
            continue;
        let d = distance(p, p0);
        let w = Math.exp(-10.0*d);
        weight_sum += w;
        lat += w * p.data.lat;
        lad += w * p.data.lad;
    }
    if(weight_sum !== 0.0) {
        p0.lat = lat / weight_sum;
        p0.lad = lad / weight_sum;
    }
    return p0;
}

AI.prototype.batchAI = function(trajectory, states, N, finalCallback, iteration) {
    let state = null;
    let end = false;
    let len = this.track.design.length();
    let ahead = this.ahead;
    if(this.result.best && this.result.best.v) {
        let R = this.track.defaultSteeringRadius;
        let v = Math.max(this.result.best.v, 3 * R);
        ahead = Math.max(this.ahead, 0.5 * v * Math.ceil(v / R));
    }
    let target = this.ahead;
    if(this.result.best && this.result.best.bmoves[0]) {
        target = this.result.best.bmoves[0].lat*len/this.track.maxu + ahead;
    }
    target  = (target + len)% len;
    if(target + 0.5*len < this.currentTarget)
        this.currentTarget -= len;
    target = Math.max(this.currentTarget||0, target);
    this.currentTarget = target;
    while(N > 0 && (states.length > 0 || this.lastState) && !end) {
        state = this.lastState || states.pop();
        this.debugState = state;
        if (state.finished > 1) {
            end = true;
            this.result.best = state;
            this.result.bestd = state.val;
            break;
        } else {
            let tt = this.tt;
            tt.moves = state.moves;
            if(this.candidates === undefined) {
                let detail = this.detail[Math.min(this.detail.length - 1, state.n - state.n0)];
                this.candidates = this.getSortedCandidates(tt, this.track.cover, state.n, detail, state.n - state.n0);
            }
            let candidates_end = Math.min(this.lastBatch + N, this.candidates.length);
            let length = this.candidates.length;
            let candidates = this.candidates.slice(this.lastBatch||0, candidates_end);
            if(candidates_end === length) {
                this.lastState = undefined;
                this.lastBatch = 0;
                this.candidates = undefined;
                N = Math.max(N - candidates.length, 1);
            } else {
                this.lastState = state;
                this.lastBatch += candidates.length;
            }
            for (let Bb of candidates){
                let newState = {...state};
                newState.moves = [];
                newState.moves = copy_moves(state.moves);
                newState.bmoves = state.bmoves.slice();
                newState.n = state.n + 1;

                let ps = this._getSortedCandidates(this.track.cover, Bb, this.precision);
                _getWeightedLat(ps, Bb, len);
                if (Bb.lat === undefined)
                    continue;

                tt.moves = newState.moves;
                if(this.anticipateAdjustment) {
                    if(newState.n === newState.n0) {
                        this.player.plannedMove.mov(Bb);
                        model.avoid.adjust(model.race.players, this.sid);
                        Bb.x = this.player.adjustedMove.x;
                        Bb.y = this.player.adjustedMove.y;

                        let ps = this._getSortedCandidates(this.track.cover, Bb, this.precision);
                        _getWeightedLat(ps, Bb, len);
                        if (Bb.lat === undefined)
                            continue;
                    }
                }

                let Bt = tt.b2t(Bb, state.n);
                let At = tt.get(state.n);
                let Ab = tt.t2b(At, state.n);
                let lat = Bb.lat;//lat*len;
                let diff = (target - lat);
                let speed = distance(Bb, Ab);//state.point.lat - Bb.lat;

                if(speed < tt.steeringRadius(state.n)*0.5)
                    continue;
                tt.move(Bt, newState.n, tt.moves, 0);
                let result = tt.getMove(newState.n).result;
                let startingOffTrack = (result.parity - result.intersections.count) % 2 === 1;
                if (!result.legal || (result.offTrackFraction > 0 && !startingOffTrack))
                    continue;
                //tt.move(tt.t2b(tt.c(state.n+1),state.n+1),newState.n+1, tt.moves, 0);
                //result = tt.getMove(newState.n+1).result;
                //startingOffTrack = (result.parity - result.intersections.count) % 2 === 1;
                //if (result.offTrackFraction > 0)
                //    continue;
                let v = distance(Bb, state.point);

                newState.bmoves[state.n-state.n0] = {...Bb};//copy(Bb);
                v = speed/this.track.defaultSteeringRadius;
                if(state.n === state.n0)
                    newState.v = speed;

                let ret = tt.scoreAt(newState.n, undefined, this.currentTarget,  this.shorten);
                let gScore = newState.moves.length - 1;
                newState.gScore = gScore;

                if(target < lat - 0.5*this.track.maxu)
                    diff = this.track.maxu - lat + target;

                let rest = Math.max(0, diff)/this.track.defaultSteeringRadius;

                let hScore = Math.max(0, Math.sqrt(v*v + 2*rest)-v);// - Math.random()*Math.abs(this.randomize);
                let fScore = gScore + hScore;
                if (ret.length > 0 && ret[0].point.t > 0 /*&& ret[0].direction > 0 &&*/&& ret[0].point.t < 1/* && state.finished < 2*/) {
                    fScore = gScore - 1 + ret[0].point.t;// - Math.random()*Math.abs(this.randomize);
                    newState.finished = 2;

                }
                newState.point = {...Bb};
                newState.val = fScore;
                states.push(newState);

                this.progress_current += 1;
                if (this.progress_current > 0.9*this.progress_count) {
                    this.progress_start += 0.25*(this.progress_count - this.progress_start);
                    this.progress_current = this.progress_start;
                }
            }
            if(this.lastState && !end) {
                break;
            }
        }
    }
    if ((states.length > 0 || this.lastState) && !end) {
        this.process(trajectory, states, finalCallback, iteration+1);
    }
    else {
        finalCallback([this.result.best.bmoves[0], this.result.bestd, this]);
    }
}

AI.prototype.process = function(trajectory, states, finalCallback, k) {
    setTimeout(this.batchAI.bind(this, trajectory, states, 64, finalCallback, k), 0);
}

AI.prototype._goodMove = function(trajectory, n0, finalCallback) {
    if(this.thinking)
        return false;
    this.legal = 0;
    let state0 = new State();
    this.progress_count = 5760;
    this.progress_start = 0.0;
    this.progress_current = 0;
    let moves = trajectory.moves.slice(Math.max(0,trajectory.moves.length-4), trajectory.moves.length);
    state0.moves = copy_moves(moves);
    state0.n0 = moves.length - 1;
    state0.n = moves.length - 1;
    state0.nx = trajectory.moves.length - moves.length;
    state0.collision = trajectory.collision||0;
    state0.estimate = 100000;
    let ps = this._getSortedCandidates(this.track.cover, this.player.trajectory.moves[0].point, 50);
    state0.point = this.track.points2D[ps[0].data.ix][ps[0].data.iy];
    let states = new TinyQueue([state0], function (a, b) { return a.val - b.val; });
    let lastBest = this.result ? this.result.best||undefined : undefined;
    if(lastBest!== undefined) lastBest.bmoves.shift();
    this.result = new State();
    this.result.bestd = 1000000;
    this.result.best = lastBest;
    this.thinking = true
    this.process(trajectory, states, finalCallback, 1);
    return true;
}

function distance(a, b) {
    let x = a.x - b.x;
    let y = a.y - b.y;
    return Math.sqrt(x*x + y*y);
}

AI.prototype.think = function(ai, callback) {
    let n0 = ai.player.trajectory.moves.length;
    return ai._goodMove(ai.player.trajectory, n0, callback);
};

AI.prototype.randomMove = function(callback) {
    return this.think(this, callback);
}