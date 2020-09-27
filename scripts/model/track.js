function Track() {
    this.width = 0;
    this.height = 0;
    this.S = 1.0;
    return this;
}

Track.prototype.createFrom = function(designString) {
    let design = new Designer("").parse(designString);
    let path;
    if(design.circuit) {
        path = design.i() + " " + design.o();
    } else {
        path = design.o() + "L" + design.i().substr(1) + "z";
    }
    this.renderPath = path;

    //TODO get rid of Raphael dependency
    this.sPath = Raphael.transformPath(path,"t" + 0 + "," + 0 + " s" + 1 + "," + 1);

    this.collisionPath = new Path();
    this.collisionPath.parseData(this.sPath.toString());

    this.defaultSteeringRadius = design.R;
    this.defaultCollisionRadius = 0.25 * design.R;
    this.startPositions = [];
    for(let i = 0; i < design.gridcount; ++i) {
        this.startPositions.push(design.startpos(i));
    }
    this.design = design;
    this.cover = null;
    this.point = null;
    return this;
};

Track.prototype.initAI = function(lcount, wcount, maxK, limit, alpha, beta) {
    this.points = this.design.cover(lcount, wcount);
    let bounds = this.getBoundingBox(0.0);
    console.log(JSON.stringify(bounds));
    this.cover = new QuadTree(bounds, true, 128, 16);
    for(let i = 0; i < this.points.length; ++i) {
        this.cover.insert(this.points[i]);
    }
    //this.design.optimal(32, 7, 64, 1.0, 1.0);
    //this.optim = this.design.optimalPath.points;;
/*
    let ps = this.design.optimalPath.points;
    let qs = [];
    for(let i = 1; i < ps.length; ++i) {
        let len = new P().mov(ps[i]).sub(ps[i-1]);
        let steps = len.len()/3;
        let ldiff = ps[i].lat-ps[i-1].lat;
        if(ldiff > 0.5) ldiff -= 1.0;
        if(ldiff < -0.5) ldiff += 1.0;
        for(let j = 0; j < steps; ++j) {
            qs.push({x:ps[i-1].x + len.x*j/steps, y:ps[i-1].y + len.y*j/steps, lat: (ps[i-1].lat + j/steps*(ldiff))%1.0});
        }
    }
    this.optim = qs;//new QuadTree(qs, 0, maxK);*/
}

Track.prototype.getBoundingBox = function(margin) {
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    let ub = function(x, y) {
        x1 = Math.min(x, x1);
        y1 = Math.min(y, y1);
        x2 = Math.max(x, x2);
        y2 = Math.max(y, y2);
    }
    for(let j = 0; j < this.sPath.length; ++j) {
        for(let k = 1; k < this.sPath[j].length; k+=2) {
            ub(this.sPath[j][k], this.sPath[j][k+1]);
        }
    }
    return {x:x1-margin, y:y1-margin, width: (x2-x1)+2*margin, height: (y2-y1) + 2*margin};
};
