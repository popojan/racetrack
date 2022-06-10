function Avoid() {
    this.eax = new P();
}


Avoid.prototype.adjust =  function (players, lastPlanned, tt) {
    if(tt === undefined) tt = players[lastPlanned].trajectory;
    let softRELU = function (t) {
        return function (x) {
            return 1.0 / t * Math.log(1 + Math.exp(t * x));
        }
    }
    let softMax = function(t) {
        return function (x) {
            return x * Math.exp(t * x) / (1 + Math.exp(t * x));
        }

    }
    //moves, steeringCentres, steeringRadii, collisionRadii
    let rectify = softRELU(10.0);
    let F = function (X) {
        let dist = 0.0;
        let i = 0;
        for (let player of players.slice(0, lastPlanned + 1)) {
            let dx = X[i * 2 + 0] - player.plannedMove.x;
            let dy = X[i * 2 + 1] - player.plannedMove.y;
            dist += (dx * dx + dy * dy);
            let trajectory = i == lastPlanned ? tt : player.trajectory;
            let center = trajectory.t2b(trajectory.c());
            dx = X[i * 2 + 0] - center.x;
            dy = X[i * 2 + 1] - center.y;
            dist += 100.0 * Math.pow(rectify(Math.sqrt(dx * dx + dy * dy) - trajectory.steeringRadius()),2.0);
            for (let j = i + 1; j <= lastPlanned; ++j) {
                dx = X[i * 2 + 0] - X[j * 2 + 0];
                dy = X[i * 2 + 1] - X[j * 2 + 1];
                let player2 = players[j];
                let collisionDistance = player.collisionRadius + player2.collisionRadius;
                dist += 100 * Math.pow(rectify(collisionDistance - Math.sqrt(dx * dx + dy * dy)), 2.0);
            }
            i += 1;
        }
        return dist;
    };
    let X0 = [];
    for(let i = 0; i <= lastPlanned; ++i) {
        X0.push(players[i].plannedMove.x);
        X0.push(players[i].plannedMove.y);
    }
    let ret = null;
    if(lastPlanned > 0) {
        //let result = {argument: []};
        let result = optimjs.minimize_Powell(F, X0);
        let nn = result["argument"];
        ret = [];
        for (let i = 0; i <= lastPlanned; ++i) {
            players[i].adjustedMove.x = nn[i * 2] || X0[i * 2];
            players[i].adjustedMove.y = nn[i * 2 + 1] || X0[i * 2 + 1];
        }
    }
    else {
        players[0].adjustedMove.x = X0[0];
        players[0].adjustedMove.y = X0[1];
    }
    return ret;
};