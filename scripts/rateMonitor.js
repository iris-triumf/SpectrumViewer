////////////////////////////////////////////
// main setup
////////////////////////////////////////////

function setupDataStore(){
    //sets up global variable datastore
    var i, labels = ['time']

    dataStore = {};
    dataStore.plots = ['ICCh15ADC'];                           //names of plotGrid cells and spectrumViewer objects
    //dataStore.plots = ['SUM_Singles_Energy'];                           //what plot will we be focusing on?
    dataStore.spectrumServer = 'http://iris00.triumf.ca:9094/';       //host and port of analyzer
    dataStore.ODBrequests = ['http://iris00.triumf.ca:8081/?cmd=jcopy&odb0=/Equipment/AdcScaler/Variables/SCAR&odb1=/Runinfo/Run number&encoding=json-p-nokeys&callback=parseScalars'];  //odb requests to make every update

    //you probably don't need to change anything below this line----------------------------------------------------

    dataStore.pageTitle = 'Rate Monitor'                                //header title
    dataStore.allClear = 0;                                             //counter to track when all templates are loaded
    dataStore.doUpdates = true;                                         //include update loop
    dataStore.manualBKG = {};                                           //string encodings of manual background ranges: 'a-b;c;d-e' indicates all bins on [a,b], plus c, plus [d,e]
    dataStore.rateData = [[new Date(),0,0,0,0,0,0,0,0]];                //dummy data to seed rate data collection
    dataStore.annotations = {};                                         //annotations queued up to add to the next dygraph point
    dataStore.targetSpectrum = dataStore.plots[0];                      //analyzer key for spectrum to examine
    dataStore.scalars = {                                               //key:value pairs for scalrs to pull from odb
            'accepted': 0,
            'ssb': 0,
            'clock': 0,
            'scint': 0,
            'ic': 0,
            'free': 0,
            'sclr_ratio': 0,
            'ic_ratio': 0
        }
    dataStore.currentSpectrum = [];                                     //latest polled spectrum, after background subtraction
    dataStore.oldSpectrum = [];                                         //previous bkg-subtracted spectrum
    dataStore.currentTime = null;                                       //in ms since epoch (current poll)
    dataStore.oldTime = null;                                           //ms since epoch (previous poll)
    dataStore.colors = [                                                //color palete to use
        "#AAE66A",
        "#EFB2F0",
        "#40DDF1",
        "#F1CB3C",
        "#FFFFFF",
        "#F22613",
        "#786FBC",
        "#619D48",
        "#AA5FC7",
        "#D35400"
    ]
    dataStore.defaults = {                                             
        'gammas':[                                                  //default parameters for gamma gates
            {
                'title': 'Gate 1',                                  //human readable name
                'min': 0,                                         //default minimum bin
                'max': 4096,                                         //default maximum bin
                'onByDefault': true                                 //displayed by default?
            },
            {
                'title': 'Gate 2',
                'min': 0,
                'max': 0,
                'onByDefault': false
            },
            {
                'title': 'Gate 3',
                'min': 0,
                'max': 0,
                'onByDefault': false
            }//,
         //   {
         //       'title': 'Gate 4',
         //       'min': 0,
         //       'max': 0,
         //       'onByDefault': false
         //   },
         //   {
         //       'title': 'Gate 5',
         //       'min': 0,
         //       'max': 0,
         //       'onByDefault': false
         //   }  
        ],

        'levels':[
         	{
                'title': 'Accepted Trigger',
                'lvlID': 'accepted'
            },
			{
                'title': 'SSB',
                'lvlID': 'ssb'
            },
			{
                'title': '1KHz Clock',
                'lvlID': 'clock'
            },
			{
                'title': 'Scintillator',
                'lvlID': 'scint'
            },			
			{
                'title': 'IC',
                'lvlID': 'ic'
            },
			{
                'title': 'Free Trigger',
                'lvlID': 'free'
            },
			{
                'title': 'Scint/IC',
                'lvlID': 'ratio1'
            },
			{
                'title': 'IC Ratio',
                'lvlID': 'ratio2'
            }

        ]
    }

    //annotate gamma objects
    for(i=0; i<dataStore.defaults.gammas.length; i++){
        dataStore.defaults.gammas[i].index = i;
        dataStore.defaults.gammas[i].color = dataStore.colors[i%dataStore.colors.length];
    }

    //dygraph
    //construct plot labels
    for(i=0; i<dataStore.defaults.gammas.length; i++){
        labels.push(dataStore.defaults.gammas[i].title);
    }
    for(i=0; i<dataStore.defaults.levels.length; i++){
        labels.push(dataStore.defaults.levels[i].title)
    }

    dataStore.plotStyle = {                                             //dygraph plot style object
        labels: labels,
        title: 'Gate Integrals for ' + dataStore.targetSpectrum,
        colors: dataStore.colors,
        axisLabelColor: '#FFFFFF',
        axes: {
            x: {
                axisLabelFormatter: function(Date, granularity, opts, dygraph){
                    return alwaysThisLong(Date.getHours(), 2) + ':' + alwaysThisLong(Date.getMinutes(), 2) + ':' + alwaysThisLong(Date.getSeconds(), 2)
                }
            }
        },
        labelsDiv: 'ratesLegend',
        legend: 'always'
    };
    dataStore.plotInitData = [[new Date(),0,0,0,0,0,0,0,0]];            //dummy to initialize plot on
}
setupDataStore();

function fetchCallback(){
    //runs as callback after all data has been refreshed.

    var leadingEdge, windowWidth;

    //keep track of this histogram and the last one for calculating rates:
    if(dataStore.currentSpectrum){
        dataStore.oldSpectrum = JSON.parse(JSON.stringify(dataStore.currentSpectrum));
    }
    dataStore.currentSpectrum = JSON.parse(JSON.stringify(dataStore.viewers[dataStore.plots[0]].plotBuffer[dataStore.targetSpectrum]));

    //note that at run start, the oldSpectrum will still have the stale state of the spectrum in it from last run,
    //since the analyzer keeps broadcasting it; so, drop old spectrum on run change
    if(dataStore.scalars.run != dataStore.oldRun)
        dataStore.oldSpectrum = [];

    dataStore.oldTime = dataStore.currentTime;
    dataStore.currentTime = Date.now()/1000;

    //update the rate monitor and backgrounds fits
    leadingEdge = dataStore._striptoolSliders.windowLeadingEdgeTime() / 3;
    windowWidth = parseInt(document.getElementById('rateSlideswindowSlider').value,10);
    dataStore._rateControl.appendNewPoint();
    dataStore._rateControl.updateDygraph(leadingEdge, windowWidth);
    //redraw spectrum, fit results included
    dataStore.viewers[dataStore.plots[0]].plotData();
}

function parseScalars(scalars){
    //JSON-P wrapper for ODB fetch
    
    if(dataStore.scalars)
        dataStore.oldRun = dataStore.scalars.run

    dataStore.scalars = {
        'accepted': scalars[0].SCAR[26],
        'ssb': scalars[0].SCAR[27],
        'clock': scalars[0].SCAR[28],
        'scint': scalars[0].SCAR[29],
        'ic': scalars[0].SCAR[30],
        'free': scalars[0].SCAR[31],
        'ratio1': scalars[0].SCAR[29]/scalars[0].SCAR[30],
        'ratio2': dataStore.rateData[dataStore.rateData.length - 1][3]/dataStore.rateData[dataStore.rateData.length - 1][2], //scalars[1].SCTR[1],
        'run': scalars[1]['Run number']
    }
}
