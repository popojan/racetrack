function P(x, y){
    this.x = x;
    this.y = y;
}
P.prototype = {x:0, y:0};

P.prototype.mov = function(b) {
    this.x = b.x;
    this.y = b.y;
    return this;
};

P.prototype.add = function(b) {
    this.x += b.x;
    this.y += b.y;
    return this;
};

P.prototype.sub = function(b) {
    this.x -= b.x;
    this.y -= b.y;
    return this;
};

P.prototype.mul = function(b) {
    this.x *= b;
    this.y *= b;
    return this;
};

P.prototype.len = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
P.prototype.n = function() {
    let len = this.len();
    this.x /= len;
    this.y /= len;
    return this;
};

P.prototype.p = function() {
    let x = this.x;
    this.x = this.y;
    this.y = -x;
    return this;
};