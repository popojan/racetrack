let MotorSound = function (context, generator, count) {
    this.currentFrame = [];
    this.context = context;
    this.speed = [];
    this.isPlaying = false;
    this.generator = generator;
    //context.createPanner();
    // scriptNode to change sound wave on the run
    this.scriptNode = context.createScriptProcessor(1024);
    this.scriptNode.onaudioprocess = this.process.bind(this);

    // gainNode for volume control
    this.gainNode = context.createGain();
    this.gainNode.gain.value = 0.5;
    this.scriptNode.connect(this.gainNode);
    this.lvolume = [];
    this.rvolume = [];
    this.setVolume(0.1);
    this.regenerate(count);

};

MotorSound.prototype.start = function () {
    this.gainNode.connect(this.context.destination);
};

MotorSound.prototype.stop = function () {
    this.gainNode.disconnect(this.context.destination);
};

MotorSound.prototype.regenerate = function (count) {
    this.data = [];
    this.speed = [];
    this.currentFrame = [];
    for(let i = 0; i < count; ++i) {
        this.data.push(this.generator.generate());
        this.speed.push(0.6);
        this.currentFrame.push(0);
        this.lvolume.push(1.0);
        this.rvolume.push(1.0);
    }
};

MotorSound.prototype.setVolume = function (volume) {
    this.gainNode.gain.value = volume;
};

MotorSound.prototype.setBalance = function (j, leftVolume, rightVolume) {
    this.lvolume[j] = leftVolume;
    this.rvolume[j] = rightVolume;
};

MotorSound.prototype.setGenerator = function (generator) {
    this.generator = generator;
    this.regenerate();
};

MotorSound.prototype.setSpeed = function (i, speed) {
    this.speed[i] = speed;
};

MotorSound.prototype.process = function (event) {
    // this is the output buffer we can fill with new data
    let lchannel = event.outputBuffer.getChannelData(0);
    let rchannel = event.outputBuffer.getChannelData(1);
    let index;

    for (let i = 0; i < lchannel.length; ++i) {
        let lval = 0.0;
        let rval = 0.0;
        for(let j = 0; j < this.data.length; ++j) {
            // skip more data frames on higher speed
            this.currentFrame[j] += this.speed[j];
            index = Math.floor(this.currentFrame[j]) % this.data[j].length;
            let dat = this.data[j][index];
            lval += this.lvolume[j] * dat;
            rval += this.rvolume[j] * dat;
        }
        lchannel[i] = lval;
        rchannel[i] = rval;
    }
    for(let j = 0; j < this.data.length; ++j) {
        this.currentFrame[j] %= this.data[j].length;
    }
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



let NoiseGenerator = function () {
    this.dataLength = 4096;
    this.linearLength = 30;
    this.smoothness = 3;
};

NoiseGenerator.prototype.generate = function () {
    let data = [];
    let lastValue = 0.5;
    data.push(lastValue);

    for (let i = 1; i <= this.dataLength-this.linearLength; i++) {
        lastValue += (Math.random() - 0.5) / this.smoothness;
        lastValue = Math.min(1, lastValue);
        lastValue = Math.max(-1, lastValue);
        data.push(lastValue);
    }

    // interpolate the last view values
    let step = (0.5 - lastValue) / this.linearLength;
    for (let j = 0; j < this.linearLength; j++) {
        data.push(lastValue + step * j);
    }

    data.push(0.5);
    return data;
};

function initSound(window, count) {
    let AudioContext = window.AudioContext || window.webkitAudioContext;
    if(AudioContext === undefined)
        return undefined;
    let context = new AudioContext();
    let generator = new LinearGenerator();
    let motorSound = new MotorSound(context, generator, count);
    window.onload = function () {
        function regenerateSound() {
            motorSound.regenerate(count);
            motorSound.start();
        }

        regenerateSound();
    };
    return motorSound;
}