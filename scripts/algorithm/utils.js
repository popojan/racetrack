Raphael = new (function(){})();
function bezierDerivative(t, P0, P1, P2, output) {
    output.x = 2*(1-t)*(P1.x-P0.x) + 2*t*(P2.x-P1.x);
    output.y = 2*(1-t)*(P1.y-P0.y) + 2*t*(P2.y-P1.y);
    return output;
}

function bezierPoint(t, P0, P1, P2, output) {
    output.x = P1.x + (1-t)*(1-t)*(P0.x-P1.x) + t*t * (P2.x-P1.x);
    output.y = P1.y + (1-t)*(1-t)*(P0.y-P1.y) + t*t * (P2.y-P1.y);
    return output;
}

function getTangentPoint(t, A, b, B, p0, p1) {
    bezierDerivative(t, A, b, B, p0);
    bezierPoint(t, A, b, B, p1);
    p0.x = p1.x - p0.x;
    p0.y = p1.y - p0.y;
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

function intersectionQuadraticCircle(a1x, a1y, bx, by, a2x, a2y, cx, cy, r) {
    let kevinPath = new Circle();
    kevinPath.center.point.x = cx;
    kevinPath.center.point.y = cy;
    kevinPath.radius.point.x = cx + r;
    kevinPath.radius.point.y = cy;
    kevinPath.getIntersectionParams();
    let inter = new Intersection("I");
    inter.t = 2;
    let kevinLine = new Path();
    kevinLine.parseData("M0,0 S1,1,1,1");
    kevinLine.getIntersectionParams();
    kevinLine.segments[0].handles[0].point.x = a1x;
    kevinLine.segments[0].handles[0].point.y = a1y;
    kevinLine.segments[1].handles[0].point.x = bx;
    kevinLine.segments[1].handles[0].point.y = by;
    kevinLine.segments[1].handles[1].point.x = a2x;
    kevinLine.segments[1].handles[1].point.y = a2y;

    intersectShapes(kevinPath, kevinLine, inter);
    if (inter.t < 2) {
        let closest = inter.point;
        let collisionT = inter.t;
        let collision = 1;
        return {t: inter.t, p: closest};
    }
    return false;
}

function intersectionSegmentCircle(ax, ay, bx, by, cx, cy, r) {
    let dx = bx - ax;
    let dy = by - ay;
    let fx = ax - cx;
    let fy = ay - cy;
    let a = dx*dx + dy*dy;
    let b = 2 * (fx*dx + fy*dy);
    let c = fx*fx + fy*fy - r*r;
    let D = b*b-4*a*c;
    if(D < 0)
        return false;
    D = Math.sqrt(D);
    let t1 = (-b - D)/(2*a);
    let t2 = (-b + D)/(2*a);
    t1 = Math.min(t1, t2);
    t2 = Math.max(t1, t2);
    if(t1 >= 0 && t1 <= 1)
        return t1;
    if(t2 >= 0 && t2 <= 1)
        return t2;
    if(t1 < 0 && t2  > 0)
        return true;
    return false;
}