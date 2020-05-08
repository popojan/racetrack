function BezierPhysics() {
    this.eax = new P();
    this.ebx = new P();
}

BezierPhysics.prototype.getControlCenter = function(momentum, prevMove, currentMove, output) {
    output.x = currentMove.x +  momentum * (currentMove.x - prevMove.x);
    output.y = currentMove.y +  momentum * (currentMove.y - prevMove.y);
    return output;
};

BezierPhysics.prototype.getControlCenterInverse = function(momentum, prevMove, nextControlCenter, output) {
    output.x = (nextControlCenter.x +  momentum * prevMove.x)/(1 + momentum);
    output.y = (nextControlCenter.y +  momentum * prevMove.y)/(1 + momentum);
    return output;
};