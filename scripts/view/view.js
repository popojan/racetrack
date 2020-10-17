let DEBUG = false;
function View (canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.colors = ["#eb0000", "#000000", "#0000ff", "#eb8000", "#808000", "#FF00FF", "#008080", "#0080FF", "#eb0000", "#800000"];
    this.translation = null;
    this.scale = null;
    this.arrowScale = 2.0;
    this.tmp_p0 = new P();
    this.tmp_p1 = new P();
    this.eax = new P();
    this.ebx = new P();
    this.ecx = new P();
    this.edx = new P();
    this.tt = null;
    this.motorSound = undefined;
}

View.prototype.getModelCoords = function(e, output) {
    let rect = this.canvas.getBoundingClientRect();
    output.x = e.clientX - rect.left;
    output.y = e.clientY - rect.top;
    return this.m(output);
};

View.prototype.clear = function() {
    this.context.fillStyle = "#A0A0A0";
    this.context.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
};

View.prototype.drawGrid = function(minorCount, majorCount) {
    let W = Math.max(this.canvas.clientWidth, this.canvas.clientHeight);
    for(const count of [minorCount, majorCount]) {
        for (let i = 0; i < count; ++i) {
            if(count === minorCount && i % majorCount === 0)
                continue;
            this.context.strokeStyle = "#404040";
            this.context.lineWidth = count === minorCount ? 0.5:1.0;
            this.context.beginPath();
            //this.context.strokeDasharray = count === minorCount ? [2, 3] : [1, 1];
            this.context.moveTo(i * W / count, 0);
            this.context.lineTo(i * W / count, this.canvas.clientHeight);
            this.context.stroke();
            this.context.beginPath();
            //this.context.strokeDasharray = count === minorCount ? [2, 3] : [1, 1];
            this.context.moveTo(0, i * W / count);
            this.context.lineTo(this.canvas.clientWidth, i * W / count);
            this.context.stroke();

        }
    }
};

View.prototype.resize = function (width, height, bbox) {
    this.pixelRatio = window.devicePixelRatio||1;
    let scale = Math.min(width / bbox.width, height / bbox.height);
    this.scale = new P(scale, scale);
    this.translation = new P(
        -this.scale.x * bbox.x + (width - this.scale.x * bbox.width)/2,
        -this.scale.y * bbox.y + (height - this.scale.y * bbox.height)/2
    );
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = width;
    this.canvas.style.height = height;
    this.trackPath = undefined;

    this.rasterizedTrack = undefined;
};

View.prototype.drawMark = function(p) {
    let pp = new P().mov(p);
    this.v(pp);
    this.context.fillStyle = "#000000";
    this.context.beginPath();
    this.context.arc(pp.x, pp.y, 2, 0, 2*Math.PI);
    this.context.closePath();
    this.context.fill();
};

View.prototype.hatchCircle = function(t, S, R, lastMove, alpha, beta, color1, color2) {
    this.ebx.mov(t.t2b(t.getMove(lastMove - 2).point, lastMove - 3));
    this.eax.mov(t.t2b(t.getMove(lastMove - 1).point, lastMove - 2));
    this.ebx.mov(this.eax);
    this.v(this.ebx);
    let r11 = distance(this.ebx, this.eax);
    let RR = distance(S, this.eax);
    for(let k = 0; k <= 10; ++k) {
        let r1 = RR - R + k/5*R;
        t.getCandidates(this.eax, r1, S, R, this.ecx, this.edx);
        this.ecx.sub(this.eax);
        this.edx.sub(this.eax);
        if(r1 >= r11) {
            this.context.strokeStyle = color2||color1;
            this.context.globalAlpha = alpha;
        }
        else {
            this.context.strokeStyle = color1;
            this.context.globalAlpha = alpha;
        }
        if(r1 > 0) {
            this.context.beginPath();
            this.context.arc(this.ebx.x, this.ebx.y,
                this.scale.x * r1, Math.atan2(this.ecx.y, this.ecx.x), Math.atan2(this.edx.y, this.edx.x));
            this.context.stroke();
        }
    }
    //console.log(JSON.stringify([pp, R, R2]));
    //this.drawMark(A);
    //this.drawMark(B);

};
View.prototype.drawTrajectory = function(t, i,  notAi, moveFrom, moveTo, globalAlpha) {
    let lastMove = t.moves.length;
    let player = model.race.players[i];
    if(player && notAi && i <= model.playerToMove && player.adjustedMove && player.trajectory.altmoves.length > player.trajectory.moves.length) {
        lastMove += 1;
        if(i === model.playerToMove && notAi/* && model.race.ais[model.playerToMove] === null*/) {
            let R = t.steeringRadius(lastMove - 1);
            let S1 = this.tmp_p0.mov(t.t2b(player.trajectory.c(lastMove - 1), lastMove - 1));
            let S2 = this.tmp_p1.mov(t.t2b(t.c()));
            this.drawCircle(S1, R, this.colors[i], 0.15, false);
            //this.drawArrow(B, pp, this.colors[i], false, true);
            let R2 = t.steeringRadius();
            this.drawCircle(S2, R2, this.colors[i], 0.25, false);
            this.hatchCircle(t, S1, R, lastMove, 0.25, 0.15, this.colors[i]);
            this.hatchCircle(t, S2, R2, lastMove-1, 0.25, 0.15, this.colors[i]);
            //this.drawMark(pp[0]);
            //this.drawMark(pp[1]);
        }
    }
    if(lastMove === 1) {
        let p = model.track.startPositions[player.sid];
        this.edx.x = p.vx;
        this.edx.y = p.vy
        this.drawArrow(this.ecx.mov(p).sub(this.edx), p, this.colors[i], true, false);
    }
    for (let j = moveFrom||0; j < lastMove; ++j) {
        let drawMove = j >= (moveFrom||(lastMove-1)) && j < (moveTo||lastMove);
        let speed = this.drawMove(t, j, drawMove, this.colors[i], globalAlpha, model)
        if(speed !== undefined && this.soundEngine !== undefined) {
            //this.soundEngine.setListenerPosition(0, 0, speed.dx, speed.dy);
            this.soundEngine.setRPM(i, speed.rpm);
            this.soundEngine.setPosition(i, speed.x, speed.y);
        }
        if(drawMove) globalAlpha *= 0.75;
        if(false) { //j >= (circlesFrom||Infinity) && j< (circlesFrom||-Infinity) ) { // DEBUG
            let R = t.steeringRadius(j);
            let S1 = t.t2b(player.trajectory.c(j), j);
            this.drawCircle(S1, R, this.colors[i], j / lastMove);
        }
    }
};

View.prototype.render = function(model) {
    //if(!model.track || !model.scale) return;
    if(this.soundEngine === undefined) {
        this.soundEngine = initSound(window, model.race.players.length);
    }
    this.drawTrack(model.track);
    for (const player of model.race.players) {
        this.drawTrajectory(player.trajectory, player.i, true);
    }

    let ctx = this.context;
    //ctx.strokeStyle = "#eb0000";
    ctx.lineWidth = 1;

    for(const player of model.race.players) {
        if (!model.race.ais[player.i]) continue;

        let tt = undefined;//model.race.ais[i].traj;
        if (!tt) continue;
        let m = tt.moves[0].point;
        ctx.moveTo(this.scale.x * m.x + this.translation.x, this.scale.y * m.y + this.translation.y);
        //console.log(JSON.stringify(model.race.ais[1].traj.moves));
        ctx.beginPath();
        if (!tt) continue;
        let prevMove = null;
        for (const move of tt.moves) {
            if (prevMove === null) {
                prevMove = move;
                continue;
            }
            let m0 = prevMove.point;
            let m = move.point;
            //this.drawArrow(m0, m, true, false);
            ctx.lineTo(this.scale.x * m.x + this.translation.x, this.scale.y * m.y + this.translation.y);
            ctx.stroke();
        }
    }
    if(model.coord) {
        ctx.font = '50px serif';
        //ctx.fillText("[" + Math.round(model.coord.x)+ ", " + Math.round(model.coord.y) + "]", 200, 100);
    }
    let ai = model.race.ais[model.playerToMove];
    if(ai) {
        ctx.fillStyle = this.colors[model.playerToMove];
        //ctx.strokeStyle = this.colors[1];
        ctx.fillRect(5, 5, Math.min(1.0, ai.progress_current / ai.progress_count) * (this.canvas.clientWidth-10), 15);
        //ctx.beginPath();

        if(DEBUG || true && (ai.states.length > 0 || ai.lastState)) {
            this.tt.moves = (ai.lastState ? ai.lastState : ai.states.peek()).moves;

            this.drawTrajectory(this.tt, model.playerToMove, false, 3, this.tt.moves.length-1, 1.0);
            ctx.globalAlpha = 0.1;
            let  at = ai.currentTarget;
            let line = model.track.design.line(at, ai.shorten);
            this.eax.x = line.x1;
            this.eax.y = line.y1;
            this.ebx.x = line.x2;
            this.ebx.y = line.y2;

            let A = this.v(this.eax);
            let B = this.v(this.ebx);
            ctx.lineWidth = 1;
            ctx.strokeStyle = ctx.fillStyle;
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.closePath();
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }
    //ctx.stroke();
};

View.prototype.drawCircle = function(c, R, color, op, filled) {
    op = op || 1.0;
    let ctx = this.context;
    ctx.beginPath();
    ctx.globalAlpha = op;
    let cv = this.v(this.eax.mov(c));
    ctx.arc(cv.x, cv.y, R*this.scale.x, 0, 2*Math.PI);
    //ctx.closePath();
    if(filled){
        ctx.fillStyle = color;
        ctx.fill();
    }
    else {
        ctx.lineWidth = 1;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    ctx.closePath();
};

function speed2rpm(speed) {
    speed *= 70;
    let speeds = [0, 33.1, 64.9, 88.6, 112, 224];
    //let rpms = [[200, 7786], [4687, 7069], [4980, 6794], [5108, 6456], [5255, 9735]];
    let rpms = [[200, 7786], [4687, 7969], [4980, 8600], [5108, 9000], [5255, 12735]];
    for(let i = 0; i < speeds.length; ++i) {
        if(speed < speeds[i]) {
            let a = rpms[i - 1][0];
            let b = rpms[i - 1][1];
            return (a + (b-a) * (speed - speeds[i-1])/(speeds[i]-speeds[i-1]))/2500;
        }
    }
    let a = rpms[rpms.length-1][0];
    let b = rpms[rpms.length-1][1];
    return (a + (b-a)*(speed - speeds[speeds.length-2])/(speeds[speeds.length-1]-speeds[speeds.length-2]))/2500;

}
View.prototype.drawMove = function(trajectory, moveNumber, drawMove, color, globalAlpha, model) {
    globalAlpha = globalAlpha||1.0;
    let t0 = trajectory.animationMoveFraction;
    let ctx = this.context;
    let ret = trajectory.bez(moveNumber);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2*globalAlpha;

    if(drawMove/* || trajectory.animationMove ===  moveNumber*/) {
        ctx.beginPath();
        this.v(this.eax.mov(ret[0]));
        ctx.moveTo(this.eax.x, this.eax.y);
        this.v(this.eax.mov(ret[1]));
        this.v(this.ebx.mov(ret[2]));
        ctx.quadraticCurveTo(this.eax.x, this.eax.y, this.ebx.x, this.ebx.y);
        ctx.stroke();//}*/
    }

    ctx.globalAlpha = 1.0 * globalAlpha;
    //let legal = trajectory.legal(moveNumber);
    let intersections = trajectory.getMove(moveNumber).result.intersections;
    for(let j = 0; j < intersections.count; ++j) {
        let cp = intersections.points[j];
        getTangentPoint(cp.t,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p0, this.tmp_p1);
        this.tmp_p1.mov(cp);
        this.drawArrow(this.tmp_p0, this.tmp_p1, color, true, true);
    }
    let speedOfSound = undefined;
    if(drawMove && moveNumber > 0) {
        getTangentPoint(1.0,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p0, this.tmp_p1);
        this.drawArrow(this.tmp_p0, this.tmp_p1, color, false, false);
    }
    if(trajectory.animationMove ===  moveNumber && moveNumber > 0) {
        getTangentPoint(trajectory.animationMoveFraction,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p0, this.tmp_p1);
        this.drawArrow(this.tmp_p0, this.tmp_p1, color, true, false);



        let pv0 = bezierPoint(trajectory.animationMoveFraction,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p0);
        let pv1 = bezierPoint(trajectory.animationMoveFraction - 0.01,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p1);
        let vx = pv1.x - pv0.x;
        let vy = pv1.y - pv0.y;
        let speed = distance(pv0, pv1);
        //this.eax.x = 0.33 * this.context.canvas.clientWidth;
        //this.eax.y = this.context.canvas.clientHeight/2;

        let ptm = model.race.players[model.playerToMove];
        let move = ptm.trajectory.bez(Math.min(ptm.trajectory.moves.length-1, ptm.trajectory.animationMove));
        let b0 = bezierPoint(ptm.trajectory.animationMoveFraction-0.01,
            this.eax.mov(move[0]), this.ebx.mov(move[1]), this.ecx.mov(move[2]), this.edx);
        let b1 = bezierPoint(ptm.trajectory.animationMoveFraction,
            this.eax.mov(move[0]), this.ebx.mov(move[1]), this.ecx.mov(move[2]), this.tmp_p1);

        speedOfSound = {rpm: speed2rpm(speed), x: pv0.x - b1.x, y: pv0.y - b1.y, dx: b1.x - b0.x, dy: b1.y-b0.y};
    }
    ctx.globalAlpha = 1.0;
    return speedOfSound;
};

View.prototype.drawTrack = function(track) {
    let ctx = this.context;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.clear();
    if(this.trackPath === undefined) {

        this.trackPath = parseSvgPathData(track.renderPath,
            parseSvgPathData.canvasIfc,
            new Path2D());
        //console.log(JSON.stringify());
        //this.trackPath = new Path2D(track.renderPath);
        //const p0 = new Path2D(track.renderPath);
        //const m = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
        //const t = m.translate(this.translation.x, this.translation.y).scale(this.scale.x, this.scale.y);
        //this.trackPath.addPath(p0, t);
        this.tt = new Trajectory(track);
        //this.rasterizedTrack = ctx.getImageData(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }

    ctx.fillStyle = "#ffffff";
    //let oldTransform = ctx.resetTransform();
    ctx.setTransform(this.scale.x * this.pixelRatio, 0, 0, this.scale.y * this.pixelRatio,
        this.translation.x* this.pixelRatio, this.translation.y * this.pixelRatio);
    ctx.fill(this.trackPath);
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    //ctx.resetTransform();
    //this.drawGrid(200, 20);
    //ctx.globalAlpha = 0.75;
    //ctx.fill(this.trackPath)
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1;
    let solid = ctx.getLineDash();
    ctx.setLineDash([3,2]);
    for(let i = 0; i < track.design.checks.length; ++i) {
        ctx.beginPath();
        let check = track.design.finishLine(i);
        ctx.moveTo(check.x1 * this.scale.x + this.translation.x, check.y1 * this.scale.y + this.translation.y);
        ctx.lineTo(check.x2 * this.scale.x + this.translation.x, check.y2 * this.scale.y + this.translation.y);
        ctx.strokeStyle = "#808080";
        //ctx.closePath();
        ctx.stroke();
    }
    let _this = this;
    let tx = function(x) { return x* _this.scale.x + _this.translation.x; }
    let ty = function(y) { return y* _this.scale.y + _this.translation.y; }
    ctx.setLineDash([1,2]);
    ctx.lineWidth = 1;
    for(let i = 0; i < track.design.gridcount; ++i) {
        let p = track.design.startpos(i);
        let vx = p.vx*6;
        let vy = p.vy*6;
        ctx.beginPath();
        ctx.moveTo(tx(p.x - 3*vx/2 + vy), ty(p.y - 3*vy/2 - vx));
        ctx.lineTo(tx(p.x + vx/2 + vy),   ty(p.y + vy/2 - vx));
        ctx.lineTo(tx(p.x + vx/2 - vy),   ty(p.y + vy/2 + vx));
        ctx.lineTo(tx(p.x - 3*vx/2 - vy), ty(p.y - 3*vy/2 + vx));
        ctx.stroke();
    }
    ctx.setLineDash(solid);

    if(DEBUG) {
        let points = track.cover ? track.cover.getAllPoints() : [];
        if(points.length > 0) {
            for (let i = 0; i < points.length; ++i) {
                this.drawCircle(points[i], 0.5, "#eb0000", points[i].data.lat, true);
            }
        }
    }
    //console.log(track.design.optimalPath.length, track.design.optimalPath[0].points.length);
    if(DEBUG && track.design.optimalPath) {
        for(let j = 0; j < track.design.optimalPath.length; ++j) {
            let p = this.v(this.eax.mov(track.design.optimalPath[j].points[0]));
            ctx.strokeStyle = "#eb0000";
            ctx.globalAlpha = 0.9;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            for (let i = 1; i < track.design.optimalPath[j].points.length; ++i) {
                let p = this.v(this.eax.mov(track.design.optimalPath[j].points[i]));
                ctx.lineTo(p.x, p.y);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
    //ctx.putImageData(this.rasterizedTrack, 0, 0);
};

View.prototype.v = function(p) {
    p.x = this.translation.x + this.scale.x * p.x;
    p.y = this.translation.y + this.scale.y * p.y;
    return p;
};

View.prototype.m = function(p) {
    p.x -= this.translation.x;
    p.x /= this.scale.x;
    p.y -= this.translation.y;
    p.y /= this.scale.y;
    return p;
};

View.prototype.drawArrow = function(a, b, color, filled, cross) {
    let ctx = this.context;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if(filled)
        ctx.lineWidth = 0;
    else
        ctx.lineWidth = 1;
    let scale =  this.arrowScale * model.track.defaultCollisionRadius * 0.75 * Math.sqrt(1.25);
    let u = this.eax.mov(a).sub(b).n().mul(scale);
    let v = this.ebx.mov(u).p().mul(0.5);
    if(cross === true) {
        ctx.beginPath()
        u.mul(0.5);
        this.v(this.ecx.mov(b).sub(u).add(v));
        ctx.moveTo(this.ecx.x, this.ecx.y);
        this.v(this.ecx.mov(b).add(u).sub(v));
        ctx.lineTo(this.ecx.x, this.ecx.y);
        ctx.stroke();
        this.v(this.ecx.mov(b).add(u).add(v));
        ctx.moveTo(this.ecx.x, this.ecx.y);
        this.v(this.ecx.mov(b).sub(u).sub(v));
        ctx.lineTo(this.ecx.x, this.ecx.y);
        ctx.stroke();
    } else {
        ctx.beginPath();
        this.v(this.ecx.mov(b));
        ctx.moveTo(this.ecx.x, this.ecx.y);
        this.v(this.ecx.mov(b).add(u).add(v));
        ctx.lineTo(this.ecx.x, this.ecx.y);
        this.v(this.ecx.mov(b).add(u).sub(v));
        ctx.lineTo(this.ecx.x, this.ecx.y);
        ctx.closePath();
        if(filled ) {
            ctx.fill();
        }
        else {
            ctx.stroke();
        }
    }
};