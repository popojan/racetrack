
function drawCircle(ctx, c, R, color) {
    ctx.beginPath();
    ctx.globalAlpha = 0.2;
    let cv = c.v();
    ctx.arc(cv.x, cv.y, R*scale, 0, 2*Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
}

function drawTrack(ctx, track) {
    for(let i = 0; i < track.walls.length; ++i) {
        let wall = track.walls[i];
        ctx.fillStyle = "#000000";
        ctx.lineWidth = 0;
        ctx.beginPath();
        let c = wall.c.v();
        ctx.arc(c.x, c.y, scale*wall.r, 0, 2*Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}

function drawMove(ctx, traj, drawarrow, color, alpha, t0, pi, i) {
    if(i === undefined) i = traj.length -1;
    if(t0 === undefined) t0 = 0.5;
    if(alpha === undefined) alpha = 1.0;
    let ret = traj.bez(i);
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
    let ba = A.mul(1-t0).add(b.mul(t0));
    let Ba = b.mul(1-t0).add(B.mul(t0));
    /*A = A.v();
    //A = A.v();
    B = B.v();
    b = b.v();*/
    //if(alpha == 1.0){
    if(i == traj.length-1) {
        ctx.beginPath();
        ctx.moveTo(A.v().x, A.v().y);
        ctx.quadraticCurveTo(b.v().x, b.v().y, B.v().x, B.v().y);
        ctx.stroke();//}*/
    }
    ctx.globalAlpha = 1.0;
    for(let j = 0; j < traj.crashp[i].points.length; ++j) {
        let b1 = A.add((b.sub(A)).mul(2 / 3));
        let b2 = B.add((b.sub(B)).mul(2 / 3));
        let cp = traj.crashp[i].points[j];
        let p0 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, cp.t - 0.01);
        drawArrow(ctx, new P(p0.x, p0.y), new P(cp.point.x, cp.point.y), color, true, true);
    }
    if(animMove[pi] == i-1) {
        let b1 = A.add((b.sub(A)).mul(2/3));
        let b2 = B.add((b.sub(B)).mul(2/3));
        p0 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, t0-0.01);
        let p1 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, t0);
        drawArrow(ctx, new P(p0.x, p0.y), new P(p1.x, p1.y), color, true, false);
    }
    if(drawarrow) {
        let b1 = A.add((b.sub(A)).mul(2/3));
        let b2 = B.add((b.sub(B)).mul(2/3));
        p0 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, 1.0-0.01);
        let p1 = Raphael.findDotsAtSegment(A.x, A.y, b1.x, b1.y, b2.x, b2.y, B.x, B.y, 1.0);
        drawArrow(ctx, new P(p0.x, p0.y), new P(p1.x, p1.y), color, false, false);
    }

}

function getTrack(design) {
    let st = null;
    if(true) {
        st = design.i() + " " + design.o();
    } else {
        st = design.o() + "L" + design.i().substr(1) + "z";
    }
    return st;
}

function drawTrackDesign(ctx, st) {
    let p = new Path2D();
    const p0 = new Path2D(st);
    const m = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix()
    const t = m.translate(tx, ty).scale(scale);
    p.addPath(p0, t)
    ctx.fillStyle = "#ffffff";
    ctx.fill(p);
}

function drawArrow(ctx, a, b, color, filled, cross) {
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
    let uu = u.mul(size * Math.sqrt(1.25)*track.car);
    if(cross == 1) {
        let a1 = b.sub(uu).add(uu.p());
        let a2 = b.add(uu).sub(uu.p());
        let b1 = b.add(uu).add(uu.p());
        let b2 = b.sub(uu).sub(uu.p());
        ctx.beginPath();
        ctx.moveTo(a1.v().x, a1.v().y);
        ctx.lineTo(a2.v().x, a2.v().y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(b1.v().x, b1.v().y);
        ctx.lineTo(b2.v().x, b2.v().y);
        ctx.stroke();
    } else {
        //ctx.beginPath();
        //let bv = b.v();
        //ctx.arc(bv.x, bv.y, 0.5*track.car*scale, 0, 2*Math.PI);
        let a1 = b.sub(uu).add(v.mul(size*0.5*track.car)).v();
        let a2 = b.sub(uu).sub(v.mul(size*0.5*track.car)).v();
        let b0 = b.v();
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
}