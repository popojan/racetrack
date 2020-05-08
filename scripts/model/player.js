function Player(name, steeringRadius, collisionRadius) {
    this.name = name;
    this.steeringRadius = steeringRadius;
    this.collisionRadius = collisionRadius;
    this.plannedMove = null;
    this.adjustedMove = null;
}

Player.prototype.participates = function(race, startPosition) {
    this.trajectory = new Trajectory(track).push(startPosition);
};