function Avoid() {
}

Avoid.prototype.adjust =  function (players, lastPlanned) {
    let softRELU = function (t) {
        return function (x) {
            return 1.0 / t * Math.log(1 + Math.exp(t * x));
        }
    }
    //moves, steeringCentres, steeringRadii, collisionRadii
    let rectify = softRELU(10.0);
    let F = function (X) {
        let dist = 0.0;
        for (let i = 0; i <= lastPlanned; ++i) {
            let player = players[i];
            let dx = X[i * 2 + 0] - player.plannedMove.x;
            let dy = X[i * 2 + 1] - player.plannedMove.y;
            dist += (dx * dx + dy * dy);
            let center = player.trajectory.t2b(player.trajectory.c());
            dx = X[i * 2 + 0] - center.x;
            dy = X[i * 2 + 1] - center.y;
            dist += 100.0 * Math.pow(rectify(Math.sqrt(dx * dx + dy * dy) - player.trajectory.steeringRadius()),2.0);
            for (let j = i + 1; j <= lastPlanned; ++j) {
                dx = X[i * 2 + 0] - X[j * 2 + 0];
                dy = X[i * 2 + 1] - X[j * 2 + 1];
                let player2 = players[j];
                let collisionDistance = player.collisionRadius + player2.collisionRadius;
                dist += 100 * Math.pow(rectify(collisionDistance - Math.sqrt(dx * dx + dy * dy)), 2.0);
            }
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
        let result = optimjs.minimize_Powell(F, X0);
        let nn = result["argument"];
        ret = [];
        for (let i = 0; i <= lastPlanned; ++i) {
            players[i].adjustedMove = new P(nn[i * 2], nn[i * 2 + 1]);
        }
    }
    else {
        players[0].adjustedMove = new P(X0[0], X0[1]);
    }
    return ret;
};