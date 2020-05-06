function View (canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.colors = ["#eb0000", "#800000", "#0000ff", "#eb8000", "#808000", "#FF00FF", "#008080", "#0080FF", "#eb0000", "#800000"];
    this.translation = null;
    this.scale = null;
    this.arrowScale = 2.0;
}

View.prototype.getModelCoords = function(e) {
    let rect = this.canvas.getBoundingClientRect();
    return this.m(new P(e.clientX - rect.left, e.clientY - rect.top));
};

View.prototype.clear = function() {
    this.context.fillStyle = "#808080";
    this.context.fillRect(0, 0, 8000, 6000);
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
};
View.prototype.render = function(model) {
    //if(!model.track || !model.scale) return;
    this.clear();
    this.drawTrack(model.track);

    //let nb0 = new P(body[2*playerToMove],body[2*playerToMove+1]);
    for (let i = 0; i < model.race.players.length; ++i) {
        let player = model.race.players[i];
        for (let j = 0; j < player.trajectory.moves.length; ++j) {
            this.drawMove(player.trajectory, j, false, this.colors[i], 1.0)
        }
    }
    for (let i = 0; i <= model.playerToMove; ++i) {
        //let ob = model.players[i].trajectory.b2t(new P(body[2*i], body[2*i+1]));
        //let ots = ts[i].plan(ob);
        let player = model.race.players[i];
        let adjustedMove = player.trajectory.b2t(player.adjustedMove);
        let newTrajectory = player.trajectory.plan(adjustedMove);

        //if(ob.sub(nb).len() > 0.001)
        //    drawMove(ctx, ots, this.color[i], 0.25, 1.0);
        let alpha = i === model.playerToMove ? 1.0 : 0.99;
        this.drawMove(newTrajectory, newTrajectory.moves.length-1, true, this.colors[i], alpha);

        let S2 = newTrajectory.t2b(newTrajectory.c());
        if (i === model.playerToMove) {
            let prev = newTrajectory.moves.length-2;
            let R = newTrajectory.steeringRadius(prev);
            let S1 = newTrajectory.t2b(newTrajectory.c(0, 0, prev), prev);
            this.drawCircle(S1, R, this.colors[i]);
            R = newTrajectory.steeringRadius();
            this.drawCircle(S2, R, this.colors[i]);
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
    let A = ret[0];
    let b = ret[1];
    let B = ret[2];
    //shorten?, there will be arrow
    //de Casteljau
    t0 = Math.max(0.01, t0);
    //let ba = A.mul(1-t0).add(b.mul(t0));
    //let Ba = b.mul(1-t0).add(B.mul(t0));
    /*A = A.v();
    //A = A.v();
    B = B.v();
    b = b.v();*/
    //if(alpha == 1.0){
    if(moveNumber === trajectory.moves.length-1) {
        ctx.beginPath();
        let vA =  this.v(A);
        let vb = this.v(b);
        let vB = this.v(B);
        ctx.moveTo(vA.x, vA.y);
        ctx.quadraticCurveTo(vb.x, vb.y, vB.x, vB.y);
        ctx.stroke();//}*/
    }
    ctx.globalAlpha = 1.0;
    let legal = trajectory.legal(moveNumber);
    for(let j = 0; j < trajectory.crashp[moveNumber].points.length; ++j) {
        let b1 = A.add((b.sub(A)).mul(2 / 3));
        let b2 = B.add((b.sub(B)).mul(2 / 3));
        let cp = trajectory.crashp[moveNumber].points[j];
        let p0 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, cp.t - 0.01);
        this.drawArrow(new P(p0.x, p0.y), new P(cp.point.x, cp.point.y), color, true, true);
    }
    if(trajectory.animationMove ===  moveNumber) {
        let b1 = A.add((b.sub(A)).mul(2/3));
        let b2 = B.add((b.sub(B)).mul(2/3));
        let p0 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, trajectory.animationMoveFraction-0.01);
        let p1 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, trajectory.animationMoveFraction);
        this.drawArrow(new P(p0.x, p0.y), new P(p1.x, p1.y), color, true, false);
    }
    if(drawArrow) {
        let b1 = A.add((b.sub(A)).mul(2/3));
        let b2 = B.add((b.sub(B)).mul(2/3));
        let p0 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, 1.0-0.01);
        let p1 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, 1.0);
        this.drawArrow(new P(p0.x, p0.y), new P(p1.x, p1.y), color, false, false);
    }
};

View.prototype.drawTrack = function(track) {
    let ctx = this.context;
    let p = new Path2D();
    const p0 = new Path2D(track.renderPath);
    const m = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix();
    const t = m.translate(this.translation.x, this.translation.y).scale(this.scale.x, this.scale.y);
    p.addPath(p0, t);
    ctx.fillStyle = "#ffffff";
    ctx.fill(p);
};

View.prototype.v = function(p) {
    return new P(
        this.translation.x + this.scale.x * p.x,
        this.translation.y + this.scale.y * p.y
    );
};
View.prototype.m = function(p) {
    return new P(
        (p.x - this.translation.x)/this.scale.x,
        (p.y - this.translation.y)/this.scale.y
    );
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
    let u = b.sub(a).n();//.mul(0.75 * track.car);
    let v = u.p();//.mul(0.75 * track.car);;
    //let scale = 0.75;
    let size = 0.75;
    let car = this.arrowScale * model.track.defaultCollisionRadius;
    let uu = u.mul(size * Math.sqrt(1.25)*car);
    if(cross === true) {
        let uup = uu.p();
        let a1 = b.sub(uu).add(uup);
        let a2 = b.add(uu).sub(uup);
        let b1 = b.add(uu).add(uup);
        let b2 = b.sub(uu).sub(uup);
        ctx.beginPath();
        let va1 = this.v(a1);
        let va2 = this.v(a2);
        ctx.moveTo(va1.x, va1.y);
        ctx.lineTo(va2.x, va2.y);
        ctx.stroke();
        ctx.beginPath();
        let vb1 = this.v(b1)
        let vb2 = this.v(b2);
        ctx.moveTo(vb1.x, vb1.y);
        ctx.lineTo(vb2.x, vb2.y);
        ctx.stroke();
    } else {
        //ctx.beginPath();
        //let bv = b.v();
        //ctx.arc(bv.x, bv.y, 0.5*track.car*scale, 0, 2*Math.PI);
        let vvv = v.mul(size*0.5*car);
        let aa = b.sub(uu);
        let a1 = this.v(aa.add(vvv));
        let a2 = this.v(aa.sub(vvv));
        let b0 = this.v(b);
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(b0.x, b0.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.closePath();
        if(filled ) {
            ctx.fill();
        }
        else {
            //ctx.globalAlpha = 0.2;
            //ctx.fill();
            //ctx.globalAlpha = 1.0;
            ctx.stroke();
        }
    }
    /*ctx.arc(tx + scale*b.x, ty + scale*b.y, scale*r, 0, 2*Math.PI);
    ctx.fill();*/
};