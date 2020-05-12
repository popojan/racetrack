function Player(name, steeringRadius, collisionRadius) {
    this.name = name;
    this.steeringRadius = steeringRadius;
    this.collisionRadius = collisionRadius;
    this.plannedMove = new P();
    this.adjustedMove = new P();
}