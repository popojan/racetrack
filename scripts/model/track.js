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
    return this;
};

Track.prototype.initAI = function(lcount, wcount, maxK) {
    this.points = this.design.cover(lcount, wcount);
    this.cover = new QuadTree(this.points, 0, maxK);
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
