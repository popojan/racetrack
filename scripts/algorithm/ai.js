function AI (track, player) {
    this.player = player;
    track.initAI(192, 13, 12);
    //track.initAI(128, 9, 12);
    this.track = track;
    this.depth0 = 3;// 4 @ [32,8,8,8];
    this.samples = [];
    this.result = new State();
}

AI.prototype.getProgress = function(p) {
    let ps = this.track.cover.query(new QT.Circle(p.x, p.y, 20));
    return ps[0].data;
};


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
    this.val = Infinity;
    this.ii = 0;
    this.n = n0 - 1;
    this.depth0 = depth0;
    this.depth = depth;
    this.bestd = 1000000; //Infinity stringifies as null
    this.moves = [];
    this.bmoves = [];
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
        let end = false;
        for(let step = 0; step < N && states.length > 0 && !end; ++step) {
            ai.progress_current += 1;
            if(ai.progress_current > 0.75 * ai.progress_count)
                ai.progress_count *= 2.0;
            state = states.pop();
            let tt = new Trajectory(traj.track);
            tt.moves = state.moves;

            if (state.depth > 0) {
                if (state.candidates === undefined) {
                    state.candidates = getSortedCandidates(tt, state.n)
                    //console.log("Retrieved " + state.candidates.length + " candidate points.");
                }
                if (state.ii < state.candidates.length) {
                    let Bb = state.candidates[state.ii].data;
                    //console.log(state.ii, state.n, JSON.stringify(Bb));
                    let Bt = tt.b2t(new P().mov(Bb), state.n);
                    tt.move(Bt, state.n + 1, tt.moves, 1);
                    state.bmoves[state.depth0 - state.depth] = JSON.parse(JSON.stringify(Bb));
                    //console.log(state.moves.length, state.n + 1);
                    let result = tt.getMove(state.n + 1).result;

                    let s = (1-Bb.lat);
                    let speed = new P().mov(tt.t2b(tt.get(state.n), state.n)).sub(Bb).len()/tt.track.design.length();

                    let estimate = Math.sqrt(speed*speed + 2*s) - speed;
                    //console.log(speed, s, estimate);
                    if (result.legal && result.offTrackFraction <= 0) {
                        //enqueue new child state
                        let dstate = JSON.parse(JSON.stringify(state));
                        dstate.ii = 0;
                        dstate.candidates = undefined;
                        ++dstate.n;
                        --dstate.depth;
                        dstate.val = dstate.moves.length + estimate;
                        states.push(dstate)

                    }
                    if(state.ii < state.candidates.length -  1) {
                        //enqueue new sibling state
                        let wstate = JSON.parse(JSON.stringify(state));
                        ++wstate.ii;
                        wstate.val = wstate.moves.length + estimate ;
                        states.push(wstate);
                    }
                }
            } else {
                //specified depth reached, update results
                 let lat = state.val;
                if(lat < ai.result.bestd) {
                    ai.result.bestd = lat;
                    ai.result.best = state.bmoves[0];
                    end = true;
                }
            }
        }
        if (states.length > 0 && !end)
            process(ai, traj, states, finalCallback)();
        else {
            console.log("" + JSON.stringify(ai.result.best) + " -> " + ai.result.bestd);
            finalCallback([ai.result.best, ai.result.bestd, ai]);
        }
    }
}

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
    this.progress_count = 10000;
    this.progress_current = 0;
    state0.moves = JSON.parse(JSON.stringify(traj.moves));
    state0.n = traj.moves.length - 1;
    let states = new TinyQueue([state0], function (a, b) { return a.val - b.val; });
    this.states = states;
    this.result = new State();
    this.result.bestd = 1000000;
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
