//worker script for performing a single fit as a background process.

onmessage = function(e){
    var i;

    dataStore.x = e.data[0];
    dataStore.y = e.data[1];
    if(e.data[2] == 'gaussPlusLinear')
        dataStore.fxn = gaussPlusLinear.bind(null, e.data[3][0], e.data[3][1]);
    dataStore.guess = e.data[4];    

    fitit()
    postMessage(dataStore.param)
}

//////////////////////
// local variables
//////////////////////

dataStore = {}
//Input
dataStore.x = []; //independent variables
dataStore.y = []; //dependent variables
dataStore.fxn = null; //function to fit, form: function(independent variable, [array of fittable parameters])
dataStore.guess = []; //initial fit guess
//Output
dataStore.param = []; //fit parameters
//Config
dataStore.stepSize = 1;  //initial size of step to take along gradient towards minima

/////////////////////////
// helper functions
/////////////////////////

//log probability of n counts in a bin where lambda were expected:
function logPoisson(n, lambda){
    var i, N=0;
    for(i=1; i<=n; i++)
        N += i;

    return n*Math.log(lambda) - lambda - N;
}

//negative log likelihood of seeing the observed spectrum given the theory function and <param> array
function NegLL(param){
    var lambda, i, 
    nll = 0;

    for(i=0; i<dataStore.x.length; i++){
        lambda = dataStore.fxn.bind(null, dataStore.x[i], param)();

        nll -= logPoisson(dataStore.y[i], lambda);
    }

    return nll;
}

//derivative in negative log likelihood space along parameter index <dim> at parameter config <param>:
function nllDer(param, dim){
    var tol = 0.000001,
        dtol1, dtol2, Xhi=[], Xlo=[], Xhi2=[], Xlo2=[], vary, D;

    for(vary = 0; vary < param.length; vary++){
        Xhi[vary] = param[vary];
        Xlo[vary] = param[vary];
        Xhi2[vary] = param[vary];
        Xlo2[vary] = param[vary];
    }
    Xhi[dim]  += tol;
    Xlo[dim]  -= tol;
    Xhi2[dim] += tol / 2;
    Xlo2[dim] -= tol / 2;

    dtol = (NegLL.bind(null, Xhi)() - NegLL.bind(null, Xlo)()) / (2*tol);
    dtol2 = (NegLL.bind(null, Xhi2)() - NegLL.bind(null, Xlo2)()) / tol;

    D = (4*dtol2-dtol)/3;

    return D;
}

//gradient in negative log likelihood space:
function nllGrad(param){
    var grad = [],
        i, length=0;
    for(i=0; i<param.length; i++){
        grad[i] = nllDer(param, i);
        length += Math.pow(grad[i],2);
    }

    length = Math.sqrt(length);
    //normalize
    for(i=0; i<param.length; i++){
        grad[i] /= length;
    }

    return grad;
}

//converge a fit
function fitit(){

    var i, grad, NLL, newNLL,
        dNLL = 1000,
        tolerance = 0.0001,
        limit = 1000;

    //demand same length of dataStore.x and dataStore.y
    if(dataStore.x.length != dataStore.y.length){
        console.log('length of input and output arrays must be equal; fit aborted.')
        return;
    }

    for(i=0; i<dataStore.guess.length; i++)
        dataStore.param[i] = dataStore.guess[i];

    while(Math.abs(dNLL) > tolerance && limit>0){

        NLL = NegLL(dataStore.param);
        grad = nllGrad(dataStore.param);

        //step towards mimium
        for(i=0; i<dataStore.param.length; i++){
            dataStore.param[i] -= grad[i]*dataStore.stepSize;
        }

        newNLL = NegLL(dataStore.param);

        //take smaller steps as we approach minimum
        if(newNLL > NLL)
            dataStore.stepSize = dataStore.stepSize/2;

        dNLL = newNLL - NLL;
        limit--;

    }
    dataStore.stepSize = 1;

}

//simple straight line:
function simpleLine(x,y){
    var i, X=0, Y=0, XY=0, X2=0,
        slope, intercept;

    for(i=0; i<x.length; i++){
        X += x[i];
        Y += y[i];
        XY += x[i]*y[i];
        X2 += x[i]*x[i];
    }

    slope = (x.length*XY - X*Y) / (x.length*X2 - X*X);
    intercept = (X2*Y - X*XY) / (x.length*X2 - X*X)

    return  [intercept, slope]
}

/////////////////////////////
// fit functions
/////////////////////////////

function gaussPlusLinear(intercept, slope, x, par){
    return intercept + slope*x + par[0]*Math.exp(-1*(((x-par[1])*(x-par[1]))/(2*par[2]*par[2])))
}

function line(x, par){
    return par[0] + x*par[1]
};
