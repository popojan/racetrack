function Controller(elementId) {
    this.body = document.getElementById(elementId);
    this.eax = new P();
    window.addEventListener('contextmenu', function (e) {
        // do something here...
        e.preventDefault();
    }, false);
    this.humanDrag = false;
    this.humanDown = false;
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
    this.body.onwheel = this.wheel.bind(this);
    return this;
};

Controller.prototype.move = function (event) {
    if(!this.ready || this.model.race.players.length < 1) return;
    if(this.humanDrag) {
        this.view.getViewCoords(event, this.eax);
        this.view.drag(this.eax);
    }
    if(this.model.race.ais[this.model.playerToMove] === null) {
        this.view.getModelCoords(event, this.eax);
        this.model.updateMove(this.eax);
    }
};

Controller.prototype.down = function (event) {
    if(this.view.soundEngine) this.view.soundEngine.context.resume();
    if(!this.ready || this.model.race.players.length < 1) return;
    if(event.button === 0 && this.model.race.ais[this.model.playerToMove] === null) {
        this.humanDown = true;
        this.view.getModelCoords(event, this.eax);
        this.model.initializeMove(this.eax);
    }
    else if(event.button === 2) {
        this.humanDrag = true;
        this.view.getViewCoords(event, this.eax);
        this.view.initializeDrag(this.eax);
    }
};

Controller.prototype.wheel = function (event) {
    if(!this.ready || this.model.race.players.length < 1) return;
    this.view.getModelCoords(event, this.eax);
    this.view.zoom(this.eax, event.deltaY);
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
    if(!this.ready || this.model.race.players.length < 1) return;
    this.humanDown = false;
    this.humanDrag = false;
    this.view.getModelCoords(event, this.eax);
    if(event.button === 0 && this.model.race.ais[this.model.playerToMove] === null)
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
