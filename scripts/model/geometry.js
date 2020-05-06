function P(x, y){
    this.x = x;
    this.y = y;
}
P.prototype = {x:0, y:0};

P.prototype.add = function(b) {
    return new P(this.x + b.x, this.y + b.y);
};
P.prototype.sub = function(b) {
    return new P(this.x - b.x, this.y - b.y);
};
P.prototype.mul = function(b) {
    return new P(b * this.x, b * this.y);
};
P.prototype.len = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
P.prototype.n = function() {
    let len = this.len();
    return new P(this.x/len, this.y/len);
};
P.prototype.p = function() {
    return new P(this.y, -this.x);
};