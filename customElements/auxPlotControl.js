xtag.register('x-aux-plot-control', {
    lifecycle:{
        inserted: function(){
            //inject template
            Promise.all(['auxPlotControl', 'auxPlotControlTable'].map(promisePartial)).then(
                function(templates){
                    dataStore.auxControlTable = templates[1];
                    this.innerHTML = Mustache.to_html(
                        templates[0], 
                        {
                            'id': this.id,
                            'plots': dataStore.plots
                        },
                        {
                            'auxPlotControlTable': templates[1]
                        }
                    );
                }.bind(this)
            ).then(
                function(){
                    this.configure();
                }.bind(this)
            )

            //listen for new table rows requests
            this.addEventListener('addPlotRow', this.newTableRow, false);

            //listen for new cell requests
            this.addEventListener('newCell', this.newTable, false);

            //listen for cell attach / unattach events
            this.addEventListener('deleteCell', this.deleteTable, false);

            //prepare the template for additional table rows
            promisePartial('fitRow').then(
                function(template){
                    dataStore.auxRowTemplate = template;
                }
            )
        }
    },

    methods:{
        /////////////////////
        //configuration
        /////////////////////

        configure: function(){
            //plug in delete all button
            document.getElementById(this.id + 'deleteAll').onclick = this.deleteAllSpectra;
            //plug in fit mode toggle
            document.getElementById(this.id + 'fitMode').onclick = this.toggleFitMode.bind(this);

        },

        ////////////////////////
        // table management
        ////////////////////////

        newTableRow: function(event){
            //add a row to table event.detail.target for spectrum event.detail.plotName
            //<event>: event; addPlotRow custom event
            //this: x-aux-plot-control object

            //generate the row object and append it
            var radio;
            var row = document.createElement('tr');
            row.setAttribute('id', event.detail.target + event.detail.plotName);
            row.setAttribute('class', 'plotControlTable')
            var color = dataStore.viewers[event.detail.target].dataColor[dataStore.viewers[event.detail.target].colorAssignment.indexOf(event.detail.plotName)]
            var html = Mustache.to_html(dataStore.auxRowTemplate, {
                'spectrum': event.detail.plotName, 
                'target': event.detail.target, 
                'color': color,
                'id': this.id
            });
            row.innerHTML = html;
            document.getElementById(this.id + event.detail.target + 'Table').appendChild(row);

            //plug in buttons
            document.getElementById('delete' + event.detail.target + event.detail.plotName).onclick = this.deleteSpectrum; 
            document.getElementById('zero' + event.detail.target + event.detail.plotName).onclick = this.zeroSpectrum; 
            document.getElementById('dropFit' + event.detail.target + event.detail.plotName).onclick = this.dropFit; 

            //plug in fit target radio, emulate its click behavior
            radio = document.getElementById(event.detail.target + event.detail.plotName + 'Radio')
            radio.onclick = this.setFitTarget
            radio.onclick();
        },

        newTable: function(event){
            //add a new table to go with a new cell
            //<event>: event; newCell custom event
            //this: x-aux-plot-control object

            var buffer = document.createElement('div');
            var html = Mustache.to_html(
                dataStore.auxControlTable, 
                {
                    'id': this.id,
                    'plots': [event.detail.cellName]
                }
            );
            buffer.innerHTML = html;
            this.appendChild(buffer.getElementsByTagName('div')[0]);
        },

        deleteTable: function(event){
            //delete a table on deleteCell event
            //<event>: event; deleteCell custom event
            //this: x-aux-plot-control object

            deleteNode(this.id + event.detail.cellName + 'TableWrapper');
        },

        ////////////////////////
        // data manipulation
        ////////////////////////

        deleteAllSpectra: function(){
            //delete every spectrum currently displayed

            var deleteButtons = document.getElementsByClassName('deleteRow')
            while(deleteButtons.length > 0){
                deleteButtons[0].onclick(); //actually modifies deleteButtons in place - keep deleting zeroth element.
            }
        },

        deleteSpectrum: function(){
            //callback for delete button to remove corresponding plot
            //this: delete button element

            var target = this.getAttribute('target')
            var spectrum = this.getAttribute('spectrum')

            dataStore.viewers[target].removeData(spectrum);
            dataStore.viewers[target].plotData();

            deleteNode(target + spectrum);
        },

        zeroSpectrum: function(){
            //callback for zero button to zero corresponding plot
            //this: zero spectrum button element

            var target = this.getAttribute('target')
            var spectrum = this.getAttribute('spectrum')

            dataStore.viewers[target].baselines[spectrum] = JSON.parse(JSON.stringify(dataStore.viewers[target].plotBuffer[spectrum]));
            dataStore.viewers[target].plotData();
        },

        dropFit: function(){
            //abandon last fit result for this spectrum
            //this: drop last fit button element

            var target = this.getAttribute('target')
            var spectrum = this.getAttribute('spectrum')

            var text = document.getElementById(target+spectrum+'FitResult').innerHTML
            text = text.split('<br>')
            text = text.slice(0, text.length-2).join('<br>')
            if(text=='')
                text = '-'

            document.getElementById(target+spectrum+'FitResult').innerHTML = text
            dataStore.viewers[target].plotData();
        },

        toggleFitMode: function(){
            //manage the state of the Fit Mode button, and the corresponding state of the viewer.
            //this: x-aux-plot-control object

            //determine which canvas and spectrum we're currently pointing at
            var radio = checkedRadio(this.id+'fitTarget');
            var target = radio.getAttribute('target');
            var spectrum = radio.getAttribute('spectrum');            

            var fitModeSwitch = document.getElementById(this.id + 'fitMode')
            var state = fitModeSwitch.getAttribute('engaged')

            //make sure the fit callback is set up
            dataStore.viewers[target].fitCallback = this.fitCallback.bind(this);

            if(state == 0){
                dataStore.viewers[target].setupFitMode();
                fitModeSwitch.setAttribute('engaged', 1);
                document.getElementById(this.id+'fitBadge').classList.add('redText')
            }
            else{
                dataStore.viewers[target].leaveFitMode();
                fitModeSwitch.setAttribute('engaged', 0);
                document.getElementById(this.id+'fitBadge').classList.remove('redText')
            }

            //toggle state indicator
            document.getElementById(this.id+'fitInstructions').classList.toggle('hidden')
        },

        /////////////////
        // callbacks
        /////////////////

        setFitTarget: function(event){
            //callback for radios to set fit targets
            //<event>: event; onclick
            //this: fit target radio element

            var target = this.getAttribute('target')
            var spectrum = this.getAttribute('spectrum')

            dataStore.viewers[target].fitTarget = spectrum;
        },

        fitCallback: function(center, width, amplitude, intercept, slope){
            //route the fit results to the table, and gracefully exit fit mode.
            //<center>: number; center of gaussian peak
            //<width>: number; width of peak
            //<amplitude>: number; amplitude of peak
            //<intercept>: number; intercept of linear background beneath peak
            //<slope>: number; slope of linear background
            //this: x-aux-plot-control object

            var radio = checkedRadio(this.id+'fitTarget');
            var target = radio.getAttribute('target');
            var spectrum = radio.getAttribute('spectrum'); 

            var spectrum = dataStore.viewers[target].fitTarget,
                reportDiv = document.getElementById(target+spectrum+'FitResult'),
                integral = 0,
                functionVals = [],
                i, x, sigmas = 5, stepSize = 0.01;

            if(reportDiv.innerHTML == '-')
                reportDiv.innerHTML = '';

            //calculate peak area in excess of background, for <sigmas> up and down.
            for(i=0; i<2*sigmas*width/stepSize; i++){
                x = center - sigmas*width + i*stepSize
                functionVals.push( gauss(amplitude, center, width, x)*stepSize )
                integral = functionVals.integrate()
            }

            reportDiv.innerHTML += 'Center: ' + center.toFixed(2) + ', SD: ' + width.toFixed(2) + ', Area: ' + integral.toFixed(2) + '<br>';

            this.toggleFitMode()
            dataStore.viewers[target].leaveFitMode();
        }
    }

});
