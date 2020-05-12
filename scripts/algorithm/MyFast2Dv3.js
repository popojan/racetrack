/*****
 *
 *   The contents of this file were written by Kevin Lindsey
 *   copyright 2006 Kevin Lindsey
 *
 *   This file was compacted by jscompact
 *   A Perl utility written by Kevin Lindsey (kevin@kevlindev.com)
 *
 *****/
//Array.prototype.foreach=function(func){let length=this.length;for(let i=0;i<length;i++){func(this[i]);}};
//Array.prototype.grep=function(func){let length=this.length;let result=[];for(let i=0;i<length;i++){let elem=this[i];if(func(elem)){result.push(elem);}}return result;};
//Array.prototype.map=function(func){let length=this.length;let result=[];for(let i=0;i<length;i++){result.push(func(this[i]));}return result;};
//Array.prototype.min=function(){let length=this.length;let min=this[0];for(let i=0;i<length;i++){let elem=this[i];if(elem<min)min=elem;}return min;}
//Array.prototype.max=function(){let length=this.length;let max=this[0];for(let i=0;i<length;i++)let elem=this[i];if(elem>max)max=elem;return max;}
"use strict";
let svgns = "http://www.w3.org/2000/svg";
function Intersection(s, capacity) {
    this.status = s;
    this.count = 0;
    this.points = [];
    for(let i = 0; i < capacity; ++i) {
        this.points.push({x:null,y:null,t:2.0});
    }
};
Intersection.prototype.appendPoint = function (point, t) {
    if(t >= 0 && t< 1) {

        this.points[this.count].x = point.x;
        this.points[this.count].y = point.y;
        this.points[this.count].t = t;
        this.count += 1;
    }
};
Intersection.prototype.appendPoints = function (points, ts) {
    for (let i = 0; i < points.length; i++) {
        this.appendPoint(points[i], ts[i]);
    }
};
function intersectShapes (shape1, shape2, result) {
    let ip1 = shape1.ip;//getIntersectionParams();
    let ip2 = shape2.ip;//getIntersectionParams();
    if (ip1 != null && ip2 != null) {
        if (ip1.name == "Path") {
            Intersection.intersectPathShape(shape1, shape2, result);
        } else if (ip2.name == "Path") {
            Intersection.intersectPathShape(shape2, shape1, result);
        } else if(ip1.name == "Circle"){
            
        }
        else {
            let method;
            let params;
            if (ip1.name < ip2.name) {
                method = "intersect" + ip1.name + ip2.name;
                params = ip1.params.concat(ip2.params);
            } else {
                method = "intersect" + ip2.name + ip1.name;
                params = ip2.params.concat(ip1.params);
            }
            params.push(result);
            //Intersection[method].apply(null, params);
        }
    }
    return result;
};

Intersection.intersectPathShape = intersectPathShape; 
function intersectPathShape (path, shape, result) {
    return path.intersectShape(shape, result);
};

Intersection.intersectBezier2Bezier2 = function (a1, a2, a3, b1, b2, b3) {
    let a, b;
    let c12, c11, c10;
    let c22, c21, c20;
    let TOLERANCE = 1e-4;
    let result = new Intersection("No Intersection");
    a = a2.multiply(-2);
    c12 = a1.add(a.add(a3));
    a = a1.multiply(-2);
    b = a2.multiply(2);
    c11 = a.add(b);
    c10 = new Point2D(a1.x, a1.y);
    a = b2.multiply(-2);
    c22 = b1.add(a.add(b3));
    a = b1.multiply(-2);
    b = b2.multiply(2);
    c21 = a.add(b);
    c20 = new Point2D(b1.x, b1.y);
    a = c12.x * c11.y - c11.x * c12.y;
    b = c22.x * c11.y - c11.x * c22.y;
    let c = c21.x * c11.y - c11.x * c21.y;
    let d = c11.x * (c10.y - c20.y) + c11.y * (-c10.x + c20.x);
    let e = c22.x * c12.y - c12.x * c22.y;
    let f = c21.x * c12.y - c12.x * c21.y;
    let g = c12.x * (c10.y - c20.y) + c12.y * (-c10.x + c20.x);
    let poly = new Polynomial(-e * e, -2 * e * f, a * b - f * f - 2 * e * g, a * c - 2 * f * g, a * d - g * g);
    let roots = poly.getRoots();
    for (let i = 0; i < roots.length; i++) {
        let s = roots[i];
        if (0 <= s && s <= 1) {
            let xRoots = new Polynomial(-c12.x, -c11.x, -c10.x + c20.x + s * c21.x + s * s * c22.x).getRoots();
            let yRoots = new Polynomial(-c12.y, -c11.y, -c10.y + c20.y + s * c21.y + s * s * c22.y).getRoots();
            if (xRoots.length > 0 && yRoots.length > 0) {
                checkRoots: for (let j = 0; j < xRoots.length; j++) {
                    let xRoot = xRoots[j];
                    if (0 <= xRoot && xRoot <= 1) {
                        for (let k = 0; k < yRoots.length; k++) {
                            if (Math.abs(xRoot - yRoots[k]) < TOLERANCE) {
                                result.t.push(xRoot);
                                result.points.push(c22.multiply(s * s).add(c21.multiply(s).add(c20)));
                                //break checkRoots;
                            }
                        }
                    }
                }
            }
        }
    }
    return result;
};
Intersection.intersectBezier2Bezier3 = ib2b3;

function ib2b3(a1, a2, a3, b1, b2, b3, b4) {
    let result = null;
    let a, b, c, d;
    let c12, c11, c10;
    let c23, c22, c21, c20;
    a = a2.multiply(-2);
    c12 = a1.add(a.add(a3));
    a = a1.multiply(-2);
    b = a2.multiply(2);
    c11 = a.add(b);
    c10 = new Point2D(a1.x, a1.y);
    a = b1.multiply(-1);
    b = b2.multiply(3);
    c = b3.multiply(-3);
    d = a.add(b.add(c.add(b4)));
    c23 = new Vector2D(d.x, d.y);
    a = b1.multiply(3);
    b = b2.multiply(-6);
    c = b3.multiply(3);
    d = a.add(b.add(c));
    c22 = new Vector2D(d.x, d.y);
    a = b1.multiply(-3);
    b = b2.multiply(3);
    c = a.add(b);
    c21 = new Vector2D(c.x, c.y);
    c20 = new Vector2D(b1.x, b1.y);
    let c10x2 = c10.x * c10.x;
    let c10y2 = c10.y * c10.y;
    let c11x2 = c11.x * c11.x;
    let c11y2 = c11.y * c11.y;
    let c12x2 = c12.x * c12.x;
    let c12y2 = c12.y * c12.y;
    let c20x2 = c20.x * c20.x;
    let c20y2 = c20.y * c20.y;
    let c21x2 = c21.x * c21.x;
    let c21y2 = c21.y * c21.y;
    let c22x2 = c22.x * c22.x;
    let c22y2 = c22.y * c22.y;
    let c23x2 = c23.x * c23.x;
    let c23y2 = c23.y * c23.y;
    let poly = new Polynomial(-2 * c12.x * c12.y * c23.x * c23.y + c12x2 * c23y2 + c12y2 * c23x2, -2 * c12.x * c12.y * c22.x * c23.y - 2 * c12.x * c12.y * c22.y * c23.x + 2 * c12y2 * c22.x * c23.x + 2 * c12x2 * c22.y * c23.y, -2 * c12.x * c21.x * c12.y * c23.y - 2 * c12.x * c12.y * c21.y * c23.x - 2 * c12.x * c12.y * c22.x * c22.y + 2 * c21.x * c12y2 * c23.x + c12y2 * c22x2 + c12x2 * (2 * c21.y * c23.y + c22y2), 2 * c10.x * c12.x * c12.y * c23.y + 2 * c10.y * c12.x * c12.y * c23.x + c11.x * c11.y * c12.x * c23.y + c11.x * c11.y * c12.y * c23.x - 2 * c20.x * c12.x * c12.y * c23.y - 2 * c12.x * c20.y * c12.y * c23.x - 2 * c12.x * c21.x * c12.y * c22.y - 2 * c12.x * c12.y * c21.y * c22.x - 2 * c10.x * c12y2 * c23.x - 2 * c10.y * c12x2 * c23.y + 2 * c20.x * c12y2 * c23.x + 2 * c21.x * c12y2 * c22.x - c11y2 * c12.x * c23.x - c11x2 * c12.y * c23.y + c12x2 * (2 * c20.y * c23.y + 2 * c21.y * c22.y), 2 * c10.x * c12.x * c12.y * c22.y + 2 * c10.y * c12.x * c12.y * c22.x + c11.x * c11.y * c12.x * c22.y + c11.x * c11.y * c12.y * c22.x - 2 * c20.x * c12.x * c12.y * c22.y - 2 * c12.x * c20.y * c12.y * c22.x - 2 * c12.x * c21.x * c12.y * c21.y - 2 * c10.x * c12y2 * c22.x - 2 * c10.y * c12x2 * c22.y + 2 * c20.x * c12y2 * c22.x - c11y2 * c12.x * c22.x - c11x2 * c12.y * c22.y + c21x2 * c12y2 + c12x2 * (2 * c20.y * c22.y + c21y2), 2 * c10.x * c12.x * c12.y * c21.y + 2 * c10.y * c12.x * c21.x * c12.y + c11.x * c11.y * c12.x * c21.y + c11.x * c11.y * c21.x * c12.y - 2 * c20.x * c12.x * c12.y * c21.y - 2 * c12.x * c20.y * c21.x * c12.y - 2 * c10.x * c21.x * c12y2 - 2 * c10.y * c12x2 * c21.y + 2 * c20.x * c21.x * c12y2 - c11y2 * c12.x * c21.x - c11x2 * c12.y * c21.y + 2 * c12x2 * c20.y * c21.y, -2 * c10.x * c10.y * c12.x * c12.y - c10.x * c11.x * c11.y * c12.y - c10.y * c11.x * c11.y * c12.x + 2 * c10.x * c12.x * c20.y * c12.y + 2 * c10.y * c20.x * c12.x * c12.y + c11.x * c20.x * c11.y * c12.y + c11.x * c11.y * c12.x * c20.y - 2 * c20.x * c12.x * c20.y * c12.y - 2 * c10.x * c20.x * c12y2 + c10.x * c11y2 * c12.x + c10.y * c11x2 * c12.y - 2 * c10.y * c12x2 * c20.y - c20.x * c11y2 * c12.x - c11x2 * c20.y * c12.y + c10x2 * c12y2 + c10y2 * c12x2 + c20x2 * c12y2 + c12x2 * c20y2);
    let roots = poly.getRootsInInterval(0, 1);
    for (let i = 0; i < roots.length; i++) {
        let s = roots[i];
        let xRoots = new Polynomial(c12.x, c11.x, c10.x - c20.x - s * c21.x - s * s * c22.x - s * s * s * c23.x).getRoots();
        let yRoots = new Polynomial(c12.y, c11.y, c10.y - c20.y - s * c21.y - s * s * c22.y - s * s * s * c23.y).getRoots();
        if (xRoots.length > 0 && yRoots.length > 0) {
            let TOLERANCE = 1e-4;
            checkRoots: for (let j = 0; j < xRoots.length; j++) {
                let xRoot = xRoots[j];
                if (0 <= xRoot && xRoot <= 1) {
                    for (let k = 0; k < yRoots.length; k++) {
                        if (Math.abs(xRoot - yRoots[k]) < TOLERANCE) {
                            if (result == null) result = new Intersection("Intersection");
                            result.appendPoint(c23.multiply(s * s * s).add(c22.multiply(s * s).add(c21.multiply(s).add(c20))), 1.0 - s);
                            //break checkRoots;
                        }
                    }
                }
            }
        }
    }
    return result;
};
Intersection.intersectBezier2Circle = function (p1, p2, p3, c, r) {
    return Intersection.intersectBezier2Ellipse(p1, p2, p3, c, r, r);
};
Intersection.intersectBezier2Ellipse = function (p1, p2, p3, ec, rx, ry) {
    let a, b;
    let c2, c1, c0;
    let result = new Intersection("No Intersection");
    a = p2.multiply(-2);
    c2 = p1.add(a.add(p3));
    a = p1.multiply(-2);
    b = p2.multiply(2);
    c1 = a.add(b);
    c0 = new Point2D(p1.x, p1.y);
    let rxrx = rx * rx;
    let ryry = ry * ry;
    let roots = new Polynomial(ryry * c2.x * c2.x + rxrx * c2.y * c2.y, 2 * (ryry * c2.x * c1.x + rxrx * c2.y * c1.y), ryry * (2 * c2.x * c0.x + c1.x * c1.x) + rxrx * (2 * c2.y * c0.y + c1.y * c1.y) - 2 * (ryry * ec.x * c2.x + rxrx * ec.y * c2.y), 2 * (ryry * c1.x * (c0.x - ec.x) + rxrx * c1.y * (c0.y - ec.y)), ryry * (c0.x * c0.x + ec.x * ec.x) + rxrx * (c0.y * c0.y + ec.y * ec.y) - 2 * (ryry * ec.x * c0.x + rxrx * ec.y * c0.y) - rxrx * ryry).getRoots();
    for (let i = 0; i < roots.length; i++) {
        let t = roots[i];
        if (0 <= t && t <= 1) {
            result.points.push(c2.multiply(t * t).add(c1.multiply(t).add(c0)));
        }
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectBezier2Line = function (p1, p2, p3, a1, a2) {
    let a, b;
    let c2, c1, c0;
    let cl;
    let n;
    let min = a1.min(a2);
    let max = a1.max(a2);
    let result = new Intersection("No Intersection");
    a = p2.multiply(-2);
    c2 = p1.add(a.add(p3));
    a = p1.multiply(-2);
    b = p2.multiply(2);
    c1 = a.add(b);
    c0 = new Point2D(p1.x, p1.y);
    n = new Vector2D(a1.y - a2.y, a2.x - a1.x);
    cl = a1.x * a2.y - a2.x * a1.y;
    let roots = new Polynomial(n.dot(c2), n.dot(c1), n.dot(c0) + cl).getRoots();
    for (let i = 0; i < roots.length; i++) {
        let t = roots[i];
        if (0 <= t && t <= 1) {
            let p4 = p1.lerp(p2, t);
            let p5 = p2.lerp(p3, t);
            let p6 = p4.lerp(p5, t);
            if (a1.x == a2.x) {
                if (min.y <= p6.y && p6.y <= max.y) {
                    result.status = "Intersection";
                    result.appendPoint(p6, t);
                }
            } else if (a1.y == a2.y) {
                if (min.x <= p6.x && p6.x <= max.x) {
                    result.status = "Intersection";
                    result.appendPoint(p6, t);
                }
            } else if (p6.gte(min) && p6.lte(max)) {
                result.status = "Intersection";
                result.appendPoint(p6, t);
            }
        }
    }
    return result;
};
Intersection.intersectBezier2Polygon = function (p1, p2, p3, points) {
    let result = new Intersection("No Intersection");
    let length = points.length;
    for (let i = 0; i < length; i++) {
        let a1 = points[i];
        let a2 = points[(i + 1) % length];
        let inter = Intersection.intersectBezier2Line(p1, p2, p3, a1, a2);
        result.appendPoints(inter.points, inter.t);
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectBezier2Rectangle = function (p1, p2, p3, r1, r2) {
    let min = r1.min(r2);
    let max = r1.max(r2);
    let topRight = new Point2D(max.x, min.y);
    let bottomLeft = new Point2D(min.x, max.y);
    let inter1 = Intersection.intersectBezier2Line(p1, p2, p3, min, topRight);
    let inter2 = Intersection.intersectBezier2Line(p1, p2, p3, topRight, max);
    let inter3 = Intersection.intersectBezier2Line(p1, p2, p3, max, bottomLeft);
    let inter4 = Intersection.intersectBezier2Line(p1, p2, p3, bottomLeft, min);
    let result = new Intersection("No Intersection");
    result.appendPoints(inter1.points, inter.t);
    result.appendPoints(inter2.points, inter2.t);
    result.appendPoints(inter3.points, inter3.t);
    result.appendPoints(inter4.points, inter4.t);
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectBezier3Bezier3 = ib3b3;

function ib3b3(pa1, pa2, pa3, pa4, pb1, pb2, pb3, pb4, result) {
    let minax = Math.min(pa1.x, pa2.x, pa3.x, pa4.x);
    let minay = Math.min(pa1.y, pa2.y, pa3.y, pa4.y);
    let minbx = Math.min(pb1.x, pb2.x, pb3.x, pb4.x);
    let minby = Math.min(pb1.y, pb2.y, pb3.y, pb4.y);
    let maxax = Math.max(pa1.x, pa2.x, pa3.x, pa4.x);
    let maxay = Math.max(pa1.y, pa2.y, pa3.y, pa4.y);
    let maxbx = Math.max(pb1.x, pb2.x, pb3.x, pb4.x);
    let maxby = Math.max(pb1.y, pb2.y, pb3.y, pb4.y);
    let possiblex = false;
    if((minax >= minbx && minax <= maxbx) ||(minbx >= minax && minbx <= maxax))
        possiblex = true;
    let possibley = false;
    if((minay >= minby && minay <= maxby) ||(minby >= minay && minby <= maxay))       possibley = true;
    if(possiblex == false || possibley == false) return result;
    //m("before ib3b3");
    let ax, ay, bx, by, cx, cy, dx, dy;
    let c13x, c13y, c12x, c12y, c11x, c11y, c10x, c10y;
    let c23x, c23y, c22x, c22y, c21x, c21y, c20x, c20y;
    ax = pa1.x * -1;
    ay = pa1.y * -1;
    bx = pa2.x * 3;
    by = pa2.y * 3;
    cx = pa3.x * -3;
    cy = pa3.y * -3;
    dx = ax + bx + cx + pa4.x;
    dy = ay + by + cy + pa4.y;
    c13x = dx;
    c13y = dy;
    ax = pa1.x * 3;
    ay = pa1.y * 3;
    bx = pa2.x * -6;
    by = pa2.y * -6;
    cx = pa3.x * 3;
    cy = pa3.y * 3;
    dx = ax + bx + cx;
    dy = ay + by + cy;
    c12x = dx;
    c12y = dy;
    ax = pa1.x * -3;
    ay = pa1.y * -3;
    bx = pa2.x * 3;
    by = pa2.y * 3;
    cx = ax + bx;
    cy = ay + by;
    c11x = cx;
    c11y = cy;
    c10x = pa1.x;
    c10y = pa1.y;
    ax = pb1.x * -1;
    ay = pb1.y * -1;
    bx = pb2.x * 3;
    by = pb2.y * 3;
    cx = pb3.x * -3;
    cy = pb3.y * -3;
    dx = ax + bx + cx + pb4.x;
    dy = ay + by + cy + pb4.y;
    c23x = dx;
    c23y = dy;
    ax = pb1.x * 3;
    ay = pb1.y * 3;
    bx = pb2.x * -6;
    by = pb2.y * -6;
    cx = pb3.x * 3;
    cy = pb3.y * 3;
    dx = ax + bx + cx;
    dy = ay + by + cy;
    c22x = dx;
    c22y = dy;
    ax = pb1.x * -3;
    ay = pb1.y * -3;
    bx = pb2.x * 3;
    by = pb2.y * 3;
    cx = ax + bx;
    cy = ay + by;
    c21x = cx;
    c21y = cy;
    c20x = pb1.x;
    c20y = pb1.y;
    let c10x2 = c10x * c10x;
    let c10x3 = c10x * c10x * c10x;
    let c10y2 = c10y * c10y;
    let c10y3 = c10y * c10y * c10y;
    let c11x2 = c11x * c11x;
    let c11x3 = c11x * c11x * c11x;
    let c11y2 = c11y * c11y;
    let c11y3 = c11y * c11y * c11y;
    let c12x2 = c12x * c12x;
    let c12x3 = c12x * c12x * c12x;
    let c12y2 = c12y * c12y;
    let c12y3 = c12y * c12y * c12y;
    let c13x2 = c13x * c13x;
    let c13x3 = c13x * c13x * c13x;
    let c13y2 = c13y * c13y;
    let c13y3 = c13y * c13y * c13y;
    let c20x2 = c20x * c20x;
    let c20x3 = c20x * c20x * c20x;
    let c20y2 = c20y * c20y;
    let c20y3 = c20y * c20y * c20y;
    let c21x2 = c21x * c21x;
    let c21x3 = c21x * c21x * c21x;
    let c21y2 = c21y * c21y;
    let c22x2 = c22x * c22x;
    let c22x3 = c22x * c22x * c22x;
    let c22y2 = c22y * c22y;
    let c23x2 = c23x * c23x;
    let c23x3 = c23x * c23x * c23x;
    let c23y2 = c23y * c23y;
    let c23y3 = c23y * c23y * c23y;

let a9 = -c13x3 * c23y3; 
a9 += c13y3 * c23x3;
a9 -= 3 * c13x * c13y2 * c23x2 * c23y;
a9 += 3 * c13x2 * c13y * c23x * c23y2;
pol33.coefs[9] = a9;

let a8 = -6 * c13x * c22x * c13y2 * c23x * c23y; 
a8 += 6 * c13x2 * c13y * c22y * c23x * c23y;
a8 += 3 * c22x * c13y3 * c23x2;
a8 -= 3 * c13x3 * c22y * c23y2;
a8 -= 3 * c13x * c13y2 * c22y * c23x2;
a8 += 3 * c13x2 * c22x * c13y * c23y2;
pol33.coefs[8] = a8;

let a7 = -6 * c21x * c13x * c13y2 * c23x * c23y;
a7 -= 6 * c13x * c22x * c13y2 * c22y * c23x; 
a7 += 6 * c13x2 * c22x * c13y * c22y * c23y;
a7 += 3 * c21x * c13y3 * c23x2; 
a7 += 3 * c22x2 * c13y3 * c23x;
a7 += 3 * c21x * c13x2 * c13y * c23y2; 
a7 -= 3 * c13x * c21y * c13y2 * c23x2;
a7 -= 3 * c13x * c22x2 * c13y2 * c23y;
a7 += c13x2 * c13y * c23x * (6 * c21y * c23y + 3 * c22y2);
a7 += c13x3 * (-c21y * c23y2 - 2 * c22y2 * c23y - c23y * (2 * c21y * c23y + c22y2));
pol33.coefs[7] = a7;

let a6 = c11x * c12y * c13x * c13y * c23x * c23y;
a6 -= c11y * c12x * c13x * c13y * c23x * c23y; 
a6 += 6 * c21x * c22x * c13y3 * c23x; 
a6 += 3 * c11x * c12x * c13x * c13y * c23y2; 
a6 += 6 * c10x * c13x * c13y2 * c23x * c23y; 
a6 -= 3 * c11x * c12x * c13y2 * c23x * c23y; 
a6 -= 3 * c11y * c12y * c13x * c13y * c23x2; 
a6 -= 6 * c10y * c13x2 * c13y * c23x * c23y; 
a6 -= 6 * c20x * c13x * c13y2 * c23x * c23y; 
a6 += 3 * c11y * c12y * c13x2 * c23x * c23y; 
a6 -= 2 * c12x * c12y2 * c13x * c23x * c23y; 
a6 -= 6 * c21x * c13x * c22x * c13y2 * c23y; 
a6 -= 6 * c21x * c13x * c13y2 * c22y * c23x; 
a6 -= 6 * c13x * c21y * c22x * c13y2 * c23x; 
a6 += 6 * c21x * c13x2 * c13y * c22y * c23y; 
a6 += 2 * c12x2 * c12y * c13y * c23x * c23y; 
a6 += c22x3 * c13y3; 
a6 -= 3 * c10x * c13y3 * c23x2; 
a6 += 3 * c10y * c13x3 * c23y2; 
a6 += 3 * c20x * c13y3 * c23x2; 
a6 += c12y3 * c13x * c23x2; 
a6 -= c12x3 * c13y * c23y2; 
a6 -= 3 * c10x * c13x2 * c13y * c23y2; 
a6 += 3 * c10y * c13x * c13y2 * c23x2; 
a6 -= 2 * c11x * c12y * c13x2 * c23y2; 
a6 += c11x * c12y * c13y2 * c23x2; 
a6 -= c11y * c12x * c13x2 * c23y2; 
a6 += 2 * c11y * c12x * c13y2 * c23x2; 
a6 += 3 * c20x * c13x2 * c13y * c23y2; 
a6 -= c12x * c12y2 * c13y * c23x2; 
a6 -= 3 * c20y * c13x * c13y2 * c23x2; 
a6 += c12x2 * c12y * c13x * c23y2; 
a6 -= 3 * c13x * c22x2 * c13y2 * c22y; 
a6 += c13x2 * c13y * c23x * (6 * c20y * c23y + 6 * c21y * c22y); 
a6 += c13x2 * c22x * c13y * (6 * c21y * c23y + 3 * c22y2); 
a6 += c13x3 * (-2 * c21y * c22y * c23y - c20y * c23y2 - c22y * (2 * c21y * c23y + c22y2) - c23y * (2 * c20y * c23y + 2 * c21y * c22y));
pol33.coefs[6] =  a6;

let a5 = 6 * c11x * c12x * c13x * c13y * c22y * c23y;
a5 += c11x * c12y * c13x * c22x * c13y * c23y; 
a5 += c11x * c12y * c13x * c13y * c22y * c23x; 
a5 -= c11y * c12x * c13x * c22x * c13y * c23y; 
a5 -= c11y * c12x * c13x * c13y * c22y * c23x; 
a5 -= 6 * c11y * c12y * c13x * c22x * c13y * c23x; 
a5 -= 6 * c10x * c22x * c13y3 * c23x; 
a5 += 6 * c20x * c22x * c13y3 * c23x; 
a5 += 6 * c10y * c13x3 * c22y * c23y; 
a5 += 2 * c12y3 * c13x * c22x * c23x; 
a5 -= 2 * c12x3 * c13y * c22y * c23y; 
a5 += 6 * c10x * c13x * c22x * c13y2 * c23y; 
a5 += 6 * c10x * c13x * c13y2 * c22y * c23x; 
a5 += 6 * c10y * c13x * c22x * c13y2 * c23x; 
a5 -= 3 * c11x * c12x * c22x * c13y2 * c23y; 
a5 -= 3 * c11x * c12x * c13y2 * c22y * c23x; 
a5 += 2 * c11x * c12y * c22x * c13y2 * c23x; 
a5 += 4 * c11y * c12x * c22x * c13y2 * c23x; 
a5 -= 6 * c10x * c13x2 * c13y * c22y * c23y; 
a5 -= 6 * c10y * c13x2 * c22x * c13y * c23y; 
a5 -= 6 * c10y * c13x2 * c13y * c22y * c23x; 
a5 -= 4 * c11x * c12y * c13x2 * c22y * c23y; 
a5 -= 6 * c20x * c13x * c22x * c13y2 * c23y; 
a5 -= 6 * c20x * c13x * c13y2 * c22y * c23x; 
a5 -= 2 * c11y * c12x * c13x2 * c22y * c23y; 
a5 += 3 * c11y * c12y * c13x2 * c22x * c23y; 
a5 += 3 * c11y * c12y * c13x2 * c22y * c23x; 
a5 -= 2 * c12x * c12y2 * c13x * c22x * c23y; 
a5 -= 2 * c12x * c12y2 * c13x * c22y * c23x; 
a5 -= 2 * c12x * c12y2 * c22x * c13y * c23x; 
a5 -= 6 * c20y * c13x * c22x * c13y2 * c23x; 
a5 -= 6 * c21x * c13x * c21y * c13y2 * c23x; 
a5 -= 6 * c21x * c13x * c22x * c13y2 * c22y; 
a5 += 6 * c20x * c13x2 * c13y * c22y * c23y; 
a5 += 2 * c12x2 * c12y * c13x * c22y * c23y; 
a5 += 2 * c12x2 * c12y * c22x * c13y * c23y; 
a5 += 2 * c12x2 * c12y * c13y * c22y * c23x; 
a5 += 3 * c21x * c22x2 * c13y3; 
a5 += 3 * c21x2 * c13y3 * c23x; 
a5 -= 3 * c13x * c21y * c22x2 * c13y2; 
a5 -= 3 * c21x2 * c13x * c13y2 * c23y; 
a5 += c13x2 * c22x * c13y * (6 * c20y * c23y + 6 * c21y * c22y); 
a5 += c13x2 * c13y * c23x * (6 * c20y * c22y + 3 * c21y2); 
a5 += c21x * c13x2 * c13y * (6 * c21y * c23y + 3 * c22y2); 
a5 += c13x3 * (-2 * c20y * c22y * c23y - c23y * (2 * c20y * c22y + c21y2) - c21y * (2 * c21y * c23y + c22y2) - c22y * (2 * c20y * c23y + 2 * c21y * c22y));
pol33.coefs[5] = a5;


let a4 = c11x * c21x * c12y * c13x * c13y * c23y;
a4 += c11x * c12y * c13x * c21y * c13y * c23x; 
a4 += c11x * c12y * c13x * c22x * c13y * c22y; 
a4 -= c11y * c12x * c21x * c13x * c13y * c23y; 
a4 -= c11y * c12x * c13x * c21y * c13y * c23x; 
a4 -= c11y * c12x * c13x * c22x * c13y * c22y; 
a4 -= 6 * c11y * c21x * c12y * c13x * c13y * c23x; 
a4 -= 6 * c10x * c21x * c13y3 * c23x; 
a4 += 6 * c20x * c21x * c13y3 * c23x; 
a4 += 2 * c21x * c12y3 * c13x * c23x; 
a4 += 6 * c10x * c21x * c13x * c13y2 * c23y; 
a4 += 6 * c10x * c13x * c21y * c13y2 * c23x; 
a4 += 6 * c10x * c13x * c22x * c13y2 * c22y; 
a4 += 6 * c10y * c21x * c13x * c13y2 * c23x; 
a4 -= 3 * c11x * c12x * c21x * c13y2 * c23y; 
a4 -= 3 * c11x * c12x * c21y * c13y2 * c23x; 
a4 -= 3 * c11x * c12x * c22x * c13y2 * c22y; 
a4 += 2 * c11x * c21x * c12y * c13y2 * c23x; 
a4 += 4 * c11y * c12x * c21x * c13y2 * c23x; 
a4 -= 6 * c10y * c21x * c13x2 * c13y * c23y; 
a4 -= 6 * c10y * c13x2 * c21y * c13y * c23x; 
a4 -= 6 * c10y * c13x2 * c22x * c13y * c22y; 
a4 -= 6 * c20x * c21x * c13x * c13y2 * c23y; 
a4 -= 6 * c20x * c13x * c21y * c13y2 * c23x; 
a4 -= 6 * c20x * c13x * c22x * c13y2 * c22y; 
a4 += 3 * c11y * c21x * c12y * c13x2 * c23y; 
a4 -= 3 * c11y * c12y * c13x * c22x2 * c13y; 
a4 += 3 * c11y * c12y * c13x2 * c21y * c23x; 
a4 += 3 * c11y * c12y * c13x2 * c22x * c22y; 
a4 -= 2 * c12x * c21x * c12y2 * c13x * c23y; 
a4 -= 2 * c12x * c21x * c12y2 * c13y * c23x; 
a4 -= 2 * c12x * c12y2 * c13x * c21y * c23x; 
a4 -= 2 * c12x * c12y2 * c13x * c22x * c22y; 
a4 -= 6 * c20y * c21x * c13x * c13y2 * c23x; 
a4 -= 6 * c21x * c13x * c21y * c22x * c13y2; 
a4 += 6 * c20y * c13x2 * c21y * c13y * c23x; 
a4 += 2 * c12x2 * c21x * c12y * c13y * c23y; 
a4 += 2 * c12x2 * c12y * c21y * c13y * c23x; 
a4 += 2 * c12x2 * c12y * c22x * c13y * c22y; 
a4 -= 3 * c10x * c22x2 * c13y3; 
a4 += 3 * c20x * c22x2 * c13y3; 
a4 += 3 * c21x2 * c22x * c13y3; 
a4 += c12y3 * c13x * c22x2; 
a4 += 3 * c10y * c13x * c22x2 * c13y2; 
a4 += c11x * c12y * c22x2 * c13y2; 
a4 += 2 * c11y * c12x * c22x2 * c13y2; 
a4 -= c12x * c12y2 * c22x2 * c13y; 
a4 -= 3 * c20y * c13x * c22x2 * c13y2; 
a4 -= 3 * c21x2 * c13x * c13y2 * c22y;
a4 += c12x2 * c12y * c13x * (2 * c21y * c23y + c22y2); 
a4 += c11x * c12x * c13x * c13y * (6 * c21y * c23y + 3 * c22y2); 
a4 += c21x * c13x2 * c13y * (6 * c20y * c23y + 6 * c21y * c22y); 
a4 += c12x3 * c13y * (-2 * c21y * c23y - c22y2); 
a4 += c10y * c13x3 * (6 * c21y * c23y + 3 * c22y2); 
a4 += c11y * c12x * c13x2 * (-2 * c21y * c23y - c22y2); 
a4 += c11x * c12y * c13x2 * (-4 * c21y * c23y - 2 * c22y2); 
a4 += c10x * c13x2 * c13y * (-6 * c21y * c23y - 3 * c22y2); 
a4 += c13x2 * c22x * c13y * (6 * c20y * c22y + 3 * c21y2); 
a4 += c20x * c13x2 * c13y * (6 * c21y * c23y + 3 * c22y2); 
a4 += c13x3 * (-2 * c20y * c21y * c23y - c22y * (2 * c20y * c22y + c21y2) - c20y * (2 * c21y * c23y + c22y2) - c21y * (2 * c20y * c23y + 2 * c21y * c22y));
pol33.coefs[4] = a4;

let a3 = -c10x * c11x * c12y * c13x * c13y * c23y; 
a3 += c10x * c11y * c12x * c13x * c13y * c23y; 
a3 += 6 * c10x * c11y * c12y * c13x * c13y * c23x; 
a3 -= 6 * c10y * c11x * c12x * c13x * c13y * c23y; 
a3 -= c10y * c11x * c12y * c13x * c13y * c23x; 
a3 += c10y * c11y * c12x * c13x * c13y * c23x; 
a3 += c11x * c11y * c12x * c12y * c13x * c23y; 
a3 -= c11x * c11y * c12x * c12y * c13y * c23x; 
a3 += c11x * c20x * c12y * c13x * c13y * c23y; 
a3 += c11x * c20y * c12y * c13x * c13y * c23x; 
a3 += c11x * c21x * c12y * c13x * c13y * c22y; 
a3 += c11x * c12y * c13x * c21y * c22x * c13y; 
a3 -= c20x * c11y * c12x * c13x * c13y * c23y; 
a3 -= 6 * c20x * c11y * c12y * c13x * c13y * c23x; 
a3 -= c11y * c12x * c20y * c13x * c13y * c23x; 
a3 -= c11y * c12x * c21x * c13x * c13y * c22y; 
a3 -= c11y * c12x * c13x * c21y * c22x * c13y; 
a3 -= 6 * c11y * c21x * c12y * c13x * c22x * c13y; 
a3 -= 6 * c10x * c20x * c13y3 * c23x; 
a3 -= 6 * c10x * c21x * c22x * c13y3; 
a3 -= 2 * c10x * c12y3 * c13x * c23x; 
a3 += 6 * c20x * c21x * c22x * c13y3; 
a3 += 2 * c20x * c12y3 * c13x * c23x; 
a3 += 2 * c21x * c12y3 * c13x * c22x; 
a3 += 2 * c10y * c12x3 * c13y * c23y; 
a3 -= 6 * c10x * c10y * c13x * c13y2 * c23x; 
a3 += 3 * c10x * c11x * c12x * c13y2 * c23y; 
a3 -= 2 * c10x * c11x * c12y * c13y2 * c23x; 
a3 -= 4 * c10x * c11y * c12x * c13y2 * c23x; 
a3 += 3 * c10y * c11x * c12x * c13y2 * c23x; 
a3 += 6 * c10x * c10y * c13x2 * c13y * c23y; 
a3 += 6 * c10x * c20x * c13x * c13y2 * c23y; 
a3 -= 3 * c10x * c11y * c12y * c13x2 * c23y; 
a3 += 2 * c10x * c12x * c12y2 * c13x * c23y; 
a3 += 2 * c10x * c12x * c12y2 * c13y * c23x; 
a3 += 6 * c10x * c20y * c13x * c13y2 * c23x; 
a3 += 6 * c10x * c21x * c13x * c13y2 * c22y; 
a3 += 6 * c10x * c13x * c21y * c22x * c13y2; 
a3 += 4 * c10y * c11x * c12y * c13x2 * c23y; 
a3 += 6 * c10y * c20x * c13x * c13y2 * c23x; 
a3 += 2 * c10y * c11y * c12x * c13x2 * c23y; 
a3 -= 3 * c10y * c11y * c12y * c13x2 * c23x; 
a3 += 2 * c10y * c12x * c12y2 * c13x * c23x; 
a3 += 6 * c10y * c21x * c13x * c22x * c13y2; 
a3 -= 3 * c11x * c20x * c12x * c13y2 * c23y; 
a3 += 2 * c11x * c20x * c12y * c13y2 * c23x; 
a3 += c11x * c11y * c12y2 * c13x * c23x; 
a3 -= 3 * c11x * c12x * c20y * c13y2 * c23x; 
a3 -= 3 * c11x * c12x * c21x * c13y2 * c22y; 
a3 -= 3 * c11x * c12x * c21y * c22x * c13y2; 
a3 += 2 * c11x * c21x * c12y * c22x * c13y2; 
a3 += 4 * c20x * c11y * c12x * c13y2 * c23x; 
a3 += 4 * c11y * c12x * c21x * c22x * c13y2; 
a3 -= 2 * c10x * c12x2 * c12y * c13y * c23y; 
a3 -= 6 * c10y * c20x * c13x2 * c13y * c23y; 
a3 -= 6 * c10y * c20y * c13x2 * c13y * c23x; 
a3 -= 6 * c10y * c21x * c13x2 * c13y * c22y; 
a3 -= 2 * c10y * c12x2 * c12y * c13x * c23y; 
a3 -= 2 * c10y * c12x2 * c12y * c13y * c23x; 
a3 -= 6 * c10y * c13x2 * c21y * c22x * c13y; 
a3 -= c11x * c11y * c12x2 * c13y * c23y; 
a3 -= 2 * c11x * c11y2 * c13x * c13y * c23x; 
a3 += 3 * c20x * c11y * c12y * c13x2 * c23y; 
a3 -= 2 * c20x * c12x * c12y2 * c13x * c23y; 
a3 -= 2 * c20x * c12x * c12y2 * c13y * c23x; 
a3 -= 6 * c20x * c20y * c13x * c13y2 * c23x; 
a3 -= 6 * c20x * c21x * c13x * c13y2 * c22y; 
a3 -= 6 * c20x * c13x * c21y * c22x * c13y2; 
a3 += 3 * c11y * c20y * c12y * c13x2 * c23x; 
a3 += 3 * c11y * c21x * c12y * c13x2 * c22y; 
a3 += 3 * c11y * c12y * c13x2 * c21y * c22x; 
a3 -= 2 * c12x * c20y * c12y2 * c13x * c23x; 
a3 -= 2 * c12x * c21x * c12y2 * c13x * c22y; 
a3 -= 2 * c12x * c21x * c12y2 * c22x * c13y; 
a3 -= 2 * c12x * c12y2 * c13x * c21y * c22x; 
a3 -= 6 * c20y * c21x * c13x * c22x * c13y2; 
a3 -= c11y2 * c12x * c12y * c13x * c23x; 
a3 += 2 * c20x * c12x2 * c12y * c13y * c23y; 
a3 += 6 * c20y * c13x2 * c21y * c22x * c13y; 
a3 += 2 * c11x2 * c11y * c13x * c13y * c23y; 
a3 += c11x2 * c12x * c12y * c13y * c23y; 
a3 += 2 * c12x2 * c20y * c12y * c13y * c23x; 
a3 += 2 * c12x2 * c21x * c12y * c13y * c22y; 
a3 += 2 * c12x2 * c12y * c21y * c22x * c13y; 
a3 += c21x3 * c13y3; 
a3 += 3 * c10x2 * c13y3 * c23x; 
a3 -= 3 * c10y2 * c13x3 * c23y; 
a3 += 3 * c20x2 * c13y3 * c23x ;
a3 += c11y3 * c13x2 * c23x; 
a3 -= c11x3 * c13y2 * c23y; 
a3 -= c11x * c11y2 * c13x2 * c23y; 
a3 += c11x2 * c11y * c13y2 * c23x; 
a3 -= 3 * c10x2 * c13x * c13y2 * c23y; 
a3 += 3 * c10y2 * c13x2 * c13y * c23x; 
a3 -= c11x2 * c12y2 * c13x * c23y; 
a3 += c11y2 * c12x2 * c13y * c23x; 
a3 -= 3 * c21x2 * c13x * c21y * c13y2; 
a3 -= 3 * c20x2 * c13x * c13y2 * c23y; 
a3 += 3 * c20y2 * c13x2 * c13y * c23x; 
a3 += c11x * c12x * c13x * c13y * (6 * c20y * c23y + 6 * c21y * c22y); 
a3 += c12x3 * c13y * (-2 * c20y * c23y - 2 * c21y * c22y); 
a3 += c10y * c13x3 * (6 * c20y * c23y + 6 * c21y * c22y); 
a3 += c11y * c12x * c13x2 * (-2 * c20y * c23y - 2 * c21y * c22y); 
a3 += c12x2 * c12y * c13x * (2 * c20y * c23y + 2 * c21y * c22y); 
a3 += c11x * c12y * c13x2 * (-4 * c20y * c23y - 4 * c21y * c22y); 
a3 += c10x * c13x2 * c13y * (-6 * c20y * c23y - 6 * c21y * c22y); 
a3 += c20x * c13x2 * c13y * (6 * c20y * c23y + 6 * c21y * c22y); 
a3 += c21x * c13x2 * c13y * (6 * c20y * c22y + 3 * c21y2); 
a3 += c13x3 * (-2 * c20y * c21y * c22y - c20y2 * c23y - c21y * (2 * c20y * c22y + c21y2) - c20y * (2 * c20y * c23y + 2 * c21y * c22y));
pol33.coefs[3] = a3;

let a2 =-c10x * c11x * c12y * c13x * c13y * c22y;
a2 += c10x * c11y * c12x * c13x * c13y * c22y; 
a2 += 6 * c10x * c11y * c12y * c13x * c22x * c13y; 
a2 -= 6 * c10y * c11x * c12x * c13x * c13y * c22y;
a2 -= c10y * c11x * c12y * c13x * c22x * c13y; 
a2 += c10y * c11y * c12x * c13x * c22x * c13y; 
a2 += c11x * c11y * c12x * c12y * c13x * c22y; 
a2 -= c11x * c11y * c12x * c12y * c22x * c13y; 
a2 += c11x * c20x * c12y * c13x * c13y * c22y; 
a2 += c11x * c20y * c12y * c13x * c22x * c13y; 
a2 += c11x * c21x * c12y * c13x * c21y * c13y; 
a2 -= c20x * c11y * c12x * c13x * c13y * c22y; 
a2 -= 6 * c20x * c11y * c12y * c13x * c22x * c13y; 
a2 -= c11y * c12x * c20y * c13x * c22x * c13y; 
a2 -= c11y * c12x * c21x * c13x * c21y * c13y; 
a2 -= 6 * c10x * c20x * c22x * c13y3; 
a2 -= 2 * c10x * c12y3 * c13x * c22x; 
a2 += 2 * c20x * c12y3 * c13x * c22x; 
a2 += 2 * c10y * c12x3 * c13y * c22y; 
a2 -= 6 * c10x * c10y * c13x * c22x * c13y2; 
a2 += 3 * c10x * c11x * c12x * c13y2 * c22y; 
a2 -= 2 * c10x * c11x * c12y * c22x * c13y2; 
a2 -= 4 * c10x * c11y * c12x * c22x * c13y2; 
a2 += 3 * c10y * c11x * c12x * c22x * c13y2; 
a2 += 6 * c10x * c10y * c13x2 * c13y * c22y; 
a2 += 6 * c10x * c20x * c13x * c13y2 * c22y; 
a2 -= 3 * c10x * c11y * c12y * c13x2 * c22y; 
a2 += 2 * c10x * c12x * c12y2 * c13x * c22y; 
a2 += 2 * c10x * c12x * c12y2 * c22x * c13y; 
a2 += 6 * c10x * c20y * c13x * c22x * c13y2; 
a2 += 6 * c10x * c21x * c13x * c21y * c13y2; 
a2 += 4 * c10y * c11x * c12y * c13x2 * c22y; 
a2 += 6 * c10y * c20x * c13x * c22x * c13y2; 
a2 += 2 * c10y * c11y * c12x * c13x2 * c22y; 
a2 -= 3 * c10y * c11y * c12y * c13x2 * c22x; 
a2 += 2 * c10y * c12x * c12y2 * c13x * c22x; 
a2 -= 3 * c11x * c20x * c12x * c13y2 * c22y; 
a2 += 2 * c11x * c20x * c12y * c22x * c13y2; 
a2 += c11x * c11y * c12y2 * c13x * c22x; 
a2 -= 3 * c11x * c12x * c20y * c22x * c13y2; 
a2 -= 3 * c11x * c12x * c21x * c21y * c13y2; 
a2 += 4 * c20x * c11y * c12x * c22x * c13y2; 
a2 -= 2 * c10x * c12x2 * c12y * c13y * c22y; 
a2 -= 6 * c10y * c20x * c13x2 * c13y * c22y; 
a2 -= 6 * c10y * c20y * c13x2 * c22x * c13y; 
a2 -= 6 * c10y * c21x * c13x2 * c21y * c13y; 
a2 -= 2 * c10y * c12x2 * c12y * c13x * c22y; 
a2 -= 2 * c10y * c12x2 * c12y * c22x * c13y; 
a2 -= c11x * c11y * c12x2 * c13y * c22y; 
a2 -= 2 * c11x * c11y2 * c13x * c22x * c13y; 
a2 += 3 * c20x * c11y * c12y * c13x2 * c22y; 
a2 -= 2 * c20x * c12x * c12y2 * c13x * c22y; 
a2 -= 2 * c20x * c12x * c12y2 * c22x * c13y; 
a2 -= 6 * c20x * c20y * c13x * c22x * c13y2; 
a2 -= 6 * c20x * c21x * c13x * c21y * c13y2; 
a2 += 3 * c11y * c20y * c12y * c13x2 * c22x; 
a2 += 3 * c11y * c21x * c12y * c13x2 * c21y; 
a2 -= 2 * c12x * c20y * c12y2 * c13x * c22x; 
a2 -= 2 * c12x * c21x * c12y2 * c13x * c21y; 
a2 -= c11y2 * c12x * c12y * c13x * c22x; 
a2 += 2 * c20x * c12x2 * c12y * c13y * c22y; 
a2 -= 3 * c11y * c21x2 * c12y * c13x * c13y; 
a2 += 6 * c20y * c21x * c13x2 * c21y * c13y; 
a2 += 2 * c11x2 * c11y * c13x * c13y * c22y; 
a2 += c11x2 * c12x * c12y * c13y * c22y; 
a2 += 2 * c12x2 * c20y * c12y * c22x * c13y; 
a2 += 2 * c12x2 * c21x * c12y * c21y * c13y; 
a2 -= 3 * c10x * c21x2 * c13y3; 
a2 += 3 * c20x * c21x2 * c13y3; 
a2 += 3 * c10x2 * c22x * c13y3; 
a2 -= 3 * c10y2 * c13x3 * c22y; 
a2 += 3 * c20x2 * c22x * c13y3; 
a2 += c21x2 * c12y3 * c13x; 
a2 += c11y3 * c13x2 * c22x; 
a2 -= c11x3 * c13y2 * c22y; 
a2 += 3 * c10y * c21x2 * c13x * c13y2; 
a2 -= c11x * c11y2 * c13x2 * c22y; 
a2 += c11x * c21x2 * c12y * c13y2; 
a2 += 2 * c11y * c12x * c21x2 * c13y2; 
a2 += c11x2 * c11y * c22x * c13y2; 
a2 -= c12x * c21x2 * c12y2 * c13y; 
a2 -= 3 * c20y * c21x2 * c13x * c13y2; 
a2 -= 3 * c10x2 * c13x * c13y2 * c22y; 
a2 += 3 * c10y2 * c13x2 * c22x * c13y; 
a2 -= c11x2 * c12y2 * c13x * c22y; 
a2 += c11y2 * c12x2 * c22x * c13y; 
a2 -= 3 * c20x2 * c13x * c13y2 * c22y; 
a2 += 3 * c20y2 * c13x2 * c22x * c13y; 
a2 += c12x2 * c12y * c13x * (2 * c20y * c22y + c21y2); 
a2 += c11x * c12x * c13x * c13y * (6 * c20y * c22y + 3 * c21y2); 
a2 += c12x3 * c13y * (-2 * c20y * c22y - c21y2); 
a2 += c10y * c13x3 * (6 * c20y * c22y + 3 * c21y2); 
a2 += c11y * c12x * c13x2 * (-2 * c20y * c22y - c21y2); 
a2 += c11x * c12y * c13x2 * (-4 * c20y * c22y - 2 * c21y2); 
a2 += c10x * c13x2 * c13y * (-6 * c20y * c22y - 3 * c21y2); 
a2 += c20x * c13x2 * c13y * (6 * c20y * c22y + 3 * c21y2); 
a2 += c13x3 * (-2 * c20y * c21y2 - c20y2 * c22y - c20y * (2 * c20y * c22y + c21y2));
pol33.coefs[2] = a2;

let a1 = -c10x * c11x * c12y * c13x * c21y * c13y; 
a1 += c10x * c11y * c12x * c13x * c21y * c13y; 
a1 += 6 * c10x * c11y * c21x * c12y * c13x * c13y; 
a1 -= 6 * c10y * c11x * c12x * c13x * c21y * c13y; 
a1 -= c10y * c11x * c21x * c12y * c13x * c13y; 
a1 += c10y * c11y * c12x * c21x * c13x * c13y; 
a1 -= c11x * c11y * c12x * c21x * c12y * c13y; 
a1 += c11x * c11y * c12x * c12y * c13x * c21y; 
a1 += c11x * c20x * c12y * c13x * c21y * c13y; 
a1 += 6 * c11x * c12x * c20y * c13x * c21y * c13y; 
a1 += c11x * c20y * c21x * c12y * c13x * c13y; 
a1 -= c20x * c11y * c12x * c13x * c21y * c13y; 
a1 -= 6 * c20x * c11y * c21x * c12y * c13x * c13y; 
a1 -= c11y * c12x * c20y * c21x * c13x * c13y; 
a1 -= 6 * c10x * c20x * c21x * c13y3; 
a1 -= 2 * c10x * c21x * c12y3 * c13x; 
a1 += 6 * c10y * c20y * c13x3 * c21y; 
a1 += 2 * c20x * c21x * c12y3 * c13x; 
a1 += 2 * c10y * c12x3 * c21y * c13y; 
a1 -= 2 * c12x3 * c20y * c21y * c13y; 
a1 -= 6 * c10x * c10y * c21x * c13x * c13y2; 
a1 += 3 * c10x * c11x * c12x * c21y * c13y2;
a1 -= 2 * c10x * c11x * c21x * c12y * c13y2; 
a1 -= 4 * c10x * c11y * c12x * c21x * c13y2; 
a1 += 3 * c10y * c11x * c12x * c21x * c13y2; 
a1 += 6 * c10x * c10y * c13x2 * c21y * c13y; 
a1 += 6 * c10x * c20x * c13x * c21y * c13y2; 
a1 -= 3 * c10x * c11y * c12y * c13x2 * c21y; 
a1 += 2 * c10x * c12x * c21x * c12y2 * c13y; 
a1 += 2 * c10x * c12x * c12y2 * c13x * c21y; 
a1 += 6 * c10x * c20y * c21x * c13x * c13y2; 
a1 += 4 * c10y * c11x * c12y * c13x2 * c21y; 
a1 += 6 * c10y * c20x * c21x * c13x * c13y2; 
a1 += 2 * c10y * c11y * c12x * c13x2 * c21y; 
a1 -= 3 * c10y * c11y * c21x * c12y * c13x2; 
a1 += 2 * c10y * c12x * c21x * c12y2 * c13x; 
a1 -= 3 * c11x * c20x * c12x * c21y * c13y2; 
a1 += 2 * c11x * c20x * c21x * c12y * c13y2; 
a1 += c11x * c11y * c21x * c12y2 * c13x; 
a1 -= 3 * c11x * c12x * c20y * c21x * c13y2; 
a1 += 4 * c20x * c11y * c12x * c21x * c13y2; 
a1 -= 6 * c10x * c20y * c13x2 * c21y * c13y; 
a1 -= 2 * c10x * c12x2 * c12y * c21y * c13y; 
a1 -= 6 * c10y * c20x * c13x2 * c21y * c13y; 
a1 -= 6 * c10y * c20y * c21x * c13x2 * c13y; 
a1 -= 2 * c10y * c12x2 * c21x * c12y * c13y; 
a1 -= 2 * c10y * c12x2 * c12y * c13x * c21y; 
a1 -= c11x * c11y * c12x2 * c21y * c13y; 
a1 -= 4 * c11x * c20y * c12y * c13x2 * c21y; 
a1 -= 2 * c11x * c11y2 * c21x * c13x * c13y; 
a1 += 3 * c20x * c11y * c12y * c13x2 * c21y; 
a1 -= 2 * c20x * c12x * c21x * c12y2 * c13y; 
a1 -= 2 * c20x * c12x * c12y2 * c13x * c21y; 
a1 -= 6 * c20x * c20y * c21x * c13x * c13y2; 
a1 -= 2 * c11y * c12x * c20y * c13x2 * c21y; 
a1 += 3 * c11y * c20y * c21x * c12y * c13x2; 
a1 -= 2 * c12x * c20y * c21x * c12y2 * c13x; 
a1 -= c11y2 * c12x * c21x * c12y * c13x; 
a1 += 6 * c20x * c20y * c13x2 * c21y * c13y; 
a1 += 2 * c20x * c12x2 * c12y * c21y * c13y; 
a1 += 2 * c11x2 * c11y * c13x * c21y * c13y; 
a1 += c11x2 * c12x * c12y * c21y * c13y; 
a1 += 2 * c12x2 * c20y * c21x * c12y * c13y; 
a1 += 2 * c12x2 * c20y * c12y * c13x * c21y; 
a1 += 3 * c10x2 * c21x * c13y3; 
a1 -= 3 * c10y2 * c13x3 * c21y; 
a1 += 3 * c20x2 * c21x * c13y3; 
a1 += c11y3 * c21x * c13x2; 
a1 -= c11x3 * c21y * c13y2; 
a1 -= 3 * c20y2 * c13x3 * c21y; 
a1 -= c11x * c11y2 * c13x2 * c21y; 
a1 += c11x2 * c11y * c21x * c13y2; 
a1 -= 3 * c10x2 * c13x * c21y * c13y2; 
a1 += 3 * c10y2 * c21x * c13x2 * c13y; 
a1 -= c11x2 * c12y2 * c13x * c21y; 
a1 += c11y2 * c12x2 * c21x * c13y; 
a1 -= 3 * c20x2 * c13x * c21y * c13y2; 
a1 += 3 * c20y2 * c21x * c13x2 * c13y;

let a0 = c10x * c10y * c11x * c12y * c13x * c13y;
a0 -= c10x * c10y * c11y * c12x * c13x * c13y; 
a0 += c10x * c11x * c11y * c12x * c12y * c13y; 
a0 -= c10y * c11x * c11y * c12x * c12y * c13x; 
a0 -= c10x * c11x * c20y * c12y * c13x * c13y; 
a0 += 6 * c10x * c20x * c11y * c12y * c13x * c13y; 
a0 += c10x * c11y * c12x * c20y * c13x * c13y; 
a0 -= c10y * c11x * c20x * c12y * c13x * c13y; 
a0 -= 6 * c10y * c11x * c12x * c20y * c13x * c13y; 
a0 += c10y * c20x * c11y * c12x * c13x * c13y; 
a0 -= c11x * c20x * c11y * c12x * c12y * c13y; 
a0 += c11x * c11y * c12x * c20y * c12y * c13x; 
a0 += c11x * c20x * c20y * c12y * c13x * c13y; 
a0 -= c20x * c11y * c12x * c20y * c13x * c13y; 
a0 -= 2 * c10x * c20x * c12y3 * c13x; 
a0 += 2 * c10y * c12x3 * c20y * c13y; 
a0 -= 3 * c10x * c10y * c11x * c12x * c13y2; 
a0 -= 6 * c10x * c10y * c20x * c13x * c13y2; 
a0 += 3 * c10x * c10y * c11y * c12y * c13x2; 
a0 -= 2 * c10x * c10y * c12x * c12y2 * c13x; 
a0 -= 2 * c10x * c11x * c20x * c12y * c13y2; 
a0 -= c10x * c11x * c11y * c12y2 * c13x; 
a0 += 3 * c10x * c11x * c12x * c20y * c13y2; 
a0 -= 4 * c10x * c20x * c11y * c12x * c13y2; 
a0 += 3 * c10y * c11x * c20x * c12x * c13y2; 
a0 += 6 * c10x * c10y * c20y * c13x2 * c13y; 
a0 += 2 * c10x * c10y * c12x2 * c12y * c13y; 
a0 += 2 * c10x * c11x * c11y2 * c13x * c13y; 
a0 += 2 * c10x * c20x * c12x * c12y2 * c13y; 
a0 += 6 * c10x * c20x * c20y * c13x * c13y2; 
a0 -= 3 * c10x * c11y * c20y * c12y * c13x2; 
a0 += 2 * c10x * c12x * c20y * c12y2 * c13x; 
a0 += c10x * c11y2 * c12x * c12y * c13x; 
a0 += c10y * c11x * c11y * c12x2 * c13y; 
a0 += 4 * c10y * c11x * c20y * c12y * c13x2; 
a0 -= 3 * c10y * c20x * c11y * c12y * c13x2; 
a0 += 2 * c10y * c20x * c12x * c12y2 * c13x; 
a0 += 2 * c10y * c11y * c12x * c20y * c13x2; 
a0 += c11x * c20x * c11y * c12y2 * c13x; 
a0 -= 3 * c11x * c20x * c12x * c20y * c13y2; 
a0 -= 2 * c10x * c12x2 * c20y * c12y * c13y; 
a0 -= 6 * c10y * c20x * c20y * c13x2 * c13y; 
a0 -= 2 * c10y * c20x * c12x2 * c12y * c13y; 
a0 -= 2 * c10y * c11x2 * c11y * c13x * c13y; 
a0 -= c10y * c11x2 * c12x * c12y * c13y; 
a0 -= 2 * c10y * c12x2 * c20y * c12y * c13x; 
a0 -= 2 * c11x * c20x * c11y2 * c13x * c13y; 
a0 -= c11x * c11y * c12x2 * c20y * c13y; 
a0 += 3 * c20x * c11y * c20y * c12y * c13x2; 
a0 -= 2 * c20x * c12x * c20y * c12y2 * c13x; 
a0 -= c20x * c11y2 * c12x * c12y * c13x; 
a0 += 3 * c10y2 * c11x * c12x * c13x * c13y; 
a0 += 3 * c11x * c12x * c20y2 * c13x * c13y; 
a0 += 2 * c20x * c12x2 * c20y * c12y * c13y; 
a0 -= 3 * c10x2 * c11y * c12y * c13x * c13y; 
a0 += 2 * c11x2 * c11y * c20y * c13x * c13y; 
a0 += c11x2 * c12x * c20y * c12y * c13y; 
a0 -= 3 * c20x2 * c11y * c12y * c13x * c13y; 
a0 -= c10x3 * c13y3; 
a0 += c10y3 * c13x3; 
a0 += c20x3 * c13y3; 
a0 -= c20y3 * c13x3; 
a0 -= 3 * c10x * c20x2 * c13y3; 
a0 -= c10x * c11y3 * c13x2; 
a0 += 3 * c10x2 * c20x * c13y3; 
a0 += c10y * c11x3 * c13y2; 
a0 += 3 * c10y * c20y2 * c13x3; 
a0 += c20x * c11y3 * c13x2; 
a0 += c10x2 * c12y3 * c13x; 
a0 -= 3 * c10y2 * c20y * c13x3; 
a0 -= c10y2 * c12x3 * c13y; 
a0 += c20x2 * c12y3 * c13x; 
a0 -= c11x3 * c20y * c13y2; 
a0 -= c12x3 * c20y2 * c13y; 
a0 -= c10x * c11x2 * c11y * c13y2; 
a0 += c10y * c11x * c11y2 * c13x2; 
a0 -= 3 * c10x * c10y2 * c13x2 * c13y; 
a0 -= c10x * c11y2 * c12x2 * c13y; 
a0 += c10y * c11x2 * c12y2 * c13x; 
a0 -= c11x * c11y2 * c20y * c13x2; 
a0 += 3 * c10x2 * c10y * c13x * c13y2; 
a0 += c10x2 * c11x * c12y * c13y2; 
a0 += 2 * c10x2 * c11y * c12x * c13y2; 
a0 -= 2 * c10y2 * c11x * c12y * c13x2; 
a0 -= c10y2 * c11y * c12x * c13x2; 
a0 += c11x2 * c20x * c11y * c13y2; 
a0 -= 3 * c10x * c20y2 * c13x2 * c13y; 
a0 += 3 * c10y * c20x2 * c13x * c13y2; 
a0 += c11x * c20x2 * c12y * c13y2; 
a0 -= 2 * c11x * c20y2 * c12y * c13x2; 
a0 += c20x * c11y2 * c12x2 * c13y; 
a0 -= c11y * c12x * c20y2 * c13x2; 
a0 -= c10x2 * c12x * c12y2 * c13y; 
a0 -= 3 * c10x2 * c20y * c13x * c13y2; 
a0 += 3 * c10y2 * c20x * c13x2 * c13y; 
a0 += c10y2 * c12x2 * c12y * c13x; 
a0 -= c11x2 * c20y * c12y2 * c13x; 
a0 += 2 * c20x2 * c11y * c12x * c13y2; 
a0 += 3 * c20x * c20y2 * c13x2 * c13y; 
a0 -= c20x2 * c12x * c12y2 * c13y; 
a0 -= 3 * c20x2 * c20y * c13x * c13y2; 
a0 += c12x2 * c20y2 * c12y * c13x;
pol33.coefs[0] = a0;
   let roots = pol33.getRootsInInterval(0, 1, rootsi[11]);
    for (let i = 0; i < roots.length; i++) {
        let s = roots[i];
        if(s < 0) continue;
        pol41.coefs[3] = c13x;
        pol41.coefs[2] = c12x;
        pol41.coefs[1] = c11x;
        pol41.coefs[0] = c10x - c20x - s * c21x - s * s * c22x - s * s * s * c23x;
        pol42.coefs[3] = c13y;
        pol42.coefs[2] = c12y;
        pol42.coefs[1] = c11y;
        pol42.coefs[0] = c10y - c20y - s * c21y - s * s * c22y - s * s * s * c23y;

        let xRoots = pol41.getRoots(roots2); //new Polynomial(c13x, c12x, c11x, c10x - c20x - s * c21x - s * s * c22x - s * s * s * c23x).getRoots(roots2);
        let yRoots = pol42.getRoots(roots3); //new Polynomial(c13y, c12y, c11y, c10y - c20y - s * c21y - s * s * c22y - s * s * s * c23y).getRoots(roots3);
        let lastResultIdx = 0;
        if (xRoots.length > 0 && yRoots.length > 0) {
            let TOLERANCE = 1e-8;
            checkRoots: for (let j = 0; j < xRoots.length; j++) {
                let xRoot = xRoots[j];
                if (0 <= xRoot && xRoot <= 1) {
                    for (let k = 0; k < yRoots.length; k++) {
                            if (Math.abs(xRoot - yRoots[k]) < TOLERANCE) {
                                result.points[lastResultIdx].x =
                                    c23x * s * s * s + c22x * s * s + c21x * s + c20x;
                                result.points[lastResultIdx].y =
                                    c23y * s * s * s + c22y * s * s + c21y * s + c20y;
                                result.points[lastResultIdx].t = s;
                                result.count += 1;
                                ++lastResultIdx;
                            }
                        }
                }
            }
        }
    }
    //m("after ib3b3");
    return result;
};
Intersection.intersectBezier3Circle = ib3e; //function (p1, p2, p3, p4, c, r) {
   // return ib3e(p1, p2, p3, p4, c, r, r);//Intersection.intersectBezier3Ellipse(p1, p2, p3, p4, c, r, r);
//};

function ib3e(p1, p2, p3, p4, ec, rx, ry, result) {
    let a, b, c, d;
    let c3, c2, c1, c0;
    a = p1.multiply(-1);
    b = p2.multiply(3);
    c = p3.multiply(-3);
    d = a.add(b.add(c.add(p4)));
    c3 = new Vector2D(d.x, d.y);
    a = p1.multiply(3);
    b = p2.multiply(-6);
    c = p3.multiply(3);
    d = a.add(b.add(c));
    c2 = new Vector2D(d.x, d.y);
    a = p1.multiply(-3);
    b = p2.multiply(3);
    c = a.add(b);
    c1 = new Vector2D(c.x, c.y);
    c0 = new Vector2D(p1.x, p1.y);
    let rxrx = rx * rx;
    let ryry = ry * ry;
    dpol[7].coefs[6] = c3.x * c3.x * ryry + c3.y * c3.y * rxrx;
    dpol[7].coefs[5] = 2 * (c3.x * c2.x * ryry + c3.y * c2.y * rxrx);
    dpol[7].coefs[4] = 2 * (c3.x * c1.x * ryry + c3.y * c1.y * rxrx) + c2.x * c2.x * ryry + c2.y * c2.y * rxrx;
    dpol[7].coefs[3] = 2 * c3.x * ryry * (c0.x - ec.x) + 2 * c3.y * rxrx * (c0.y - ec.y) + 2 * (c2.x * c1.x * ryry + c2.y * c1.y * rxrx);
    dpol[7].coefs[2] = 2 * c2.x * ryry * (c0.x - ec.x) + 2 * c2.y * rxrx * (c0.y - ec.y) + c1.x * c1.x * ryry + c1.y * c1.y * rxrx;
    dpol[7].coefs[1] = 2 * c1.x * ryry * (c0.x - ec.x) + 2 * c1.y * rxrx * (c0.y - ec.y);
    dpol[7].coefs[0] = c0.x * c0.x * ryry - 2 * c0.y * ec.y * rxrx - 2 * c0.x * ec.x * ryry + c0.y * c0.y * rxrx + ec.x * ec.x * ryry + ec.y * ec.y * rxrx - rxrx * ryry;
    let roots = dpol[7].getRootsInInterval(0, 1, rootsi[7]);
    for (let i = 0; i < roots.length; i++) {
        let t = roots[i];
        if(t >= 0 && t <= 1) {
            //result.appendPoint(c3.multiply(t * t * t).add(c2.multiply(t * t).add(c1.multiply(t).add(c0))), t);
            let d = Raphael.findDotsAtSegment(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y, t);
            result.appendPoint({x:d.x, y:d.y}, t);
            //console.log(t+ "  " + d.x + " " + d.y);
            result.status = "Intersection";
        }
    }
    return result;

}

Intersection.intersectBezier3Ellipse = function (p1, p2, p3, p4, ec, rx, ry) {
    let a, b, c, d;
    let c3, c2, c1, c0;
    let result = new Intersection("No Intersection");
    a = p1.multiply(-1);
    b = p2.multiply(3);
    c = p3.multiply(-3);
    d = a.add(b.add(c.add(p4)));
    c3 = new Vector2D(d.x, d.y);
    a = p1.multiply(3);
    b = p2.multiply(-6);
    c = p3.multiply(3);
    d = a.add(b.add(c));
    c2 = new Vector2D(d.x, d.y);
    a = p1.multiply(-3);
    b = p2.multiply(3);
    c = a.add(b);
    c1 = new Vector2D(c.x, c.y);
    c0 = new Vector2D(p1.x, p1.y);
    let rxrx = rx * rx;
    let ryry = ry * ry;
    let poly = new Polynomial(c3.x * c3.x * ryry + c3.y * c3.y * rxrx, 2 * (c3.x * c2.x * ryry + c3.y * c2.y * rxrx), 2 * (c3.x * c1.x * ryry + c3.y * c1.y * rxrx) + c2.x * c2.x * ryry + c2.y * c2.y * rxrx, 2 * c3.x * ryry * (c0.x - ec.x) + 2 * c3.y * rxrx * (c0.y - ec.y) + 2 * (c2.x * c1.x * ryry + c2.y * c1.y * rxrx), 2 * c2.x * ryry * (c0.x - ec.x) + 2 * c2.y * rxrx * (c0.y - ec.y) + c1.x * c1.x * ryry + c1.y * c1.y * rxrx, 2 * c1.x * ryry * (c0.x - ec.x) + 2 * c1.y * rxrx * (c0.y - ec.y), c0.x * c0.x * ryry - 2 * c0.y * ec.y * rxrx - 2 * c0.x * ec.x * ryry + c0.y * c0.y * rxrx + ec.x * ec.x * ryry + ec.y * ec.y * rxrx - rxrx * ryry);
    let roots = poly.getRootsInInterval(0, 1);
    for (let i = 0; i < roots.length; i++) {
        let t = roots[i];
        result.points.push(c3.multiply(t * t * t).add(c2.multiply(t * t).add(c1.multiply(t).add(c0))));
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};

Intersection.intersectBezier3Line = ib3l;

function ib3l(p1, p2, p3, p4, a1, a2, result) {
    let min = a1.min(a2);
    let max = a1.max(a2);
    let ax = -p1.x;
    let ay = -p1.y;
    let bx = 3*p2.x;
    let by = 3*p2.y;
    let cx = -3*p3.x;
    let cy = -3*p3.y;
    let c3x = ax + bx + cx + p4.x;
    let c3y = ay + by + cy + p4.y;
    ax = 3*p1.x;
    ay = 3*p1.y;
    bx = -6*p2.x;
    by = -6*p2.y;
    cx = 3*p3.x;
    cy = 3*p3.y;
    let c2x = ax + bx + cx;
    let c2y = ay + by + cy;
    ax = -3*p1.x;
    ay = -3*p1.y;
    bx = 3*p2.x;
    by = 3*p2.y;
    let c1x = ax + bx;
    let c1y = ay + by;
    let c0x = p1.x;
    let c0y = p1.y;
    let nx = a1.y - a2.y;
    let ny = a2.x - a1.x;
    let cl = a1.x * a2.y - a2.x * a1.y;
    pol41.coefs[3] = nx*c3x + ny*c3y;
    pol41.coefs[2] = nx*c2x + ny*c2y;
    pol41.coefs[1] = nx*c1x + ny*c1y;
    pol41.coefs[0] = nx*c0x + ny*c0y + cl;
    let roots = pol41.getRoots(roots2); //new Polynomial(n.dot(c3), n.dot(c2), n.dot(c1), n.dot(c0) + cl).getRoots(roots2);
    for (let i = 0; i < roots.length; i++) {
        let t = roots[i];
        if (0 <= t && t <= 1) {
            let p5 = p1.lerp(p2, t);
            let p6 = p2.lerp(p3, t);
            let p7 = p3.lerp(p4, t);
            let p8 = p5.lerp(p6, t);
            let p9 = p6.lerp(p7, t);
            let p10 = p8.lerp(p9, t);
            if (Math.abs(a1.x - a2.x) < Math.abs(a1.y - a2.y)) {
                if (min.y <= p10.y && p10.y <= max.y) {
                    result.appendPoint(p10, t);
                }
            } else /*if (a1.y == a2.y)*/ {
                if (min.x <= p10.x && p10.x <= max.x) {
                    result.appendPoint(p10, t);
                }
            } /*else if (p10.gte(min) && p10.lte(max)) {
                result.appendPoint(p10, t);
            }*/
        }
    }
    return result;
};
Intersection.intersectBezier3Polygon = function (p1, p2, p3, p4, points) {
    let result = new Intersection("No Intersection");
    let length = points.length;
    for (let i = 0; i < length; i++) {
        let a1 = points[i];
        let a2 = points[(i + 1) % length];
        let inter = Intersection.intersectBezier3Line(p1, p2, p3, p4, a1, a2);
        result.appendPoints(inter.points, inter.t);
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectBezier3Rectangle = function (p1, p2, p3, p4, r1, r2) {
    let min = r1.min(r2);
    let max = r1.max(r2);
    let topRight = new Point2D(max.x, min.y);
    let bottomLeft = new Point2D(min.x, max.y);
    let inter1 = Intersection.intersectBezier3Line(p1, p2, p3, p4, min, topRight);
    let inter2 = Intersection.intersectBezier3Line(p1, p2, p3, p4, topRight, max);
    let inter3 = Intersection.intersectBezier3Line(p1, p2, p3, p4, max, bottomLeft);
    let inter4 = Intersection.intersectBezier3Line(p1, p2, p3, p4, bottomLeft, min);
    let result = new Intersection("No Intersection");
    result.appendPoints(inter1.points, inter1.t);
    result.appendPoints(inter2.points, inter2.t);
    result.appendPoints(inter3.points, inter3.t);
    result.appendPoints(inter4.points, inter4.t);
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectCircleCircle = function (c1, r1, c2, r2) {
    let result;
    let r_max = r1 + r2;
    let r_min = Math.abs(r1 - r2);
    let c_dist = c1.distanceFrom(c2);
    if (c_dist > r_max) {
        result = new Intersection("Outside");
    } else if (c_dist < r_min) {
        result = new Intersection("Inside");
    } else {
        result = new Intersection("Intersection");
        let a = (r1 * r1 - r2 * r2 + c_dist * c_dist) / (2 * c_dist);
        let h = Math.sqrt(r1 * r1 - a * a);
        let p = c1.lerp(c2, a / c_dist);
        let b = h / c_dist;
        result.points.push(new Point2D(p.x - b * (c2.y - c1.y), p.y + b * (c2.x - c1.x)));
        result.points.push(new Point2D(p.x + b * (c2.y - c1.y), p.y - b * (c2.x - c1.x)));
    }
    return result;
};
Intersection.intersectCircleEllipse = function (cc, r, ec, rx, ry) {
    return Intersection.intersectEllipseEllipse(cc, r, r, ec, rx, ry);
};
Intersection.intersectCircleLine = function (c, r, a1, a2) {
    let result;
    let a = (a2.x - a1.x) * (a2.x - a1.x) + (a2.y - a1.y) * (a2.y - a1.y);
    let b = 2 * ((a2.x - a1.x) * (a1.x - c.x) + (a2.y - a1.y) * (a1.y - c.y));
    let cc = c.x * c.x + c.y * c.y + a1.x * a1.x + a1.y * a1.y - 2 * (c.x * a1.x + c.y * a1.y) - r * r;
    let deter = b * b - 4 * a * cc;
    if (deter < 0) {
        result = new Intersection("Outside");
    } else if (deter == 0) {
        result = new Intersection("Tangent");
    } else {
        let e = Math.sqrt(deter);
        let u1 = (-b + e) / (2 * a);
        let u2 = (-b - e) / (2 * a);
        if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
            if ((u1 < 0 && u2 < 0) || (u1 > 1 && u2 > 1)) {
                result = new Intersection("Outside");
            } else {
                result = new Intersection("Inside");
            }
        } else {
            result = new Intersection("Intersection");
            if (0 <= u1 && u1 <= 1) result.points.push(a1.lerp(a2, u1));
            if (0 <= u2 && u2 <= 1) result.points.push(a1.lerp(a2, u2));
        }
    }
    return result;
};
Intersection.intersectCirclePolygon = function (c, r, points) {
    let result = new Intersection("No Intersection");
    let length = points.length;
    let inter;
    for (let i = 0; i < length; i++) {
        let a1 = points[i];
        let a2 = points[(i + 1) % length];
        inter = Intersection.intersectCircleLine(c, r, a1, a2);
        result.appendPoints(inter.points, inter.t);
    }
    if (result.points.length > 0) result.status = "Intersection";
    else result.status = inter.status;
    return result;
};
Intersection.intersectCircleRectangle = function (c, r, r1, r2) {
    let min = r1.min(r2);
    let max = r1.max(r2);
    let topRight = new Point2D(max.x, min.y);
    let bottomLeft = new Point2D(min.x, max.y);
    let inter1 = Intersection.intersectCircleLine(c, r, min, topRight);
    let inter2 = Intersection.intersectCircleLine(c, r, topRight, max);
    let inter3 = Intersection.intersectCircleLine(c, r, max, bottomLeft);
    let inter4 = Intersection.intersectCircleLine(c, r, bottomLeft, min);
    let result = new Intersection("No Intersection");
    result.appendPoints(inter1.points, inter.t);
    result.appendPoints(inter2.points, inter2.t);
    result.appendPoints(inter3.points);
    result.appendPoints(inter4.points);
    if (result.points.length > 0) result.status = "Intersection";
    else result.status = inter1.status;
    return result;
};
Intersection.intersectEllipseEllipse = function (c1, rx1, ry1, c2, rx2, ry2) {
    let a = [ry1 * ry1, 0, rx1 * rx1, -2 * ry1 * ry1 * c1.x, -2 * rx1 * rx1 * c1.y, ry1 * ry1 * c1.x * c1.x + rx1 * rx1 * c1.y * c1.y - rx1 * rx1 * ry1 * ry1];
    let b = [ry2 * ry2, 0, rx2 * rx2, -2 * ry2 * ry2 * c2.x, -2 * rx2 * rx2 * c2.y, ry2 * ry2 * c2.x * c2.x + rx2 * rx2 * c2.y * c2.y - rx2 * rx2 * ry2 * ry2];
    let yPoly = Intersection.bezout(a, b);
    let yRoots = yPoly.getRoots();
    let epsilon = 1e-3;
    let norm0 = (a[0] * a[0] + 2 * a[1] * a[1] + a[2] * a[2]) * epsilon;
    let norm1 = (b[0] * b[0] + 2 * b[1] * b[1] + b[2] * b[2]) * epsilon;
    let result = new Intersection("No Intersection");
    for (let y = 0; y < yRoots.length; y++) {
        let xPoly = new Polynomial(a[0], a[3] + yRoots[y] * a[1], a[5] + yRoots[y] * (a[4] + yRoots[y] * a[2]));
        let xRoots = xPoly.getRoots();
        for (let x = 0; x < xRoots.length; x++) {
            let test = (a[0] * xRoots[x] + a[1] * yRoots[y] + a[3]) * xRoots[x] + (a[2] * yRoots[y] + a[4]) * yRoots[y] + a[5];
            if (Math.abs(test) < norm0) {
                test = (b[0] * xRoots[x] + b[1] * yRoots[y] + b[3]) * xRoots[x] + (b[2] * yRoots[y] + b[4]) * yRoots[y] + b[5];
                if (Math.abs(test) < norm1) {
                    result.appendPoint(new Point2D(xRoots[x], yRoots[y]));
                }
            }
        }
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectEllipseLine = function (pc, rx, ry, a1, a2) {
    let result;
    let origin = new Vector2D(a1.x, a1.y);
    let dir = Vector2D.fromPoints(a1, a2);
    let center = new Vector2D(pc.x, pc.y);
    let diff = origin.subtract(center);
    let mDir = new Vector2D(dir.x / (rx * rx), dir.y / (ry * ry));
    let mDiff = new Vector2D(diff.x / (rx * rx), diff.y / (ry * ry));
    let a = dir.dot(mDir);
    let b = dir.dot(mDiff);
    let c = diff.dot(mDiff) - 1.0;
    let d = b * b - a * c;
    if (d < 0) {
        result = new Intersection("Outside");
    } else if (d > 0) {
        let root = Math.sqrt(d);
        let t_a = (-b - root) / a;
        let t_b = (-b + root) / a;
        if ((t_a < 0 || 1 < t_a) && (t_b < 0 || 1 < t_b)) {
            if ((t_a < 0 && t_b < 0) || (t_a > 1 && t_b > 1)) result = new Intersection("Outside");
            else result = new Intersection("Inside");
        } else {
            result = new Intersection("Intersection");
            if (0 <= t_a && t_a <= 1) result.appendPoint(a1.lerp(a2, t_a));
            if (0 <= t_b && t_b <= 1) result.appendPoint(a1.lerp(a2, t_b));
        }
    } else {
        let t = -b / a;
        if (0 <= t && t <= 1) {
            result = new Intersection("Intersection");
            result.appendPoint(a1.lerp(a2, t));
        } else {
            result = new Intersection("Outside");
        }
    }
    return result;
};
Intersection.intersectEllipsePolygon = function (c, rx, ry, points) {
    let result = new Intersection("No Intersection");
    let length = points.length;
    for (let i = 0; i < length; i++) {
        let b1 = points[i];
        let b2 = points[(i + 1) % length];
        let inter = Intersection.intersectEllipseLine(c, rx, ry, b1, b2);
        result.appendPoints(inter.points, inter.t);
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectEllipseRectangle = function (c, rx, ry, r1, r2) {
    let min = r1.min(r2);
    let max = r1.max(r2);
    let topRight = new Point2D(max.x, min.y);
    let bottomLeft = new Point2D(min.x, max.y);
    let inter1 = Intersection.intersectEllipseLine(c, rx, ry, min, topRight);
    let inter2 = Intersection.intersectEllipseLine(c, rx, ry, topRight, max);
    let inter3 = Intersection.intersectEllipseLine(c, rx, ry, max, bottomLeft);
    let inter4 = Intersection.intersectEllipseLine(c, rx, ry, bottomLeft, min);
    let result = new Intersection("No Intersection");
    result.appendPoints(inter1.points, inter1.t);
    result.appendPoints(inter2.points, inter2.t);
    result.appendPoints(inter3.points, inter3.t);
    result.appendPoints(inter4.points, inter4.t);
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectLineLine = function (a1, a2, b1, b2) {
    let result;
    let ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    let ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    let u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (u_b != 0) {
        let ua = ua_t / u_b;
        let ub = ub_t / u_b;
        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
            result = new Intersection("Intersection");
            result.points.push(new Point2D(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)));
        } else {
            result = new Intersection("No Intersection");
        }
    } else {
        if (ua_t == 0 || ub_t == 0) {
            result = new Intersection("Coincident");
        } else {
            result = new Intersection("Parallel");
        }
    }
    return result;
};
Intersection.intersectLinePolygon = function (a1, a2, points) {
    let result = new Intersection("No Intersection");
    let length = points.length;
    for (let i = 0; i < length; i++) {
        let b1 = points[i];
        let b2 = points[(i + 1) % length];
        let inter = Intersection.intersectLineLine(a1, a2, b1, b2);
        result.appendPoints(inter.points, inter.t);
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectLineRectangle = function (a1, a2, r1, r2) {
    let min = r1.min(r2);
    let max = r1.max(r2);
    let topRight = new Point2D(max.x, min.y);
    let bottomLeft = new Point2D(min.x, max.y);
    let inter1 = Intersection.intersectLineLine(min, topRight, a1, a2);
    let inter2 = Intersection.intersectLineLine(topRight, max, a1, a2);
    let inter3 = Intersection.intersectLineLine(max, bottomLeft, a1, a2);
    let inter4 = Intersection.intersectLineLine(bottomLeft, min, a1, a2);
    let result = new Intersection("No Intersection");
    result.appendPoints(inter1.points, inter1.t);
    result.appendPoints(inter2.points, inter2.t);
    result.appendPoints(inter3.points, inter3.t);
    result.appendPoints(inter4.points, inter4.t);
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectPolygonPolygon = function (points1, points2) {
    let result = new Intersection("No Intersection");
    let length = points1.length;
    for (let i = 0; i < length; i++) {
        let a1 = points1[i];
        let a2 = points1[(i + 1) % length];
        let inter = Intersection.intersectLinePolygon(a1, a2, points2);
        result.appendPoints(inter.points, inter.t);
    }
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectPolygonRectangle = function (points, r1, r2) {
    let min = r1.min(r2);
    let max = r1.max(r2);
    let topRight = new Point2D(max.x, min.y);
    let bottomLeft = new Point2D(min.x, max.y);
    let inter1 = Intersection.intersectLinePolygon(min, topRight, points);
    let inter2 = Intersection.intersectLinePolygon(topRight, max, points);
    let inter3 = Intersection.intersectLinePolygon(max, bottomLeft, points);
    let inter4 = Intersection.intersectLinePolygon(bottomLeft, min, points);
    let result = new Intersection("No Intersection");
    result.appendPoints(inter1.points, inter1.t);
    result.appendPoints(inter2.points, inter2.t);
    result.appendPoints(inter3.points, inter3.t);
    result.appendPoints(inter4.points, inter4.t);
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.intersectRayRay = function (a1, a2, b1, b2) {
    let result;
    let ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    let ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    let u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (u_b != 0) {
        let ua = ua_t / u_b;
        result = new Intersection("Intersection");
        result.points.push(new Point2D(a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)));
    } else {
        if (ua_t == 0 || ub_t == 0) {
            result = new Intersection("Coincident");
        } else {
            result = new Intersection("Parallel");
        }
    }
    return result;
};
Intersection.intersectRectangleRectangle = function (a1, a2, b1, b2) {
    let min = a1.min(a2);
    let max = a1.max(a2);
    let topRight = new Point2D(max.x, min.y);
    let bottomLeft = new Point2D(min.x, max.y);
    let inter1 = Intersection.intersectLineRectangle(min, topRight, b1, b2);
    let inter2 = Intersection.intersectLineRectangle(topRight, max, b1, b2);
    let inter3 = Intersection.intersectLineRectangle(max, bottomLeft, b1, b2);
    let inter4 = Intersection.intersectLineRectangle(bottomLeft, min, b1, b2);
    let result = new Intersection("No Intersection");
    result.appendPoints(inter1.points, inter1.t);
    result.appendPoints(inter2.points, inter2.t);
    result.appendPoints(inter3.points, inter3.t);
    result.appendPoints(inter4.points, inter4.t);
    if (result.points.length > 0) result.status = "Intersection";
    return result;
};
Intersection.bezout = function (e1, e2) {
    let AB = e1[0] * e2[1] - e2[0] * e1[1];
    let AC = e1[0] * e2[2] - e2[0] * e1[2];
    let AD = e1[0] * e2[3] - e2[0] * e1[3];
    let AE = e1[0] * e2[4] - e2[0] * e1[4];
    let AF = e1[0] * e2[5] - e2[0] * e1[5];
    let BC = e1[1] * e2[2] - e2[1] * e1[2];
    let BE = e1[1] * e2[4] - e2[1] * e1[4];
    let BF = e1[1] * e2[5] - e2[1] * e1[5];
    let CD = e1[2] * e2[3] - e2[2] * e1[3];
    let DE = e1[3] * e2[4] - e2[3] * e1[4];
    let DF = e1[3] * e2[5] - e2[3] * e1[5];
    let BFpDE = BF + DE;
    let BEmCD = BE - CD;
    return new Polynomial(AB * BC - AC * AC, AB * BEmCD + AD * BC - 2 * AC * AE, AB * BFpDE + AD * BEmCD - AE * AE - 2 * AC * AF, AB * DF + AD * BFpDE - 2 * AE * AF, AD * DF - AF * AF);
};

function IntersectionParams(name, params) {
    if (arguments.length > 0) this.init(name, params);
}
IntersectionParams.prototype.init = function (name, params) {
    this.name = name;
    this.params = params;
};

function Point2D(x, y) {
    this.x = x;
    this.y = y;
}
Point2D.prototype.clone = function () {
    return new Point2D(this.x, this.y);
};
Point2D.prototype.add = function (that) {
    return new Point2D(this.x + that.x, this.y + that.y);
};
Point2D.prototype.addEquals = function (that) {
    this.x += that.x;
    this.y += that.y;
    return this;
};
Point2D.prototype.offset = function (a, b) {
    let result = 0;
    if (!(b.x <= this.x || this.x + a.x <= 0)) {
        let t = b.x * a.y - a.x * b.y;
        let s;
        let d;
        if (t > 0) {
            if (this.x < 0) {
                s = this.x * a.y;
                d = s / a.x - this.y;
            } else if (this.x > 0) {
                s = this.x * b.y;
                d = s / b.x - this.y;
            } else {
                d = -this.y;
            }
        } else {
            if (b.x < this.x + a.x) {
                s = (b.x - this.x) * a.y;
                d = b.y - (this.y + s / a.x);
            } else if (b.x > this.x + a.x) {
                s = (a.x + this.x) * b.y;
                d = s / b.x - (this.y + a.y);
            } else {
                d = b.y - (this.y + a.y);
            }
        } if (d > 0) {
            result = d;
        }
    }
    return result;
};
Point2D.prototype.rmoveto = function (dx, dy) {
    this.x += dx;
    this.y += dy;
};
Point2D.prototype.scalarAdd = function (scalar) {
    return new Point2D(this.x + scalar, this.y + scalar);
};
Point2D.prototype.scalarAddEquals = function (scalar) {
    this.x += scalar;
    this.y += scalar;
    return this;
};
Point2D.prototype.subtract = function (that) {
    return new Point2D(this.x - that.x, this.y - that.y);
};
Point2D.prototype.subtractEquals = function (that) {
    this.x -= that.x;
    this.y -= that.y;
    return this;
};
Point2D.prototype.scalarSubtract = function (scalar) {
    return new Point2D(this.x - scalar, this.y - scalar);
};
Point2D.prototype.scalarSubtractEquals = function (scalar) {
    this.x -= scalar;
    this.y -= scalar;
    return this;
};
Point2D.prototype.multiply = function (scalar) {
    return new Point2D(this.x * scalar, this.y * scalar);
};
Point2D.prototype.multiplyEquals = function (scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
};
Point2D.prototype.divide = function (scalar) {
    return new Point2D(this.x / scalar, this.y / scalar);
};
Point2D.prototype.divideEquals = function (scalar) {
    this.x /= scalar;
    this.y /= scalar;
    return this;
};
Point2D.prototype.compare = function (that) {
    return (this.x - that.x || this.y - that.y);
};
Point2D.prototype.eq = function (that) {
    return (this.x == that.x && this.y == that.y);
};
Point2D.prototype.lt = function (that) {
    return (this.x < that.x && this.y < that.y);
};
Point2D.prototype.lte = function (that) {
    return (this.x <= that.x && this.y <= that.y);
};
Point2D.prototype.gt = function (that) {
    return (this.x > that.x && this.y > that.y);
};
Point2D.prototype.gte = function (that) {
    return (this.x >= that.x && this.y >= that.y);
};
Point2D.prototype.lerp = function (that, t) {
    return new Point2D(this.x + (that.x - this.x) * t, this.y + (that.y - this.y) * t);
};
Point2D.prototype.distanceFrom = function (that) {
    let dx = this.x - that.x;
    let dy = this.y - that.y;
    return Math.sqrt(dx * dx + dy * dy);
};
Point2D.prototype.min = function (that) {
    return new Point2D(Math.min(this.x, that.x), Math.min(this.y, that.y));
};
Point2D.prototype.max = function (that) {
    return new Point2D(Math.max(this.x, that.x), Math.max(this.y, that.y));
};
Point2D.prototype.toString = function () {
    return this.x + "," + this.y;
};
Point2D.prototype.setXY = function (x, y) {
    this.x = x;
    this.y = y;
};
Point2D.prototype.setFromPoint = function (that) {
    this.x = that.x;
    this.y = that.y;
};
Point2D.prototype.swap = function (that) {
    let x = this.x;
    let y = this.y;
    this.x = that.x;
    this.y = that.y;
    that.x = x;
    that.y = y;
};
Polynomial.TOLERANCE = 1e-16;
Polynomial.ACCURACY = 12;
let tmp2 = Math.LN10 * Polynomial.ACCURACY;
Polynomial.interpolate = function (xs, ys, n, offset, x) {
    if (xs.constructor !== Array || ys.constructor !== Array) throw new Error("Polynomial.interpolate: xs and ys must be arrays");
    if (isNaN(n) || isNaN(offset) || isNaN(x)) throw new Error("Polynomial.interpolate: n, offset, and x must be numbers");
    let y = 0;
    let dy = 0;
    let c = new Array(n);
    let d = new Array(n);
    let ns = 0;
    let result;
    let diff = Math.abs(x - xs[offset]);
    for (let i = 0; i < n; i++) {
        let dift = Math.abs(x - xs[offset + i]);
        if (dift < diff) {
            ns = i;
            diff = dift;
        }
        c[i] = d[i] = ys[offset + i];
    }
    y = ys[offset + ns];
    ns--;
    for (let m = 1; m < n; m++) {
        for (let i = 0; i < n - m; i++) {
            let ho = xs[offset + i] - x;
            let hp = xs[offset + i + m] - x;
            let w = c[i + 1] - d[i];
            let den = ho - hp;
            if (den == 0.0) {
                result = {
                    y: 0,
                    dy: 0
                };
                break;
            }
            den = w / den;
            d[i] = hp * den;
            c[i] = ho * den;
        }
        dy = (2 * (ns + 1) < (n - m)) ? c[ns + 1] : d[ns--];
        y += dy;
    }
    return {
        y: y,
        dy: dy
    };
};

function Polynomial() {
    let c = new Array();
    for (let i = arguments.length - 1; i >= 0; i--) c.push(arguments[i]);
    this.coefs = c;
    this._variable = "t";
    this._s = 0;
    this.degree = c.length - 1;
};
let roots1 = newRoots(5);
let roots2 = newRoots(4);
let roots3 = newRoots(4);
let rootsj1 = newRoots(1);
let rootsj2 = newRoots(2);
let rootsj3 = newRoots(3);
let rootsj4 = newRoots(4);
let rootsi = new Array();
for(let i = 0; i < 12; ++i)
    rootsi.push(newRoots(i + 1));

function newRoots(n){
    let roots = new Array();
    for(let i = 0; i < n; ++i)
        roots.push(-1);
    return roots;
};
Polynomial.prototype.init = function (coefs) {
    let c = new Array();
    for (let i = coefs.length - 1; i >= 0; i--) c.push(coefs[i]);
    this.coefs = c;
    this._variable = "t";
    this._s = 0;
};
Polynomial.prototype.eval = peval;

function peval(x) {
    if (isNaN(x)) throw new Error("Polynomial.eval: parameter must be a number");
    let result = 0;
    for (let i = this.coefs.length - 1; i >= 0; i--) result = result * x + this.coefs[i];
    return result;
};
Polynomial.prototype.add = function (that) {
    let result = new Polynomial();
    let d1 = this.getDegree();
    let d2 = that.getDegree();
    let dmax = Math.max(d1, d2);
    for (let i = 0; i <= dmax; i++) {
        let v1 = (i <= d1) ? this.coefs[i] : 0;
        let v2 = (i <= d2) ? that.coefs[i] : 0;
        result.coefs[i] = v1 + v2;
    }
    return result;
};
Polynomial.prototype.multiply = function (that) {
    let result = new Polynomial();
    for (let i = 0; i <= this.getDegree() + that.getDegree(); i++) result.coefs.push(0);
    for (let i = 0; i <= this.getDegree(); i++)
        for (let j = 0; j <= that.getDegree(); j++) result.coefs[i + j] += this.coefs[i] * that.coefs[j];
    return result;
};
Polynomial.prototype.divide_scalar = function (scalar) {
    for (let i = 0; i < this.coefs.length; i++) this.coefs[i] /= scalar;
};
Polynomial.prototype.simplify = function () {
    for (let i = this.coefs.length - 1; i >= 0; i--) {
        if (Math.abs(this.coefs[i]) <= Polynomial.TOLERANCE) this.coefs.pop();
        else break;
    }
};
Polynomial.prototype.bisection = bisection;

function bisection(coefs, min, max) {
    let last = coefs.length - 1;
    let minValue = 0;
    let maxValue = 0;
    for (let i = last; i >= 0; i--) {
        minValue = minValue * min + coefs[i];
        maxValue = maxValue * max + coefs[i];
    }
    let result;
    if (Math.abs(minValue) <= Polynomial.TOLERANCE) result = min;
    else if (Math.abs(maxValue) <= Polynomial.TOLERANCE) result = max;
    else if (minValue * maxValue <= 0) {
        let tmp1 = Math.log(max - min);
        let iters = Math.ceil((tmp1 + tmp2) / Math.LN2);
        for (let i = 0; i < iters; i++) {
            result = 0.5 * (min + max);
            let value = 0;
            for (let j = last; j >= 0; j--) value = value * result + coefs[j];
            if (Math.abs(value) <= Polynomial.TOLERANCE) {
                break;
            }
            if (value * minValue < 0) {
                max = result;
                maxValue = value;
            } else {
                min = result;
                minValue = value;
            }
        }
    }
    return result;
};
Polynomial.prototype.toString = function () {
    let coefs = new Array();
    let signs = new Array();
    for (let i = this.coefs.length - 1; i >= 0; i--) {
        let value = Math.round(this.coefs[i] * 1000) / 1000;
        if (value != 0) {
            let sign = (value < 0) ? " - " : " + ";
            value = Math.abs(value);
            if (i > 0)
                if (value == 1) value = this._variable;
                else value += this._variable;
            if (i > 1) value += "^" + i;
            signs.push(sign);
            coefs.push(value);
        }
    }
    signs[0] = (signs[0] == " + ") ? "" : "-";
    let result = "";
    for (let i = 0; i < coefs.length; i++) result += signs[i] + coefs[i];
    return result;
};
Polynomial.prototype.trapezoid = function (min, max, n) {
    if (isNaN(min) || isNaN(max) || isNaN(n)) throw new Error("Polynomial.trapezoid: parameters must be numbers");
    let range = max - min;
    let TOLERANCE = 1e-7;
    if (n == 1) {
        let minValue = this.eval(min);
        let maxValue = this.eval(max);
        this._s = 0.5 * range * (minValue + maxValue);
    } else {
        let it = 1 << (n - 2);
        let delta = range / it;
        let x = min + 0.5 * delta;
        let sum = 0;
        for (let i = 0; i < it; i++) {
            sum += this.eval(x);
            x += delta;
        }
        this._s = 0.5 * (this._s + range * sum / it);
    } if (isNaN(this._s)) throw new Error("Polynomial.trapezoid: this._s is NaN");
    return this._s;
};
Polynomial.prototype.simpson = function (min, max) {
    if (isNaN(min) || isNaN(max)) throw new Error("Polynomial.simpson: parameters must be numbers");
    let range = max - min;
    let st = 0.5 * range * (this.eval(min) + this.eval(max));
    let t = st;
    let s = 4.0 * st / 3.0;
    let os = s;
    let ost = st;
    let TOLERANCE = 1e-7;
    let it = 1;
    for (let n = 2; n <= 20; n++) {
        let delta = range / it;
        let x = min + 0.5 * delta;
        let sum = 0;
        for (let i = 1; i <= it; i++) {
            sum += this.eval(x);
            x += delta;
        }
        t = 0.5 * (t + range * sum / it);
        st = t;
        s = (4.0 * st - ost) / 3.0;
        if (Math.abs(s - os) < TOLERANCE * Math.abs(os)) break;
        os = s;
        ost = st;
        it <<= 1;
    }
    return s;
};
Polynomial.prototype.romberg = function (min, max) {
    if (isNaN(min) || isNaN(max)) throw new Error("Polynomial.romberg: parameters must be numbers");
    let MAX = 20;
    let K = 3;
    let TOLERANCE = 1e-6;
    let s = new Array(MAX + 1);
    let h = new Array(MAX + 1);
    let result = {
        y: 0,
        dy: 0
    };
    h[0] = 1.0;
    for (let j = 1; j <= MAX; j++) {
        s[j - 1] = this.trapezoid(min, max, j);
        if (j >= K) {
            result = Polynomial.interpolate(h, s, K, j - K, 0.0);
            if (Math.abs(result.dy) <= TOLERANCE * result.y) break;
        }
        s[j] = s[j - 1];
        h[j] = 0.25 * h[j - 1];
    }
    return result.y;
};
Polynomial.prototype.getDegree = function () {
    return this.coefs.length - 1;
};
Polynomial.prototype.getDerivative = function () {
    let derivative = new Polynomial();
    let last = this.coefs.length;
    for (let i = 1; i < last; i++) {
        derivative.coefs.push(i * this.coefs[i]);
    }
    return derivative;
};
Polynomial.prototype.getRoots = gr;

function gr(roots) {
    //this.simplify();
    //for(i = 0; i < roots.length; ++i)
    //    roots[i] = -1;
    let c0, c1, c2, c3, a, b, c, d, offset, discrim, halfB;
    switch (this.coefs.length - 1) {
    case 1:
        //this.getLinearRoot(roots);
        a = this.coefs[1];
        if (a != 0) roots[0] = -this.coefs[0] / a;
        else roots[0] = -1;
        break;
    case 2:
        //this.getQuadraticRoots(roots);
        a = this.coefs[2];
        b = this.coefs[1] / a;
        c = this.coefs[0] / a;
        d = b * b - 4 * c;
        if (d > 0) {
            let e = Math.sqrt(d);
            roots[0] = 0.5 * (-b + e);
            roots[1] = 0.5 * (-b - e);
        } else if (d == 0) {
            roots[0] = 0.5 * -b;
            roots[1] = -1;
        }
        else {
            roots[0] = -1;
            roots[1] = -1;
        }
        break;
    case 3:
        //this.getCubicRoots(roots)
        c3 = this.coefs[3];
        c2 = this.coefs[2] / c3;
        c1 = this.coefs[1] / c3;
        c0 = this.coefs[0] / c3;
        a = (3 * c1 - c2 * c2) / 3;
        b = (2 * c2 * c2 * c2 - 9 * c1 * c2 + 27 * c0) / 27;
        offset = c2 / 3;
        discrim = b * b / 4 + a * a * a / 27;
        halfB = b / 2;
        if (Math.abs(discrim) <= Polynomial.TOLERANCE) discrim = 0;
        if (discrim > 0) {
            let e = Math.sqrt(discrim);
            let tmp;
            let root;
            tmp = -halfB + e;
            if (tmp >= 0) root = Math.pow(tmp, 1 / 3);
            else root = -Math.pow(-tmp, 1 / 3);
            tmp = -halfB - e;
            if (tmp >= 0) root += Math.pow(tmp, 1 / 3);
            else root -= Math.pow(-tmp, 1 / 3);
            roots[0] = root - offset;
            roots[1] = -1;
            roots[2] = -1;
        } else if (discrim < 0) {
            let distance = Math.sqrt(-a / 3);
            let angle = Math.atan2(Math.sqrt(-discrim), -halfB) / 3;
            let cos = Math.cos(angle);
            let sin = Math.sin(angle);
            let sqrt3 = Math.sqrt(3);
            roots[0] = 2 * distance * cos - offset;
            roots[1] = -distance * (cos + sqrt3 * sin) - offset;
            roots[2] = -distance * (cos - sqrt3 * sin) - offset;
        } else {
            let tmp;
            if (halfB >= 0) tmp = -Math.pow(halfB, 1 / 3);
            else tmp = Math.pow(-halfB, 1 / 3);
            roots[0] = 2 * tmp - offset;
            roots[1] = -tmp - offset;
            roots[2] = -1;
        }
        break;
    case 4:
        //this.getQuarticRoots(roots);
        let c4 = this.coefs[4];
        c3 = this.coefs[3] / c4;
        c2 = this.coefs[2] / c4;
        c1 = this.coefs[1] / c4;
        c0 = this.coefs[0] / c4;
        qpol.coefs[3] = 1;
        qpol.coefs[2] = -c2;
        qpol.coefs[1] = c3 * c1 - 4 * c0;
        qpol.coefs[0] = -c3 * c3 * c0 + 4 * c2 * c0 - c1 * c1;
        //let resolveRoots = new Polynomial(1, -c2, c3 * c1 - 4 * c0, -c3 * c3 * c0 + 4 * c2 * c0 - c1 * c1).getCubicRoots(roots1);
        let resolveRoots = qpol.getRoots(rootsj3);
        let y = resolveRoots[0];
        discrim = c3 * c3 / 4 - c2 + y;
        if (Math.abs(discrim) <= Polynomial.TOLERANCE) discrim = 0;
        let ii = 0;
        if (discrim > 0) {
            let e = Math.sqrt(discrim);
            let t1 = 3 * c3 * c3 / 4 - e * e - 2 * c2;
            let t2 = (4 * c3 * c2 - 8 * c1 - c3 * c3 * c3) / (4 * e);
            let plus = t1 + t2;
            let minus = t1 - t2;
            if (Math.abs(plus) <= Polynomial.TOLERANCE) plus = 0;
            if (Math.abs(minus) <= Polynomial.TOLERANCE) minus = 0;
            let ii = 0;
            if (plus >= 0) {
                let f = Math.sqrt(plus);
                roots[ii++] = -c3 / 4 + (e + f) / 2;
                roots[ii++] = -c3 / 4 + (e - f) / 2;
            }
            if (minus >= 0) {
                let f = Math.sqrt(minus);
                roots[ii++] = -c3 / 4 + (f - e) / 2;
                roots[ii++] = -c3 / 4 - (f + e) / 2;
            }
        } else if (discrim < 0) {} else {
            let t2 = y * y - 4 * c0;
            if (t2 >= -Polynomial.TOLERANCE) {
                if (t2 < 0) t2 = 0;
                t2 = 2 * Math.sqrt(t2);
                let t1 = 3 * c3 * c3 / 4 - 2 * c2;
                if (t1 + t2 >= Polynomial.TOLERANCE) {
                    let d = Math.sqrt(t1 + t2);
                    roots[ii++] = -c3 / 4 + d / 2;
                    roots[ii++] = -c3 / 4 - d / 2;
                }
                if (t1 - t2 >= Polynomial.TOLERANCE) {
                    let d = Math.sqrt(t1 - t2);
                    roots[ii++] = -c3 / 4 + d / 2;
                    roots[ii++] = -c3 / 4 - d / 2;
                }
            }
        }
        while(ii < 4) rootsj4[ii++] = -1;
        break;
    default:
        roots[0] = -1;
        roots[1] = -1;
        roots[2] = -1;
        roots[3] = -1;
    }
    return roots;
};
Polynomial.prototype.getRootsInInterval = getRootsInInterval;

let dummyroots = new Array();

function getRootsInInterval(min, max, roots) {
    let root;
    let coefs = this.coefs;
    if (coefs.length == 2) {
        root = bisection(coefs, min, max);
        if (root != null) {
            roots[0] = root;
        }
        else {
            roots[0] = -1;
        } 
    } else {
        let ii = 0;
        let degree = this.degree;
        for(let i = 0; i < roots.length; ++i)
            roots[i] = -1;
        for (let i = 1; i < coefs.length; i++) {
            dpol[degree - 1].coefs[i - 1] = i * coefs[i];
        }
        //dpol.degree = degree - 1; 
        let droots = dpol[degree - 1].getRootsInInterval(min, max, rootsi[degree-1]);
        let lastRoot = min;
        for (let i = 0; i <= droots.length - 1; i++) {
            if(droots[i] < 0) continue;
            root = bisection(coefs, lastRoot, droots[i]);
            if (root != null) {
                roots[ii++] = root;
            }
            lastRoot = droots[i];
        }
        root = bisection(coefs, lastRoot, max);
        if (root != null) {
            roots[ii++] = root;
        }
    }
    return roots;
};

Polynomial.prototype.getLinearRoot = function (roots) {
    let a = this.coefs[1];
    if (a != 0) roots[0] = -this.coefs[0] / a;
    return roots;
};
Polynomial.prototype.getQuadraticRoots = function (roots) {
    if (this.getDegree() == 2) {
        let a = this.coefs[2];
        let b = this.coefs[1] / a;
        let c = this.coefs[0] / a;
        let d = b * b - 4 * c;
        if (d > 0) {
            let e = Math.sqrt(d);
            roots[0] = 0.5 * (-b + e);
            roots[1] = 0.5 * (-b - e);
        } else if (d == 0) {
            roots[0] = 0.5 * -b;
        }
    }
    return roots;
};
Polynomial.prototype.getCubicRoots = function (roots) {
    if (this.getDegree() == 3) {
        let c3 = this.coefs[3];
        let c2 = this.coefs[2] / c3;
        let c1 = this.coefs[1] / c3;
        let c0 = this.coefs[0] / c3;
        let a = (3 * c1 - c2 * c2) / 3;
        let b = (2 * c2 * c2 * c2 - 9 * c1 * c2 + 27 * c0) / 27;
        let offset = c2 / 3;
        let discrim = b * b / 4 + a * a * a / 27;
        let halfB = b / 2;
        if (Math.abs(discrim) <= Polynomial.TOLERANCE) discrim = 0;
        if (discrim > 0) {
            let e = Math.sqrt(discrim);
            let tmp;
            let root;
            tmp = -halfB + e;
            if (tmp >= 0) root = Math.pow(tmp, 1 / 3);
            else root = -Math.pow(-tmp, 1 / 3);
            tmp = -halfB - e;
            if (tmp >= 0) root += Math.pow(tmp, 1 / 3);
            else root -= Math.pow(-tmp, 1 / 3);
            roots[0] = root - offset;
        } else if (discrim < 0) {
            let distance = Math.sqrt(-a / 3);
            let angle = Math.atan2(Math.sqrt(-discrim), -halfB) / 3;
            let cos = Math.cos(angle);
            let sin = Math.sin(angle);
            let sqrt3 = Math.sqrt(3);
            roots[0] = 2 * distance * cos - offset;
            roots[1] = -distance * (cos + sqrt3 * sin) - offset;
            roots[2] = -distance * (cos - sqrt3 * sin) - offset;
        } else {
            let tmp;
            if (halfB >= 0) tmp = -Math.pow(halfB, 1 / 3);
            else tmp = Math.pow(-halfB, 1 / 3);
            roots[0] = 2 * tmp - offset;
            roots[1] = -tmp - offset;
        }
    }
    return roots;
};
let qpol = new Polynomial(0,0,0);
let dpol = new Array();
for(let i = 0; i < 12; ++i){
    let pol = new Polynomial(0);
    for(let j = 1; j < i + 1; j++)
        pol.coefs.push(0);
    pol.degree = i;
    dpol.push(pol);
}
let pol33 = new Polynomial(0,0,0,0,0,0,0,0,0,0);
let pol61 = new Polynomial(0,0,0,0,0,0);
let pol41 = new Polynomial(0,0,0,0);
let pol42 = new Polynomial(0,0,0,0);
Polynomial.prototype.getQuarticRoots = function (roots) {
    if (this.getDegree() == 4) {
        let c4 = this.coefs[4];
        let c3 = this.coefs[3] / c4;
        let c2 = this.coefs[2] / c4;
        let c1 = this.coefs[1] / c4;
        let c0 = this.coefs[0] / c4;
        for(let i = 0; i < roots1.length; ++i)
            roots1[i] = -1;
        qpol.coefs[3] = 1;
        qpol.coefs[2] = -c2;
        qpol.coefs[1] = c3 * c1 - 4 * c0;
        qpol.coefs[0] = -c3 * c3 * c0 + 4 * c2 * c0 - c1 * c1;
        //let resolveRoots = new Polynomial(1, -c2, c3 * c1 - 4 * c0, -c3 * c3 * c0 + 4 * c2 * c0 - c1 * c1).getCubicRoots(roots1);
        let resolveRoots = qpol.getCubicRoots(roots1);
        let y = resolveRoots[0];
        let discrim = c3 * c3 / 4 - c2 + y;
        if (Math.abs(discrim) <= Polynomial.TOLERANCE) discrim = 0;
        if (discrim > 0) {
            let e = Math.sqrt(discrim);
            let t1 = 3 * c3 * c3 / 4 - e * e - 2 * c2;
            let t2 = (4 * c3 * c2 - 8 * c1 - c3 * c3 * c3) / (4 * e);
            let plus = t1 + t2;
            let minus = t1 - t2;
            if (Math.abs(plus) <= Polynomial.TOLERANCE) plus = 0;
            if (Math.abs(minus) <= Polynomial.TOLERANCE) minus = 0;
            let ii = 0;
            if (plus >= 0) {
                let f = Math.sqrt(plus);
                roots[ii + 0] = -c3 / 4 + (e + f) / 2;
                roots[ii + 1] = -c3 / 4 + (e - f) / 2;
                ii += 2;
            }
            if (minus >= 0) {
                let f = Math.sqrt(minus);
                roots[ii + 0] = -c3 / 4 + (f - e) / 2;
                roots[ii + 1] = -c3 / 4 - (f + e) / 2;
            }
        } else if (discrim < 0) {} else {
            let t2 = y * y - 4 * c0;
            if (t2 >= -Polynomial.TOLERANCE) {
                if (t2 < 0) t2 = 0;
                t2 = 2 * Math.sqrt(t2);
                let t1 = 3 * c3 * c3 / 4 - 2 * c2;
                let ii = 0;
                if (t1 + t2 >= Polynomial.TOLERANCE) {
                    let d = Math.sqrt(t1 + t2);
                    roots[ii + 0] = -c3 / 4 + d / 2;
                    roots[ii + 1] = -c3 / 4 - d / 2;
                    ii += 2;
                }
                if (t1 - t2 >= Polynomial.TOLERANCE) {
                    let d = Math.sqrt(t1 - t2);
                    roots[ii + 0] = -c3 / 4 + d / 2;
                    roots[ii + 1] = -c3 / 4 - d / 2;
                }
            }
        }
    }
    return roots;
};

function Vector2D(x, y) {
    if (arguments.length > 0) {
        this.x = x;
        this.y = y;
    }
}
Vector2D.prototype.length = function () {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
Vector2D.prototype.dot = function (that) {
    return this.x * that.x + this.y * that.y;
};
Vector2D.prototype.cross = function (that) {
    return this.x * that.y - this.y * that.x;
}
Vector2D.prototype.unit = function () {
    return this.divide(this.length());
};
Vector2D.prototype.unitEquals = function () {
    this.divideEquals(this.length());
    return this;
};
Vector2D.prototype.add = function (that) {
    this.x += that.x, this.y += that.y;
    return this;
};
Vector2D.prototype.addEquals = function (that) {
    this.x += that.x;
    this.y += that.y;
    return this;
};
Vector2D.prototype.subtract = function (that) {
    return new Vector2D(this.x - that.x, this.y - that.y);
};
Vector2D.prototype.subtractEquals = function (that) {
    this.x -= that.x;
    this.y -= that.y;
    return this;
};
Vector2D.prototype.multiply = function (scalar) {
    this.x *= scalar, this.y *= scalar;
    return this;
};
Vector2D.prototype.multiplyEquals = function (scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
};
Vector2D.prototype.divide = function (scalar) {
    return new Vector2D(this.x / scalar, this.y / scalar);
};
Vector2D.prototype.divideEquals = function (scalar) {
    this.x /= scalar;
    this.y /= scalar;
    return this;
};
Vector2D.prototype.perp = function () {
    return new Vector2D(-this.y, this.x);
};
Vector2D.prototype.perpendicular = function (that) {
    return this.subtract(this.project(that));
};
Vector2D.prototype.project = function (that) {
    let percent = this.dot(that) / that.dot(that);
    return that.multiply(percent);
};
Vector2D.prototype.toString = function () {
    return this.x + "," + this.y;
};
Vector2D.fromPoints = function (p1, p2) {
    return new Vector2D(p2.x - p1.x, p2.y - p1.y);
};
Shape.prototype.constructor = Shape;

function Shape(svgNode) {
    if (arguments.length > 0) {
        this.init(svgNode);
    }
}
Shape.prototype.init = function (svgNode) {
    this.svgNode = svgNode;
    this.locked = false;
    this.visible = true;
    this.selected = false;
    this.callback = null;
    this.lastUpdate = null;
}
Shape.prototype.show = function (state) {
    let display = (state) ? "inline" : "none";
    this.visible = state;
    this.svgNode.setAttributeNS(null, "display", display);
};
Shape.prototype.refresh = function () {};
Shape.prototype.update = function () {
    this.refresh();
    if (this.owner) this.owner.update(this);
    if (this.callback != null) this.callback(this);
};
Shape.prototype.translate = function (delta) {};
Shape.prototype.select = function (state) {
    this.selected = state;
};
Shape.prototype.registerHandles = function () {};
Shape.prototype.unregisterHandles = function () {};
Shape.prototype.selectHandles = function (select) {};
Shape.prototype.showHandles = function (state) {};

Circle.prototype = new Shape();
Circle.prototype.constructor = Circle;
Circle.superclass = Shape.prototype;

function Circle() {
    this.init();
}
Circle.prototype.init = function (svgNode) {
    if (svgNode == null || svgNode.localName == "circle") {
        Circle.superclass.init.call(this, svgNode);
        let cx = 0; //parseFloat(svgNode.getAttributeNS(null, "cx"));
        let cy = 0; // parseFloat(svgNode.getAttributeNS(null, "cy"));
        let r = 1; //parseFloat(svgNode.getAttributeNS(null, "r"));
        this.center = new Handle(cx, cy, this);
        this.last = new Point2D(cx, cy);
        this.radius = new Handle(cx + r, cy, this);
    } else {
        throw new Error("Circle.init: Invalid SVG Node: " + svgNode.localName);
    }
    this.ip = new IntersectionParams("Circle", [null, null]);
    this.getIntersectionParams();
};
Circle.prototype.realize = function () {
    if (this.svgNode != null) {
        this.center.realize();
        this.radius.realize();
        this.center.show(false);
        this.radius.show(false);
    }
};
Circle.prototype.translate = function (delta) {
    this.center.translate(delta);
    this.radius.translate(delta);
    this.refresh();
};
Circle.prototype.refresh = function () {
    let r = this.radius.point.distanceFrom(this.center.point);
    this.svgNode.setAttributeNS(null, "cx", this.center.point.x);
    this.svgNode.setAttributeNS(null, "cy", this.center.point.y);
    this.svgNode.setAttributeNS(null, "r", r);
};
Circle.prototype.registerHandles = function () {
    mouser.register(this.center);
    mouser.register(this.radius);
};
Circle.prototype.unregisterHandles = function () {
    mouser.unregister(this.center);
    mouser.unregister(this.radius);
};
Circle.prototype.selectHandles = function (select) {
    this.center.select(select);
    this.radius.select(select);
};
Circle.prototype.showHandles = function (state) {
    this.center.show(state);
    this.radius.show(state);
};
Circle.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.center.point;
    this.ip.params[1] = this.radius.point.x - this.center.point.x;
    return this.ip;
};
Ellipse.prototype = new Shape();
Ellipse.prototype.constructor = Ellipse;
Ellipse.superclass = Shape.prototype;

function Ellipse(svgNode) {
    if (arguments.length > 0) {
        this.init(svgNode);
    }
}
Ellipse.prototype.init = function (svgNode) {
    if (svgNode == null || svgNode.localName != "ellipse")
        throw new Error("Ellipse.init: Invalid localName: " + svgNode.localName);
    Ellipse.superclass.init.call(this, svgNode);
    let cx = parseFloat(svgNode.getAttributeNS(null, "cx"));
    let cy = parseFloat(svgNode.getAttributeNS(null, "cy"));
    let rx = parseFloat(svgNode.getAttributeNS(null, "rx"));
    let ry = parseFloat(svgNode.getAttributeNS(null, "ry"));
    this.center = new Handle(cx, cy, this);
    this.radiusX = new Handle(cx + rx, cy, this);
    this.radiusY = new Handle(cx, cy + ry, this);
    this.ip = new IntersectionParams("Ellipse", [null, null, null]);
    this.getIntersectionParams();
};
Ellipse.prototype.realize = function () {
    this.center.realize();
    this.radiusX.realize();
    this.radiusY.realize();
    this.center.show(false);
    this.radiusX.show(false);
    this.radiusY.show(false);
};
Ellipse.prototype.refresh = function () {
    let rx = Math.abs(this.center.point.x - this.radiusX.point.x);
    let ry = Math.abs(this.center.point.y - this.radiusY.point.y);
    this.svgNode.setAttributeNS(null, "cx", this.center.point.x);
    this.svgNode.setAttributeNS(null, "cy", this.center.point.y);
    this.svgNode.setAttributeNS(null, "rx", rx);
    this.svgNode.setAttributeNS(null, "ry", ry);
};
Ellipse.prototype.registerHandles = function () {
    mouser.register(this.center);
    mouser.register(this.radiusX);
    mouser.register(this.radiusY);
};
Ellipse.prototype.unregisterHandles = function () {
    mouser.unregister(this.center);
    mouser.unregister(this.radiusX);
    mouser.unregister(this.radiusY);
};
Ellipse.prototype.selectHandles = function (select) {
    this.center.select(select);
    this.radiusX.select(select);
    this.radiusY.select(select);
};
Ellipse.prototype.showHandles = function (state) {
    this.center.show(state);
    this.radiusX.show(state);
    this.radiusY.show(state);
};
Ellipse.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.center.point;
    this.ip.params[1] = parseFloat(this.svgNode.getAttributeNS(null, "rx")), this.ip.params[2] = parseFloat(this.svgNode.getAttributeNS(null, "ry"));
    return ip;
};
Handle.prototype = new Shape();
Handle.prototype.constructor = Handle;
Handle.superclass = Shape.prototype;
Handle.NO_CONSTRAINTS = 0;
Handle.CONSTRAIN_X = 1;
Handle.CONSTRAIN_Y = 2;

function Handle(x, y, owner) {
    if (arguments.length > 0) {
        this.init(x, y, owner);
    }
}
Handle.prototype.init = function (x, y, owner) {
    Handle.superclass.init.call(this, null);
    this.point = new Point2D(x, y);
    this.owner = owner;
    this.constrain = Handle.NO_CONSTRAINTS;
}
Handle.prototype.realize = function () {
};
Handle.prototype.unrealize = function () {
};
Handle.prototype.translate = function (delta) {
    if (this.constrain == Handle.CONSTRAIN_X) {
        this.point.x += delta.x;
    } else if (this.constrain == Handle.CONSTRAIN_Y) {
        this.point.y += delta.y;
    } else {
        this.point.addEquals(delta);
    }
    this.refresh();
};
Handle.prototype.refresh = function () {
};
Handle.prototype.select = function (state) {
};
Line.prototype = new Shape();
Line.prototype.constructor = Line;
Line.superclass = Shape.prototype;

function Line(svgNode) {
    if (arguments.length > 0) {
        this.init(svgNode);
    }
}
Line.prototype.init = function (svgNode) {
    if (svgNode == null || svgNode.localName != "line")
        throw new Error("Line.init: Invalid localName: " + svgNode.localName);
    Line.superclass.init.call(this, svgNode);
    let x1 = parseFloat(svgNode.getAttributeNS(null, "x1"));
    let y1 = parseFloat(svgNode.getAttributeNS(null, "y1"));
    let x2 = parseFloat(svgNode.getAttributeNS(null, "x2"));
    let y2 = parseFloat(svgNode.getAttributeNS(null, "y2"));
    this.p1 = new Handle(x1, y1, this);
    this.p2 = new Handle(x2, y2, this);
    this.ip = new IntersectionParams("Line", [null, null]);
    this.getIntersectionParams();
};
Line.prototype.realize = function () {
    this.p1.realize();
    this.p2.realize();
    this.p1.show(false);
    this.p2.show(false);
};
Line.prototype.refresh = function () {
    this.svgNode.setAttributeNS(null, "x1", this.p1.point.x);
    this.svgNode.setAttributeNS(null, "y1", this.p1.point.y);
    this.svgNode.setAttributeNS(null, "x2", this.p2.point.x);
    this.svgNode.setAttributeNS(null, "y2", this.p2.point.y);
};
Line.prototype.registerHandles = function () {
    mouser.register(this.p1);
    mouser.register(this.p2);
};
Line.prototype.unregisterHandles = function () {
    mouser.unregister(this.p1);
    mouser.unregister(this.p2);
};
Line.prototype.selectHandles = function (select) {
    this.p1.select(select);
    this.p2.select(select);
};
Line.prototype.showHandles = function (state) {
    this.p1.show(state);
    this.p2.show(state);
};
Line.prototype.cut = function (t) {
    let cutPoint = this.p1.point.lerp(this.p2.point, t);
    let newLine = this.svgNode.cloneNode(true);
    this.p2.point.setFromPoint(cutPoint);
    this.p2.update();
    if (this.svgNode.nextSibling != null) this.svgNode.parentNode.insertBefore(newLine, this.svgNode.nextSibling);
    else this.svgNode.parentNode.appendChild(newLine);
    let line = new Line(newLine);
    line.realize();
    line.p1.point.setFromPoint(cutPoint);
    line.p1.update();
};
Line.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.p1.point;
    this.ip.params[1] = this.p2.point;
    return ip;
};

function Token(type, text) {
    if (arguments.length > 0) {
        this.init(type, text);
    }
}
Token.prototype.init = function (type, text) {
    this.type = type;
    this.text = text;
};
Token.prototype.typeis = function (type) {
    return this.type == type;
}
Path.prototype = new Shape();
Path.prototype.constructor = Path;
Path.superclass = Shape.prototype;
Path.COMMAND = 0;
Path.NUMBER = 1;
Path.EOD = 2;
Path.PARAMS = {
    A: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
    a: ["rx", "ry", "x-axis-rotation", "large-arc-flag", "sweep-flag", "x", "y"],
    C: ["x1", "y1", "x2", "y2", "x", "y"],
    c: ["x1", "y1", "x2", "y2", "x", "y"],
    H: ["x"],
    h: ["x"],
    L: ["x", "y"],
    l: ["x", "y"],
    M: ["x", "y"],
    m: ["x", "y"],
    Q: ["x1", "y1", "x", "y"],
    q: ["x1", "y1", "x", "y"],
    S: ["x2", "y2", "x", "y"],
    s: ["x2", "y2", "x", "y"],
    T: ["x", "y"],
    t: ["x", "y"],
    V: ["y"],
    v: ["y"],
    Z: [],
    z: []
};

function Path() {
    this.init();
}
Path.prototype.init = function (svgNode) {
    this.ip = new IntersectionParams("Path", []);
    this.getIntersectionParams();
};
Path.prototype.realize = function () {
    for (let i = 0; i < this.segments.length; i++) {
        this.segments[i].realize();
    }
};
Path.prototype.unrealize = function () {
    for (let i = 0; i < this.segments.length; i++) {
        this.segments[i].unrealize();
    }
};
Path.prototype.refresh = function () {
    let d = new Array();
    for (let i = 0; i < this.segments.length; i++) {
        d.push(this.segments[i].toString());
    }
    this.svgNode.setAttributeNS(null, "d", d.join(" "));
};
Path.prototype.registerHandles = function () {
    for (let i = 0; i < this.segments.length; i++) {
        this.segments[i].registerHandles();
    }
};
Path.prototype.unregisterHandles = function () {
    for (let i = 0; i < this.segments.length; i++) {
        this.segments[i].unregisterHandles();
    }
};
Path.prototype.selectHandles = function (select) {
    for (let i = 0; i < this.segments.length; i++) {
        this.segments[i].selectHandles(select);
    }
};
Path.prototype.showHandles = function (state) {
    for (let i = 0; i < this.segments.length; i++) {
        this.segments[i].showHandles(state);
    }
};
Path.prototype.appendPathSegment = function (segment) {
    segment.previous = this.segments[this.segments.length - 1];
    this.segments.push(segment);
};
Path.prototype.parseData = function (d) {
    let tokens = this.tokenize(d);
    let index = 0;
    let token = tokens[index];
    let mode = "BOD";
    this.segments = new Array();
    while (!token.typeis(Path.EOD)) {
        let param_length;
        let params = new Array();
        if (mode == "BOD") {
            if (token.text == "M" || token.text == "m") {
                index++;
                param_length = Path.PARAMS[token.text].length;
                mode = token.text;
            } else {
                throw new Error("Path data must begin with a moveto command");
            }
        } else {
            if (token.typeis(Path.NUMBER)) {
                param_length = Path.PARAMS[mode].length;
            } else {
                index++;
                param_length = Path.PARAMS[token.text].length;
                mode = token.text;
            }
        } if ((index + param_length) < tokens.length) {
            for (let i = index; i < index + param_length; i++) {
                let number = tokens[i];
                if (number.typeis(Path.NUMBER)) params[params.length] = number.text;
                else throw new Error("Parameter type is not a number: " + mode + "," + number.text);
            }
            let segment;
            let length = this.segments.length;
            let previous = (length == 0) ? null : this.segments[length - 1];
            if((mode == "C" || mode == "c") && params[2] == params[4] && params[3] == params[5]) {
                mode = mode == "C" ? "L" : "l";
                params = [params[4], params[5]];
            }
            switch (mode) {
            case "A":
                segment = new AbsoluteArcPath(params, this, previous);
                break;
            case "C":
                segment = new AbsoluteCurveto3(params, this, previous);
                break;
            case "c":
                segment = new RelativeCurveto3(params, this, previous);
                break;
            case "H":
                segment = new AbsoluteHLineto(params, this, previous);
                break;
            case "L":
                segment = new AbsoluteLineto(params, this, previous);
                break;
            case "l":
                segment = new RelativeLineto(params, this, previous);
                break;
            case "M":
                segment = new AbsoluteMoveto(params, this, previous);
                break;
            case "m":
                segment = new RelativeMoveto(params, this, previous);
                break;
            case "Q":
                segment = new AbsoluteCurveto2(params, this, previous);
                break;
            case "q":
                segment = new RelativeCurveto2(params, this, previous);
                break;
            case "S":
                segment = new AbsoluteSmoothCurveto3(params, this, previous);
                break;
            case "s":
                segment = new RelativeSmoothCurveto3(params, this, previous);
                break;
            case "T":
                segment = new AbsoluteSmoothCurveto2(params, this, previous);
                break;
            case "t":
                segment = new RelativeSmoothCurveto2(params, this, previous);
                break;
            case "Z":
                segment = new RelativeClosePath(params, this, previous);
                break;
            case "z":
                segment = new RelativeClosePath(params, this, previous);
                break;
            default:
                throw new Error("Unsupported segment type: " + mode);
            };
            this.segments.push(segment);
            index += param_length;
            token = tokens[index];
            if (mode == "M") mode = "L";
            if (mode == "m") mode = "l";
            this.ip = new IntersectionParams("Path", []);
        } else {
            throw new Error("Path data ended before all parameters were found");
        }
    }
}
Path.prototype.tokenize = function (d) {
    let tokens = new Array();
    while (d != "") {
        if (d.match(/^([ \t\r\n,]+)/)) {
            d = d.substr(RegExp.$1.length);
        } else if (d.match(/^([aAcChHlLmMqQsStTvVzZ])/)) {
            tokens[tokens.length] = new Token(Path.COMMAND, RegExp.$1);
            d = d.substr(RegExp.$1.length);
        } else if (d.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) {
            tokens[tokens.length] = new Token(Path.NUMBER, parseFloat(RegExp.$1));
            d = d.substr(RegExp.$1.length);
        } else {
            throw new Error("Unrecognized segment command: " + d);
        }
    }
    tokens[tokens.length] = new Token(Path.EOD, null);
    return tokens;
}
Path.prototype.intersectShape = intersectShape;

function intersectShape(shape, ret) {
    let last = this.segments.length;
    let shape2 = shape;
    let ip2 = shape2.ip;//getIntersectionParams();
    if (ip2 == null) return;
    for (let i = 0; i < last; i++) {
        let shape1 = this.segments[i];
        let ip1 = shape1.ip;//getIntersectionParams();
        if (ip1 != null) {
            if (ip1.name == "Path") {
                shape1.intersectShape(shape2, ret);
                //Intersection.intersectPathShape(shape1, shape2, ret);
            } else if (ip2.name == "Path") {
                shape2.intersectShape(shape1, ret);
                //Intersection.intersectPathShape(shape2, shape1, ret);
            } else {
                let method;
                //let params;
                if (ip1.name < ip2.name) {
                    method = "intersect" + ip1.name + ip2.name;
                    if(method == "intersectBezier3Bezier3") {
                        ib3b3(ip1.params[0], ip1.params[1], ip1.params[2], ip1.params[3], ip2.params[0], ip2.params[1], ip2.params[2], ip2.params[3], ret);
                    }
                    else if (method == "intersectBezier3Line") {
                        ib3l(ip1.params[0], ip1.params[1], ip1.params[2], ip1.params[3], ip2.params[0], ip2.params[1], ret); 
                    }
                    else if (method == "intersectBezier3Circle") {
                        ib3e(ip1.params[0], ip1.params[1], ip1.params[2], ip1.params[3], ip2.params[0], ip2.params[1], ip2.params[1], ret); 
                    }
                    //params = ip1.params.concat(ip2.params);
                } else {
                    method = "intersect" + ip2.name + ip1.name;
                    //params = ip2.params.concat(ip1.params);
                    if(method == "intersectBezier3Bezier3") {
                        ib3b3(ip2.params[0], ip2.params[1], ip2.params[2], ip2.params[3], ip1.params[0], ip1.params[1], ip1.params[2], ip1.params[3], ret);
                    }
                    else if (method == "intersectBezier3Line") {
                        ib3l(ip2.params[0], ip2.params[1], ip2.params[2], ip2.params[3], ip1.params[0], ip1.params[1], ret); 
                    }
                    else if (method == "intersectBezier3Circle") {
                        ib3e(ip1.params[0], ip1.params[1], ip1.params[2], ip1.params[3], ip1.params[0], ip2.params[1], ip2.params[1], ret); 
                    }
                }
                //else {
                //    params.push(ret);
                //    Intersection[method].apply(null, params);
                //}
            }
        }
    }
    return ret;
};
Path.prototype.getIntersectionParams = function () {
    return this.ip;
};

function AbsolutePathSegment(command, params, owner, previous) {
    if (arguments.length > 0) this.init(command, params, owner, previous);
};
AbsolutePathSegment.prototype.init = function (command, params, owner, previous) {
    this.command = command;
    this.owner = owner;
    this.previous = previous;
    this.handles = new Array();
    let index = 0;
    while (index < params.length) {
        let handle = new Handle(params[index], params[index + 1], owner);
        this.handles.push(handle);
        index += 2;
    }
};
AbsolutePathSegment.prototype.realize = function () {
    for (let i = 0; i < this.handles.length; i++) {
        let handle = this.handles[i];
        handle.realize();
        handle.show(false);
    }
};
AbsolutePathSegment.prototype.unrealize = function () {
    for (let i = 0; i < this.handles.length; i++) {
        this.handles[i].unrealize();
    }
};
AbsolutePathSegment.prototype.registerHandles = function () {
    for (let i = 0; i < this.handles.length; i++) {
        mouser.register(this.handles[i]);
    }
};
AbsolutePathSegment.prototype.unregisterHandles = function () {
    for (let i = 0; i < this.handles.length; i++) {
        mouser.unregister(this.handles[i]);
    }
};
AbsolutePathSegment.prototype.selectHandles = function (select) {
    for (let i = 0; i < this.handles.length; i++) {
        this.handles[i].select(select);
    }
};
AbsolutePathSegment.prototype.showHandles = function (state) {
    for (let i = 0; i < this.handles.length; i++) {
        this.handles[i].show(state);
    }
};
AbsolutePathSegment.prototype.toString = function () {
    let points = new Array();
    let command = "";
    if (this.previous == null || this.previous.constructor != this.constuctor) command = this.command;
    for (let i = 0; i < this.handles.length; i++) {
        points.push(this.handles[i].point.toString());
    }
    return command + points.join(" ");
};
AbsolutePathSegment.prototype.getLastPoint = function () {
    return this.handles[this.handles.length - 1].point;
};
AbsolutePathSegment.prototype.getIntersectionParams = function () {
    return null;
};
AbsoluteArcPath.prototype = new AbsolutePathSegment();
AbsoluteArcPath.prototype.constructor = AbsoluteArcPath;
AbsoluteArcPath.superclass = AbsolutePathSegment.prototype;

function AbsoluteArcPath(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("A", params, owner, previous);
    }
}
AbsoluteArcPath.prototype.init = function (command, params, owner, previous) {
    let point = new Array();
    let y = params.pop();
    let x = params.pop();
    point.push(x, y);
    AbsoluteArcPath.superclass.init.call(this, command, point, owner, previous);
    this.rx = parseFloat(params.shift());
    this.ry = parseFloat(params.shift());
    this.angle = parseFloat(params.shift());
    this.arcFlag = parseFloat(params.shift());
    this.sweepFlag = parseFloat(params.shift());
};
AbsoluteArcPath.prototype.toString = function () {
    let points = new Array();
    let command = "";
    if (this.previous.constructor != this.constuctor) command = this.command;
    return command + [this.rx, this.ry, this.angle, this.arcFlag, this.sweepFlag, this.handles[0].point.toString()].join(",");
};
AbsoluteArcPath.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.getCenter();
    this.params[1] = this.rx;
    this.params[2] = this.ry;
    return ip;
};
AbsoluteArcPath.prototype.getCenter = function () {
    let startPoint = this.previous.getLastPoint();
    let endPoint = this.handles[0].point;
    let rx = this.rx;
    let ry = this.ry;
    let angle = this.angle * Math.PI / 180;
    let c = Math.cos(angle);
    let s = Math.sin(angle);
    let TOLERANCE = 1e-6;
    let halfDiff = startPoint.subtract(endPoint).divide(2);
    let x1p = halfDiff.x * c + halfDiff.y * s;
    let y1p = halfDiff.x * -s + halfDiff.y * c;
    let x1px1p = x1p * x1p;
    let y1py1p = y1p * y1p;
    let lambda = (x1px1p / (rx * rx)) + (y1py1p / (ry * ry));
    if (lambda > 1) {
        let factor = Math.sqrt(lambda);
        rx *= factor;
        ry *= factor;
    }
    let rxrx = rx * rx;
    let ryry = ry * ry;
    let rxy1 = rxrx * y1py1p;
    let ryx1 = ryry * x1px1p;
    let factor = (rxrx * ryry - rxy1 - ryx1) / (rxy1 + ryx1);
    if (Math.abs(factor) < TOLERANCE) factor = 0;
    let sq = Math.sqrt(factor);
    if (this.arcFlag == this.sweepFlag) sq = -sq;
    let mid = startPoint.add(endPoint).divide(2);
    let cxp = sq * rx * y1p / ry;
    let cyp = sq * -ry * x1p / rx;
    return new Point2D(cxp * c - cyp * s + mid.x, cxp * s + cyp * c + mid.y);
};
AbsoluteCurveto2.prototype = new AbsolutePathSegment();
AbsoluteCurveto2.prototype.constructor = AbsoluteCurveto2;
AbsoluteCurveto2.superclass = AbsolutePathSegment.prototype;

function AbsoluteCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("Q", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier2", [null, null, null]);
}
AbsoluteCurveto2.prototype.getControlPoint = function () {
    return this.handles[0].point;
};
AbsoluteCurveto2.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.handles[0].point;
    this.ip.params[2] = this.handles[1].point;
    return this.ip;
};
AbsoluteCurveto3.prototype = new AbsolutePathSegment();
AbsoluteCurveto3.prototype.constructor = AbsoluteCurveto3;
AbsoluteCurveto3.superclass = AbsolutePathSegment.prototype;

function AbsoluteCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("C", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier3", [null, null, null, null]);
    this.getIntersectionParams();
}
AbsoluteCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[1].point;
};
AbsoluteCurveto3.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.handles[0].point;
    this.ip.params[2] = this.handles[1].point;
    this.ip.params[3] = this.handles[2].point;
    return this.ip;
};
AbsoluteHLineto.prototype = new AbsolutePathSegment();
AbsoluteHLineto.prototype.constructor = AbsoluteHLineto;
AbsoluteHLineto.superclass = AbsolutePathSegment.prototype;

function AbsoluteHLineto(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("H", params, owner, previous);
    }
}
AbsoluteHLineto.prototype.init = function (command, params, owner, previous) {
    let prevPoint = previous.getLastPoint();
    let point = new Array();
    point.push(params.pop(), prevPoint.y);
    AbsoluteHLineto.superclass.init.call(this, command, point, owner, previous);
};
AbsoluteHLineto.prototype.toString = function () {
    let points = new Array();
    let command = "";
    if (this.previous.constructor != this.constuctor) command = this.command;
    return command + this.handles[0].point.x;
};
AbsoluteLineto.prototype = new AbsolutePathSegment();
AbsoluteLineto.prototype.constructor = AbsoluteLineto;
AbsoluteLineto.superclass = AbsolutePathSegment.prototype;

function AbsoluteLineto(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("L", params, owner, previous);
    }
    this.ip = new IntersectionParams("Line", [null, null]);
    this.getIntersectionParams();
}
AbsoluteLineto.prototype.toString = function () {
    let points = new Array();
    let command = "";
    if (this.previous.constructor != this.constuctor)
        if (this.previous.constructor != AbsoluteMoveto) command = this.command;
    return command + this.handles[0].point.toString();
};
AbsoluteLineto.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.handles[0].point;
    return this.ip;
};
AbsoluteMoveto.prototype = new AbsolutePathSegment();
AbsoluteMoveto.prototype.constructor = AbsoluteMoveto;
AbsoluteMoveto.superclass = AbsolutePathSegment.prototype;

function AbsoluteMoveto(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("M", params, owner, previous);
    }
}
AbsoluteMoveto.prototype.toString = function () {
    return "M" + this.handles[0].point.toString();
};
AbsoluteSmoothCurveto2.prototype = new AbsolutePathSegment();
AbsoluteSmoothCurveto2.prototype.constructor = AbsoluteSmoothCurveto2;
AbsoluteSmoothCurveto2.superclass = AbsolutePathSegment.prototype;

function AbsoluteSmoothCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("T", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier2", [null, null, null]);
}
AbsoluteSmoothCurveto2.prototype.getControlPoint = function () {
    let lastPoint = this.previous.getLastPoint();
    let point;
    if (this.previous.command.match(/^[QqTt]$/)) {
        let ctrlPoint = this.previous.getControlPoint();
        let diff = ctrlPoint.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
AbsoluteSmoothCurveto2.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.getControlPoint();
    this.ip.params[2] = this.handles[0].point;
    return this.ip;
};
AbsoluteSmoothCurveto3.prototype = new AbsolutePathSegment();
AbsoluteSmoothCurveto3.prototype.constructor = AbsoluteSmoothCurveto3;
AbsoluteSmoothCurveto3.superclass = AbsolutePathSegment.prototype;

function AbsoluteSmoothCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("S", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier3", [null, null, null, null]);
    this.getIntersectionParams();
}
AbsoluteSmoothCurveto3.prototype.getFirstControlPoint = function () {
    let lastPoint = this.previous.getLastPoint();
    let point;
    if (this.previous.command.match(/^[SsCc]$/)) {
        let lastControl = this.previous.getLastControlPoint();
        let diff = lastControl.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
AbsoluteSmoothCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[0].point;
};
AbsoluteSmoothCurveto3.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.getFirstControlPoint();
    this.ip.params[2] = this.handles[0].point;
    this.ip.params[3] = this.handles[1].point;
    return this.ip;
};
RelativePathSegment.prototype = new AbsolutePathSegment();
RelativePathSegment.prototype.constructor = RelativePathSegment;
RelativePathSegment.superclass = AbsolutePathSegment.prototype;

function RelativePathSegment(command, params, owner, previous) {
    if (arguments.length > 0) this.init(command, params, owner, previous);
}
RelativePathSegment.prototype.init = function (command, params, owner, previous) {
    this.command = command;
    this.owner = owner;
    this.previous = previous;
    this.handles = new Array();
    let lastPoint;
    if (this.previous) lastPoint = this.previous.getLastPoint();
    else lastPoint = new Point2D(0, 0);
    let index = 0;
    while (index < params.length) {
        let handle = new Handle(lastPoint.x + params[index], lastPoint.y + params[index + 1], owner);
        this.handles.push(handle);
        index += 2;
    }
};
RelativePathSegment.prototype.toString = function () {
    let points = new Array();
    let command = "";
    let lastPoint;
    if (this.previous) lastPoint = this.previous.getLastPoint();
    else lastPoint = new Point2D(0, 0); if (this.previous == null || this.previous.constructor != this.constructor) command = this.command;
    for (let i = 0; i < this.handles.length; i++) {
        let point = this.handles[i].point.subtract(lastPoint);
        points.push(point.toString());
    }
    return command + points.join(" ");
};
RelativeClosePath.prototype = new RelativePathSegment();
RelativeClosePath.prototype.constructor = RelativeClosePath;
RelativeClosePath.superclass = RelativePathSegment.prototype;

function RelativeClosePath(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("z", params, owner, previous);
    }
    this.ip = new IntersectionParams("Line", [null, null]);
    this.getIntersectionParams();
}
RelativeClosePath.prototype.getLastPoint = function () {
    let current = this.previous;
    let point;
    while (current) {
        if (current.command.match(/^[mMzZ]$/)) {
            point = current.getLastPoint();
            break;
        }
        current = current.previous;
    }
    return point;
};
RelativeClosePath.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.getLastPoint();
    return this.ip;
};
RelativeCurveto2.prototype = new RelativePathSegment();
RelativeCurveto2.prototype.constructor = RelativeCurveto2;
RelativeCurveto2.superclass = RelativePathSegment.prototype;

function RelativeCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("q", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier2", [null, null, null]);
}
RelativeCurveto2.prototype.getControlPoint = function () {
    return this.handles[0].point;
};
RelativeCurveto2.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.handles[0].point;
    this.ip.params[2] = this.handles[1].point;
    return this.ip;
};
RelativeCurveto3.prototype = new RelativePathSegment();
RelativeCurveto3.prototype.constructor = RelativeCurveto3;
RelativeCurveto3.superclass = RelativePathSegment.prototype;

function RelativeCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("c", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier3", [null, null, null, null]);
}
RelativeCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[1].point;
};
RelativeCurveto3.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.handles[0].point;
    this.ip.params[2] = this.handles[1].point;
    this.ip.params[3] = this.handles[2].point;
    return this.ip;
};
RelativeLineto.prototype = new RelativePathSegment();
RelativeLineto.prototype.constructor = RelativeLineto;
RelativeLineto.superclass = RelativePathSegment.prototype;

function RelativeLineto(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("l", params, owner, previous);
    }
    this.ip = new IntersectionParams("Line", [null, null]);
    this.getIntersectionParams();
}
RelativeLineto.prototype.toString = function () {
    let points = new Array();
    let command = "";
    let lastPoint;
    let point;
    if (this.previous) lastPoint = this.previous.getLastPoint();
    else lastPoint = new Point(0, 0);
    point = this.handles[0].point.subtract(lastPoint);
    let cmd = "";
    if (this.previous.constructor != this.constuctor)
        if (this.previous.constructor != RelativeMoveto) cmd = this.command;
    return cmd + point.toString();
};
RelativeLineto.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.handles[0].point;
    return this.ip;
};
RelativeMoveto.prototype = new RelativePathSegment();
RelativeMoveto.prototype.constructor = RelativeMoveto;
RelativeMoveto.superclass = RelativePathSegment.prototype;

function RelativeMoveto(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("m", params, owner, previous);
    }
}
RelativeMoveto.prototype.toString = function () {
    return "m" + this.handles[0].point.toString();
};
RelativeSmoothCurveto2.prototype = new RelativePathSegment();
RelativeSmoothCurveto2.prototype.constructor = RelativeSmoothCurveto2;
RelativeSmoothCurveto2.superclass = RelativePathSegment.prototype;

function RelativeSmoothCurveto2(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("t", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier2", [null, null, null]);
}
RelativeSmoothCurveto2.prototype.getControlPoint = function () {
    let lastPoint = this.previous.getLastPoint();
    let point;
    if (this.previous.command.match(/^[QqTt]$/)) {
        let ctrlPoint = this.previous.getControlPoint();
        let diff = ctrlPoint.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
RelativeSmoothCurveto2.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.getControlPoint();
    this.ip.params[2] = this.handles[0].point;
    return this.ip;
};
RelativeSmoothCurveto3.prototype = new RelativePathSegment();
RelativeSmoothCurveto3.prototype.constructor = RelativeSmoothCurveto3;
RelativeSmoothCurveto3.superclass = RelativePathSegment.prototype;

function RelativeSmoothCurveto3(params, owner, previous) {
    if (arguments.length > 0) {
        this.init("s", params, owner, previous);
    }
    this.ip = new IntersectionParams("Bezier3", [null, null, null, null]);
}
RelativeSmoothCurveto3.prototype.getFirstControlPoint = function () {
    let lastPoint = this.previous.getLastPoint();
    let point;
    if (this.previous.command.match(/^[SsCc]$/)) {
        let lastControl = this.previous.getLastControlPoint();
        let diff = lastControl.subtract(lastPoint);
        point = lastPoint.subtract(diff);
    } else {
        point = lastPoint;
    }
    return point;
};
RelativeSmoothCurveto3.prototype.getLastControlPoint = function () {
    return this.handles[0].point;
};
RelativeSmoothCurveto3.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.previous.getLastPoint();
    this.ip.params[1] = this.getFirstControlPoint();
    this.ip.params[2] = this.handles[0].point;
    this.ip.params[3] = this.handles[1].point;
    return this.ip;
};
Polygon.prototype = new Shape();
Polygon.prototype.constructor = Polygon;
Polygon.superclass = Shape.prototype;

function Polygon(svgNode) {
    if (arguments.length > 0) {
        this.init(svgNode);
    }
}
Polygon.prototype.init = function (svgNode) {
    if (svgNode.localName == "polygon") {
        Polygon.superclass.init.call(this, svgNode);
        let points = svgNode.getAttributeNS(null, "points").split(/[\s,]+/);
        this.handles = new Array();
        for (let i = 0; i < points.length; i += 2) {
            let x = parseFloat(points[i]);
            let y = parseFloat(points[i + 1]);
            this.handles.push(new Handle(x, y, this));
        }
        this.ip = new IntersectionParams("Polygon", new Array(this.handles.length));
    } else {
        throw new Error("Polygon.init: Invalid SVG Node: " + svgNode.localName);
    }
};
Polygon.prototype.realize = function () {
    if (this.svgNode != null) {
        for (let i = 0; i < this.handles.length; i++) {
            this.handles[i].realize();
            this.handles[i].show(false);
        }
    }
};
Polygon.prototype.refresh = function () {
    let points = new Array();
    for (let i = 0; i < this.handles.length; i++) {
        points.push(this.handles[i].point.toString());
    }
    this.svgNode.setAttributeNS(null, "points", points.join(" "));
};
Polygon.prototype.registerHandles = function () {
    for (let i = 0; i < this.handles.length; i++) mouser.register(this.handles[i]);
};
Polygon.prototype.unregisterHandles = function () {
    for (let i = 0; i < this.handles.length; i++) mouser.unregister(this.handles[i]);
};
Polygon.prototype.selectHandles = function (select) {
    for (let i = 0; i < this.handles.length; i++) this.handles[i].select(select);
};
Polygon.prototype.showHandles = function (state) {
    for (let i = 0; i < this.handles.length; i++) this.handles[i].show(state);
};
Polygon.prototype.pointInPolygon = function (point) {
    let length = this.handles.length;
    let counter = 0;
    let x_inter;
    let p1 = this.handles[0].point;
    for (let i = 1; i <= length; i++) {
        let p2 = this.handles[i % length].point;
        if (point.y > Math.min(p1.y, p2.y)) {
            if (point.y <= Math.max(p1.y, p2.y)) {
                if (point.x <= Math.max(p1.x, p2.x)) {
                    if (p1.y != p2.y) {
                        x_inter = (point.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
                        if (p1.x == p2.x || point.x <= x_inter) {
                            counter++;
                        }
                    }
                }
            }
        }
        p1 = p2;
    }
    return (counter % 2 == 1);
};
Polygon.prototype.getIntersectionParams = function () {
    for (let i = 0; i < this.handles.length; i++) {
        this.ip.params[i] = this.handles[i].point;
    }
    return this.ip;
};
Polygon.prototype.getArea = function () {
    let area = 0;
    let length = this.handles.length;
    let neg = 0;
    let pos = 0;
    for (let i = 0; i < length; i++) {
        let h1 = this.handles[i].point;
        let h2 = this.handles[(i + 1) % length].point;
        area += (h1.x * h2.y - h2.x * h1.y);
    }
    return area / 2;
};
Polygon.prototype.getCentroid = function () {
    let length = this.handles.length;
    let area6x = 6 * this.getArea();
    let x_sum = 0;
    let y_sum = 0;
    for (let i = 0; i < length; i++) {
        let p1 = this.handles[i].point;
        let p2 = this.handles[(i + 1) % length].point;
        let cross = (p1.x * p2.y - p2.x * p1.y);
        x_sum += (p1.x + p2.x) * cross;
        y_sum += (p1.y + p2.y) * cross;
    }
    return new Point2D(x_sum / area6x, y_sum / area6x);
};
Polygon.prototype.isClockwise = function () {
    return this.getArea() < 0;
};
Polygon.prototype.isCounterClockwise = function () {
    return this.getArea() > 0;
};
Polygon.prototype.isConcave = function () {
    let positive = 0;
    let negative = 0;
    let length = this.handles.length;
    for (let i = 0; i < length; i++) {
        let p0 = this.handles[i].point;
        let p1 = this.handles[(i + 1) % length].point;
        let p2 = this.handles[(i + 2) % length].point;
        let v0 = Vector2D.fromPoints(p0, p1);
        let v1 = Vector2D.fromPoints(p1, p2);
        let cross = v0.cross(v1);
        if (cross < 0) {
            negative++;
        } else {
            positive++;
        }
    }
    return (negative != 0 && positive != 0);
};
Polygon.prototype.isConvex = function () {
    return !this.isConcave();
};
Rectangle.prototype = new Shape();
Rectangle.prototype.constructor = Rectangle;
Rectangle.superclass = Shape.prototype;

function Rectangle(svgNode) {
    if (arguments.length > 0) {
        this.init(svgNode);
    }
}
Rectangle.prototype.init = function (svgNode) {
    if (svgNode.localName == "rect") {
        Rectangle.superclass.init.call(this, svgNode);
        let x = parseFloat(svgNode.getAttributeNS(null, "x"));
        let y = parseFloat(svgNode.getAttributeNS(null, "y"));
        let width = parseFloat(svgNode.getAttributeNS(null, "width"));
        let height = parseFloat(svgNode.getAttributeNS(null, "height"));
        this.p1 = new Handle(x, y, this);
        this.p2 = new Handle(x + width, y + height, this);
        this.ip = new IntersectionParams("Rectangle", [null, null]);
    } else {
        throw new Error("Rectangle.init: Invalid SVG Node: " + svgNode.localName);
    }
};
Rectangle.prototype.realize = function () {
    if (this.svgNode != null) {
        this.p1.realize();
        this.p2.realize();
        this.p1.show(false);
        this.p2.show(false);
    }
};
Rectangle.prototype.refresh = function () {
    let min = this.p1.point.min(this.p2.point);
    let max = this.p1.point.max(this.p2.point);
    this.svgNode.setAttributeNS(null, "x", min.x);
    this.svgNode.setAttributeNS(null, "y", min.y);
    this.svgNode.setAttributeNS(null, "width", max.x - min.x);
    this.svgNode.setAttributeNS(null, "height", max.y - min.y);
};
Rectangle.prototype.registerHandles = function () {
    mouser.register(this.p1);
    mouser.register(this.p2);
};
Rectangle.prototype.unregisterHandles = function () {
    mouser.unregister(this.p1);
    mouser.unregister(this.p2);
};
Rectangle.prototype.selectHandles = function (select) {
    this.p1.select(select);
    this.p2.select(select);
};
Rectangle.prototype.showHandles = function (state) {
    this.p1.show(state);
    this.p2.show(state);
};
Rectangle.prototype.getIntersectionParams = function () {
    this.ip.params[0] = this.p1.point;
    this.ip.params[1] = this.p2.point;
    return this.ip;
};
