let AudioEngine = function(context, count) {
    this.context = context;
    this.gainNode = context.createGain();
    this.gainNode.gain.value = 0.1;
    this.motorSounds = [];
    this.generator = new LinearGenerator();
    for(let i = 0; i < count; ++i) {
        this.motorSounds.push(new MotorSound(context, this.generator, this.gainNode));
    }
}

AudioEngine.prototype.setVolume = function (volume) {
    this.gainNode.gain.value = volume;
};

AudioEngine.prototype.start = function () {
    this.gainNode.connect(this.context.destination);
};

AudioEngine.prototype.stop = function () {
    this.gainNode.disconnect(this.context.destination);
};

AudioEngine.prototype.setRPM = function (i, rpm) {
    this.motorSounds[i].setRPM(rpm);
};

AudioEngine.prototype.setPosition = function (i, x, y, dx, dy) {
    this.motorSounds[i].setPosition(x, y, dx, dy);
};

AudioEngine.prototype.setListenerPosition = function (x, y, dx, dy) {
    if(this.context.listener.orientationX) {
        this.context.listener.orientationX.setValueAtTime(dx, this.context.currentTime);
        this.context.listener.orientationZ.setValueAtTime(dy, this.context.currentTime);

    }
    if(this.context.listener.positionX) {
        this.context.listener.forwardX.setValueAtTime(dx, this.context.currentTime);
        this.context.listener.forwardZ.setValueAtTime(dy, this.context.currentTime);
    }
};

let MotorSound = function (context, generator, targetNode) {
    this.currentFrame = 0;
    this.context = context;
    this.speed = 0.5;
    this.generator = generator;
    this.scriptNode = context.createScriptProcessor(1024, 2, 2);
    this.scriptNode.onaudioprocess = this.process.bind(this);
    this.panner = context.createPanner();
    this.panner.refDistance = 30;
    this.panner.distanceModel = "inverse";
    this.panner.rolloffFactor = 1;
    this.scriptNode.connect(this.panner);
    this.panner.connect(targetNode);
    this.regenerate();

};

MotorSound.prototype.regenerate = function () {
    this.speed = 0.6;
    this.currentFrame = 0;
    this.data = this.generator.generate();
};

MotorSound.prototype.setRPM = function (rpm) {
    this.speed = rpm;
};

MotorSound.prototype.setPosition = function (x, y, dx, dy) {
    this.panner.positionX.linearRampToValueAtTime(x, this.context.currentTime);
    this.panner.positionZ.linearRampToValueAtTime(y, this.context.currentTime);
};

MotorSound.prototype.process = function (event) {
    let lchannel = event.outputBuffer.getChannelData(0);
    let rchannel = event.outputBuffer.getChannelData(1);
    let index;

    for (let i = 0; i < lchannel.length; ++i) {
        this.currentFrame += this.speed;
        index = Math.floor(this.currentFrame) % this.data.length;
        let dat = this.data[index];
        lchannel[i] = dat;
        rchannel[i] = dat;
    }
    this.currentFrame %= this.data.length;
};

let LinearGenerator = function () {
    this.dataLength = 1024;
};

LinearGenerator.prototype.pushLinear = function (data, toValue, toPosition) {
    let lastPosition = data.length - 1;
    let lastValue = data.pop();
    let positionDiff = toPosition - lastPosition;
    let step = (toValue - lastValue) / positionDiff;
    for (let i = 0; i < positionDiff; i++) {
        data.push(lastValue + step * i);
    }
    return data;
};

LinearGenerator.prototype.generate = function () {
    let data = [];
    let lastValue = 1;
    let lastPosition = 0;
    let nextValue, nextPosition;

    data.push(lastValue);

    for (let i = 0.05; i < 1; i += Math.random()/8+0.01) {
        nextPosition = Math.floor(i * this.dataLength);
        nextValue = Math.random() * 2 - 1;
        this.pushLinear(data, nextValue, nextPosition);
    }

    this.pushLinear(data, 1, this.dataLength);
    return data;
};

function initSound(window, count) {
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    if(AudioContext === undefined)
        return undefined;
    let context = new AudioContext();
    let generator = new LinearGenerator();
    let soundEngine = new AudioEngine(context, count);
    window.onload = function () {
        function regenerateSound() {
            soundEngine.start();
        }
        regenerateSound();
    };
    return soundEngine;
}