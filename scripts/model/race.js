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
    let nMoves = this.players[0].trajectory.moves.length;
    for(let player of this.players) {
        player.trajectory.advanceAnimation(timeDelta, nMoves);
    }
};

Race.prototype.start = function(model) {
    if(this.ais[0]) {

    }
}