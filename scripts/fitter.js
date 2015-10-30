//wrapper for a web worker fitter
//worker should post array of fit parameters after completion.

function fitter(workerScript){

    this.workerScript = workerScript;

    this.asyncFit = function(spectrum, min, max, fxn, boundParams, guess, callback){
        //spectrum: array of bin contents
        //min: min bin to fit
        //max: max bin to fit
        //fxn: string naming function to use from fit worker
        //fixedParams: array of parameters to bind to the fit function, in order.
        //guess: array of parameter guesses.
        //callback: function of fit parameter array, runs after fit completes.

        var fitWorker = new Worker(this.workerScript);
        var i, x=[];

        for(i=min; i<max; i++)
            x.push(i+0.5);

        fitWorker.postMessage([x, spectrum.slice(min, max), fxn, boundParams, guess])

        fitWorker.onmessage = function(e){
            callback(e.data)
        }
    }

}