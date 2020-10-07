function AI (track, player, sid) {
    this.player = player;
    track.initAI(1024, 15, 12);
    this.track = track;
    this.depth0 = 4;// 4 @ [32,8,8,8];
    this.result = new State();
    this.sid = sid;
    this.ahead = 220;
    this.shorten = 0.05;
    this.randomize = 0.0;
    this.annulus = 0.8;
}

AI.prototype.getProgress = function(p) {
    let ps = this.track.cover.query(new QT.Circle(p.x, p.y, 20));
    return ps[0].data;
};

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
    this.bests = [];
    this.bmoves = [];
    this.estimate = 100000;
    this.lap = [];
    this.lats = [];
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

function _getSortedCandidates(cover, cb, R, closeTo, mult) {
    //closeTo = undefined;
    cb = closeTo||cb;
    let ps = cover.query(new QT.Circle(cb.x, cb.y, closeTo ? R * mult : R));
    ps.sort(function (a, b) {
        return b.data.lat - a.data.lat;
    });
    if(ps.length < 1)
        return [];
    /*
    let p = closeTo||ps[0];
    ps.sort(function (a, b) {
        let db = Math.sqrt((p.x - b.x)*(p.x - b.x) + (p.y - b.y)*(p.y - b.y));
        let da = Math.sqrt((p.x - b.x)*(p.x - b.x) + (p.y - b.y)*(p.y - b.y));
        return da - db;
    });
    */
    return ps;
}

function getSortedCandidates(traj, cover, i, annulus, pp, mult) {
    let track = traj.track;
    let cb = traj.t2b(traj.c(i), i);
    let R = traj.steeringRadius(i);
    let ps =_getSortedCandidates(cover, cb, R, pp, mult);
    if(!annulus)
        return ps;
    let ret = [];
    for (let i = 0; i < ps.length; ++i) {
        let aa = new P().mov(cb).sub(ps[i].data);
        if(aa.len()/R >= annulus)
            ret.push(ps[i]);
    }
    return ret;
}


function batchAI(ai, traj, states, N, finalCallback) {
    return function() {
        let state = null;
        let end = false;
        let len = traj.track.design.length();

        let ii = traj.moves.length-1;
        let target = traj.target[Math.min(traj.target.length-1,ii)]*len + ai.ahead;
        target = target % len;
        ai.currentTarget = target;

        for(let step = 0; step < N && states.length > 0 && !end; ++step) {
            state = states.pop();
            if (state.finished > 1) {
                end = true;
                let tt = new Trajectory(traj.track);
                tt.moves = state.moves;
                let finalScore = tt.score();
                if(finalScore < Infinity)
                    console.log("FINAL SCORE = ", finalScore);
                ai.result.best = state;
                ai.result.bestd = state.val;
                traj.collision = traj.collision||0 + state.collision||0;
                traj.target = JSON.parse(JSON.stringify(state.lats));
                break;
            } else {
                let tt = new Trajectory(traj.track);
                tt.moves = state.moves;
                let candidates = getSortedCandidates(tt, traj.track.cover, state.n, ai.annulus);
                for (let j = 0; j < candidates.length; j += 1){ //state.depth0 - state.depth + 1){
                    let dstate = JSON.parse(JSON.stringify(state));
                    --dstate.depth;
                    ++dstate.n;

                    let Bb = candidates[j%candidates.length].data;
                    if(ai.randomize > 0 && Math.random() < ai.randomize)
                        continue;
                    //Bb.x += randn_bm() / 3.0 * ai.randomize * tt.track.defaultSteeringRadius;
                    //Bb.y += randn_bm() / 3.0 * ai.randomize ** tt.track.defaultSteeringRadius;
                    tt.moves = dstate.moves;

                    let Bt = tt.b2t(new P().mov(Bb), state.n);
                    tt.move(Bt, dstate.n, tt.moves, 0);

                    let result = tt.getMove(dstate.n).result;
                    let startingOffTrack = (result.parity - result.intersections.count) % 2 === 1;
                    if (!result.legal || (result.offTrackFraction > 0 && !startingOffTrack))
                        continue;
                    tt.move(tt.t2b(tt.c(state.n+1),state.n+1),dstate.n+1, tt.moves, 0);
                    result = tt.getMove(dstate.n+1).result;
                    if (result.offTrackFraction > 0)
                        continue;
                    let Ab = tt.t2b(tt.get(state.n), state.n);
                    let speed = new P().mov(Bb).sub(Ab);
                    let nspeed = new P().mov(Bb).sub(tt.t2b(tt.c(state.n-1), state.n-1))//new P().mov(speed).n();
                    //if(nspeed.len() < traj.track.defaultSteeringRadius * 0.5)
                    //    continue;last
                    nspeed = nspeed.n()
                    let v = tt.track.points2D[(Bb.ix+1)%tt.track.points2D.length][Bb.iy];
                    v = new P().mov(v).sub(Bb).n();
                    dstate.bmoves[state.depth0 - state.depth] = new P().mov(Bb);//JSON.parse(JSON.stringify(Bb));
                    v =1.0;// (nspeed.x*v.x + nspeed.y*v.y);
                    //vsgn = Math.sign(v);
                    //v = 10*(1/(1+Math.exp(-50*v))-0.9);
                    v = v*(speed.len()/tt.track.defaultSteeringRadius + 0.5);
                    if(state.depth0 === state.depth)
                        dstate.v = speed.len();
                    let ret = tt.scoreAt(dstate.n, undefined, target, ai.shorten);
                    let gScore = dstate.moves.length - 1;
                    let lat = Bb.lat*len;
                    if(target < lat) {
                        lat -= len;
                    }
                    // have we missed the shortened checkpoint line?
                    // dstate.far = target - lat  < 0 && target - lat > len/2;
                    let rest = Math.max(0, (target - lat))/tt.track.defaultSteeringRadius;
                    let hScore = (Math.sqrt(v*v + 2*rest)-v);
                    let fScore = gScore + hScore;
                    if (ret.length > 0 && ret[0].point.t < 1 && state.finished === undefined) {
                        fScore = gScore - 1 + ret[0].point.t;
                        dstate.finished = 2;
                        if(dstate.val < ai.result.bestd)
                        {
                            ai.result.bestd = dstate.val;
                            ai.result.best = dstate.bmoves;
                        }
                    } else if (ret.length > 0 && ret[0].point.t < 1 && state.finished === 1) {
                        dstate.finished = 2;
                    } else {
                        dstate.lats[dstate.n] = Bb.lat;
                    }
                    dstate.val = fScore;
                    states.push(dstate);
                    ++ai.progress_current;
                    if (ai.progress_current > 0.75 * ai.progress_count)
                        ai.progress_count *= 2.0;
                }
            }
        }
        if (states.length > 0 && !end) {
            process(ai, traj, states, finalCallback)();
        }
        else {
            finalCallback([ai.result.best.bmoves[0], ai.result.bestd, ai]);
        }
    }
}

function process(ai, traj, states, finalCallback) {
    return function () {
        setTimeout(batchAI(ai, traj, states,1, finalCallback), 0);
    };
}

AI.prototype._goodMove = function(traj, n0, depth0, depth, finalCallback) {
    if(this.thinking)
        return false;
    this.legal = 0;
    let state0 = new State(n0, depth0, depth);
    this.progress_count = 10000;
    this.progress_current = 0;
    state0.moves = JSON.parse(JSON.stringify(traj.moves));
    state0.n = traj.moves.length - 1;
    state0.collision = traj.collision||0;
    state0.estimate = 100000;
    let len = traj.track.design.length();
    if(traj.target)
        state0.lats = JSON.parse(JSON.stringify(traj.target));
    else {
        state0.lats = [traj.track.design.startposAt(this.sid) / len];
        traj.target = JSON.parse(JSON.stringify(state0.lats));
    }
    traj.target = state0.lats;
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
