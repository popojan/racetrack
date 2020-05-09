function Controller(elementId) {
    this.body = document.getElementById(elementId);
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
    if(!this.ready || this.model.race.players.length < 1) return;
    let p = this.view.getModelCoords(event);
    this.model.updateMove(p);
}

Controller.prototype.down = function (event) {
    if(!this.ready || this.model.race.players.length < 1) return;
    let p = this.view.getModelCoords(event);
    this.model.initializeMove(p);
}

Controller.prototype.up = function (event) {
    if(!this.ready || this.model.race.players.length < 1) return;
    let p = this.view.getModelCoords(event);
    this.model.finalizeMove(p);
}

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