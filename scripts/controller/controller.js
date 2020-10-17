function Controller(elementId) {
    this.body = document.getElementById(elementId);
    this.eax = new P();
    return this;
}


Controller.prototype.manipulates = function(model, view) {
    this.model = model;
    this.view = view;
    this.ready = false;
    this.body.onresize = this.resizePaper.bind(this);
    this.body.onmousemove = this.move.bind(this);
    this.body.onmousedown = this.down.bind(this);
    this.body.onmouseup = this.up.bind(this);
    return this;
};

Controller.prototype.move = function (event) {
    if(!this.ready || this.model.race.players.length < 1
        || this.model.race.ais[this.model.playerToMove] !== null) return;
    this.view.getModelCoords(event, this.eax);
    this.model.updateMove(this.eax);
};

Controller.prototype.down = function (event) {
    if(this.view.soundEngine) this.view.soundEngine.context.resume();
    if(!this.ready || this.model.race.players.length < 1
        || this.model.race.ais[this.model.playerToMove] !== null) return;
    this.humanDown = true;
    this.view.getModelCoords(event, this.eax);
    this.model.initializeMove(this.eax);
};
/*
Controller.prototype.down = function(event) {
    let _this = this;
    setTimeout(function () {
        return _this._down(event);
    }, 10);
};
*/
Controller.prototype.up = function (event) {
    if(!this.ready || this.model.race.players.length < 1
        || this.model.race.ais[this.model.playerToMove] !== null
        || !this.humanDown) return;
    this.humanDown = false;
    this.view.getModelCoords(event, this.eax);
    this.model.finalizeMove(this.eax);
};

/*Controller.prototype.up = function(event) {
    let _this = this;
    setTimeout(function () {
        return _this._up(event);
    }, 10);
}*/

Controller.prototype.resizePaper = function(e) {
    let w = window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;

    let h = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight;

    let bbox = this.model.track.getBoundingBox(0);
    this.view.resize(w, h, bbox);
    this.ready = true;
    this.view.render(this.model);
};
