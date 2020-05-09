function Player(name, steeringRadius, collisionRadius) {
    this.name = name;
    this.steeringRadius = steeringRadius;
    this.collisionRadius = collisionRadius;
    this.plannedMove = new P();
    this.adjustedMove = new P();
}

Player.prototype.participates = function(race, startPosition) {
    this.trajectory = new Trajectory(track).push(startPosition);
};