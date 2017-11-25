
class Gauss {
    constructor (mu, sigma2) {
        this.mu = mu;
        this.sigma2 = sigma2;
    }

    yAt (x) {
        let normalizer = (1 / Math.sqrt(2. * Math.PI * this.sigma2));
        return normalizer * (Math.exp((-.5) * (Math.pow(x - this.mu, 2) / this.sigma2)));
    }

    observe (observation) {
        let frac = 1 / (this.sigma2 + observation.sigma2);
        let top = (observation.sigma2 * this.mu) + (this.sigma2 * observation.mu);
        this.mu = frac*top;

        this.sigma2 = 1 / ( (1 / this.sigma2) + (1 / observation.sigma2));

        return this;
    }

    move (movement) {
        this.mu += movement.mu;
        this.sigma2 += movement.sigma2;

        return this;
    }
}

let gauss = new Gauss(0., 10000.);

let actions = [{measure:5.}, {move:1.},{measure:6.}, {move:1.},{measure:7.}, {move:2.},{measure:9.}, {move:1.},{measure:10.}, {move:1.}];

const measureSig = 4., motionSig = 2;

actions.forEach(action=>{
    if (action.hasOwnProperty('measure')) {
        gauss.observe(new Gauss(action.measure, measureSig));
    } else {
        gauss.move(new Gauss(action.move, motionSig));
    }
});
console.log('gauss', gauss);