class Animate {
    _fps = 30;
    _interval = null;
    _updates = 0;
    _interval_time = 0;
    _interval_count = 0;
    _agent = null;
    _start_position = null;
    _end_position = null;
    _two_pi = 2 * Math.PI;

    constructor(agent) {
        this._agent = agent;
    }

    start(start_position, end_position, time) {
        if (!isEmpty(this._interval)) {
            this.stop();
        }

        if (start_position.equalCoords(end_position)) {
            return this;
        }

        this._updates = 0;
        this._interval_time = 1000 / this._fps;
        this._interval_count = Math.floor(time / this._interval_time);
        this._start_position = start_position;
        this._end_position = end_position;
        if (this._start_position.angle < this._end_position.angle && this._end_position.angle - this._start_position.angle > Math.PI) {
            this._start_position.angle += this._two_pi;
        }
        this._interval = setInterval(() => {
            this.step();
        }, this._interval_time);
        return this;
    }

    step() {
        this._updates++;
        if (this._updates >= this._interval_count) {
            this.stop();
        }

        let percent = this._updates / this._interval_count;
        let position = {
            x: lerp(this._start_position.x, this._end_position.x, percent),
            y: lerp(this._start_position.y, this._end_position.y, percent),
            angle: truncateAngle(lerp(this._start_position.angle, this._end_position.angle, percent), this._two_pi),
        }

        this._agent.updatePosition(position);
    }

    stop() {
        clearInterval(this._interval);
        this._interval = null;
        this._agent.updatePosition(this._end_position);
    }
}
