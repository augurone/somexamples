$(function(){
//Global configurations
    configs= {
        date: new Date(),
        navWr: $('.navbar'),
        navCont: configs.navWr.find('div.primary-navbar.navbar-inner'),
        content: $('div.container.masterwr.mainwr'),//This is the main content wrapper DOM selector
        subNavWr: configs.content.find('div.secondary-nav ul.nav'), 
        errors: $('div#errors'),
        reqroute : null,
        //Browser Typing
        browzType= {
            browse : navigator.appCodeName, //This is only useful if trying to determine between IE and any other Browser
            agent: navigator.userAgent, //This value is very verbose, and has to be parsed in order to be useful
            platform: navigator.platform, //Returns Systems type if there is a need to identify the OS/Chipset being used by the client. 
            version: navigator.appVersion, //A substring of agent, but really almost everything that agent has. 
            //Returns Browser Type for logical use elsewhere
            getBrowser:	function(){
                splitAgent= navProps.agent.split(' ');
                vlen= splitAgent.length;
                splitAgentCk= splitAgent[vlen-2].split('/')[0].match('Chrome');
                splitAgentLast= splitAgent[vlen-1].split('/')[0];
                splitAgentIE=  navProps.agent.match(/MSIE/);
                splitAgentCk == "Chrome" ? agent=splitAgent[vlen-2].split('/')[0] : splitAgentIE != "MSIE" ? agent=splitAgentLast : agent= navProps.browse+' v.'+navProps.version;
                return agent;
            }
        }
    }
    validPattern ={
        email : '(/^[aA-zZ0-9._%+-]+@[aA-zZ0-9.-]+\.[aA-zZ]{2,4}$/)*'
    }
//Web Service Request Handling
	requestHandler= {
		//Generic function checker to see if a method exists before running it, currently used on nav triggers
		fcheck : function(m){
			route= m.split('/');
			rtct= route.length-1;
			method= route[rtct];
			obs= window[method];
			typeof obs !== "undefined" >= 1 ? new requestHandler.initobs(obs) : obs ="";
		},
		//Initiates function object. May be extended to deal with queuing issues and Loading Scripts
		initobs : function(ob){
			pos= function(b){
				requestHandler.queuemgr.active=b;
				new b;
			}
			typeof ob === "function" ? pos(ob) : ob="";
		},
		queuemgr : {
			active: '',
			kill: function(fob){
				fob.dequeue();
				requestHandler.queuemgr.active= '';
			}
		},        
		request: function(route,pdata,fback){
			$.ajax({
				url:route,
                type:''
				dataType:'',
				data: pdata,
				success: function(data){
					fback.length !=0 && typeof fback === 'function' ? fback(data) : fback= "null";
					url= '';
					data= '';
					fback= '';
				},
				error: function(msg){
					configs.reqroute= route;
					requestHandler.errorHandler(msg);
				},
                accepts: '',
                async:true,
                cache:false,
                contentType:'',
                context: document.body,
                crossDomain:'',
                global:'',
                timeout:'',
                xhr:{},
                
			});
		},
		// Error Handler for entire App
		errorHandler: function(msg){
			msg.responseText != undefined ? builde() : parseresp= msg;
			function builde(){
				errorbx= $('<div></div>');
				$(errorbx).append(msg.responseText);
				errorInt= $(errorbx).find('#detail');
				errorInt.append('controller route '+rconfigs.reqroute);
				errorEx= $(errorbx).find('h2,p');
				errorZex= errorEx.text().replace('Reason:','');
				errorInt.length != 0 ? parseresp= errorInt : parseresp= '<p>'+errorZex+'</p>';
			}
			configs.errors.append(parseresp);
		}		
	}
	//View History
	//Skeleton only this should be extended. Right now it is only interacting with the Page Title Handling
	histTrak= {
			iniTitle: document.title,
			sects: null, //someObject.split('/') if URL based, may need to use title approach
			sect: null, //secs[secs.length-2],
			sunSect: null //secs[secs.length-1]
	}    
});