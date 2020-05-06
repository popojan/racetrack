function Model() {
    this.views = [];
    this.animationLastTime = 0;
    this.track = null;
    this.race = null;
    this.playerToMove = 0;
    this.avoid = new Avoid();
    return this;
}
Model.prototype.startRace = function (trackDesign, playerCount) {
    this.track = new Track().createFrom(trackDesign);
    this.race = new Race();
    let steeringRadius = this.track.defaultSteeringRadius;
    let collisionRadius = this.track.defaultCollisionRadius;
    for(let i = 0; i < playerCount; ++i) {
        let player = new Player("player" + i, steeringRadius, collisionRadius);
        let trajectory = new Trajectory(this.track)
        player.trajectory = trajectory.push(this.track.startPositions[i]);;
        this.race.addPlayer(player);
    }
    this.race.start();
};

Model.prototype.updates = function (view) {
    this.views.push(view);
    return this;
};

Model.prototype.update = function () {
    for(let i = 0; i < this.views.length; ++i) {
        this.views[i].render(this);
    }
};

Model.prototype.animate = function () {
    let now = new Date().getTime();
    let timeDelta = (now - this.animationLastTime);
    this.animationLastTime = now;
    this.race.advanceAnimation(timeDelta);
};

Model.prototype.startAnimation = function() {
    this.animationLastTime = new Date().getTime();
    this.timerRender = window.setInterval(this.update.bind(this), 1000/60);
    this.timerUpdate = window.setInterval(this.animate.bind(this), 1000/60);
};

Model.prototype.preciseMove = function (B) {
    let shorten = 0.999;
    let trajectory = this.race.players[this.playerToMove].trajectory;
    let C = trajectory.t2b(trajectory.c());
    let D = B.sub(C);
    let R = trajectory.steeringRadius();
    if (this.initialPosition) {
        let E = this.initialPosition.sub(C);
        if (E.len() >= R) {
            shorten *= R / D.len() * Math.min(1.0, D.len() / E.len());
        } else {
            shorten *= 1.0;
        }
    } else {
        if (D.len() >= R)
            shorten *= Math.min(1.0, R / D.len());
        else
            shorten *= 1.0;
    }
    return new P(C.x + shorten * D.x, C.y + shorten * D.y);
};


Model.prototype.adjust = function(p) {
    this.race.players[this.playerToMove].plannedMove = this.preciseMove(p);
    this.avoid.adjust(this.race.players, this.playerToMove);
    this.update();
}

Model.prototype.initializeMove = function(p) {
    this.initialPosition = p;
    this.adjust(p);
};

Model.prototype.updateMove = function(p) {
    this.adjust(p);
};

Model.prototype.finalizeMove = function(p) {
    this.adjust(p);
    this.initialPosition = false;
    let n = this.race.players.length;
    if (this.playerToMove === n - 1) {
        for (let j = 0; j < n; ++j) {
            let player = this.race.players[j];
            let adjustedMove = player.trajectory.b2t(player.adjustedMove);
            player.trajectory.m(adjustedMove);
        }
        this.playerToMove = 0;
    } else {
        this.playerToMove += 1;
    }
    this.adjust(p);

};