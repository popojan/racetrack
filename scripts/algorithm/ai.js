function AI (track, player) {
    this.player = player;
    //track.initAI(512,13, 12);
    //track.initAI(2048, 127, 12);
    track.initAI(2048, 127, 12);
    this.track = track;
    this.depth0 = 4;// 4 @ [32,8,8,8];
    this.samples = [32,8,4,4,2,1,1,1];
    this.minSamples =  [16,8,4,4,4];
    this.result = new State();
    this.traj = new Trajectory(track);
}

AI.prototype.getProgress = function(p) {
    /*let best = null;
    let bestd = Infinity;

    let ps = this.track.points;
    for(let i = 0; i < ps.length; ++i) {
        let q = ps[i];
        let d = (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
        if (d < bestd) {
            bestd = d;
            best = q;
        }
    }
    return best.lat;*/
    //
    //if(ret.length === 0)
    //    return -Infinity;
    /*let dist = Infinity;
    let best = -Infinity;
    for(let i = 0; i < ret.length; ++i) {
        let a = ret[i];
        let d = Math.sqrt((a.x-p.x)*(a.x-p.x)+(a.y-p.y)*(a.y-p.y))
        if(d < dist ){
            dist  = d;
            best = p;
        }
    }
    return best;*/
    let ret = this.track.cover.retrieve({x:p.x-0.05, y:p.y-0.05, width:0.1, height:0.1});
    if(ret.length > 0) {
        ret.sort(function (a, b) {
            return Math.sqrt((a.x - p.x) * (a.x - p.x) + (a.y - p.y) * (a.y - p.y)) - Math.sqrt((b.x - p.x) * (b.x - p.x) + (b.y - p.y) * (b.y - p.y));
        });
        return ret[0].lat;
    }
    return -Infinity;
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
function State(n0, depth0, depth) {
    this.estimate = Infinity;
    this.n0 = n0;
    this.depth0 = depth0;
    this.depth = depth;
    this.bestd = -Infinity; //Infinity stringifies as null
    this.bmoves = [];
    for(let i = 0; i <= depth0; ++i) {
        this.bmoves.push(null);
    }
    this.dis = -Infinity;
}

function batchAI(ai, traj, states, N, finalCallback) {
    return function() {
        let state = null;
        let next = function(state, one) {
            //console.log("skip");
            if (state.ii < state.K/* && !(ai.result.best !== null && state.ii >= state.minK)*/){
                ai.progress_current += one ? 0 : ai.progress_counts[state.depth0 - state.depth + 2]||0;
                let newState = new State(state.n0, state.depth0, state.depth);
                newState.estimate = state.bmoves.length;;
                newState.n = state.n
                newState.ii = state.ii + 1;
                newState.A = state.A;
                newState.AA = state.AA;
                newState.c = state.c;
                newState.R = state.R;
                newState.c0 = state.c0;
                newState.K = state.K;
                newState.minK = state.minK;
                newState.advance0 = state.advance0;
                newState.collision = state.parentCollision;
                //console.log(JSON.stringify(state.bmoves0));
                //newState.bmoves = JSON.parse(JSON.stringify(state.bmoves0));
                //newState.moves = JSON.parse(JSON.stringify(state.moves0));
                newState.moves = state.moves;
                newState.bmoves = state.bmoves;
                newState.parent = ai.result;
                states.push(newState);
                //console.log("newState "+newState.estimate);
           }
        }
        for(let step = 0; step < N && states.length > 0; ++step) {
            state = states.pop();
            let tt = ai.traj;
            tt.moves = state.moves;
            state.parentCollision = state.collision;
            if (state.n === undefined) {
                let n = state.n0 -1;
                state.A = tt.t2b(tt.get(n), n);
                state.AA = tt.t2b(tt.get(n - 1), n);
                state.R = tt.steeringRadius(n);
                state.c = tt.t2b(tt.c(n), n);
                state.c0 = tt.t2b(tt.c(n - 1), n-1);
                let level = Math.min(ai.samples.length - 1, state.depth0 - state.depth);
                state.K = ai.samples[level];
                //console.log(state.K);
                state.minK = ai.minSamples[level];
                state.advance0 = state.depth0 === state.depth ? ai.getProgress(state.A): state.advance0;
                state.n = n;
                state.ii = 0;
            }
            //console.log(state.n0, state.n, state.moves.length, state.bmoves.length);
            if(state.advance0 === -Infinity) {
                //console.log("advance0 === -Infinity");
                next(state);
                continue;
            }
            //state.advance1 = ai.getProgress(state.A);
            let dv = null;
            //if(distance(state.AA, state.A) === 0)
                dv = new P(-0.5+Math.random(), -0.5+Math.random()).n().mul(0.99*state.R);
            //else
            //    dv = new P().mov(state.AA).sub(state.c0).add(new P(randn_bm(), randn_bm()).mul(0.3));
            //console.log(JSON.stringify(dv));
            let Bt = new P().mov(state.c).add(dv);
            let B = tt.b2t(new P().mov(Bt), state.n);
            state.bmoves[state.depth0 - state.depth] = new P().mov(Bt);
            tt.move(new P().mov(B), state.n0, tt.moves, 2);
            let res = tt.getMove(state.n0).result;
            state.legal = res.legal;
            if (!state.legal) {
                next(state);
                continue;
            }
            tt.move(new P().mov(B), state.n0, tt.moves, 1);
            res = tt.getMove(state.n0).result;
            state.collision |= res.offTrackFraction > 0.0

            let estimate = state.bmoves.length;// + nMoves;
            if (state.depth > 0) {
                //if(dis >= 0.0) {
                    let nextState = new State(state.n0+1, state.depth0, state.depth - 1);
                    nextState.estimate = estimate;
                    nextState.moves = JSON.parse(JSON.stringify(state.moves));
                    nextState.bmoves = JSON.parse(JSON.stringify(state.bmoves));
                    nextState.bmoves0 = JSON.parse(JSON.stringify(state.bmoves));
                    nextState.moves0 = JSON.parse(JSON.stringify(state.moves));
                    nextState.bestd = -Infinity;
                    nextState.n = undefined; //hack
                    nextState.parent = ai.result;
                    nextState.advance0 = state.advance0;
                    //console.log(JSON.stringify([state.collision, state.estimate, state.dis]));//, new P().mov(state.bmoves[traj.moves.length]
                    //if(state.dis > 0.05) {
                    //    states.clear();
                    //    continue;
                    //} else
                    if(nextState.moves === undefined) {
                        console.log("FATAL1");
                    }
                    states.push(nextState);
                    //console.log("depth");
                //}
            } else if(state.depth === 0) {
                let advance = ai.getProgress(B);
                let dis = advance - state.advance0;
                if (dis > 0.5) dis -= 1.0;
                if (dis < -0.5) dis += 1.0;
                if (state.collision){
                    dis -= 10;
                }
                //dis -= 10;
                state.dis = dis;
                let s = (1.0-dis)*tt.track.design.length();
                let nMoves = 0.5*(Math.sqrt(8*s +tt.track.defaultSteeringRadius)/Math.sqrt(tt.track.defaultSteeringRadius)-1);
                //console.log(state.depth0, state.depth, state.dis + " " + nMoves + " " + s);
                    let update = ai.result;
                    if (dis > update.bestd) {
                        update.bestd = dis;
                        update.best = state.bmoves[0];
                        update.dis = state.dis;
                    }
            }
            next(state, 1);
        }
        if(states.length > 0)
            process(ai, traj, states, finalCallback)();
        else {
            console.log(""+ JSON.stringify(ai.result.best) + " -> "+ ai.result.bestd);
            finalCallback([ai.result.best, ai.result.bestd, ai]);
        }
    }
}
function process(ai, traj, states, finalCallback) {
    return function () {
        setTimeout(batchAI(ai, traj, states, 64, finalCallback), 1);
    };
}

AI.prototype._goodMove = function(traj, n0, depth0, depth, finalCallback) {
    if(this.thinking)
        return false;
    let state0 = new State(n0, depth0, depth);
    let count = 1;
    this.progress_counts = [count, 1, 1];
    for(let i = 0; i <= this.depth0; ++i) {
        let level = Math.min(this.samples.length - 1, depth0 - i);
        count *= this.samples[level];
        this.progress_counts.unshift(count);
    }
    this.progress_current = 0;
    console.log(JSON.stringify(this.progress_counts));
    state0.parent = this.result;
    state0.moves = JSON.parse(JSON.stringify(traj.moves));
    state0.moves0 = JSON.parse(JSON.stringify(traj.moves));
    state0.n0 = traj.moves.length;
    let states = new TinyQueue([state0], function (a, b) { return a.estimate - b.estimate; });
    this.result = new State();
    this.result.best = null;
    this.result.bestd = -Infinity;
    let trajCopy = new Trajectory(traj.track);
    trajCopy.moves = JSON.parse(JSON.stringify(traj.moves));
    this.thinking = true
    process(this, trajCopy, states, finalCallback)();
    return true;
}/*

    let n = n0 - 1;
    let A = traj.t2b(traj.get(n), n);
    let AA = traj.t2b(traj.get(n-1), n);
    let R = traj.steeringRadius(n);
    let c = traj.t2b(traj.c(n), n);
    let c0 = traj.t2b(traj.c(n-1), n-1);
    let bestd = -Infinity;
    let best = null;
    let N = this.samples;
    let K = N[Math.min(N.length-1, depth0 - depth)];
    advance0 = advance0 === undefined ? this.getProgress(A) : advance0;
    let mult = K/this.MAGIC;
    for (let ii = 0; ii < K; ++ii) {
        let dv = null;
        if(distance(AA, A) === 0)
            dv = new P(-0.5+Math.random(), -0.5+Math.random()).n().mul(0.99*R);
        else
            dv = new P().mov(AA).sub(c0).add(new P(randn_bm(), randn_bm()).mul(1/K));
        //console.log(JSON.stringify(dv));
        let Bt = new P().mov(c).add(dv);
        let B = traj.b2t(new P().mov(Bt), n)
        traj.move(B, n0, traj.moves, 2);
        let res = traj.getMove(n0).result;
        if(!res.legal)
            continue;
        traj.move(B, n0, traj.moves, 1);
        //if (res.offTrackFraction > 0.0)
        //    continue;
        let dis = null;
        if(depth > 0) {
            let rec = this._goodMove(null, null, traj, n0 + 1, depth0, depth - 1, advance0);
            dis =  rec[1];
        } else {
            let advance = this.getProgress(Bt);
            let ladvance = advance - advance0;
            if(ladvance < -0.75) ladvance += 1.0;
            if(ladvance > 0.75) ladvance -= 1.0;
            //let sumadvance = ladvance;// + oadvance;
            dis = ladvance;
        }
        traj.move(B, n0, traj.moves, 1);
        if (res.offTrackFraction > 0.0)
            dis -= 100.0;

        if (dis > bestd) {
            bestd = dis;
            best = Bt;
        }
    }
    traj.moves = traj.moves.slice(0, n0);
    return [best, bestd];
}
*/

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

AI.prototype.think = function(ai, callback) {
    let n0 = ai.player.trajectory.moves.length;
    return ai._goodMove(ai.player.trajectory, n0, ai.depth0, ai.depth0, callback);
};

AI.prototype.randomMove = function(callback) {
    return this.think(this, callback);
}
