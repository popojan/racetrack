Raphael = new (function(){})();

function copy(x) { return JSON.parse(JSON.stringify(x)); }

function copy_moves(x) {
    let moves = [];
    for(let i = 0; i < x.length; ++i) {
        moves.push(new Move());
        moves[i].point = {...x[i].point};
        moves[i].result = {...x[i].result};
    }
    return moves;
}

function bezierDerivative(t, P0, P1, P2, output) {
    return output.mov(P1.sub(P0).mul(2*(1-t))).add(P2.sub(P1).mul(2*t));
}

function bezierPoint(t, P0, P1, P2, output) {
    return output.mov(P1).add(P0.sub(P1).mul((1-t)*(1-t))).add(P2.sub(P1).mul(t*t));
}

function getTangentPoint(t, A, b, B, p0, p1) {
    if(t < 1 && t > 0) {
        bezierPoint(t, A, b, B, p1);
        p0.mov(p1).sub(A.mul(-2 / (1 - t))).sub(B.mul((2 / t)));
    } else if(t >= 1) {
        p1.mov(B);
        p0.mov(p1).sub(B.sub(b).n());
    } else if (t <= 0) {
        p1.mov(A);
        p0.mov(p1).sub(b.sub(A).n());
    }
}

Raphael.findDotsAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
    let t1 = 1 - t,
        t13 = Math.pow(t1, 3),
        t12 = Math.pow(t1, 2),
        t2 = t * t,
        t3 = t2 * t,
        x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
        y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
        mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
        my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
        nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
        ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
        ax = t1 * p1x + t * c1x,
        ay = t1 * p1y + t * c1y,
        cx = t1 * c2x + t * p2x,
        cy = t1 * c2y + t * p2y,
        alpha = (90 - Math.atan2(mx - nx, my - ny) * 180 / Math.PI);
    (mx > nx || my < ny) && (alpha += 180);
    return {
        x: x,
        y: y,
        m: {x: mx, y: my},
        n: {x: nx, y: ny},
        start: {x: ax, y: ay},
        end: {x: cx, y: cy},
        alpha: alpha
    };
};