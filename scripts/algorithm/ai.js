function AI (track, player, sid) {
    this.player = player;
    //track.initAI(128, 11, 12);
    //track.initAI(64, 3, 12);
    //track.initAI(512, 15, 12);
    track.initAI(764, 15, 12);
    //track.initAI(132, 7, 12);//track.initAI(512, 11, 12);
    this.track = track;
    this.depth0 = 4;// 4 @ [32,8,8,8];
    this.result = new State();
    this.sid = sid;
    this.ahead = 180;
    this.ahead2 = 40;
    this.shorten = 0.025;
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
    /*let p = closeTo||ps[0];
    ps.sort(function (a, b) {
        let db = Math.sqrt((p.x - b.x)*(p.x - b.x) + (p.y - b.y)*(p.y - b.y));
        let da = Math.sqrt((p.x - b.x)*(p.x - b.x) + (p.y - b.y)*(p.y - b.y));
        return da - db;
    });*/
    return ps;//closeTo ? ps.slice(0, 4) : ps;
}

function getSortedCandidates(traj, cover, i, pp, mult) {
    let track = traj.track;
    let cb = traj.t2b(traj.c(i), i);
    let R = traj.steeringRadius(i);
    let ps = _getSortedCandidates(cover, cb, R, pp, mult);
    //if(ps.length <= 0)
    //    return [];
    //return _getSortedCandidates(cover, ps[0], R);
    return ps;
}


function batchAI(ai, traj, states, N, finalCallback) {
    return function() {
        let state = null;
        let end = false;
        let len = traj.track.design.length();

        let vv = 0.0;

        let ii = traj.moves.length-1;
        let target = traj.target[ii]*len + ai.ahead;
        if(ai.best && ai.best.bmoves)
            target += ai.best.v;// ai.best.bmoves[ai.best.bmoves.length-1].seg.len/2;
        let target0 = traj.target[ii - 1]*len;//traj.targets[traj.target]; //state.lats.length - 1 - state.depth0 + state.depth
        target = target % len;

        ai.currentTarget = target;
        //traj.targets[traj.target]; //state.lats.length - 1 - state.depth0 + state.depth

        for(let step = 0; step < N && states.length > 0 && !end; ++step) {
            state = states.pop();
            //if(state.finished === 1) {
            //    target += ai.ahead2; //traj.targets[(traj.target+10) %  traj.targets.length];
            //}
            //console.log(JSON.stringify(state.lats), target);
            if (state.finished > 1) {
                end = true;
                let tt = new Trajectory(traj.track);
                tt.moves = state.moves;
                let finalScore = tt.score();
                //if(finalScore < Infinity)
                    console.log("FINAL SCORE = ", finalScore);
                ai.result.best = state;
                //ai.ahead = state.ahead;
                //console.log(ai.ahead);
                ai.result.bestd = state.val;
                traj.collision = traj.collision||0 + state.collision||0;
                traj.target = JSON.parse(JSON.stringify(state.lats));//Math.round(traj.target + state.v/(len/ai.K)) % traj.targets.length;
                break;
            } else {
                //if(state.far||false)
                //    continue;
                let pp = undefined;
                let ph = undefined;
                let mult = undefined;

                let tt = new Trajectory(traj.track);
                tt.moves = state.moves;
                let candidates = getSortedCandidates(tt, traj.track.cover, state.n, pp, mult);
                //let added = 0;
                //let run = 0;
                let steps = state.depth0-state.depth;
                for (let j = 0; j < candidates.length; j+= 1/*state.depth0 - state.depth + 1*/) {
                    pp = undefined;
                    if(ai.result.best && ai.result.best.bmoves && steps < ai.result.best.bmoves.length) {
                        let maxSteps = ai.result.best.bmoves.length;
                        let close = steps < 2;
                        //console.log(close, traj.moves.length, steps, state.val);
                        //mult = close ? 0.075 : 1;
                        pp = undefined;// steps < maxSteps - 4 ? ai.result.best.bmoves[state.depth0-state.depth]: undefined;
                        ph = ai.result.best.bmoves[state.depth0-state.depth];
                        //pp = close ? ph : undefined;
                        //pp =  steps < maxSteps - 4 ? ai.result.best.bmoves[state.depth0-state.depth]: undefined;
                    }
                    candidates = getSortedCandidates(tt, traj.track.cover, state.n, pp, mult);
                    let dstate = JSON.parse(JSON.stringify(state));
                    --dstate.depth;
                    ++dstate.n;
                    let Bb = candidates[j%candidates.length].data;

                    //dstate.ahead = Bb.seg.len * 1.5;
                    //Bb.x += randn_bm()/3.0*0.2*tt.track.defaultSteeringRadius;
                    //Bb.y += randn_bm()/3.0*0.2*tt.track.defaultSteeringRadius;
                    tt.moves = dstate.moves;

                    let Bt = tt.b2t(new P().mov(Bb), state.n);
                    tt.move(Bt, dstate.n, tt.moves, 0);

                    let result = tt.getMove(dstate.n).result;
                    if (!result.legal || result.offTrackFraction > 0)
                        continue;
                    tt.move(tt.t2b(tt.c(state.n+1),state.n+1),dstate.n+1, tt.moves, 0);
                    result = tt.getMove(dstate.n+1).result;
                    if (result.offTrackFraction > 0)
                        continue;
                    dstate.collision = dstate.collision||0 + (result.offTrackFraction > 0 ? 1 : 0);
                    let Ab = tt.t2b(tt.get(state.n), state.n);
                    let speed = new P().mov(Bb).sub(Ab);
                    let nspeed = new P().mov(Bb).sub(tt.t2b(tt.c(state.n-1), state.n-1))//new P().mov(speed).n();
                    //if(nspeed.len() < traj.track.defaultSteeringRadius * 0.5)
                    //    continue;last
                    nspeed = nspeed.n()
                    let v = tt.track.points2D[(Bb.ix+1)%tt.track.points2D.length][Bb.iy];
                    v = new P().mov(v).sub(Bb).n();
                    dstate.bmoves[state.depth0 - state.depth] = new P().mov(Bb);//JSON.parse(JSON.stringify(Bb));
                    v = 1.0;//(nspeed.x*v.x + nspeed.y*v.y);
                    //vsgn = Math.sign(v);
                    //v = 10*(1/(1+Math.exp(-50*v))-0.9);
                    v *= speed.len()/tt.track.defaultSteeringRadius;
                    if(state.depth0 === state.depth)
                        dstate.v = speed.len();
                    let ret = tt.scoreAt(dstate.n, undefined, target, ai.shorten);
                    let gScore = dstate.moves.length -1;// + (10*state.collision||0);
                    let lat = Bb.lat*len;
                    if(target < lat) {
                        lat -= len;
                    }
                    // have we missed the shortened checkpoint line?
                    dstate.far = target - lat  < 0 && target - lat > len/2;
                    let rest = Math.max(0, (target - lat))/tt.track.defaultSteeringRadius;
                    let hScore = (Math.sqrt(v*v + 2*rest)-v);
                    if(ph)
                        hScore -= 1.0/(new P().mov(ph).sub(Bb).len());
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
                    //if(states.length < 1 || fScore < 1.3*(states.peek().val))
                        states.push(dstate);
                        //added += 1;
                    let diff = target-target0;
                    diff = diff < 0 ? len + target-target0 : target-target0;
                    let curr = Bb.lat*len-target0;
                    curr = curr < 0 ? curr + len : curr;
                    ai.progress_current = Math.max((ai.progress_current+1)%ai.progress_count, curr/diff *ai.progress_count);
                    //if (ai.progress_current > 0.75 * ai.progress_count)
                    //    ai.progress_count *= 2.0;

                   /* if(j >= candidates.length -1) {
                        if(added === 0) {
                            j = 0;
                            run += 1;
                        }
                    }*/
                }
            }
        }
        if (states.length > 0 && !end) {
            /*let LIMIT = 1000;
            if(states.length > LIMIT)
            {
                let backup = [];
                for(let i = 0; i < LIMIT;++i) {
                    backup.push(states.pop());
                }
                ai.states = new TinyQueue([], function (a, b) { return a.val - b.val; });
                for(let i = 0; i < backup.length;++i) {
                    ai.states.push(backup[i]);
                }
            }*/
            process(ai, traj, states, finalCallback)();
        }
        else {
            console.log("QUEUE.len == ", states.length);
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
    this.illegal = 0;
    this.crash = 0;
    let state0 = new State(n0, depth0, depth);
    this.progress_count = 10000;
    this.progress_current = 0;
    state0.moves = JSON.parse(JSON.stringify(traj.moves));
    state0.n = traj.moves.length - 1;
    state0.collision = traj.collision||0;
    this.K = 300;
    state0.lap = [traj.lap||0];
    state0.lap0 = [traj.lap||0];
    state0.estimate = 100000;
    let len = traj.track.design.length();
    if(traj.target)
        state0.lats = JSON.parse(JSON.stringify(traj.target));
    else {
        state0.lats = [traj.track.design.startposAt(this.sid) / len];
        traj.target = JSON.parse(JSON.stringify(state0.lats));
    }
    traj.target = state0.lats;
    //console.log(state0.lats);
    //traj.lastLat = traj.lastLat||(traj.track.design.startposAt(this.sid)+traj.track.defaultSteeringRadius);
    let states = new TinyQueue([state0], function (a, b) { return a.val - b.val; });
    this.states = states;
    let lastBest = this.result ? this.result.best||undefined : undefined;
    if(lastBest!== undefined) lastBest.bmoves.shift();
    //console.log(JSON.stringify(lastBest));
    this.result = new State();
    this.result.bestd = 1000000;
    this.result.best = lastBest;
    /*this.result.bests = [];
    for(let jj = 0; jj <lastBest.length; ++jj) {
        let x = lastBest[jj].slice(lastBest[jj].length-2, lastBest[jj].length);
        this.result.bests.push(x);
    }*/
    //let trajCopy = new Trajectory(traj.track);
    //trajCopy.moves = JSON.parse(JSON.stringify(traj.moves));
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
