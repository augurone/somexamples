$(function(){
//Global configurations
	//Browser Typing
	//Currently this is not being used, but I am keeping it for just incase purposes, especially since IE8 has been a cocern. 
	navProps= {
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
	//View History
	//Skeleton only this should be extended. Right now it is only interacting with the Page Title Handling
	histTrak= {
			iniTitle: document.title,
			sects: null, //someObject.split('/') if URL based, may need to use title approach
			sect: null, //secs[secs.length-2],
			sunSect: null //secs[secs.length-1]
	}
	valids ={
			email : /^[aA-zZ0-9._%+-]+@[aA-zZ0-9.-]+\.[aA-zZ]{2,4}$/
	}
//Web Service Request Handling
	requestHandler= {
		configs: {
			date :	new Date(),
			content: $('div.container.masterwr.mainwr'),
			errors: $('#errors'),//This is the main content wrapper DOM selector
			reqroute : null
		},
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
			//console.log(ob)
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
				dataType:'json',
				data: pdata,
				success: function(data){
					fback.length !=0 && typeof fback === 'function' ? fback(data) : fback= "null";
					url= '';
					data= '';
					fback= '';
				},
				error: function(msg){
					requestHandler.configs.reqroute= route;
					requestHandler.errorHandler(msg);
				}
			});
		},
		// Error Handler for entire App
		errorHandler: function(msg){
			msg.responseText != undefined ? builde() : parseresp= msg;
			function builde(){
				errorbx= $('<div></div>');
				$(errorbx).append(msg.responseText);
				errorInt= $(errorbx).find('#detail');
				errorInt.append('controller route '+requestHandler.configs.reqroute);
				errorEx= $(errorbx).find('h2,p');
				errorZex= errorEx.text().replace('Reason:','');
				errorInt.length != 0 ? parseresp= errorInt : parseresp= '<p>'+errorZex+'</p>';
			}
			requestHandler.configs.errors.append(parseresp);
		}		
	}	
//Functional Handlers for Widgets	
	//DATA URI OBJECT (text/csv;charset=utf-8) !!!<a href="URI" download="MyFile.csv">Download</a>???IE and CHROME, there ibe filesize limits on IE.
	//http://stackoverflow.com/questions/10000173/data-uri-for-csv-file-in-firefox-not-putting-csv-extension
	dURI={
		data:'',
		handler: function(data,fback){
			dURI.data= encodeURI(data);
			ahref= 'data:application/csv;charset=utf-8,'+dURI.data;
			fback.length != 0 && typeof fback === 'function' ? fback(ahref) : fback= "null";
		}
	}
// Tab Management
	actmgt= function(el){
		act= $(el).parent().find('.active')
		$(act).removeClass('active');
	}
	loaded= function(ind){
		$('.container.masterwr.mainwr').load(thref,function(){
			actmgt(actr);
			requestHandler.configs.errors.html('');
			ttle= thref.split('/')[1];
			acttab= $('.navbar .nav .tab')[ind];
			$(acttab).addClass('active');
			extract= $(this).find('.container.masterwr.mainwr'); //will want to eliminate this
			extract.length != 0 ? $(this).replaceWith(extract):extract="";// will want to eliminate this
			thref.length ? requestHandler.fcheck(thref) : requestHandler.fcheck('index');
			document.title= histTrak.iniTitle+':'+ttle;
		});
	}
	loadi= function(ind){
		$('.container.masterwr.mainwr .modules').load(thref,function(){
			splTitle= document.title.split(':')[1];
			stgTitle= splTitle.split('-')[0];
			tprep= thref.split('/');
			ttle= tprep[tprep.length-1];
			acttab= $('.navbar .nav .tab')[ind];
			$(acttab).addClass('active');
			actmgt($this);
			acttab= $('.tab')[ind];
			$(acttab).addClass('active');
			extract= $(this).find('.row.modules');//will want to eliminate this
			extract.length != 0 ? $(this).replaceWith(extract) :extract=""; //will want to eliminate this
			requestHandler.fcheck(thref);
			document.title= histTrak.iniTitle+':'+stgTitle+'-'+ttle;
			requestHandler.configs.errors.html('');
		});
	}
	doubleLoad= function(ind){
		$('.container.masterwr.mainwr').animate({'opacity':0}, function(){
			$('body').css({'overflow-y':'hidden'});
			$('.container.masterwr.mainwr').load(thref,function(){
				requestHandler.fcheck(thref);
				actmgt(actr);
				requestHandler.configs.errors.html('');
				ttle= thref.split('/')[1];
				acttab= $('.navbar .nav .tab')[ind];
				$(acttab).addClass('active');
				document.title= histTrak.iniTitle+':'+ttle;
				newroute= '/aircraft/issues';
				newindex = 4;
				keepgoing(newroute, newindex);
				function keepgoing(rt, ind){
					$('.container.masterwr.mainwr .modules').load(rt,function(){
						requestHandler.fcheck(rt);
						splTitle= document.title.split(':')[1];
						stgTitle= splTitle.split('-')[0];
						tprep= thref.split('/');
						ttle= tprep[tprep.length-1];
						actmgt($('.nav.nav-pills .tab.active'));
						acttab= $('.tab')[ind];
						$(acttab).addClass('active');
						document.title= histTrak.iniTitle+':'+stgTitle+'-'+ttle;
						requestHandler.configs.errors.html('');
					});
				}
			});
		}).animate({'opacity':1},500, function(){
			$('body').removeAttr('style');
		});
	}
	//This should be done in scala but this will do for now. Thanks
	userName = {
		getname: $.ajax({type:'GET',url:'/username',async:false}).responseText,
		setname: function(el){
			var named = userName.getname,
				name = named.trim().toUpperCase();
			name != 'undefined' ? $(el).text(name) : requestHandler.errorHandler('controller route /username has failed');
		}
	}
	//Table Stuff
	tables= {
		sort:{
			asc: function (obj){
	    		sorting= [[cid,0]];
	    		sicon= $(obj).find('i.pull-right');
	    		$(sicon).hasClass('icon-sort') ? $(sicon).removeClass('icon-sort').addClass('icon-sort-up'): $(sicon).removeClass('icon-sort-down').addClass('icon-sort-up');
	    		$(obj).removeClass('desc');
	    		$(obj).addClass('asc');
	    		return sorting;
	    	},
			desc: function (obj){
	    		sorting= [[cid,1]];
	    		sicon= $(obj).find('i.pull-right');
	    		$(sicon).hasClass('icon-sort') ? $(sicon).removeClass('icon-sort').addClass('icon-sort-down'): $(sicon).removeClass('icon-sort-up').addClass('icon-sort-down');
	    		$(obj).removeClass('asc');
	    		$(obj).addClass('desc');
	    		return sorting;
	    	}
		},
		settings:{
			getHDset : function(HD){
				gese= $(HD).find('> thead');
				hese= $(gese).find('tr > th');
				hdWd= [];
				$.each(hese,function(){
					gw= $(this).attr('class');
					gws= gw.split(' ');
					gws.length > 1 ? gwf= gws[gws.length-1] : gwf= gws;
					hdWd.push(gwf);
				});
				return hdWd;
			},
			setCol: function(cols,tabla){
				cols.length == warr.length ? tables.settings.colWidths(cols) : requestHandler.errorHandler('Row '+j+' does not have enough columns');
			},
			colWidths: function(cols){
				for (k=0; k < cols.length; k++){
					setob= cols[k];
					getW= warr[k];
					$(setob).addClass(getW);
				}
			},
			tablSettings : function(t){
				tabla= t;
				warr= tables.settings.getHDset(tabla);
				tables.build.tobuild.length != 0 && tables.build.dbuild.length != 0 ? tables.build.tobuild.html(tables.build.dbuild) : tbck=0;
				tese= $(tabla).find('td.table_content div table.table');
				jese= $(tabla).find('td.table_content div table.table > tbody tr');
				for (j=0; j < jese.length; j++) {
					colspar= jese[j];
					ci= j
					cols= $(colspar).find('td');
					tables.settings.setCol(cols,tabla);
				}
			}
		},
		build: {
			tobuild: '',
			dbuild: '',
			bdck:''
		},
		exportable: {
			//parse the table
			csvStr: function(tocsv){
				hds= $(tocsv).find('thead tr th');
				hlen= hds.length;
				rws= $(tocsv).find('tbody tr');
				rlen= rws.length;
				dobj= new Date();
				date= dobj.getDay()+'-'+dobj.getMonth();
				hd= [];
				cel= [];
				row= [];
				tbd= [];
				result= [];
				for ( h=0 ; h < hlen; h++){
					hd.push('"'+hds[h].innerHTML+'"');
				};
				tbd.push(hd.join());
				for ( r=0 ; r < rlen; r++){
					rw= rws[r]
					cs= $(rw).find('td div');
					for ( c=0 ; c < cs.length; c++){
						cel.push('"'+cs[c].innerHTML+'"');
					}
					row.push('\n'+cel.join());
					cel =[];
					tbd.push(row.join(''));
					row= [];
				};
				tbd.join('');
				dURI.handler(tbd,function(ahref){
					$('#download').attr('download','AuditLog'+date+'.csv').attr('href',ahref);
				});
			}
		},
		tpar:function(tabl){
			loc= tabl;
			table= $(loc).parent().parent().parent().parent().parent();
			tables.build.tobuild= $(loc).find('tbody');
			tables.settings.tablSettings(table);
			acthead = $(table).find('thead tr th.sort.sorted');
			actind = $(acthead).index();
			$(acthead).hasClass('desc') ? actord = 1 : actord=0;
			actord == 0 ? iconsort = 'icon-sort-up' : iconsort='icon-sort-down';
			arodef = $(acthead).find('i.icon-sort');
			$(loc).tablesorter({
				sortList:[[actind,actord]],
				cssChildRow: "expand-child"
			});
			$(acthead).addClass('active');
			$(arodef).removeClass('icon-sort').addClass(iconsort);
			$('tr.tsparent:even').addClass('even');
			$('tr.tsparent:odd').addClass('odd');
			tables.build.tobuild= "";
			tables.build.dbuild="";
		}
	}
//This object is populated based on request, and is used across all Asset Pages
	craftConfig={
			site: 'null',
			issarr: [],
			assetIssueId: 'null',
			alertct: 0,
			warnct: 0,
			clearct: 0,
			clearall: function(){
				craftConfig.issarr= [];
				craftConfig.alertct= 0;
				craftConfig.warnct= 0;
				craftConfig.clearct= 0;	
			},
			ck: 0,
			issuesCounter: function(){
				issu= craftConfig.issarr;
				for (s=0; s < issu.length; s++){
					issu[s].severityCode >=1 && issu[s].severityCode <=3 ? craftConfig.alertct= craftConfig.alertct+1 : issu[s].severityCode >=4 && issu[s].severityCode <=6 ? craftConfig.warnct= craftConfig.warnct+1 : craftConfig.clearct= craftConfig.clearct+1;
				};
			},
			issAlr : '<span class="sortval">4</span><span class="issue alrt">&bull;</span><span class="issue trans">&bull;</span><span class="issue trans">&bull;</span>',
			issWrn : '<span class="sortval">3</span><span class="issue trans">&bull;</span><span class="issue wrn">&bull;</span><span class="issue trans">&bull;</span>',
			issNone :'<span class="sortval">2</span><span class="issue trans">&bull;</span><span class="issue trans">&bull;</span><span class="issue none">&bull;</span>',
			issBlank :'<span class="sortval">1</span>'
	}
	//ON DOM
	index= function(){
		craftConfig.clearall();
		// FOR INDEX Issues Table
		requestHandler.request('/allIssues','',function(data){
			//console.log(data)
			tabl= $('#issues').find('.table_content div table.table');
			con= []
			for(i=0; i < data.length; i++){
				startTime= new Date(data[i].issueStartTime);
				fixTime= new Date(data[i].mxPeriod);
				mxck= Math.floor((fixTime - requestHandler.configs.date)/1000/60/60);
				age= Math.floor((requestHandler.configs.date - startTime)/1000/60/60);
				mxck < 0 && mxck > -10000 ? mx ='overdue '+ -(mxck)+' hrs' : mxck < -10000 ? mx= 'overdue >10K hrs' : mx= mxck+' hrs';
				mx =='overdue >10K hrs'? age = '>10K hrs' : age=age+' hrs';
				data[i].severityCode >= 1 && data[i].severityCode <=3 ? diss= craftConfig.issAlr : data[i].severityCode >= 4 && data[i].severityCode <= 6  ? diss= craftConfig.issWrn : diss= '';
				model={
					severityCode:'<td><div>'+diss+'</td></div>',
					mxPeriod:'<td><div>'+mx+'</td></div>',
					issueId:'<td><div>'+data[i].issueID+'</td></div>',
					issueDescription:'<td><div>'+data[i].issueDescription+'</td></div>',
					ataRef:'<td><div>'+data[i].ataRF+'</td></div>',
					alage:'<td><div>'+age+'</td></div>',
					issueStatus:'<td><div>'+data[i].status+'</td></div>',
					foreignKey: data[i].siteID
				}
					tr= '<tr id="'+data[i].issueID+'" class="issuelink" title="'+model.foreignKey+'">'+model.severityCode+model.mxPeriod+model.issueId+model.issueDescription+model.ataRef+model.alage+model.issueStatus+'</tr>';
					con.push(tr);				
			}
			tables.build.dbuild= con.join('');
			tables.tpar(tabl);
		});
	// FOR INDEX AIRCRAFT TABLE :::: http://sjc1ssaivhm04:9090/service/aviation-service/aviation/aircraftInfo
		requestHandler.request('/aircraftInfo','',function(data){
			tabl= $('#aircraft').find('.table_content div table.table');
			con= []
				for(i=0; i < data.length; i++){
					outDate= new Date( data[i].flightOffTime).getMonth()+'/'+new Date(data[i].flightOffTime).getDate();
					outTime= new Date(data[i].flightOffTime).getHours()+':'+ new Date(data[i].flightOffTime).getMinutes();
					offTime= new Date(data[i].flightOffTime).getHours()+':'+ new Date(data[i].flightOffTime).getMinutes();
					onTime= new Date(data[i].flightOnTime).getHours()+':'+ new Date(data[i].flightOnTime).getMinutes();
					inTime= new Date(data[i].inTime).getHours()+':'+ new Date(data[i].inTime).getMinutes();
					inDate= new Date(data[i].inTime).getMonth()+'/'+new Date(data[i].inTime).getDate();
					sited= data[i].siteNo.replace(/(.{8})/g,"$1 ");// This is a bit of a hack, but conceptually could serve some purpose. 
					craftConfig.issarr=data[i].issues;
					craftConfig.issuesCounter();
					craftConfig.alertct != 0 ? diss= craftConfig.issAlr : craftConfig.warnct !=0 ? diss= craftConfig.issWrn : diss= craftConfig.issNone;
					model={
						isss: '<td><div>'+diss+'</div></td>',
						tailno: '<td><div><a class="crosslink" href="'+data[i].siteNo+'">'+sited+'</a></div></td>',
						serialNo: '<td><div>'+data[i].serialNo+'</div></td>',
						modelNo: '<td><div>'+data[i].modelNo+'</div></td>',
						flightNo: '<td><div>'+data[i].flightNo+'</div></td>',
						outDate: '<td><div>'+outDate+'</div></td>',
						outTime: '<td><div>'+outTime+'</div></td>',
						flightOffTime: '<td><div>'+offTime+'</div></td>',
					    flightOnTime: '<td><div>'+onTime+'</div></td>',
						inTime: '<td><div>'+inTime+'</div></td>',
						inDate: '<td><div>'+inDate+'</div></td>',
						inLocation: '<td><div>'+'NULL'+'</div></td>'
					}
						tr= '<tr class="tsparent">'+model.isss+model.tailno+model.serialNo+model.modelNo+model.flightNo+model.outDate+model.outTime+model.flightOffTime+model.inTime+model.flightOnTime+model.inDate+model.inLocation+'</tr>';
						con.push(tr);
						craftConfig.clearall();					
				}
				tables.build.dbuild= con.join('');
				tables.tpar(tabl);
		});
		userName.setname('.userInfo');
		userName.setname('.userInfoBd');
	}
	index();
//Feature Initiators called by requestHandler.initobs()
//THIS IS FOR THE AIRCRAFT OVERVIEW PAGE WHICH IS VERY SPARSE RIGHT NOW
	aircraft= function(){
		craftConfig.clearall();
		requestHandler.request('/aircraftOverview','aID='+craftConfig.site,function(data){
			craftConfig.issarr.length == 0 ? ctFunc() : ctoFunc();			
			var strData1 ='<dt>registration:</dt><dd>'+data.site+'</dd>'
					+'<dt>serial #:</dt><dd>'+data.serialNo+'</dd>'
					+'<dt>manufacturer:</dt><dd>'+data.manufacturer+'</dd>'
					+'<dt>model:</dt><dd>'+data.modelNo+'</dd>'
					+'<dt class="cleared">Fleet:</dt><dd class="cleared">TK</dd>'
			$('#reg').html(strData1);
			var strData2 ='<dt>number of flights:</dt><dd>'+data.flightCount+'</dd>'
					+'<dt>total flight hours:</dt><dd>'+data.totalFlightHours+'</dd>'
					+'<dt>last maintenance:</dt><dd>24 Days</dd>'
					+'<dt>last maintenance port:</dt><dd>DAL</dd>'
					+'<dt class="cleared">maintenance comments:</dt>'
					+'<dd class="cleared">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec tristique justo eu lorem posuere a accumsan augue ultrices. Vivamus elit lacus, eleifend id congue porta, iaculis vel metus. Pellentesque felis orci, vestibulum nec faucibu </dd>';
			$('#reg1').html(strData2);
			function ctFunc(){
				craftConfig.issarr= data.issues;
				craftConfig.issuesCounter();
				$('.label-important a span, .badge-important').html(craftConfig.alertct);
				$('.label-ready a span, .badge-warning').html(craftConfig.warnct);
			}
			function ctoFunc(){
				$('.label-important a span').html(craftConfig.alertct);
				$('.label-ready a span').html(craftConfig.warnct);
			}
		});
		$('.airCraftName').html('').append(craftConfig.site);
	}
	//This will grab the issues for the aircraft.
	issues= function(){
		iss= craftConfig.issarr;
		tabl= $('td.table_content div table.table');
		con=[];
		alr = craftConfig.issAlr;
		wrn = craftConfig.issWrn
		for (s=0; s < iss.length; s++){
			iss[s].severityCode >=1 && iss[s].severityCode <= 3 ? diss= craftConfig.issAlr : iss[s].severityCode>=4 && iss[s].severityCode <= 6 ? diss= craftConfig.issWrn : diss=craftConfig.issBlank;
			detail = iss[s].fault;
			darr =[];
			for (key in detail){
				darr.push('<p>'+key+':'+detail[key]+'</p>');
			}
			model={
					severityCode:'<td><div>'+diss+'</div></td>',
					mxPeriod:'<td><div>'+iss[s].timingCode+'</div></td>',
					issueId:'<td><div>'+iss[s].issueId+'</div></td>',
					issueDescription:'<td><div>'+iss[s].issueDescription+'</div></td>',
					ataRef:'<td><div>'+iss[s].fault.ataSubChapter+'</div></td>',
					alage:'<td><div>'+iss[s].generatedTime+'</div></td>',
					issueStatus:'<td><div>'+iss[s].issueStatus+'</div></td>',
					issueFault:'<div id="'+iss[s].issueId+'_detail" class="detail">'+darr.join('')+'</div>'
				}
			tr= '<tr id="row_'+iss[s].issueId+'" class="tsparent">'+model.severityCode+model.mxPeriod+model.issueId+model.issueDescription+model.ataRef+model.alage+model.issueStatus+'</tr>';
			subtr = '<tr class="expand-child"><td colspan=7>'+model.issueFault+'</td></tr>';
			con.push(tr);
			con.push(subtr);
		}
		tables.build.dbuild= con.join('');
		tables.tpar(tabl);
	}
	flights= function(){
		tables.tpar('td.table_content div table.table');
	}
	charts= function(){
		//Using Hightcharts Plugin see www.highcharts.com/ for configurations options
		//Need to refactor to have only one requestHandler, and to instantiated the Chart object without a series available. 
		//Need to better analyze functionality, right now hard wires data selection, need to understand use cases more. 
		//THIS IS THE CORRECT WAY requestHandler.request('/chartData',{aID:craftConfig.site,yParam:"1",xParam:"0",start:"2012-08-15 12:01:00",end:"2012-08-16 14:58:00"},function(data){
		requestHandler.request('/chartData',{aID:"0000042C00000002",yParam:"1",xParam:"0",start:"2012-08-15 12:01:00",end:"2012-08-17 14:58:00"},function(data){
			data.xyvalues.length >=1 ? ds= data.xyvalues : ds= '[[0,1]]';
			dtitle= data.yLabelName+" over "+data.xLabelName.toUpperCase()
			charted= new Highcharts.StockChart({
	            chart : {
	                renderTo : 'charts'
	            },
	            rangeSelector : {
	                selected : 1,
	                enabled:false,
	                inputEnabled: false,
	                inputDateFormat: "%m-%d %H:%M",
	            },
	            legend: {
	            	enabled: false,
	                layout: 'vertical',
	                align: 'right',
	                verticalAlign: 'top',
	                x: 100,
	                navigation: {
	                    activeColor: '#3E576F',
	                    animation: true,
	                    arrowSize: 12,
	                    inactiveColor: '#CCC',
	                    style: {
	                        fontWeight: 'bold',
	                        color: '#333',
	                        fontSize: '12px'    
	                    }
	                }
	            },
	            series : [{
	                name : data.yLabelName,
	                data : ds,
	                type: 'line',
	                tooltip: {
	                    valueDecimals: 4
	                },
	                showInLegend: true
	            }]
	        });
	       $('text[text-anchor=end]').remove();
	       $('.plot_trigger').live('click', function(){
	    	   selects= $('#chartbdr').find('select');
	    	   params= [];
	    	   for (i=0; i < selects.length; i++){
	    		  $(selects)[i].value !="System" && $(selects)[i].value !="Chart Type" ?  params.push(selects[i].value) : ck=0;
	    	   }
	    	   ypara= params[1];
			   //THIS IS THE RIGHT WAY IF DATA IS CORRECT requestHandler.request('/chartData',{aID:craftConfig.site,yParam:ypara,xParam:"0",start:"2012-08-16 12:01:00",end:"2012-08-16 14:58:00"}, function(data){
	    	   requestHandler.request('/chartData',{aID:"0000042C00000002",yParam:ypara,xParam:"0",start:"2012-08-15 12:01:00",end:"2012-08-17 14:58:00"}, function(data){
	   
	    		   var series= {
			            id: 'series'+i,
			            name: data.yLabelName,
			            data: data.xyvalues,
			            tooltip: {
		                    valueDecimals: 4
		                },
						showInLegend: true
			        }
					charted.addSeries(series);
				});
	       });
		});
		/// This is for all the availble ports, will need some contextual queries for this URL http://sjc1ssaivhm04.research.ge.com:9090/service/aviation-service/aviation/ports
	}
	alerts = {
		asset: 'Please Select Valid Asset Parameters',
		email: 'One Valid Email is required',
		event: 'Please Select Valid Event',
		template: 'Please Select Valid Template'
	}
	admin= function(){
		requestHandler.request('/auditLogs','',function(data){
			tabl= $('td.table_content div table.table');
			con= []
			for(i=0; i < data.length; i++){
				$.trim(data[i].auditLogPriority) >=1 && $.trim(data[i].auditLogPriority) <= 3 ? diss= craftConfig.issNone : $.trim(data[i].auditLogPriority)>=4 && $.trim(data[i].auditLogPriority) <= 6 ? diss= craftConfig.issWrn : diss=craftConfig.issAlr;
				model={
					ts: '<td><div>'+data[i].auditLogTimestamp+'</div></td>',
					id: '<td><div>'+data[i].auditLogID+'</div></td>',
					cat: '<td><div>'+data[i].auditLogCategoryName+'</div></td>',
					event: '<td><div>'+data[i].auditLogDescriptoin+'</div></td>',
					priority: '<td><div>'+diss+'</div></td>'
				}
				tr= '<tr class="tsparent">'+model.ts+model.id+model.cat+model.event+model.priority+'</tr>';
				con.push(tr);
			}
			tables.build.dbuild= con.join('');
			tables.tpar(tabl);
			tables.exportable.csvStr(tabl);
		});
		userName.setname('.userInfoBd');
	}
	//Populate First Select Menu with available Asset Types
	formHandlers ={
		fselect : function(firstSelect){
			$(firstSelect).live('change',function(){
				var $this = $(this);
					selected = $this.find('option:selected'),
					id = $(selected).attr('id');
				con = ['<option value="0" disabled="" selected="">Asset Id</option>'];
				requestHandler.request('/reportAssets/'+id,'',function(data){
					for(r=0; r<data.asset.length; r++){
						model={
							option:'<option id='+data.asset[r].site+'>'+data.asset[r].name+'</option>' 
						}
						con.push(model.option);
					}
					$this.next('select').removeAttr('disabled').html(con.join(''));
				});
			});								
		},
		assetypes : function(formid, firstSelect){
			requestHandler.request('/reportAssetTypes','',function(data){
				var con= [];
				for(a=0; a < data.length; a++){
					model={
						option:'<option id='+data[a].ancestor+'>'+data[a].description+'</option>'
					}
					con.push(model.option);
				}
				//formHandlers.formclone = $(formid).clone();
				con.length >= 1 ? $(firstSelect).append(con.join('')) : con = [];
			});
		}		
	}
	reportTable = function(){
		requestHandler.request('/reportDetails','',function(data){
			tabl= $('td.table_content div table.table');
			con= [];
			if (data != ''){
			for(i=0; i < data.length; i++){
				emails= data[i].subscriberEmailAddresses;
				emails != null ? etst = emails.indexOf(',') : etst = -1;
				etst > -1 ? splitemails(): emailed = emails;
				function splitemails(){
					earr= [];
					esplit = emails.split(',')
					for(e=0; e < esplit.length; e++){
						email = esplit[e].trim(',');
						e != ', '  ? earr.push(email+', ') : earr.push(email);
					}
					emailed = earr.join('').replace(/(,\s*$)|(,\s,\s*$)|(^\")|(\"$)/g,"");
					return emailed;
				}
				model={
					id: '<td><div>'+data[i].id+'</div></td>',
					asset: '<td><div>'+data[i].asset+'</div></td>',
					template: '<td><div>'+data[i].reportTemplateId+'</div></td>',
					email: '<td><div>'+emailed+'</div></td>',
					schedule: '<td><div>'+$.trim(data[i].weeklyScheduleDay)+'</div></td>'
				}
				tr= '<tr class="tsparent">'+model.stamp+model.id+model.asset+model.template+model.email+model.schedule+'</tr>';
				con.push(tr);
			}
			tables.build.dbuild= con.join('');
			tables.tpar(tabl);
			}else{
				tables.build.dbuild='';
				tables.build.tobuild='';
				tables.build.bdck='';
				tables.tpar(tabl);				
			}
		});	
	}
//This will need some stregthening particularly with validation. 
	reports= function(){
		var formid = $('form#rep_req'),
			firstSelect= $('form#rep_req select')[0],
			lastSelect= $('form#rep_req select[title="Template"]');
		//Populate Table with existing report data
		reportTable();
		//Populate First Select Menu with available Asset Types
		formHandlers.assetypes(formid,firstSelect);
		formHandlers.fselect(firstSelect);
		requestHandler.request('/reportTemplates','',function(data){
			var con= [];
			for(a=0; a <= data.length; a++){
				model={
					option:'<option id='+data[a].ancestor+'>'+data[a].description+'</option>'
				}
				con.push(model.option);
			}
			con != '' ? $(lastSelect).append(con.join('')):$(lastSelect).append('<option>0023</option>');
		});
		$('#reportSubmit').live('click',function(){
			var formdata = {
				reportTemplateId : $('#templateName').val(),
			    assetId : $('#assetId option:selected').attr('id'),
			    email: $('#email').val(),
			    cmsg:encodeURIComponent($('#customMsg').val()),
			    sub: encodeURIComponent($('#subject').val())
			}
			var routed = 'reportTemplateId='+formdata.reportTemplateId+'&assetId='+formdata.assetId+'&email='+formdata.email+'&cmsg="'+formdata.cmsg+'"&sub="'+formdata.sub+'"';
			populate = function(){		
				$.ajax({
					url: '/reportOnServer?'+routed,
					type: 'GET',
					success: function(data){
						alert('success '+data+' sumbitted, email sent to '+formdata.email);
					    $(formid).find(':input').each(function() {
					        switch(this.type) {
					            case 'password':
					            case 'select-multiple':
					            case 'text':
					            case 'textarea':
					                $(this).val('');
					                break;
					            case 'select-one':
					            	$(this).find('option')[0].selected = true;
					            case 'checkbox':
					            case 'radio':
					                this.checked = false;
					        }
					    });
					    tables.build.dbuild = '';
					    $('td.table_content div table.table tbody tr').html('');
						dselect = $('form#rep_req select')[1];
						$(dselect).attr('disabled', 'disabled');
						reportTable();
					},
					error: function(msg){
						requestHandler.errorHandler(msg);
					}
				});
			}
			espl = formdata.email.split(',');
			espl.length > 1 ? validemail = null : validemail = formdata.email.match(valids.email);
			formdata.assetId == undefined ? alert(alerts.asset) : formdata.reportTemplateId == 0 ? alert(alerts.template) : formdata.email == '' || validemail == null ? alert(alerts.email) : populate();
			return false;
		});
	}
	notiTable = function(){
		requestHandler.request('/notificationEvents','',function(data){
			tabl= $('td.table_content div table.table');
			con= [];
			if (data != ''){
				for(i=0; i < data.length; i++){
					var  uu= data[i].uuid;
					var  user =uu.substring(7);
					var  uinfo= "";
					if(user.substring(0,user.indexOf("@")))
					{
						uinfo =user.substring(0,user.indexOf("@"));
					}else{
						uinfo= "admin";
					}
					evstr= data[i].preferenceIndex.split('/');
					evlen= evstr.length;
					event= evstr[evlen-1];
					model={
							createdby: '<td><div>'+uinfo+'</div></td>',
							id: '<td><div>'+data[i].dupsId+'</div></td>',
							event: '<td><div>'+event+'</div></td>',
							email: '<td><div>'+data[i].preference.emails+'</div></td>',
							daildig: '<td><div>'+data[i].preference.digestEnabled+'</div></td>'
					}
					tr= '<tr class="tsparent">'+model.createdby+model.id+model.event+model.email+model.daildig+'</tr>';
					con.push(tr);
				}
				tables.build.dbuild= con.join('');
				tables.tpar(tabl);
			}else{
				tables.build.dbuild='';
				tables.build.tobuild='';
				tables.build.bdck='';
				tables.tpar(tabl);
			}
		});		
	}	
	notifications= function(){
		var formid = $('form#sub_req'),
			firstSelect= $('form#sub_req select')[0],
			lastSelect= $('form#sub_req select[title="Event Type"]');
		notiTable();
		formHandlers.assetypes(formid,firstSelect);
		$(lastSelect).append('<option>DecodeCompleted</option><option>AnalyticsAlert</option>');
		formHandlers.fselect(firstSelect);
		$('#subSubmit').live('click',function(){
			formdata = {
				cat : $('#assetType').val(),
			    unit : $('#assetId option:selected').attr('id'),
			    dailyTime: $('#txtDay').val(),
			    email: $('#email').val(),
			    event: $('select[title="Event Type"]').val(),
			    wday: $('#cbWeekDay').val(),
			    wtime: $('#txtWeekTime').val(),
			    dtime: $('#txtDay').val(),
			    de: $('#dgday').val(),
			    cmsg: encodeURIComponent($('#customMsg').val()),
			    sub: encodeURIComponent($('#subject').val())
			}
			var routed= 'cat='+formdata.cat+'&unit='+formdata.assetId+'&email='+formdata.email+'&dailyTime='+formdata.dailyTime+'&event='+formdata.event+'&wday='+formdata.wday+'&wtime='+formdata.wtime+'&dtime='+formdata.dailyTime+'&de='+formdata.de
			populate = function(){		
				$.ajax({
					url: '/createsubscriptionAll?'+routed,
					type: 'GET',
					success: function(data){
						alert('subscription created, the notification will be sent to '+formdata.email);
					    $(formid).find(':input').each(function() {
					        switch(this.type) {
					            case 'password':
					            case 'select-multiple':
					            case 'text':
					            case 'textarea':
					                $(this).val('');
					                break;
					            case 'select-one':
					            	$(this).find('option')[0].selected = true;
					            case 'checkbox':
					            case 'radio':
					                this.checked = false;
					        }
					    });
						dselect = $('form#sub_req select')[1];
						$(dselect).attr('disabled', 'disabled');
					    tables.build.dbuild = '';
					    $('td.table_content div table.table tbody tr').html('');
						notiTable();
					},
					error: function(msg){
						requestHandler.errorHandler(msg);
					}
				});
			}
			validemail = formdata.email.match(valids.email);
			formdata.unit == undefined ? alert(alerts.asset) : formdata.event == 0 ? alert(alerts.event) : formdata.email == '' || validemail == null ? alert(alerts.email) : populate();
			return false;
		});		
	}
//Interactions
    $("th.sort").live('click',function() {
    	cid= $(this).index();
    	par= $(this).parent().parent().parent();
    	sibs= $(this).siblings();
    	sstato= $(sibs).find('i.pull-right');
		sstatup= $(sibs).find('.icon-sort-up');
		sstatdn= $(sibs).find('.icon-sort-down');
		sstatup.length >=1 || sstatdn.length >=1 ? $(sstato).removeClass().addClass('icon-sort pull-right') : sstato= null;
    	loctabl= $(par).find('>tbody >tr >td.table_content >div >table.table');
    	actt= $(par).find('.active');
    	$(actt).removeClass('active');
    	$(this).hasClass('desc') != false || $(this).attr('class') == "" ? tables.sort.asc($(this)) : tables.sort.desc($(this));
        $(loctabl).trigger("sorton",[sorting]);
        $(this).addClass('active');
		$('.tsparent:odd').removeClass('even').addClass('odd');
		$('.tsparent:even').removeClass('odd').addClass('even');
    });
	$('li.tab').live('click',function(){
		$this= $(this);
		actr= $('.navbar .nav .tab.active');
		tind= $this.index('.tab');
		ta= $this.find($('a'));
		href= $(ta).attr('href');
		thref= href;
		mdck= $this.parent().parent().parent().parent();
		mdfd= $(mdck).find('.modules');
		if(tind != 0){
		mdfd.length >=1 ? loadi(tind): loaded(tind);
		return false;
		}
	});
	$('a.crosslink').live('click',function(){
		$this= $(this);
		actr= $('.navbar .nav .tab.active');
		tind= 1;
		thref= '/aircraft';
		craftConfig.site="";
		craftConfig.site= $this.attr('href');
		loaded(tind);
		return false;
	});
	$('tr.issuelink').live('click',function(){
		$this= $(this);
		actr= $('.navbar .nav .tab.active');
		tind= 1;
		thref= '/aircraft';
		craftConfig.site= $this.attr('title');
		craftConfig.assetIssueId= $this.attr('id');
		//console.log(craftConfig.site+'::'+craftConfig.assetIssueId)
		doubleLoad(tind);
		return false;
	});	
	$('li.tab.not').live('click',function(){
		var $this= $(this),
			ta= $(this).find($('a')),
			tn= $(ta).text().toLowerCase().trim(),
			td= $('#'+tn).parents('section');
		td.hasClass('expand') == false && td.length == 1 ? prependCraft($this) : ck=0;
		function prependCraft(to){
			actmgt($(to));
			$(to).addClass('active');
			$('br').remove();
			$('.row.modules .span12').prepend('<br/>').prepend(td);
			$(td).addClass('expand');
			collapseCraft($('section.module').not(td));
		}
		function collapseCraft(tb){
			var filp= tb.find('.filters').parent();
			tb.find('.filters').addClass('hidden');
			filp.append('<i class="pull-right icon-plus"></i>');
			filp.parent().parent().addClass('collapse')
		}
		return false;
	});
	$('i.pull-right.icon-plus').live('click',function(){
		var pkill= $(this).parent(),
			fshow= $(pkill).find('.filters.hidden'),
			ztab= $('.nav .tab')[0];
		$(this).remove();
		$(fshow).removeClass('hidden');
		$('.collapse').removeClass('collapse');
		$('.expand').removeClass('expand');
		$('.row.modules .span12').prepend('<br/>').prepend($(pkill).parents('.module'));
		actmgt($('.active'));
	});
	$('tr.tsparent').live('click',function(){
		chldck = $(this).next();
		$(chldck).hasClass('expand-child') ? $(chldck).hasClass('view') ? $(chldck).removeClass('view') : $(chldck).addClass('view') : chldck = 0;
	});
	$('span.expand-all').live('click', function(){
		$(this).hasClass('grey') ? gryck= 1 : expand();
		function expand(){
			$('tr.expand-child').addClass('view');
			$('span.collapse-all').removeClass('grey');
			$('span.expand-all').addClass('grey');
		};
	});
	$('span.collapse-all').live('click', function(){
		$(this).hasClass('grey') ? gryck= 1 : collapse();
		function collapse(){
			$('tr.expand-child').removeClass('view');
			$('span.expand-all').removeClass('grey');
			$('span.collapse-all').addClass('grey');
		};
	});	
});