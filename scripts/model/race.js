function Race() {
    this.players = [];
    this.ais = [];
}

Race.prototype.addPlayer = function(player, ai) {
    this.players.push(player);
    player.ai = ai;
    player.i = this.players.length - 1;
    this.ais.push(ai)
};

Race.prototype.advanceAnimation = function(timeDelta) {
    for(let i = 0; i < this.players.length; ++i) {
        this.players[i].trajectory.advanceAnimation(timeDelta, this.players[0].trajectory.moves.length);
    }
};

Race.prototype.start = function(model) {
    if(this.ais[0]) {

    }
}