////////////////////////////////////////////
// main setup
////////////////////////////////////////////

function setupDataStore(){
    var i,j
    var YdCodes = []
    var YuCodes = []
    var Sd1Codes = []
    var Sd2Codes = []
    var SuCodes = []
    var CsICodes = []
    var ICCodes = []

    //generate detector nomenclature codes
	for(i=0; i<32; i++){
		ICCodes.push('ICCh' + alwaysThisLong(i,2));
    }
	for(i=0; i<128; i++){
		YuCodes.push('YuCh' + alwaysThisLong(i,3));
    }
	for(i=0; i<128; i++){
		YdCodes.push('YdCh' + alwaysThisLong(i,3));
    }
	for(i=0; i<64; i++){
		Sd1Codes.push('Sd1Ch' + alwaysThisLong(i,2));
    }
	for(i=0; i<64; i++){
		Sd2Codes.push('Sd2Ch' + alwaysThisLong(i,2));
    }
	for(i=0; i<64; i++){
		SuCodes.push('Sd1Ch' + alwaysThisLong(i,2));
    }
	for(i=0; i<32; i++){
		CsICodes.push('CsICh' + alwaysThisLong(i,2));
    }

    //declare top level groups
    var topGroups = [
        {
            "name": "Hit Patterns & Sums",
            "id": "hitsAndSums",
            "color": '#367FA9',
            "subGroups": [
                {
                    "subname": "Hit Patterns",
                    "id": "hits",
                    "items": [
                        'YdHits',
                        'CsI1Hits',
                        'CsI2Hits',
                        'Sd1rHits',
                        'Sd1sHits',
                        'Sd2rHits',
                        'Sd2sHits'
                    ]
                },
                {
                    "subname": "Sum Spectra",
                    "id": "sums",
                    "items": [
                        'SUM_Singles_Energy',
                        'SUM_Addback_Energy'
                    ]
                }
            ]
        },
		
		{
            "name": "Overview",
            "id": "IC-SSB",
            "color": '#367FA9',
            "subGroups": [
                {
                    "subname": "Energy",
                    "id": "IC_E",
                    "items": [
						'ICEnergy',
						'YdEnergy',
						'CsI1Energy',
						'CsI2Energy',
						'Sd1rEnergy',
						'Sd1sEnergy',
						'Sd2rEnergy',
						'Sd2sEnergy',
						'SSBEnergy'
					]
                },
        	]
        },

        {
            "name": "IC",
            "id": "IC",
            "color": '#367FA9',
            "subGroups": [
				{
                    "subname": "ADC spectra",
                    "id": "IC_P",
                    "items": ICCodes.map(function(c){return c + 'ADC'})
                },
				{
                    "subname": "Energy",
                    "id": "IC_E",
                    "items": ICCodes.map(function(c){return c + 'Energy'})
                },
        	]
        },

        {
            "name": "YY1",
            "id": "YY1",
            "color": '#367FA9',
            "subGroups": [
				{
                    "subname": "ADC spectra",
                    "id": "YY1_P",
                    "items": YdCodes.map(function(c){return c + 'ADC'})
                },
				{
                    "subname": "Energy",
                    "id": "YY1_E",
                    "items": YdCodes.map(function(c){return c + 'Energy'})
                },
        	]
        },

        {
            "name": "CsI",
            "id": "CsI",
            "color": '#367FA9',
            "subGroups": [
				{
                    "subname": "ADC spectra",
                    "id": "CsI_P",
                    "items": CsICodes.map(function(c){return c + 'ADC'})
                },
				{
                    "subname": "Energy",
                    "id": "CsI_E",
                    "items": CsICodes.map(function(c){return c + 'Energy'})
                },
        	]
        },

        {
            "name": "S3-1",
            "id": "S3-1",
            "color": '#367FA9',
            "subGroups": [
				{
                    "subname": "ADC spectra",
                    "id": "S3-1_P",
                    "items": Sd1Codes.map(function(c){return c + 'ADC'})
                },
				{
                    "subname": "Energy",
                    "id": "S3-1_E",
                    "items": Sd1Codes.map(function(c){return c + 'Energy'})
                },
        	]
        },

        {
            "name": "S3-2",
            "id": "S3-2",
            "color": '#367FA9',
            "subGroups": [
				{
                    "subname": "ADC spectra",
                    "id": "S3-2_P",
                    "items": Sd2Codes.map(function(c){return c + 'ADC'})
                },
				{
                    "subname": "Energy",
                    "id": "S3-2_E",
                    "items": Sd2Codes.map(function(c){return c + 'Energy'})
                },
        	]
        },

        {
            "name": "YY1-upstream",
            "id": "YU",
            "color": '#367FA9',
            "subGroups": [
				{
                    "subname": "ADC spectra",
                    "id": "YU_P",
                    "items": YuCodes.map(function(c){return c + 'ADC'})
                },
				{
                    "subname": "Energy",
                    "id": "YU_E",
                    "items": YuCodes.map(function(c){return c + 'Energy'})
                },
        	]
        },

        {
            "name": "S3-upstream",
            "id": "S3-u",
            "color": '#367FA9',
            "subGroups": [
				{
                    "subname": "ADC spectra",
                    "id": "S3-u_P",
                    "items": SuCodes.map(function(c){return c + 'ADC'})
                },
				{
                    "subname": "Energy",
                    "id": "S3-u_E",
                    "items": SuCodes.map(function(c){return c + 'Energy'})
                },
        	]
        }
    ]

    dataStore = {
        "pageTitle": 'Spectrum Viewer',                             //header title
        "topGroups": topGroups,                                     //groups in top nav row
        "waveformSnap": true,                                       //do we want the snap to waveform functionality?
        "doUpdates": true,                                          //do we want the data update button and loop?
        "scaling": true,                                           //do we want to expose x-axis rescaling UI?
        "plots": [],                                                //array of names for default plot cells
//        "plotNameListeners": ['plotControl'],                       //array of ids of elements listneing for requestPlot events
//        "addPlotRowListeners": ['auxCtrl'],                         //array of ids of elements listneing for addPlotRow events
//        "attachCellListeners": ['plotControl'],                     //array of ids of elements listneing for attachCell events
//        "deleteCellListeners": ['plotControl', 'auxCtrl'],          //array of ids of elements listneing for deleteCell events
//        "newCellListeners": ['plotControl','auxCtrl'],              //array of ids of elements listneing for newCell events
        "spectrumServer": 'http://iris00.triumf.ca:9094/',        //analyzer url + port
//        "ODBrequests": ['http://iris00.triumf.ca:8081/?cmd=jcopy&odb0=/Runinfo/Run number&encoding=json-p-nokeys&callback=parseODB'], //array of odb requests to make on refresh
        "ODBrequests": [],                                          //array of odb requests to make on refresh
        "zeroedPlots": {}                                           //initialize empty object for zeroed plots
    }
    dataStore.cellIndex = dataStore.plots.length;

}
setupDataStore();


/////////////////
// helpers
/////////////////

function fetchCallback(){
    //fires after all data has been updated

    var i, 
        keys = Object.keys(dataStore.viewers);

    for(i=0; i<keys.length; i++){
        dataStore.viewers[keys[i]].plotData(null, true);
    }
}

// function parseODB(payload){
//     //keep track of the current run number after every data update
//     var i,
//         keys = Object.keys(dataStore.viewers);
// 
//     dataStore.currentRun = payload[0]['Run number']
// 
//     //dump all spectra zeroing on run change
//     if(dataStore.currentRun != dataStore.lastRun){
//         for(i=0; i<keys.length; i++){
//             dataStore.viewers[keys[i]].baselines = {};
//         }
//         dataStore.lastRun = dataStore.currentRun
//     }
// }
