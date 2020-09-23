function QuadTree(points, axis, maxK) {
    this.left = null;
    this.right = null;
    this.axis = null;
    this.init(points, axis, maxK);
}

QuadTree.prototype.init = function (points, axis, maxK) {
    if(points.length <= maxK) {
        this.left = points;
        this.threshold = Infinity;
        this.axis = null;
        return;
    }
    let ps = Array.from(points);
    if(axis === 0)
        ps.sort(function(a, b) {return a.x - b.x; });
    else
        ps.sort(function(a, b) {return a.y - b.y; });
    let half = Math.floor(ps.length / 2) + 1;
    this.threshold = axis === 0 ? ps[half].x : ps[half].y;
    this.left  = new QuadTree(ps.slice(0, half), 1 - axis, maxK);
    this.right = new QuadTree(ps.slice(half, ps.length), 1 - axis, maxK);
    this.axis = axis;
};

QuadTree.prototype.getNearest = function (p, k, ret) {
    if(this.axis === null) {
        ret = ret.concat(this.left);
    }
    else {
        let val = this.axis === 0 ? p.x : p.y;
        let nearFar = val < this.threshold ? [this.left, this.right] : [this.right, this.left];
        ret = ret.concat(nearFar[0].getNearest(p, k, ret));
        //if (ret.length < k) {
        //    ret = ret.concat(nearFar[1].getNearest(p, k, ret));
        //}
    }
    ret.sort(function (a, b) {
        return -(Math.sqrt(b.x - p.x)*(b.x - p.x) + (b.y - p.y)*(b.y - p.y) - Math.sqrt(a.x - p.x)*(a.x - p.x) + (a.y - p.y)*(a.y - p.y));
    });
    return ret.slice(0, k);
};