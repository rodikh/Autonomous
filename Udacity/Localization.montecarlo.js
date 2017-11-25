const colors = require('colors');

const COLORS = {
    'R': 'red',
    'G': 'green'
};

const FLOAT_PERCISION = 3;

class Matrix extends Array {
    constructor(w, h, defaultValue = null) {
        super();
        this.w = w;
        this.h = h;

        for (let y = 0; y < h; y++) {
            this.push([]);
            for (let x = 0; x < w; x++) {
                this[y][x] = defaultValue;
            }
        }
    }

    get(x, y) {
        let rx = ((x % this.w) + this.w) % this.w, ry = ((y % this.h) + this.h) % this.h;
        return this[ry][rx];
    }

    set(x, y, val, additive = false) {
        let rx = ((x % this.w) + this.w) % this.w, ry = ((y % this.h) + this.h) % this.h;
        this[ry][rx] = (additive) ? this[ry][rx] + val : val;
    }

    sum() {
        return [].concat(...this).reduce((acc, curr) => acc + curr);
    }

    normalize() {
        let sum = this.sum();
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                this[y][x] /= sum;
            }
        }
    }

    iterate(fn) {
        for (let y = 0; y < this.h; y++) {
            for (let x = 0; x < this.w; x++) {
                fn(this[y][x], x, y);
            }
        }
    }

    print() {
        let sum = this.sum;
        let str = '';
        this.iterate((val, x, y) => {
            if (x === 0 && y > 0) {
                console.log(str);
                str = '';
            }

            str += ((typeof(val) === "number") ? val.toFixed(FLOAT_PERCISION) : padMid(val)[COLORS[val]]) + '\t';
        });
        console.log(str);
        console.log('-'.repeat(this.w * 4));
    }


    distributeUncertainty(x, y, sourceProb, accuracyProb) {
        let errorProb = 1 - accuracyProb;
        this.set(x, y, sourceProb * accuracyProb, 1);

        let leftover = sourceProb * errorProb;
        let eachLeftover = parseFloat((leftover / 4).toFixed(FLOAT_PERCISION));
        if (eachLeftover > 0) {
            for (let ly = -1; ly <= 1; ly++) {
                for (let lx = -1; lx <= 1; lx++) {
                    if (Math.abs(lx)+Math.abs(ly) === 1) {
                        this.distributeUncertainty(x+lx,y+ly,eachLeftover, accuracyProb);
                    }
                }
            }
        } else {
            this.set(x, y, leftover, 1);
        }
    }

    static createUniform(w, h) {
        return new Matrix(w, h, 1.0 / (w * h));
    }
}

class Localization {

    get pHit() {
        return 0.6;
    }

    get pMiss() {
        return 0.2;
    }

    get sensorAccuracy() {
        return 0.8;
    }

    get moveAccurate() {
        return 0.8;
    }

    constructor(world) {
        this.world = world;
        this.probmap = Matrix.createUniform(world.w, world.h);
        this.world.print();
        this.probmap.print();
    }

    perform (actions, verbose = true) {
        actions.forEach((action) => {
            if (typeof action === 'object') {
                this.move(action);
            } else {
                this.sense(action);
            }
            if (verbose) {
                this.probmap.print();
            }
        });
    }

    sense(observation) {
        console.log('Sensing:', observation);
        this.world.iterate((val, x, y) => {
            let hit = val === observation;
            this.probmap[y][x] = this.probmap[y][x] * (hit * this.pHit + (1 - hit) * this.pMiss) * this.sensorAccuracy;
        });
        this.probmap.normalize();
    }

    move(direction) {
        console.log('Moving:', direction);
        let newMap = new Matrix(this.probmap.w, this.probmap.h, 0);
        this.probmap.iterate((val, x, y) => {
            newMap.distributeUncertainty(x, y, this.probmap.get(x - direction.x, y - direction.y), this.moveAccurate);
        });
        newMap.normalize();
        this.probmap = newMap;
    }

}

function padMid(str) {
    let len = (FLOAT_PERCISION + 2) - str.length;
    return ' '.repeat(Math.max(0, Math.floor(parseFloat(len) / 2))) + str + ' '.repeat(Math.max(0, Math.ceil(parseFloat(len) / 2)));
}

let world = new Matrix(6, 6, 'R');
world[0][1] = 'G';
world[1][2] = 'G';
world[4][4] = 'G';

let loc = new Localization(world, 6, 6);
loc.perform(['G', {x:0, y:1}, 'R', {x:1, y:0}, 'G']);
