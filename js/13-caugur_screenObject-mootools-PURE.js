storeThis = {
	refreshThis: '',
	curActive: '',
	imgStr:''
}
GScreen.implement({
	/**
	 * Init function
	 */
	prepareScreen: function(){
	self=this;
		this.ordersRules =
		{
			"tr.order":{
				"ord<-orders":{
					".@id":"oid_#{ord.id}",
					".@class+":function(a){
					var ck24hours = drules.rule24hours(a.item.cdate,a.item.xdate),
						ordclass = ck24hours  == true ? 'cur_order '+a.item.status : 'old_order '+a.item.status;
					return ordclass;
					},
					"td.typetime":function(b){
							var xdatep = b.item.xdate.replace(/\-\d{1,2}$/,''),// -- Set order date
								nxd = new Date.parse(xdatep).format('%m-%d-%Y %l:%M %p'),
								xdate= b.item.xdate.indexOf("00:00:00") >= 1? 'ASAP':'<span class="plain">FUTURE<br/>'+nxd+'</span>';
						return b.item.dtype+'<br/>'+xdate;
					},
							"td.guest_info":"#{ord.client.name}<br>#{ord.address.address}, #{ord.address.zip}<br>#{ord.address.phone}",
							"td.pin":"#{ord.pin}",
							"td.status":function(c){
					passStarr = ['new','hold'];
					var statusText = c.item.updated == true && c.item.status != 'confirmed' ? 'updated':c.item.status; 
					var statusObj = passStarr.indexOf(c.item.status)>=0 ? '<span class="label label-important">'+statusText+'</span>' : statusText;
					return statusObj;
					},
					"td.actind":'<i class="icon-chevron-right hide"></i>'
				}
			}
		};
	this.itemsRules =
	{	
			"tr.oitm":{
				"oitem<-items":{
					"td.o-item":function(a){
			oStrRep = String(a.item.options).replace(/","/g,'<br>').replace(/NULL/g,'').replace(/["]/g,'').replace(/:$/g,'').replace(/=>/g,':').replace(/:/g,': ');
						var aopt = a.item.options != undefined ? oStrRep : '&nbsp;',
						    wnote= '<div class="tdwr"><div class="o-opts">'+aopt+'</div><div class="o-opts">SPECIAL INSTRUCTIONS:<br>'+a.item.note+'</div></div>',
						    opti = '<div class="tdwr"><div class="o-opts">'+aopt+'</div></div>',
						    opts= a.item.note ? wnote : opti;
						return (a.item.name+opts);
					},
					"td.o-qty":"#{oitem.qty}",
					"td.o-price":"#{oitem.summa}"
				}
			},
		};
		this.driversRules =
		{
			"div.d-item":{
				"ditem<-ditems":{
					".@id":"#{ditem.id}",
					".":"#{ditem.name}"
				}
			}
		};
	},

	/**
	 * Main function
	 */
	showScreen: function(){
		try {
		var self=this;
			this.dbOrders = [],// -- Init orders arrays
			this.ordersTemplate = $('cur_otable').compile(this.ordersRules),// -- Compile using PURE JS with the Rules at the head of this file
			this.oldOrdersTemplate = $('old_otable').compile(this.ordersRules),// -- Compile using PURE JS with the Rules at the head of this file
			this.ItemsTemplate = $('items').compile(this.itemsRules),// -- Compile using PURE JS with the Rules at the head of this file
			this.driversTemplate = $('dr_wrapper').compile(this.driversRules),// -- Compile using PURE JS with the Rules at the head of this file
			storeThis.refreshThis= this,//should be reworked
			storeThis.imgStr = this.imgSrc();//should be reworked
		this.apiStatus =  {
		"0":"new",
		"1":"submit",
		"2":"faxing",
		"3":"fax_error",
		"4":"faxed",
		"5":"confirm", 
		"6":"confirmed",
		"7":"notconfirmed",
		"8":"call",
		"9":"cancel",
		"10":"old",
		"11":"hold",
		"12":"cancel_fax",
		"13":"conceled_fax",
		"14":"nomatch",
		"15":"busy",
		"16":"assigned",
		"17":"hold2",
		"18":"busy_done",
		"19":"printing"
		}
		this.monComps= {
			tbHdH:  getDims($('main_head')).totals.h,
			contentH: function(){return glDim.winH()-(glDim.ftH+glDim.hdH)},
			itemsHdH: getDims($('order_head')).totals.h,
			ttlTbH: function(){ return getDims($('total_table')).totals.h},
			cliTbH:  function(){ return $('client_info').isDisplayed() == true ? getDims($('client_info')).totals.h: 0},
		}
		$('rest_name').set('text',st.getFrom('g_RestInfo','name'));// -- Set Rest name
		// -- Loading data
		this.loadServerData();
		this.contentHeight();
		window.addEvent('resize',function(){ self.contentHeight(); });
		 } catch (e){
			log.err(e);
		}
	},

	/**
	 * Refresh Orders and Drivers from the API
	 */
	loadServerData: function(){
		try {
			var self = this;
			// -- Get drivers for the current restaurant
			$('mheader').set('html', 'Get drivers data. Please wait...');
			gui.showModal('smodal',false,false);
			remote.callRequest('driver/getRestDrivers', {'restaurant_key':restaurant_key}, function(ditems){
				/*// -- If the Restaurant has a drivers
				if (typeOf(ditems)=='array'){
					// -- render drivers
					gui.renderTemplate($('dr_wrapper'), {ditems:ditems}, self.driversTemplate);
					// -- adjust drivers-block position
					$('drcont').setStyle('margin-top',-$('drcont').getComputedSize().totalHeight+10);
				// -- If doesn't has
				} else {
					$('dlv_cont').hide();
				}*/
				// -- Loading orders
				self.reloadOrders();
			}, gui.opStatusErr);
		} catch (e){
			log.err(e);
		}
	},

	/**
	 * Reloads orders from the API, and creates Realplexor channel
	 */
	reloadOrders: function(){
	this.setAudio($('player'));
	try{
		var self = this;
		var oldOrd = [];
		var curOrd = [];
		// -- Open modal window "please wait"
		$('mheader').set('html', 'Get orders data. Please wait...');
		gui.showModal('smodal',false,false);
		// -- Disable order operations buttons
		this.noOrdersSelected();
		// -- Get orders for the current restaurant
		remote.callRequest('order/getRestOrders', {'restaurant_key':restaurant_key}, function(data){
			//console.log(data);
			// -- close modal
			gui.hideModal('smodal');
			// -- remember orders
			Array.each(data, (function(val){
				statarr = ['new','confirmed','rejected','hold']
				self.dbOrders[val.id] = val;
				val.address.phone ? val.address.phone = self.phoneF(val.address.phone):val.address.phone = '';
				chk24 = drules.rule24hours(val.cdate,val.xdate);
				statarr.indexOf(val.status)>=0 && chk24 == true ?  curOrd.push(val): oldOrd.push(val);
			}).bind(this));
			// -- refresh orders list
			//console.log(oldOrd,curOrd);
			gui.renderTemplate($('cur_otable'), {orders:curOrd}, self.ordersTemplate);
			oldOrd.length ? oldShow() : $('old_otable').setStyle('display','none');
			function oldShow(){
				gui.renderTemplate($('old_otable'), {orders:oldOrd}, self.oldOrdersTemplate);
				$('old_otable').setStyle('display','');	
			}
			function refreshed(){
				storeThis.refreshThis.selOrder($(storeThis.curActive));
				$(storeThis.curActive).addClass('active');
			}
			storeThis.curActive.length ? refreshed():"";
			// -- realplexor
			self.hangingRealplexor();
				// -- Store order info height
		}, gui.opStatusErr);
			} catch (e){
					log.err(e);
			}	
	 },
	/**
	 * Create Realplexor channel and listen it
	 */
	 hangingRealplexor:function(){
		 var self = this,
		     realplexor = new Dklab_Realplexor(RPL);
			// -- Add new orders when its added
			realplexor.subscribe("Rest"+restaurant_key, function(data, id){
				var order = data[1];// -- get order data
				// -- Operation = new order
				if (data[0]=='new_order'){
					self.reloadOrders();
					self.playAudio($('player'));
					$$('iframe')[0].getParent().remove();
					try{
						var iconType = "Critical",//Desktop app API calls for system events
						    title = "YOU HAVE A NEW ORDER",
						    msg = "Brought to you by "+order.provider.source,
						    cb = function(type) { },
						    arg0 = {icon: iconType, title: title, text: msg };
						appNotify(arg0, cb);
					}catch(ex){console.log(ed)}
				// -- Operation = update order
				} else if (data[0]=='update_order'){
					// -- If TR with this order exist we will update it
					var newStatus = self.dbOrders[order.id].updated=='true'? 'updated' : order.status
					if ($('oid_'+order.id)){
						$('oid_'+order.id).getElement('td.status').set('text',newStatus);
					}
				}
			});
		realplexor.execute();
	},
	/**
	 * Select order from the order table
	 * @param elem строка на которую нажал пользователь
	 */
	selOrder:function(elem){
        try {
			var self = this,
			    seltr = $(elem) ? $(elem) : $('main-grid').getElements('tr')[0],
			    oid = ((seltr.id.split('oid_'))[1]),// -- Get order Id
			    order = this.dbOrders[oid];//get order
		        storeThis.curActive = seltr =='null' ? $('cur_otable').getElement($$('tr')[0].id):seltr.id;
			if ( acted = $('main-grid').getElements('tr.active')){
				acted.removeClass('active');
				ind = acted.getElements('td.actind i')[0];
				ind ? ind.hide():'';
			}
			seltr.addClass('active').getElements('td.actind i').show();
			if (order){
				var xdate = String.from(order.xdate),
				    pos = (xdate.indexOf("00:00:00")),
				    odate = pos>0 ? odate.slice(0,pos)+"ASAP" : xdate;
				$('oid').set('text','Order # '+order.provider.provider_id);// -- Set order info
				$('xdate').set('text',odate);// -- Set order date
				gui.renderTemplate($('items'), {items:order.items}, this.ItemsTemplate);// -- Show order items
				// -- Amount DATA
				$('subtotal').set('text',order.amount.subtotal);
				$('tax').set('text',order.amount.tax);
				ttltgl(order.amount.gratuity,$('tip')); 
				ttltgl(order.amount.delivery,$('dfee')); 
				ttltgl('('+order.amount.discount+')',$('discount')); 
				ttltgl(order.amount.extra_charge,$('extra')); 
				$('total').set('text',order.amount.total);
				function ttltgl (dobj,dom){
					zeroarr = ['0','0.00','(0)','(0.00)'];
					pdom = dom.getParent();
					sdom = dom.getSiblings();
					testck = $('extra');
					if (dom == testck){
						dobj && zeroarr.indexOf(dobj) == -1 ? pdom.removeClass('hide') && sdom.set('text',order.amount.extra_charge_name) && dom.set('text',dobj):pdom.addClass('hide');
					}else{
						dobj && zeroarr.indexOf(dobj) == -1 ? pdom.removeClass('hide') && dom.set('text',dobj):pdom.addClass('hide');
					}   
				} 
				function pdomShow(){
					pdom.removeClass('hide');
					sdom.set('text',order.amount.extra_charge_name);
					dom.set('text',dobj);
				}
				// -- Set order client info
				if (order.address.cross || order.note){
					$$('#main-grid .table').addEvent('click:relay(#oid_'+oid+')',function(){
						$$('icon-chevron-down')?  $('chevron').removeClass('icon-chevron-down').addClass('icon-chevron-up'):''; 
						order.address.cross ? $('gcross').set('html',order.address.cross).getParent().show() : $('gcross').getParent().hide();
						order.note ? $('gnote').set('html',order.note).show() : $('gnote').hide();
						$('client_info').show();
						$('buib').show();
						self.contentHeight();
					});
				}else{
					$('client_info').hide();
					$('buib').hide();
					self.contentHeight();
				}
				this.orderSelected(order.id,order.status,order.dtype,order.driver_id,order.provider.mpid);
				self.contentHeight();
			}
		} catch (e){
			log.err(e);
		}	
	},
	printOrder:function(){
	og_rtable = $('rtable').get('html');
	this.rItemsTemplate = $('rtable').compile(this.itemsRules);
	self = this;	
	// -- Get selected order
		var sel_elem = $('main-grid').getElement('tr.active');
	if (sel_elem){
			// -- Get order Id
			var oid = ((sel_elem.id.split('oid_'))[1]);
			// -- Get order data
			var order = this.dbOrders[oid];
			// -- Get printer type
			//console.log(order);
			var printer = 'desktop';
			if (st.get('printer')=='pos') printer='pos';
			// -- Prepare order to print
			order = this.prepareOrderForPrint(order);
			// -- Print order
		(order.rest.fax) ? fax = ' -fax: '+order.rest.fax: fax = '';
		var openDiv = '<div>';
		var openDivCtr = '<div style="text-align:center;">';
		var sepLine = '<div style="border-bottom:1px solid; width:101%; margin: 0 0 12px 0;"></div>';  
		var sepLineDbl = '<div style="border-bottom:4px double; width:101%; margin: 6px 0 6px 0;"></div>';  
		var sepLineDt = '<div style="border-bottom:1px dotted; width:101%; margin: 0 0 6px 0;"></div>';  
		var sepLineDs = '<div style="border-bottom:1px dashed; width:101%; margin: 0 0 6px 0;"></div>';  
		var sepLineSig = '<div style="border-bottom:1px dashed; width:101%; margin:64px 0 0 0; text-align:left; padding: 0 0 2px 0; font:bold 12pt sans-serif;">X</div>';  
		var closeDiv = '</div>';
		//This date stuff will have to change at some point
		var xdatep = order.xdate.replace(/\-\d{1,2}$/,'');
		var nxd = new Date.parse(xdatep).format('%m-%d-%Y %l:%M %p');
		var xdate= order.xdate.indexOf("ASAP") >= 1 || order.xdate.indexOf("00:00:00") >= 1? 'ASAP':'<b>FUTURE&nbsp;&nbsp;</b>'+nxd; 
		var cdatep = order.cdate.replace(/\-\d{1,2}$/,'');
			var ncd = new Date.parse(cdatep).format('%m-%d-%Y %l:%M %p');
		var items = order.items;
		gui.renderTemplate($('rtable'), {items:items}, self.rItemsTemplate);
		var itmrw = $('rtable').getElements('.oitm').setStyle('position','relative');
		var itmsp = $('rtable').getElements('.o-item').setStyle('padding-bottom','8pt').setStyle('font','bold 12pt sans-serif').setStyle('position','relative');	
		var itmtrw = $('rtable').getElements('.tdwr').setStyle('width','100%').setStyle('overflow','visible');
		var oopts = $('rtable').getElements('.o-opts').setStyle('width','140%').setStyle('font','normal 12pt sans-serif');
		var rtable = $('rtable').get('html');
		var cc_str= sepLineSig; 
		cc_str+= '<div style="font:normal normal 10pt sans-serif">I agree to pay the total amount by: '+order.cc_info.name+'</div>';
		cc_str+= '<h3 style="margin-bottom:0; text-align:center;">(PREPAID: DO NOT CHARGE)</h3>';
		order.amount.type != 10 ? cc_info = cc_str : cc_info='<h2 style="text-align:center;">CASH ORDER</h2>';
		output = '<div style="font-family:arial; font-size:12pt; marign:0; width:100%;">';
		output+= '<div style="width:100%; text-align:right; font-size:8pt;">'+ncd+'</div>';
		output+= openDiv;
		output+= '<div>'+order.rest.name.toUpperCase()+'</div>';
		output+= '<div>'+order.rest.address.address+','+order.rest.address.zip+'</div>';
		var restPhone = String(order.rest.address.phone).trim();
		output+= '<div>'+self.phoneF(restPhone)+''+fax+'</div>';
		output+= closeDiv;
		output+= openDivCtr;
		output+= '<h1 style="margin-bottom: 0;">'+order.dtype.toUpperCase()+'</h1>';
		output+= '<div>'+xdate+'</div>';
		output+= '<div style="margin:0 0 12px 0;">Order#: '+order.provider.provider_id+'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;code#:'+order.provider.confirmation_pin+'</div>';
		output+= closeDiv;
		output+= openDiv;
		output+= '<div>'+order.client.name+'</div>';
		var custPhone = String(order.client.phone).trim();
		output+= '<div>'+self.phoneF(custPhone)+'</div>';
		output+= '<div>'+order.address.address+'</div>';
		output+= '<div>'+order.address.city+', '+order.address.state+' '+order.address.zip+'</div>';
			if (order.address.cross){
			output+= '<div><b>X: </b>'+order.address.cross+'</div>';
			}
		output+= closeDiv;
		if (order.note){
		output+= sepLineDbl;
		output+= '<div style="padding:0 2%; margin:0 0 6px 0;"><b>Order Instructions: </b>'+order.note+'</div>';
		}
		output+= sepLineDbl;
		output+= '<table id="itemsHD" style="width:100%; padding:0; border-collapse:collapse; font:italic 1.1em sans-serif;">';
		output+= '<thead>';
		output+=		'<tr>';
		output+=			'<th style="text-align:left; width:70%;">ITEM</th>';
		output+=			'<th style="text-align:left; width:10%;">QTY</th>';
		output+=			'<th style="text-align:right; width:20%;">PRICE</th>';
		output+=		'</tr>';
		output+= '</thead>';
		output+= '</table>';
		output+= sepLineDt;
		output+= '<table style="width:100%; padding:0; border-collapse:collapse;">';
		output+= rtable;
		output+= '</table>';
		output+= sepLine;
		output+= '<table style="width:100%; padding:0; border-collapse:collapse;">';
 		output+= 	'<tbody>';   
		output+=		'<tr>';		
		output+=			'<td style="text-align:left; width:80%;">Sub-Total</td>';
		output+=			'<td style="text-align:right; width:20%; ">'+order.amount.subtotal+'</td>';
		output+=		'</tr>';		
		output+=		'<tr>';		
		output+=			'<td style="text-align:left; width:80%;">Tax</td>';
		output+=			'<td style="text-align:right; width:20%; ">'+order.amount.tax+'</td>';
		output+=		'</tr>';		
		if (order.amount.delivery){
		output+=		'<tr>';		
		output+=			'<td style="text-align:left; width:80%;">Delivery Fee</td>';
		output+=			'<td style="text-align:right; width:20%; ">'+order.amount.delivery+'</td>';
		output+=		'</tr>';		
		}
			if (order.amount.extra_charge){
			output+=			'<tr>';
			output+=					'<td style="text-align:left; width:80%;">'+order.amount.extra_charge_name+'</td>';
			output+=					'<td style="text-align:right; width:20%; ">'+order.amount.extra_charge+'</td>';
			output+=			'</tr>';
			}
		if (order.amount.gratuity && order.amount.gratuity != '0.00'){	
		output+=		'<tr>';		
		output+=			'<td style="text-align:left; width:80%;">Tip</td>';
		output+=			'<td style="text-align:right; width:20%; ">'+order.amount.gratuity+'</td>';
		output+=		'</tr>';
		}		
		if (order.amount.discount && order.amount.discount != '0.00'){
		output+=		'<tr>';		
		output+=			'<td style="text-align:left; width:80%;">Discount</td>';
		output+=			'<td style="text-align:right; width:20%; ">('+order.amount.discount+')</td>';
		output+=		'</tr>';		
		}
		output+=		'<tr>';		
		output+=			'<td style="text-align:left; width:80%;"><h2 style="margin-bottom:0px;">TOTAL</h2></td>';
		output+=			'<td style="text-align:right; vertical-align:bottom; width:20%; ">'+order.amount.total+'</td>';
		output+=		'</tr>';		
 		output+= 	'</tbody>';   
 		output+= '</table>';   
		output+= openDivCtr;
		output+= cc_info;
		output+= '<img src="'+storeThis.imgStr+'" style="width:233px;"/>';
		output+= '<div style="margin:0 0 12px 0;"><i>Thank You '+order.client.name+'. We love you!!</i></div>'
		output+= '<div style="font-size:12px; ">Issues? Call Eat24 Support: 877-449-7090</div>'
		output+= closeDiv;
		output+= closeDiv;
		$('output').set('html',output).setStyle('display','block');
		try{
			var sysprinters = appPrinters();
				var sysprinter = sysprinters[0];		
			appPrint(sysprinter,output);
		}catch(ex){
		alert('For Full Functionality Download the new Monitor Application!');
		}
		$('rtable').set('html',og_rtable);
		} else alert('No orders selected!');
	},
	prepareOrderForPrint:function(order){
		order.rest = JSON.decode(st.get('g_RestInfo'));
		order.xdate = $('xdate').get('text');
		return order;
	},
	/**
	 * Confirms selected order via API
	 */
	confirmOrder:function(mpid){
		remote.callRequest('order/confirmOrder',{'mpid':mpid,'sttype':'confirm'},function(data){
		var respStatus = data['orders.status_change'][0]['status'];
		var asValue = storeThis.refreshThis.apiStatus[respStatus];
		var statObj= storeThis.refreshThis.apiStatus;
		var rejectarr = [statObj[9],statObj[12],statObj[13]];
		var alertarr = [statObj[11],statObj[16],statObj[17]];
		if (rejectarr.contains(asValue)){
			storeThis.refreshThis.changeOrderStatus('orderCancel');
			alert('Eat24 reports this order has been canceled');
				}else if(alertarr.contains(asValue)){
			alert('CALL Eat24 NOW!\nOrder cannot be confirmed with the status: '+asValue);
			gui.hideModal('smodal');
		}else{
			storeThis.refreshThis.changeOrderStatus('orderConfirm');
			try{
				var sysprinters = appPrinters();
				(sysprinters) ? storeThis.refreshThis.printOrder(): '';
			}catch(ex){console.log(ex)}
		}
		});
	},
	/**
	 * Cooking selected order via API
	 */
	cancelOrder:function(mpid){
		remote.callRequest('order/confirmOrder',{'mpid':mpid,'sttype':'reject'},function(data){
		var respStatus = data['orders.status_change'][0]['status'];
		var asValue = storeThis.refreshThis.apiStatus[respStatus];
		var statObj= storeThis.refreshThis.apiStatus;
				storeThis.refreshThis.changeOrderStatus('orderCancel');
		});
	},
	/*cookingOrder:function(ce){
	remote.callRequest('order/confirmOrder',{'ce':ce},function(data){
		storeThis.refreshThis.changeOrderStatus('orderCooking');
	});
	},
	/**
	 * Asking a driver to selected order
	 */
	/*deliveryOrder:function(driver_id){
		$('drcont').hide();
		this.changeOrderStatus('orderDelivery',driver_id);
	},
	/**
	 * Complete selected order via API
	 */
   /* completeOrder:function(){
		this.changeOrderStatus('orderDone');
	},

	/**
	 * Change order status via API
	 */
	changeOrderStatus:function(status, driver_id){
		var self = this;
		var sel_elem = $('main-grid').getElement('tr.active');
		// -- if order selected
		if (sel_elem){
			// -- Open modal window "please wait"
			$('mheader').set('html', 'please wait...');
			gui.showModal('smodal',false,false);
			// -- Get order id
			var oid = ((sel_elem.id.split('oid_'))[1]);
			// -- Confirm selected order via API
			remote.callRequest('driver/'+status, (driver_id)?{'order_id':oid,'driver_id':driver_id}:{'order_id':oid}, function(data){
		//console.log(data);
		var newStat = data.status[1];
		self.dbOrders[oid].status = newStat;
		//console.log(self.dbOrders[oid].status);
		sel_elem.removeClass('new').addClass(self.dbOrders[oid].status);
		var newStatus = self.dbOrders[oid].updated=='true' && self.dbOrders[oid].status != 'confirmed'? 'updated' : self.dbOrders[oid].status
		sel_elem.getElement('td.status').set('html',newStatus);
		self.selOrder(sel_elem);
		gui.hideModal('smodal');
			}, gui.opStatusErr);
		}
	},

	/**
	 * Shows/hides guest info
	 */
	toggleGInfo:function(){
		var elem = $('client_info');
		if (elem.isDisplayed()){
			elem.hide();
			$('chevron').swapClass('icon-chevron-up','icon-chevron-down');
		this.contentHeight();
		} else {
			$('chevron').swapClass('icon-chevron-down','icon-chevron-up');
			elem.show('table-row');
		this.contentHeight();
		};
	},

	/**
	 * Shows/hides drivers list
	 */
	toggleDrivers:function(){
		$('drcont').toggle();
	},
	//Set height of content
	contentHeight: function(){
	   	this.monitorDims(); 
	 },
	 monitorDims: function(){
	var recpH =  this.monComps.contentH()-(this.monComps.tbHdH+this.monComps.itemsHdH+this.monComps.cliTbH()+this.monComps.ttlTbH()+5)
		$('content').setStyle('height',this.monComps.contentH());
		$$('.data-grid')[0].setStyle('height',this.monComps.contentH()-this.monComps.tbHdH);
		$('order-items').setStyle('height',recpH);
	},  
	noOrdersSelected:function(){
		$('client_info').setStyle('display','none');;
		gui.disableBtn('status');
		gui.disableBtn('action');
		$('drcont').hide();
	},
	//order.id,order.status,order.dtype,order.driver_id,order.provider.confirmation_url
	orderSelected:function(od,st,dt,di,mpid){
	//console.log(od,st,dt,di,mpid);
		statusType={
		//statusType[0]=>BTN Text,statusType[1]=>changeOrder path,statusType[2]=> ActionBt text, will trigger actions
		//This should probably be a class based on a configuration, for now...
		'new':['confirm','confirmOrder','reject'],	
		//'cooking':['on delivery','deliveryOrder','print'],
		//'delivery':['completed','completeOrder','print'],
		'hold':['confirm','confirmOrder','reject'],
		/*'delivered': function(){
					gui.disableBtn('status');
					btAction('print');
		},*/
				'confirmed': function(){
						gui.disableBtn('status');
			$('status').set('text','confirmed');
						btAction('print');
				},
		'canceled': function(){
						gui.disableBtn('status');
			$('status').set('text','canceled');
						btAction('print');
			
		},
		'rejected': function(){
						gui.disableBtn('status');
						gui.disableBtn('action');
						$('status').set('text','rejected');
				}	
		}
		//This should all be moved to configuration objects
		btconfig= {
				confStr: '{engine.curScreen.'+statusType[st][1]+'("'+mpid+'")}',
				rejStr: '{engine.curScreen.cancelOrder("'+mpid+'")}',
				curStr: '{engine.curScreen.'+st+'()}',
				cookedStr: '{engine.curScreen.'+statusType[st][1]+'('+di+')}',
				newStat: statusType[st][0],
				newAct: statusType[st][2]
		 }	
	//Selects Status Type value to pass to btEnable, show receipt
	function initBt(){
		 btEnable(statusType[st]);
	}
	//Activate button using gui.enableBtn, sets values and text based on status.
	function btEnable(){
		storeThis.refreshThis.noOrdersSelected();
				var exeBt = st == 'cooking' ? btconfig.cookedStr : st =='new' || st=='hold'? btconfig.confStr : btconfig.curStr;
		gui.enableBtn('status', 'button_click',exeBt);
		$('status').set('text',btconfig.newStat);
		btAction(btconfig.newAct);
	}
	//Sets values and text of Action button based on Status type, these will trigger other methods. 
	function btAction(acr){
		acr == 'print' ? actMethod = '{engine.curScreen.printOrder()}' : actMethod = btconfig.rejStr;
		gui.enableBtn('action', 'button_click', actMethod);
		$('action').set('text',acr);
	}
	excarr = ['confirmed','canceled','rejected'];
	excarr.indexOf(st) >= 0  ? statusType[st]():initBt();
	},
	phoneF:function(ph){
	ph.length == 10 ? phone= ph.substring(0,3)+'-'+ph.substring(3,6)+'-'+ph.substring(6,10): phone= ph.substring(1,4)+'-'+ph.substring(4,7)+'-'+ph.substring(7,11);
	return phone;
	},
	imgSrc : function(){ 
	Asset.javascript('js/screens/receipt_logo.js',{
			onLoad: function(){
						storeThis.imgStr= img64();
				}
   	});
	},
	setAudio: function(elem){
	//console.log(elem);
			audioarr= ["Crowd_Small_Yell_Female_Yhu.mp3","datatransfer.mp3","Female_Oh_yes_bu_VB046107.mp3","HUMAN_VOCAL_FEMA_CT036501.mp3","HUMAN_VOCAL_FEMA_CT036505.mp3","HUMAN-VO-YES2-F.mp3","HumanVoiceClip_S08HU_552.mp3","HumanVoiceClip_S08HU_591.mp3","VB02_61_02_Yes_F.mp3"];
			this.track = function(){return audioarr.getRandom()};
			elem.set('src','audio/'+this.track()).load();
	},
	playAudio: function(elem){
	elem.play();
	}
});
