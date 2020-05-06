function Race() {
    this.players = [];
}

Race.prototype.addPlayer = function(player) {
    this.players.push(player);
};

Race.prototype.advanceAnimation = function(timeDelta) {
    for(let i = 0; i < this.players.length; ++i) {
        this.players[i].trajectory.advanceAnimation(timeDelta, this.players[0].trajectory.moves.length);
    }
};

Race.prototype.start = function() {

}