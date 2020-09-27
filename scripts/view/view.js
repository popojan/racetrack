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
}

View.prototype.getModelCoords = function(e, output) {
    let rect = this.canvas.getBoundingClientRect();
    output.x = e.clientX - rect.left;
    output.y = e.clientY - rect.top;
    return this.m(output);
};

View.prototype.clear = function() {
    this.context.fillStyle = "#808080";
    this.context.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
};

View.prototype.resize = function (width, height, bbox) {
    let scale = Math.min(width / bbox.width, height / bbox.height);
    this.scale = new P(scale, scale);
    this.translation = new P(
        -this.scale.x * bbox.x + (width - this.scale.x * bbox.width)/2,
        -this.scale.y * bbox.y + (height - this.scale.y * bbox.height)/2
    );
    this.canvas.width = width;
    this.canvas.height = height;
    this.trackPath = undefined;
    this.rasterizedTrack = undefined;
};
View.prototype.render = function(model) {
    //if(!model.track || !model.scale) return;
    this.drawTrack(model.track);
    for (let i = 0; i < model.race.players.length; ++i) {
        let player = model.race.players[i];
        let t = player.trajectory;
        let lastMove = t.moves.length;
        if(i <= model.playerToMove && player.adjustedMove && player.trajectory.altmoves.length > player.trajectory.moves.length) {
            lastMove += 1;
            if(i === model.playerToMove) {
                let R = t.steeringRadius(lastMove - 1);
                let S1 = t.t2b(player.trajectory.c(lastMove - 1), lastMove - 1);
                let S2 = t.t2b(t.c());
                this.drawCircle(S1, R, this.colors[i]);
                R = t.steeringRadius();
                this.drawCircle(S2, R, this.colors[i]);
            }
        }
        if(lastMove === 1) {
            let p = model.track.startPositions[i];
            this.drawArrow(new P().mov(p).sub(new P(p.vx, p.vy)), p, this.colors[i], true, false);
        }
        for (let j = 0; j < lastMove; ++j) {
            this.drawMove(t, j, j === lastMove-1, this.colors[i], 1.0)
            if(i === -1 ) { // DEBUG
                let R = t.steeringRadius(j);
                let S1 = t.t2b(player.trajectory.c(j), j);
                this.drawCircle(S1, R, this.colors[i], j / lastMove);
            }
        }
    }


    let ctx = this.context;
    //ctx.strokeStyle = "#eb0000";
    ctx.lineWidth = 1;

    for(let i = 0; i < model.race.players.length; ++i) {
        if (!model.race.ais[i]) continue;

            let tt = undefined;//model.race.ais[i].traj;
            if(!tt) continue;
            let m = tt.moves[0].point;
            ctx.moveTo(this.scale.x * m.x + this.translation.x, this.scale.y * m.y + this.translation.y);
            //console.log(JSON.stringify(model.race.ais[1].traj.moves));
            ctx.beginPath();
            if(!tt) continue;
            for (let j = 1; j < tt.moves.length; ++j) {
                    //this.drawMove(tt, j, true, this.colors[i]);
                    //let S1 = tt.t2b(tt.c(j), j);
                    //this.drawCircle(S1, tt.steeringRadius(j), this.colors[1], j / tt.moves.length);
                    let m0 = tt.moves[j - 1].point;
                    let m = tt.moves[j].point;
                    //this.drawArrow(m0, m, true, false);
                    ctx.lineTo(this.scale.x*m.x+this.translation.x, this.scale.y * m.y + this.translation.y);
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
        ctx.fillRect(5, 5, Math.min(1.0, ai.progress_current / ai.progress_counts[0]) * (this.canvas.clientWidth-10), 15);
    }
    //ctx.stroke();
};

View.prototype.drawCircle = function(c, R, color, op, filled) {
    op = op || 1.0;
    let ctx = this.context;
    ctx.beginPath();
    ctx.globalAlpha = op;
    let cv = this.v(new P().mov(c));
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
};

View.prototype.drawMove = function(trajectory, moveNumber, drawArrow, color) {
    let t0 = trajectory.animationMoveFraction;
    let ctx = this.context;
    let ret = trajectory.bez(moveNumber);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;

    if(drawArrow/* || trajectory.animationMove ===  moveNumber*/) {
        ctx.beginPath();
        this.v(this.eax.mov(ret[0]));
        ctx.moveTo(this.eax.x, this.eax.y);
        this.v(this.eax.mov(ret[1]));
        this.v(this.ebx.mov(ret[2]));
        ctx.quadraticCurveTo(this.eax.x, this.eax.y, this.ebx.x, this.ebx.y);
        ctx.stroke();//}*/
    }

    ctx.globalAlpha = 1.0;
    let legal = trajectory.legal(moveNumber);
    let intersections = trajectory.getMove(moveNumber).result.intersections;
    for(let j = 0; j < intersections.count; ++j) {
        let cp = intersections.points[j];
        getTangentPoint(cp.t,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p0, this.tmp_p1);
        this.tmp_p1.mov(cp);
        this.drawArrow(this.tmp_p0, this.tmp_p1, color, true, true);
    }
    if(trajectory.animationMove ===  moveNumber && moveNumber > 0) {
        getTangentPoint(trajectory.animationMoveFraction,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p0, this.tmp_p1);
        this.drawArrow(this.tmp_p0, this.tmp_p1, color, true, false);
    }
    if(drawArrow && moveNumber > 0) {
        getTangentPoint(1.0,
            this.eax.mov(ret[0]), this.ebx.mov(ret[1]), this.ecx.mov(ret[2]), this.tmp_p0, this.tmp_p1);
        this.drawArrow(this.tmp_p0, this.tmp_p1, color, false, false);
    }
};

View.prototype.drawTrack = function(track) {
    let ctx = this.context;
    this.clear();
    if(this.trackPath === undefined) {
        this.trackPath = new Path2D();
        const p0 = new Path2D(track.renderPath);
        const m = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
        const t = m.translate(this.translation.x, this.translation.y).scale(this.scale.x, this.scale.y);
        this.trackPath.addPath(p0, t);
        //this.rasterizedTrack = ctx.getImageData(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fill(this.trackPath);
    ctx.lineWidth = 1;
    let solid = ctx.getLineDash();
    ctx.setLineDash([3,2]);
    for(let i = 0; i < track.design.checks.length; ++i) {
        let check = track.design.finishLine(i);
        ctx.moveTo(check.x1 * this.scale.x + this.translation.x, check.y1 * this.scale.y + this.translation.y);
        ctx.lineTo(check.x2 * this.scale.x + this.translation.x, check.y2 * this.scale.y + this.translation.y);
        ctx.strokeStyle = "#808080";
        ctx.stroke();
    }
    let _this = this;
    let tx = function(x) { return x* _this.scale.x + _this.translation.x; }
    let ty = function(y) { return y* _this.scale.y + _this.translation.y; }
    ctx.setLineDash([1,2]);
    for(let i = 0; i < track.design.gridcount; ++i) {
        let p = track.design.startpos(i);
        let vx = p.vx*6;
        let vy = p.vy*6;
        let a = new P(tx(p.x - 3*vx/2 + vy), ty(p.y - 3*vy/2 - vx));
        let d = new P(tx(p.x - 3*vx/2 - vy), ty(p.y - 3*vy/2 + vx));
        let b = new P(tx(p.x + vx/2 + vy), ty(p.y + vy/2 - vx));
        let c = new P(tx(p.x + vx/2 - vy), ty(p.y + vy/2 + vx));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
        /*this.drawArrow(
            new P().mov(p).sub(new P(p.vx, p.vy)),
            p,"#808080", false, false);*/
    }
    ctx.setLineDash(solid);
    for(let i = 0; i < false && track.points.length; ++i) {
        this.drawCircle(track.points[i], 0.5, "#eb0000", 0.25, true);
    }
    if(false && track.design.optimalPath) {
        let p = this.v(new P().mov(track.design.optimalPath.points[0]));
        ctx.strokeStyle = "#eb0000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        for (let i = 1; i < track.design.optimalPath.points.length; ++i) {
            let p = this.v(new P().mov(track.design.optimalPath.points[i]));
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
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
    ctx.beginPath();
    let scale =  this.arrowScale * model.track.defaultCollisionRadius * 0.75 * Math.sqrt(1.25);
    let u = this.eax.mov(a).sub(b).n().mul(scale);
    let v = this.ebx.mov(u).p().mul(0.5);
    if(cross === true) {
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