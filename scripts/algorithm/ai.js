function AI (track, player) {
    this.player = player;
    //track.initAI(512,13, 12);
    //track.initAI(2048, 127, 12);
    //track.initAI(1024, 31, 12);
    track.initAI(256, 7, 12);
    this.track = track;
    this.depth0 = 3;// 4 @ [32,8,8,8];
    this.samples = [];
    this.minSamples =  [];
    this.result = new State();
    this.traj = new Trajectory(track);
    let KK = [[0, 1, 3, 3,3, 1,0]];
    this.KK = [];
    for(let k = 0; k <= this.depth0; ++k) {
        let row = [];
        let ii = Math.min(KK.length-1, k);
        for (let i = 0; i < KK[ii].length; ++i) {
            for (let j = 0; j <= KK[ii][i]; ++j) {
                row.push({u: i / (KK[ii].length - 1), v: j / (KK[ii][i] || 1)})
            }
        }
        this.samples[k] = row.length;
        this.minSamples[k] = Math.floor(row.length/2);
        this.KK.push(row);
    }
    //console.log(JSON.stringify(this.KK));
}

AI.prototype.getProgress = function(p) {
    /*let best = null;
    let bestd = 1000000;

    let ps = this.track.points;
    for (let i = 0; i < ps.length; ++i) {
        let q = ps[i];
        let d = Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y));
        if (d < bestd) {
            bestd = d;
            best = q;
        }
    }*/
    //let ret = best;

    let ps = this.track.cover.query(new QT.Circle(p.x, p.y, 20));
    return ps[0].data;
};

    /*
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
    /*let ret = this.track.cover.retrieve({x:p.x, y:p});
    if(ret.length > 0) {
        ret.sort(function (a, b) {
            return (Math.sqrt((a.x - p.x) * (a.x - p.x) + (a.y - p.y) * (a.y - p.y)) - Math.sqrt((b.x - p.x) * (b.x - p.x) + (b.y - p.y) * (b.y - p.y)));
        });
        return ret[0];
    }
    return {lat:0};*/


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
    this.estimate = -100;
    this.collision = false;
    this.n0 = n0;
    this.depth0 = depth0;
    this.depth = depth;
    this.bestd = -1000000; //Infinity stringifies as null
    this.bmoves = [];
    this.dis = 0.0;
    for(let i = 0; i <= depth0; ++i) {
        this.bmoves.push(null);
    }
}

function getCandidates(s1, r1, s2, r2) {
    let dr = new P().mov(s2).sub(s1) ;
    let d = dr.len();
    let v = 0.5/d*Math.sqrt((-d+r1-r2)*(-d-r1+r2)*(-d+r1+r2)*(d+r1+r2));
    let x = 0.5*(d*d -r2*r2+r1*r1)/d
    let u = new P().mov(dr).n();
    v = new P().mov(u).p().mul(v);
    u = new P().mov(u).mul(x);
    //console.log(JSON.stringify([s1, r1, s2, r2]));
    return [new P().mov(s1).add(u).add(v),
        new P().mov(s1).add(u).sub(v)];
};

/*

let ij = state.KK[state.ii];
                let r1 = new P().mov(state.c).sub(state.A).len() + (state.R * (-1 + 2 * ij.u));
                let Bt = null;
                if(r1 < 0) {
                    Bt = new P().mov(state.c).add(new P(Math.random()-0.5, Math.random()-0.5).n().mul(state.R * 0.99));
                } else {
                    let pp = getCandidates(state.A, r1, state.c, state.R);
                    pp[1].sub(pp[0]);
                    Bt = new P().mov(pp[0]).add(new P().mov(pp[1]).mul(ij.v));
                }
                let B = tt.b2t(new P().mov(Bt), state.n);


 */

function getSortedCandidates(traj, i) {
    let track = traj.track;
    let cb = traj.t2b(traj.c(i), i);
    let R = traj.steeringRadius(i);
    let ps = track.cover.query(new QT.Circle(cb.x, cb.y, R));
    ps.sort(function(a, b) {
        return b.data.lat - a.data.lat;
    });
    return ps;
}

function batchAI(ai, traj, states, N, finalCallback) {
    return function() {
        let state = null;
        let next = function(state, one) {
            //console.log("skip");
            if (state.ii < state.K-1/* && !(ai.result.best !== null && state.ii >= state.minK)*/){
                ai.progress_current += one ? 1 : ai.progress_counts[state.depth0 - state.depth + 1]||0;
                let newState = new State(state.n0, state.depth0, state.depth);
                newState.estimate = state.K - state.ii;
                newState.dis = state.dis0;
                newState.n = state.n
                newState.ii = state.ii + 1;
                newState.A = state.A;
                newState.AA = state.AA;
                newState.c = state.c;
                newState.R = state.R;
                newState.c0 = state.c0;
                newState.K = state.K;
                newState.KK = state.KK;
                newState.minK = state.minK;
                newState.advance0 = state.advance0;
                newState.collision = state.parentCollision;
                newState.moves =  JSON.parse(JSON.stringify(state.moves))
                newState.bmoves = JSON.parse(JSON.stringify(state.bmoves));
                newState.parent = ai.result;
                states.push(newState);
            }
        }
        for(let step = 0; step < N && states.length > 0; ++step) {
            state = states.pop();
            state.dis0 = state.dis;
            let tt = ai.traj;
            tt.moves = state.moves;
            state.parentCollision = state.collision;
            if (state.n === undefined) {
                let n = state.n0 -1;
                state.A = new P().mov(tt.t2b(tt.get(n), n));
                state.R = tt.steeringRadius(n);
                state.c = new P().mov(tt.t2b(new P().mov(tt.c(n)), n));
                let level = Math.min(ai.KK.length - 1, state.depth0 - state.depth);
                state.K = ai.samples[level];
                state.KK = ai.KK[level];
                //console.log(state.K);
                state.minK = ai.minSamples[level];
                //state.advance0 =  state.depth0 === state.depth ? ai.getProgress(state.A) : state.advance0;
                state.advance0 =  ai.getProgress(state.A);
                state.n = n;
                state.ii = 0;
            }
            //console.log(ai.KK.length, state.n, Math.min(ai.KK.length - 1, state.depth0 - state.depth), state.KK);
            let ij = state.KK[state.ii];
            let r1 = new P().mov(state.c).sub(state.A).len() + (state.R * (-1 + 2 * ij.u));
            let Bt = null;
            if(r1 <= state.R) {
                Bt = Math.random() * 2 * Math.PI;
                Bt = new P().mov(state.c).add(new P(Math.cos(Bt), Math.sin(Bt)).mul(state.R * 0.99));
            } else {
                let pp = getCandidates(state.A, r1, state.c, state.R);
                Bt = new P().mov(pp[0]).add(new P().mov(pp[1].sub(pp[0])).mul(ij.v));
                //console.log(JSON.stringify(Bt));
            }

            let B = new P().mov(tt.b2t(new P().mov(Bt), state.n));

            state.bmoves[state.depth0 - state.depth] = new P().mov(Bt);
            tt.move(new P().mov(B), state.n0, tt.moves, 1);
            let res = tt.getMove(state.n0).result;
            state.legal = res.legal;
            if (!state.legal || res.offTrackFraction > 0.0) {
                if(state.legal)
                    ai.crash += 1;
                else {
                    ai.illegal += 1;

                }
                if(!state.legal && r1 <= state.R) {
                    --state.ii;
                    --ai.progress_current;
                }
                next(state);
                continue;
            }
            ai.legal += 1;
            let estimate = state.bmoves.length;// + nMoves;
            state.estimate = state.K -state.ii;
            next(state, 1);

            //f(state.depth === 0) {
                let advance = ai.getProgress(Bt);
                let speed = (advance.lat - state.advance0.lat);
                if (speed < -0.5) {
                    //console.log("+:" + speed);
                    speed += 1.0;
                }
                if (speed > 0.5) {
                    //console.log("-1:" + speed);
                    speed -= 1.0
                }
                //dis -= 10;
                state.dis += speed;
                //let s = (1.0-dis)*tt.track.design.length();
                let update = ai.result;
                //console.log(state.dis, update.bestd);
                if (state.dis > update.bestd && state.depth <= 0) {
                    update.bestd = state.dis;
                    update.best = new P().mov(state.bmoves[0]);
                }
            //}
            if (state.depth > 0) {
                //if(dis >= 0.0) {
                let nextState = new State(state.n0+1, state.depth0, state.depth - 1);
                nextState.estimate = estimate + 1;
                nextState.ii = 0;
                nextState.moves = JSON.parse(JSON.stringify(state.moves));
                nextState.bmoves = JSON.parse(JSON.stringify(state.bmoves));
                nextState.dis = state.dis;
                nextState.n = undefined; //hack
                nextState.parent = ai.result;
                nextState.advance0 = state.advance0;
                states.push(nextState);
            }
        }
        if(states.length > 0)
            process(ai, traj, states, finalCallback)();
        else {
            console.log(""+ JSON.stringify(ai.result.best) + " -> "+ ai.result.bestd);
            finalCallback([ai.result.best, ai.result.bestd, ai]);
        }
    }
}
/*function batchAI(ai, traj, states, N, finalCallback) {
    return function() {
        let state = null;
        let end = false;
        for (let batch = 0; states.length > 0 && batch < N; ++batch) {
            ai.progress_current += 1;
            let state0 = states.pop();
            let state = JSON.parse(JSON.stringify(state0));
            state.dis = state.dis0;
            let tt = new Trajectory(traj.track);
            tt.moves = state.moves;
            if(state.n === undefined) {
                let n = state.n0 -1;
                state.A = tt.t2b(tt.get(n), n);
                state.R = tt.steeringRadius(n);
                state.c = tt.t2b(tt.c(n), n);
                let level = Math.min(ai.KK.length - 1, state.depth0 - state.depth);
                state.K = ai.samples[level];
                state.KK = ai.KK[level];
                state.advance0 = ai.getProgress(state.A);//: state.advance0;
                state.n = n;
                state.ii = 0;
            }
            console.log(state.K, state.ii);
            if(state.ii < state.K) {
                //console.log(state.ii, state.K, state.bmoves.length);

                //console.log(JSON.stringify([r1, B, Bt]));
                state.bmoves[state.depth0 - state.depth] = new P().mov(Bt);
                tt.move(new P().mov(B), state.n0, tt.moves, 1);
                let res = tt.getMove(state.n0).result;
                state.legal = res.legal;
                if (!state.legal || res.offTrackFraction > 0.0)
                    continue;

                state.advance = ai.getProgress(Bt);

                let speed = (state.advance.lat - state.advance0.lat);
                //state.dis = state.advance.lat;
                if (state.advance0.lat > 0.0 && state.advance.lat < 0.0) {
                    console.log("+1");
                    speed += 1.0;
                }
                if (state.advance.lat > 0.0 && state.advance0.lat < 0.0) {
                    speed -= 1.0
                    console.log("-1");
                }

                state.dis += speed;
                //console.log(speed);
                state.dis0 = state.dis;
                //state.dis += speed;

                state.estimate = state.K-state.ii;//ate = ste.dis;//;/ + nMoves;
                ++state.ii;
                states.push(state);
            }
            console.log("APPEND " + state.depth);
            if(state.depth === 0) {
                let update = ai.result;
                if(state.dis > update.bestd) {
                    update.bestd = state.dis;
                    update.best = state.bmoves[0];
                    console.log(state.collision, state.estimate, state.s, state.speed);
                    update.collision = state.collision;
                }
            }
            else {
                let nextState = JSON.parse(JSON.stringify(state));
                nextState.estimate = state.moves.length;
                nextState.dis0 = state.dis;
                nextState.ii = 0;
                nextState.n = undefined;
                ++nextState.n0;
                --nextState.depth;
                states.push(nextState);

            }
        }
        if(states.length > 0)
            process(ai, traj, states, finalCallback)();
        else{
            console.log(ai.result.collision + " x "+ JSON.stringify(ai.result.best) + " -> "+ ai.result.bestd);
            finalCallback([ai.result.best, ai.result.bestd, ai]);
        }
}
}*/
function process(ai, traj, states, finalCallback) {
    return function () {
        setTimeout(batchAI(ai, traj, states,32, finalCallback), 0);
    };
}

AI.prototype._goodMove = function(traj, n0, depth0, depth, finalCallback) {
    if(this.thinking)
        return false;
    this.legal = 0;
    this.illegal = 0;
    this.crash = 0;
    let state0 = new State(n0, depth0, depth);
    let count = 1;
    this.progress_counts = [count, 1, 1];
    for(let i = 0; i <= this.depth0; ++i) {
        let level = Math.min(this.samples.length - 1, depth0 - i);
        count *= this.samples[level];
        this.progress_counts.unshift(count);
    }
    this.max_states_length = 100;
    this.progress_current = 0;
    //this.progress_counts[0] = 10000;
    //console.log(JSON.stringify(this.progress_counts));
    state0.parent = this.result;
    state0.moves = JSON.parse(JSON.stringify(traj.moves));
    state0.moves0 = JSON.parse(JSON.stringify(traj.moves));
    state0.n0 = traj.moves.length;
    let states = new TinyQueue([state0], function (a, b) { return a.estimate - b.estimate; });
    this.states = states;
    this.result = new State();
    this.result.best = null;
    this.result.bestd = -1000000;
    this.result.collision = false;
    let trajCopy = new Trajectory(traj.track);
    trajCopy.moves = JSON.parse(JSON.stringify(traj.moves));
    this.thinking = true
    process(this, trajCopy, states, finalCallback)();
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
