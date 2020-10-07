function Player(name, steeringRadius, collisionRadius, sid) {
    this.name = name;
    this.steeringRadius = steeringRadius;
    this.collisionRadius = collisionRadius;
    this.plannedMove = new P();
    this.adjustedMove = new P();
    this.sid = sid;
    this.ai = null;
    this.i = null;
}