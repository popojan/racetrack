function View (canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.colors = ["#eb0000", "#800000", "#0000ff", "#eb8000", "#808000", "#FF00FF", "#008080", "#0080FF", "#eb0000", "#800000"];
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
        for (let j = 0; j < lastMove; ++j) {
            this.drawMove(t, j, j === lastMove-1, this.colors[i], 1.0)
        }
    }
};

View.prototype.drawCircle = function(c, R, color) {
    let ctx = this.context;
    ctx.beginPath();
    ctx.globalAlpha = 0.2;
    let cv = this.v(c);
    ctx.arc(cv.x, cv.y, R*this.scale.x, 0, 2*Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.stroke();
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