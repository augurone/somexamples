/**
 * @fileOverview YES-POS Javascript core classes
 * @version 1.0
 * @requires mootools core:1.4
**/
var basePath = '/pos/', //Base project-path(relative to the domain name)
    host = 'http://'+document.location.hostname, //URL for JS API connections
    //Needed for OAUTH TODO must be set this dynmically. 
    consumer = {
	key:'8a1e0f2e2f720a12e0830f3a4fc8dbc9',
	secret:'l1i5g6h0t'
    },
    is3legged = true, //FOR OAUTH
    RPL = "http://rpl.yes-pos.loc", //"http://plexor.pos.e24beta.com" //Realplexor's engine URL
    restaurant_key = '',
    DevMode = false, //Debug/Release version
    db = {}, //INSTANTIATE Object
    log = {}, //INSTANTIATE Object
    remote = {}, //INSTANTIATE Object
    st = {}, //INSTANTIATE Object
    ltr = {}, //INSTANTIATE Object
    gui = {}; //INSTANTIATE Object
    drules = {}; //INSTANTIATE Object
/**
* The class initializes the key objects(db/log/remote etc.)
* Produces an object of class GScreen, responsible for "drawing" of each individual screen/html-page.
* @class
* @namespace GEngine
*/
var GEngine = new Class({
	/** @ignore */
	Implements: Options,
	options: {
		jsScreenPath: basePath+'js/screens/',
		jsLibsPath: basePath+'js/libs/'
	},
	curScreen: {}, // Variable which contains the current screen
	//@constructor @ignore
	initialize: function(){
		// -- Init logging (type of log, debug mode)
		log = new Logging('console', false);
		// -- Init settings storage
		this._initSettings();
		// -- Initialise and prepare Database
		this._initDB();
		// -- Initialise remote connections
		this._initRemote();
		// -- Init GUI-functions
		gui = new Ggui();
		drules = new dateRules();
		
	},
	/**
	* Function-factory of Screen objects.
	* This logic needs to change in order to support the stateful tabs.
	* Entire DOM will be rendered onLoad through Server-Side. 
	* onDOMLoad and prior to leaving active tab, clone of object will be stored.
	* @param screenName Name of the executable screen
	* @memberOf GEngine
	*/
	show: function(screenName){
		// -- Creating new screen
		this.curScreen = new GScreen();
		var self = this;
		// -- Load screen css file
		Asset.css(basePath+'css/'+screenName+'.css', {
			id: screenName,
			rel:("stylesheet"),
			title: screenName+'Style',
			onLoad: function(){
			//This next line is only necessary until we stop doing a lazy load of the primary CSS
			Asset.css(basePath+'css/fontawesome/css/font-awesome.min.css',{id:'FontAwesome',rel:("stylesheet")});
			// -- Load screen file
			Asset.javascript(self.options.jsScreenPath+screenName+'.js', {
				id: screenName,
				onLoad: (function(){
						self.curScreen.ExecuteScreen();
						})
				});
			}
		});
	},
	/**
	* Init Database-object. Called from class-constructor.
	* @memberOf GEngine
	*/
	_initDB: function(){
        window.addEvent('domready', function(){
            // -- Create DataBase object
            db = new Database('Ganymede');
        });
	},
	/**
	* Init object for API connections. Called from class-constructor.
	* @memberOf GEngine
	*/
	_initRemote: function(){
        remote = new RemoteAPI();
	},
	/**
	* Init object for access LocalStorage.
	* @memberOf GEngine
	*/
	_initSettings: function(){
        st = new Settings();
	}
});
/**From Russian
* This class is using to "draw" a separate screen/html-page.
* Each Screen must implement this parent-class
* @class
* @namespace GScreen
*/
var GScreen = new Class({
	/** @ignore */
	Implements: [Events, Chain],
	/**
	* @constructor
	* @ignore
	*/
	initialize: function(){
	   gui.modal_error = "Connection Error!";
	   gui.modal_done = "Done!";
	},
	/**
	* Function implements Screen's life-cycle.
	* DO NOT IMPLEMENT/EXTEND THIS FUNCTION.
	* @memberOf GScreen
	*/
	ExecuteScreen: function(){
	   // -- If this is 3legged and we don't have the access-token - we wait to redirect
	   if (is3legged && (!localStorage.getItem('accessTokenKey') || localStorage.getItem('accessTokenKey')=='undefined')) {
		  $('mheader').set('html', 'Get authorize data...'); // -- Open modal window "please wait"
		  gui.showModal('smodal',false,false);
	   } else {
		  this.prepareScreen(); // -- Set screen configuration
		  // -- Wait for domready
		  window.addEvent('domready', (function(){
			 restaurant_key = st.getFrom('g_RestInfo','key'); // -- Get rest key from Local Storage
			 // -- If restaurant key exists
			 if (restaurant_key){
				this.showScreen(); // -- Show current screen
			 } else{
				$('mheader').set('html', 'Loading restaurant data...'); // -- Open modal window "please wait"
				gui.showModal('smodal',false,false);
				remote.callRequest('restaurant/info', {}, function(data){
				    st.set('g_RestInfo',JSON.encode(data)); // -- Save restaurant data
				    restaurant_key = data.key;
				    gui.hideModal('smodal'); // -- Hide modal
				    this.showScreen(); // -- Show current screen
				}.bind(this), gui.opStatusErr);
			 }
		  }).bind(this));
	   }
	},
	/**
	* Function implements Screen's life-cycle.
	* DO NOT IMPLEMENT/EXTEND THIS FUNCTION.
	* @memberOf GScreen
	*/
	prepareScreen: function(){
	   this.pureRules = undefined;
	},
	/**
	* Function implements Screen's life-cycle.
	* DO NOT IMPLEMENT/EXTENDED THIS FUNCTION.
	* @memberOf GScreen
	*/
	showScreen: function(){

	},
	/**From Russian
	* Inject current date into html-elem
	* @param elem_id
	*/
	pageClock: function(elem_id){
	   var date_format = "%B %d, %Y %l:%M %p";
	   var interval = 30000;
	   $(elem_id).set('text',(new Date().format(date_format)));
	   setInterval(function(){
		  $(elem_id).set('text',(new Date().format(date_format)));
	   },interval);
	},
	/**From Russian
	* Loads the list is not sent on the API orders and puts each of them in turn???
	* In the end - the queue starts to perform
	* @memberOf GScreen
	*/
	sendOrdersToAPI: function(){
	   try{
		  // -- We carry only if user is acc.option
		  if (st.get('api_send')=='1') {
			 var self = this;
			 var ord = new Order();
			 // -- Clear the send queue
			 self.clearChain();
			 ord.loadCollection('inet_status','0', function(data){
				if (log.debug) console.log(data);
				// -- Each of the orders add to the send queue
				Array.each(data, function(ord){
				    self.chain(function(){
					   self.orderSend(ord);
				    });
				});
				self.callChain();// - Run all
			 });
		  }
	   } catch (e){
		  log.err(e);
	   }
	},
	/**From Russian
	* Send order by API
	* @param order Order object with the downloaded data
	* @memberOf GScreen
	*/
	orderSend: function(order){
	   try {
		  console.log(["Sending order:", order.id]);
		  var self = this;
		  var oopts = JSON.decode(order.opts);
		  // -- authorize guest
		  // --¿¿¿TODO: (HACK) Since API requires necessarily zip and address, in case they are not (pickup), instead insert parameters (address / zip) restaurant???
		  if($('mbody')) $('mbody').set('html', 'Authorize with quest...');
		  remote.callRequest('client.guest', {
			 fname:oopts.cname,
			 lname:"",
			 cross: oopts.dcross?' '+oopts.dcross:'',
			 address:(oopts.daddr)?(oopts.daddr+' '+oopts.dapt+' '+cross):st.getFrom('g_RestInfo','address'),
			 unit_number:"3",
			 cross_street:oopts.dcross,
			 zip:(oopts.dzip)?oopts.dzip:st.getFrom('g_RestInfo','zip'),
			 state:oopts.dstate,
			 phone:oopts.cphone,
			 email:(oopts.dmail)?oopts.dmail:st.getFrom('g_RestInfo','email')
		  }, function(data){
			 // - Create a basket
			 if($('mbody')) $('mbody').set('html', 'Create Cart...');
			 remote.callRequest('cart.new',{}, function(data){
				// -- Components add to your shopping basket
				self._orderSendItems(order.id, function (){
				    // -- Get parameters basket. Used in cart.checkout
				    if($('mbody')) $('mbody').set('html', 'Get cart params...');
				    remote.callRequest('cart.params',{restaurant_id:st.getFrom('g_RestInfo','id')}, function(data){
					   console.log(data);
					   var guest_id = data.guest_id;
					   var odate = (Object.keys(data.date))[0];
					   // --The checkout process
					   var req_params = ({
						  restaurant_id:st.getFrom('g_RestInfo','id'),
						  dtype:oopts.dtype,
						  coupon:"No, Thanks",
						  payment:{type:10, fname:"Victor", lname:"Test", number:"4111111111111111", exp_year:"2014", exp_month:"3", cvv:"111", zip:94109,tip:5},
						  cashback:st.getFrom('g_RestInfo',['options','cashback']),
						  address_id: (Object.keys(data.address_id))[0],
						  date:(oopts.sday_val)?oopts.sday_val:odate,
						  time:(oopts.stime_val)?oopts.stime_val:((Object.keys(data.time[odate]))[0]),
						  guest_id: guest_id,
						  note:"Order from POS-client"
					   });
					   if($('mbody')) $('mbody').set('html', 'Create order...');
					   remote.callRequest('cart.checkout.guest', req_params, function(data){
						  // -- If all goes well - we derive notification
						  if(data && data.oid) {
							 console.log(["The order was sent successfully:",data]);
							 if($('mbody')) gui.opStatusOK();
							 // ¿¿¿-- Updating parameter inet_status in table zakazov???
							 db.execute('UPDATE g_orders SET inet_status=1 WHERE id='+order.id+';',{
								onComplete: function(res){
									  
								}
							 });
							 // -- translated from Russian??? Call following the same function which is in turn
							 self.callChain();
						  } else gui.opStatusErr(data);
					   }, gui.opStatusErr);
				    }, gui.opStatusErr);
				});
			 }, gui.opStatusErr);
		  }, gui.opStatusErr);
	   } catch (e){
		  log.err(e);
	   }
	},
	/** From Russian
	* Loads all the dishes order and sends each of them on the API
	* @param oid ID order
	* @param backFunc Performed in case of success
	* @memberOf GScreen
	*/
	_orderSendItems:function(oid, backFunc){
	   var oi = new orderItems();
	   var calls = [];
	   oi.loadCollection('order_id',oid, function(res){
		  var success_count = 0;
		  Array.each(res,function(oitem){
			 var item = {};
			 item.item_id = oitem.item_id;
			 item.price = oitem.price;
			 item.qty = oitem.qty;
			 item.note = oitem.note;
			 var opts = JSON.decode(oitem.options);
			 if (opts) item.options = opts;
			 if($('mbody')) $('mbody').set('html', 'Add item "'+oitem.name+'" ...');
			 calls.push({name:'cart.item.add', params:item});
		  });
		  remote.callRequest('api.call', {'methods':calls}, function(data){
			 backFunc();
		  }, gui.opStatusErr);
	   });
	},

    _getOrderNumber:function(){
        // -- default values
        var newNum = {receipt:1, indx:1, date:(new Date())};
        // -- get old value
        var oldNum = st.getFrom('g_OrderNum');
        // -- if no local value exists - check API values
        if (!oldNum){
            // TODO: if the cache clean
            //newNum = oldNum;
            // -- if old value is exists
        } else {
            // -- if this is a new day - incrementing "receipt"
            if ((newNum.date.diff(Date.parse(oldNum.date)))<0){
                newNum.receipt = oldNum.receipt+1;
                // -- update API values
                var rest_data = {id:this.rest_id, params:{last_order_date:newNum.date, order_sequence:newNum.receipt}};
                remote.callRequest('restaurant/updateparams', {restaurant:rest_data}, function(data){}, gui.opStatusErr.bind(gui));
                // -- if this is a current day - incrementing "index"
            } else {
                newNum.receipt = oldNum.receipt;
                newNum.indx = oldNum.indx+1;
            }
        }
        st.set('g_OrderNum', JSON.encode(newNum));
        return newNum;
    },

	/**From Russian
	* Loads data on demand and prepares them to be displayed in print templates
	* @param oid Order ID
	* @param backFunc Performed in case of success
	* @memberOf GScreen
	*/
	loadOrderForPrint: function(oid, backFunc){
	   var ord = new Order();
	   ord.loadItemByID(oid,function(){
		  ord.items = [];
		  var total = 0;
		  var oi = new orderItems();
		  oi.loadCollection('order_id', ord.id, function(idata){
			 if (idata.length == 0) throw new Error('No items, order #'+ord.id);
			 Array.each(idata, function(item, item_indx){
				// -- If the amount is more than the 1st - displays beautiful star
				var iq = Number.from(item.qty);
				if (iq>1) {
				    item.qty = '<b>'+item.qty+'</b><br>**';
				}
				// -- Options transform into HTML-view
				item.html_opts = oi.convertOptionsToHTML(item.options);
				// -- Prices should have 2 decimal places
				item.totalprice = Number.from(item.totalprice).toFixed(2);
				// -- If no additional comments for the dish - do not show this block
				if (!item.note || item.note.length==0) item.icont = 'display:none;';
				// -- Add to the order
				ord.items.push(item);
				// -- The total order amount
				total += Number.from(item.totalprice);
				// -- At the last iteration
				if (item_indx == (idata.length-1)) {
				    ord.total = total.toFixed(2);
				    ord.tax = ord.tax.toFixed(2);
				    ord.total_taxes = (total + Number.from(ord.tax)).toFixed(2);
				    backFunc(ord);
				}
			 });
		  })
	   })
	},
	/**From Russian
	* The function displays the section and dishes, when you click on the category selection menu
	* @param elem category
	* @param button_class css-class name used for the category buttons
	* @param sec_id partition ID, if specified dishes displayed in this section, instead of the first order
	*/
	selectCategory: function(elem, button_class, sec_id){
	   try {
		  $$('#cats_area span.'+button_class).removeClass(button_class+'_clk');
		  $(elem).parentNode.addClass(button_class+'_clk');
		  var elem_id = $(elem).get('id').split('_');
		  this._renderSections($('centertop'),elem_id[1], sec_id);
	   }catch(e){
		  log.err(e);
	   }
	},
	/**From Russian
	* Отрисовка секций???
	* @param cont Container (div) to render the elements
	* @param catID ID of the menu categories
	* @param sec_id partition ID, if specified dishes displayed in this section, instead of the first order
	*/
	_renderSections: function(cont, catID, sec_id){
	   var ms = new menuSection();
	   ms.loadCollection('menu_id',catID,(function(sdata){
		  gui.renderTemplate(cont,{sections:sdata},this.sectionTemplate);
		  if ($('sid_'+sec_id)) $('sid_'+sec_id).parentNode.addClass('btn_clk'); else $('sitems').getElement('span.btnsqr').addClass('btn_clk');
		  this._renderDishes(($('sid_'+sec_id))?sec_id:sdata[0].id);
		  ms = undefined;
	   }).bind(this));
	},
	/**From Russian
	* Render Dishes
	* @param id partition ID, the dishes to render
	*/
	_renderDishes: function(id){
	   var mi = new menuItem();
	   mi.loadCollection('section2_id',id,(function(idata){
		  // -- Render dishes area
		  gui.renderTemplate($('centerbot'),{dishes:idata},this.dishTemplate);
		  mi = undefined;
	   }).bind(this));
	}
});
/**
 * Common GUI functions
 * @class
 * @namespace Ggui
*/
var Ggui = new Class({
	/** @ignore */
	Binds: ['modalShowStatus','opStatusErr'],
	/**
	* @constructor
	* @ignore
	*/
	initialize: function(){
		this.selectorRules =
		{
		  "input.sel_type@value":"#{sel_type}",
		  "span.slct_i":{
			 "v<-vals":{
				"div.slct_name":"#{v.name}",
				"div.slct_name@title":"#{v.name}",
				"input.sel_val@value":"#{v.val}"
			 }
		  }
		}
		// -- Compile the template for the selector
		window.addEvent('domready', (function(){
		 // -- Only if the html-code selector is present in the current screen
		 if ($('sel_body')) this.SelectorTemplate = $('sel_body').compile(this.selectorRules);
		}).bind(this));
	},
	/**
	* ФFunctions draws Pure.JS-template. Verifies that all the necessary data - transmitted by the user.
	* @memberOf Ggui
	*/
	renderTemplate: function(tplSource, tplData, tplRules){
	   try {
		  if (tplSource && tplData && tplRules){
			 tplSource.render(tplData,tplRules);
		  } else {
			 log.write(['No enough data for render.',['Tpl Source',tplSource],['Tpl Data',tplData],['Tpl Rules',tplRules]]);
		  }
	   } catch(e){
		  log.err(e);
	   }
	},
    /**
	* The function displays a modal window, obscuring the main window
	* @param modalID ID modal window (div), which is to be shown. Acc. HTML-code to describe the window must already exist
	* @param dragHeader If you specify - giving vozmozhnot drag the window for this item
	* @memberOf Ggui
    */
    showModal: function(modalID, dragHeader, notAlign){
        // -- Remove all validator errors
        //   $$('div.err-cont').destroy();
        // -- Make shadowing backdrop(if it's not exist yet)
        if (!$('backdrop')) {
            var mask = new Element('div.modal-backdrop',{id:'backdrop'});
            mask.inject(document.body);
        }
        // -- Align modal window
        if (!(notAlign==false)) $(modalID).position({position: 'centerTop', edge: 'center'});
        // -- If we have the Header, we will do this window dragged
        if (dragHeader) new Drag(modalID, {handle: $(dragHeader)});
        // -- show modal window
        $(modalID).show();
    },
    /**
     * Hides the modal window
     * @param modalID ID modal window (div), you want to remove / hide.
     * @memberOf Ggui
    */
    hideModal: function(modalID){
        $(modalID).hide();
        if ($('backdrop')) $('backdrop').dispose();
    },
    /**
     * Activated by pressing the OK button on the modal window. Removes a modal window from the screen.
     * @memberOf Ggui
    */
    modalDone:function(){
        $('mbody').show();
        $('osimg').hide();
        $('mfooter').hide();
        this.hideModal('smodal');
    },
    /**
     * Displays the status of the operation in a modal window.
     * @memberOf Ggui
     * @param error
    */
	modalShowStatus:function(error, data){
	   if (error){
		  var err ='';
		  if (typeOf(data)=='string') err = data; // -- If there is data, and it is not JSON-object, it means Customise text messages
		  console.log(err);
		  // -- Set the text and image
		  $('osimg').set('src','./img/failed.gif');
		  $('mheader').set('html', err);
	   } else {
		  $('osimg').set('src','./img/success.gif');
		  $('mheader').set('text', (data)?data:gui.modal_done);
	   }
	   $('mbody').hide();
	   $('osimg').show();
	   $('mfooter').show();
	   this.showModal('smodal')
	},
	opStatusOK:function(text){
	   this.modalShowStatus(false,text);
	},
	opStatusErr:function(data){
	   this.modalShowStatus(true,data);
	},
    /**
     * Makes the button disabled
     * @memberOf Ggui
     * @param btn_id ID of the button links
    */
    disableBtn: function(btn_id, fn){
        var btn = $(btn_id).getParent();
        btn.addClass('disabled');
        btn.erase("onclick");
        btn.erase("onmousedown");
        btn.erase("onmouseup");
        $(btn_id).removeProperty('href');
        // -- additional disable function
        if (typeOf(fn) == 'function') fn();
    },
    /**
     * Makes disable-button active
     * @memberOf Ggui
     * @param btn_id ID of the button links
     * @param clickcss A style that is assigned when a button is pressed
     * @param clickFn Фthe function that is executed when you press
     */
	enableBtn: function(btn_id, clickcss, clickFn){
	   var btn = $(btn_id).getParent("span");
	   btn.removeClass('disabled');
	   if (clickcss){
		  btn.set("onmousedown","{$(this).addClass('"+clickcss+"');}");
		  btn.set("onmouseup","{$(this).removeClass('"+clickcss+"');}");
	   }
	   if (clickFn){
		  btn.set("onclick",clickFn);
	   }
	},
    /**
     * Implements click on the radio
     * @param elem Elements which have pressed
     * @param container The container which contains radio-siblings
    */
	radioClick:function(elem,container){
	   try{
		  $(container).getElements('a.aw_radio').swapClass('radioon','radiooff');
		  $(elem).getElement('a.aw_radio').swapClass('radiooff','radioon');
	   }catch(e){
		  log.err(e);
	   }
	},
	/**
	* When you click on the checkbox adds, ticks checked
	* @param elem
	*/
	chboxClick:function(elem){
	   try{
		  $(elem).getElement('a.aw_checkbox').toggleClass('aw_unchecked');
		  $(elem).getElement('a.aw_checkbox').toggleClass('aw_checked');
	   }catch(e){
		  log.err(e);
	   }
	},
	/**
	* When you click on the checkbox adds, ticks all the checkboxes checked in container
	* @param elem Current Element
	* @param cont container
	*/
	chboxClickAll:function(elem, cont){
	   try{
		  var el = $(elem).getElement('a.aw_checkbox');
		  el.toggleClass('aw_unchecked');
		  el.toggleClass('aw_checked');
		  if (el.hasClass('aw_checked')){
			 $(cont).getElements('a.aw_checkbox').swapClass('aw_unchecked','aw_checked');
		  } else {
			 $(cont).getElements('a.aw_checkbox').swapClass('aw_checked','aw_unchecked');
		  }
	   }catch(e){
		  log.err(e);
	   }
	},
	/**
	* Helper function to PURE, returns class checked / unchecked depending on the condition variable object
	* @param data data that came in PURE
	* @param fname Array path of the desired variable
	*/
	chbxState: function(data, fpath){
	   var ret = 'aw_unchecked';
	   var tobj = Object.getFromPath(data, ['context'].concat(fpath));
	   if (tobj && String.from(tobj)=='1'){
		  ret = 'aw_checked';
	   }
	   return ret;
	},
	/**
	* Displays a selection window (Selector). The parameter is transmitted id field for which the value is selected.
	* For all possible values of the function is called with the name "<id-polya> FnGet". This function must exist in the screen (Screen), from which the call selector.
	* @param fid ID field
	* @param wnd ID the parent window. If there is - the window will be pre hidden.
	*/
	showSelector:function(fid,wnd){
	   // -- Gets the value of the selector
	   engine.curScreen[fid+'FnGet'](function(svalues){
		  // -- If the values do not - we have nothing to even display a window
		  if (!svalues || (svalues && svalues.length==0)) return;
		  // -- Remove all errors password set validator
		  engine.curScreen.vl.hideErrors();
		  // -- Hide the window's parent. Remember the window that hid
		  if ($(wnd)) {
			 $(wnd).hide();
			 this.wnd = wnd;
		  }
		  // -- Display a list of values
		  this.showModal('selector');
		  // -- Fill in the list of values
		  this.renderTemplate($('sel_body'),{vals:svalues, sel_type:fid},this.SelectorTemplate);
		  var curv = $(fid).get('text');
		  var selctd = null;
		  // -- If you already have a value, we try to find it in the list and pick out bits and pieces respectively. radio
		  if (curv && (selctd = $('sel_body').getElement('div[title="'+curv+'"]'))) {
			 selctd.getPrevious('a.aw_radio').swapClass('radiooff','radioon');
			 // -- If the values are not present, or if it is found - select the first item
		  } else {
			 // -- If there is any value - choose the first one
			 if (($('sel_body').getElements('a.aw_radio')).length>0) ($('sel_body').getElements('a.aw_radio')[0]).swapClass('radiooff','radioon');
		  }
		  //-- If the window options more than necessary - to reduce its
		  if (($('sel_body').getSize()).y > 520) {
			 $('sel_body').setStyle('height',520);
		  }
	   }.bind(this));
	},
	/**
	* Closes the window selector and if exit! = True saves scolded value. At the end of the conservation values will be called (if it exists) is a function named "<id-polya> FnGet" of the current screen.
	* @param exit sign exit without saving
	*/
	closeSelector:function(exit){
	   try {
		  // -- Hide the selector box
		  $('selector').hide();
		  // -- If there is a hidden parent window - display it
		  if (this.wnd) {
			 this.showModal(this.wnd,this.wnd+'_header');
			 delete this.wnd;
		  }
		  // -- ID field in which data is stored
		  var tfield = $('sel_type').get('value');
		  // -- If you press the select, rather than closing. And if there is a selected item
		  if (!exit && $('selector').getElement('a.radioon')) {
			 // -- Field for which was called selector assign value scolded selectora
			 $(tfield).set('text',($('selector').getElement('a.radioon').getNext('div.slct_name').get('text')));
			 // -- If there is an additional field, assign it a hidden meaning selectora
			 if ($(tfield+'_val')) $(tfield+'_val').set('value',($('selector').getElement('a.radioon').getNext('input.sel_val').get('value')));
			 // -- If there is a function to be executed after setting - call it
			 if (engine.curScreen[tfield+'FnSet']) engine.curScreen[tfield+'FnSet']();
		  }
	   } catch(e){
		  log.err(e);
	   }
	},
	/**
	* Save inputs/divs values to an object
	* @param elems array of html-elements
	* @return {Object}
	*/
	saveFields:function(elems){
	   var ret = {};
	   Array.each(elems, function(elem){
		  if ($(elem).get('tag')=='div'){
			 ret[$(elem).get('id')] = $(elem).get('text');
		  } else ret[$(elem).get('id')] = $(elem).get('value');
	   });
	   return ret;
	},
	/**
	* Gets inputs/divs values from an object
	* @param elems array of html-elements
	* @param obj object with element's data
	*/
	getFields:function(elems, obj){
	   Array.each(elems, function(elem){
		  if ($(elem).get('tag')=='div'){
			 $(elem).set('text',obj[$(elem).get('id')]);
		  } else $(elem).set('value',obj[$(elem).get('id')]);
	   });
	},
	/**
	* Clear inputs/divs values
	* @param elems array of html-elements
	*/
	clearFields:function(elems){
	   Array.each(elems, function(elem){
		  if ($(elem).get('tag')=='div'){
			 $(elem).set('text','');
		  } else $(elem).set('value','');
	   });
	}
});
/**
* Class for communicate with Eat24hours API.
* @class
* @namespace RemoteAPI
*/
var RemoteAPI = new Class({
	/**
	* @constructor
	* @ignore
	*/
	initialize: function(){
	   this.api = new g_api(consumer.key, consumer.secret, is3legged);
	},
	/**
	* Function connect to eat24API, get a JSON-data and run success-function to process this data.
	* @param call Type of API call
	* @param apiParams Parameters using by api
	* @param backFunc Function for Result-data processing
	* @param failFunc The function is called when an error
	* @memberOf RemoteAPI
	*/
	callRequest: function(call, apiParams, backFunc, failFunc){
	   if (log.debug) log.write('Execute request:'+call+'='+JSON.encode(apiParams));
	   // -- Вызываем API, передавая параметры и функции "success" и "failure"
	   if (this.api && this.api.ready)
		  this.api.call(call, apiParams, backFunc||log.xd, failFunc||log.err);
	},
	/**
	*
	* @param call
	* @param items_arr
	* @param call_field_name
	* @param item_field_name
	* @return {Array}
	*/
	formComplexCall: function(call, items_arr, call_field_name, item_field_name){
	   var cals = [];
	   Array.each(items_arr, function(item){
		  var cobj = {name:call, params:{}};
		  cobj.params[call_field_name] = item[item_field_name];
		  cals.push(cobj);
	   });
	   return cals;
	}
});
/**
* Class for logging any Ganymede event.
* Implements various log sources.
* @class
* @namespace Logging
*/
var Logging = new Class({
	/**
	* Creates a new Log object.
	* @param {String} logType Type of logging source
	* @param {Boolean} debugMode Show extended log information
	* @memberOf Logging
	*/
	initialize: function(logType, debugMode){
	   this.logType = logType;
	   this.debug = debugMode;
	},
	/**
	* Write log message.
	* @param text Message text
	* @memberOf Logging
	*/
	write: function(){
	   this.xd($A(arguments));
	},
	/**
	* The function is used in the try-catch block to display information about the error
	* @param err caught error
	* @memberOf Logging
	*/
	err: function(err){
	   switch(this.logType){
		  case 'alert':
			 alert('Error: '+this._dump(err));
			 break
		  default:
		  case 'console':
			 console.error(err);
			 // -- Personal for me, to fast tracking any errors(Andry)
			 if (err.stack) console.log(err.stack);
	   }
	},
	/**
	* Displays the structure and data of any type of variable
	* @param dataVariable of any type (well, almost any :)
	* @memberOf Logging
	*/
	xd: function(){
	   switch(this.logType){
		  case 'alert':
			 if (typeOf(this)=='window') {
				alert(this.log._dump($A(arguments),1,4));
			 } else {
				alert(this._dump($A(arguments),1,4));
			 }
			 break
		  case 'console':
		  default:
			 console.log($A(arguments));
	   }
	},
	/**
	* The auxiliary recursive function of forming a variable of any type of text information and data about the structure of the variable
	* Analogue var_dump in PHP
	* @private
	* @memberOf Logging
	*/
	_dump: function(d,l,r){
	   if (typeof(l) == "undefined") l = 1;
	   if (typeof(r) == "undefined") r = 3;
	   if (l>r) return "***Recursed***\n";
	   var s = '';
	   var c=0;
	   if (typeof(d) == "object" || d instanceof Object) {
		  if (typeof(d["Dump"]) == "function") return "[window]\n";
		  if (typeof(d["location"]) == "object") return "[document]\n";
		  s += typeof(d) + " {\n";
		  try{
			 for (var k in d) {
				//if (l>1 && c++>3) continue;
				try{
				    var v = d[k];
				    if (v == null || typeof(v)=="function" || ((v.constructor||{}).prototype||{})[k]) continue;
				}catch (e) {}
				for (var i=0; i<l; i++) s += "  ";
				s += k+": " + this._dump(v,l+1,r);
			 }
		  }catch (e) {}
		  for (var i=0; i<l-1; i++) s += "  ";
		  s += "}\n"
	   } else {
		  s += "" + d + "\n";
	   }
	   return s;
	}
});
/**
* Class for save and get settings from LocalStorage
* @class
* @namespace Settings
*/
var Settings = new Class({
	/**
	* @memberOf Settings
	*/
	initialize: function(){
	   if (!localStorage) throw new Error('Browser not support LocalStorage');
	},
	/**
	* gets the setting
	* @param sname Name settings
	* @param def default
	* @memberOf Settings
	*/
	get: function(sname, def){
	   var res = localStorage.getItem(sname);
	   if (typeof(res)=='undefined' || res=='undefined') res=null;
	   if (!res && def) {
		  res = this.set(sname, def);
	   }
	   return res;
	},
	/**
	* Get all the settings
	* @param filter if specified, collect names begin with filter
	* @return {Object}
	*/
	getAll: function(filter){
	   var ret = {};
	   for (var key in localStorage){
		  if (filter) {
			 if (key.indexOf(filter)==0)ret[key] = this.get(key);
		  } else ret[key] = this.get(key);
	   }
	   return ret;
	},
	/**
	* Saves the setting
	* @param sname Name settings
	* @param sval  The setting value
	* @memberOf Settings
	*/
	set: function(sname, sval){
	   localStorage.setItem(sname, sval);
	   return sval;
	},
	/**
	* removes the setting
	* @param sname Name settings
	* @memberOf Settings
	*/
	rm: function(sname){
	   localStorage.removeItem(sname);
	},
	/**
	* Getting JSON-object stored in the settings and access their properties
	* @param sname Name settings
	* @param obj_path The path to the desired object property
	* @memberOf Settings
	*/
	getFrom:function(sname, obj_path){
	   var obj = JSON.decode(this.get(sname));
	   if (obj){
		  if (obj_path)
			 return Object.getFromPath(obj, obj_path);
		  else return obj;
	   }
	   else
		  return false;
	}
});
var GValidator = new Class({
	initialize: function(){
	   this.valid = true;
	},
	/**
	* Checks that the field / fields were not empty
	* @param elems Field or array of fields (array of Elements)
	* @param tfield If you specify - the field on which will display an error message.
	* @param cust_err If specified, it replaces the standard message
	*/
	notEmpty: function (elems, tfield, cust_err){
	   if (typeOf(elems)=='string') elems = [elems];
	   Array.each(elems, (function(elem){
		 if ($(elem)) {
			var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
			data = data.trim()
			if (!data || data=='null' || data==null || data==undefined) {
			    this.valid = false;
			    this.showElemErr(elem, (cust_err)?cust_err:'This field is required!', tfield);
			}
		 }
	   }).bind(this));
	},
	/**
	* Checks for the presence of illicit field specsimvolov
	* @param elems Field or array of fields (array of Elements)
	* @param tfield If you specify - the field on which will display an error message.
	* @param cust_err If specified, it replaces the standard message
	*/
	noSpChars: function(elems, tfield, cust_err){
	   if (typeOf(elems)=='string') elems = [elems];
	   Array.each(elems, (function(elem){
		  if ($(elem)) {
			 var  regexp = /[?!,{};|.:'`#$%^&*@№<>/\\=]/g;
			 var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
			 var res = data.match(regexp);
			 if (res!=null) {
				this.valid = false;
				this.showElemErr(elem, (cust_err)?cust_err:'Not allowed chars: ( '+res.join(' ')+' )', tfield);
			 }
		  }
	   }).bind(this));
	},
	oneReq: function(elems, container, cls){
	   var ret = false;
	   Array.each(elems, function(el){
		 if ($(el).hasClass(cls)) ret = true;
	   });
	   if (!ret) {
		  this.valid = false;
		  this.showElemErr(container, 'Select at least one option', container);
	   }
	},
	isEmail:function(elems, tfield, cust_err){
	   try {
		  if (typeOf(elems)=='string') elems = [elems];
		  Array.each(elems, (function(elem){
			 if ($(elem)) {
				var  regexp = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i;
				var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
				if (!regexp.test(data)) {
				    this.valid = false;
				    this.showElemErr(elem, (cust_err)?cust_err:'Enter correct e-mail', tfield);
				}
			 }
		  }).bind(this));
	   } catch (e){
		  if (e!==BreakException) throw e;
	   }
	},
	isPhone:function(elems, tfield, cust_err){
	   var BreakException= {};
	   try {
		  if (typeOf(elems)=='string') elems = [elems];
		  Array.each(elems, (function(elem){
			 if ($(elem)) {
				var  regexp = /[2-9]{1}\d{9}/;
				var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
				if (!regexp.test(data)) {
				    this.valid = false;
				    this.showElemErr(elem, (cust_err)?cust_err:'Enter US phone!', tfield);
				}
			 }
		  }).bind(this));
	   } catch (e){
		  if (e!==BreakException) throw e;
	   }
	},
	isTopping:function(elem, data){
	   var BreakException= {};
	   try {
		  var arr_data = data.split("\n");
		  var  regexp = /^[ a-z0-9"()\-]+(?:\|(?:[0-9]+(?:\.{1}[0-9]+)?;?)+(?:\|1)?)?$/i;
		  var res = true;
		  Array.each(arr_data, (function(val){
			 if (!regexp.test(val)){
				this.valid = false;
				this.showElemErr(elem, '<br>Topping format: name|price|default<br> "price","default" - non required<br>"name" can contain a-z0-9"() symbols <br>"price" can be digit or digits splited by ;<br>"default" must be 1');
				throw BreakException;
			 }
		  }).bind(this));
	   } catch (e){
		  if (e!==BreakException) throw e;
	   }
	},
	/**
	* Displays an error message and marks the erroneous yelement red border.
	* @param relElem Elements on which the error occurred
	* @param err Error message
	* @param tf The container in which to display the message, if not specified, is to be made himself yelement
	*/
	showElemErr: function(relElem, err, tf){
	   var val_id = 'val_'+((tf)?tf:$(relElem).get('id'));
	   // -- If the selected field is still no error message - create it
	   if (!$(val_id)) {
		  var epos = $((tf)?tf:$(relElem)).getCoordinates();
		  var tip = new Element('div', {
			 'class': 'err-cont',
			 'id':val_id,
			 styles: {
				top: epos.top,
				left: epos.left,
				width: epos.width,
				height: epos.height
			 },
			 events: {
				click: function(){
				    this.destroy();
				    // -- When you click on an error, if the input field - focus in it
				    if ($(relElem).get('tag')=='input') $(relElem).focus();
				    // -- When you click on the error, if it div - click on it
				    if ($(relElem).get('tag')=='div') $(relElem).click();
				}
			 }
		  }).adopt(
			 new Element('div', {'class': 'err-body', 'html':'<b>Error:&nbsp</b><span class="err-text" >'+err+'</span>', styles:{height:epos.height-16}})
		  );
		  tip.inject($(document.body))
	   }
	   // -- Add the red rims
	   $(relElem).addClass('ierr');
	   // -- Remove the rims from clicks on the Elements or change it (depending on the type of elementa)
	   if ($(relElem).get('tag')=='input' || $(relElem).get('tag')=='textarea') {
		  $(relElem).addEvent('change', function(){this.removeClass('ierr')});
		  $(relElem).addEvent('focus', function(){if ($('val_'+this.get('id'))) $('val_'+this.get('id')).destroy()});
	   };
	   if ($(relElem).get('tag')=='div')   $(relElem).addEvent('click', function(){this.removeClass('ierr')});
	},
    /**
     * Проверяет поле на наличие недозволенных спецсимволов
     * @param elems Поле или массив полей(array of Elements)
     * @param tfield Если указано - поле над которым будет выведено сообщение об ошибке.
     * @param cust_err Если указано, то заменяет стандартное сообщение
     */
    noSpChars: function(elems, tfield, cust_err){
        if (typeOf(elems)=='string') elems = [elems];
        Array.each(elems, (function(elem){
            if ($(elem)) {
                var  regexp = /[?!,{};|.:'`#$%^&*@№<>/\\=]/g;
                var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
                var res = data.match(regexp);
                if (res!=null) {
                    this.valid = false;
                    this.showElemErr(elem, (cust_err)?cust_err:'Not allowed chars: ( '+res.join(' ')+' )', tfield);
                }
            }
        }).bind(this));
    },

    oneReq: function(elems, container, cls){
        var ret = false;
        Array.each(elems, function(el){
           if ($(el).hasClass(cls)) ret = true;
        });
        if (!ret) {
            this.valid = false;
            this.showElemErr(container, 'Select at least one option', container);
        }
    },

    isNumeric:function(elems, tfield, cust_err){
        try {
            if (typeOf(elems)=='string') elems = [elems];
            Array.each(elems, (function(elem){
                if ($(elem)) {
                    var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
                    if (!Number.from(data)) {
                        this.valid = false;
                        this.showElemErr(elem, (cust_err)?cust_err:'This isn\'t number!', tfield);
                    }
                }
            }).bind(this));
        } catch (e){
            if (e!==BreakException) throw e;
        }
    },

    isEmail:function(elems, tfield, cust_err){
        try {
            if (typeOf(elems)=='string') elems = [elems];
            Array.each(elems, (function(elem){
                if ($(elem)) {
                    var  regexp = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i;
                    var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
                    if (!regexp.test(data)) {
                        this.valid = false;
                        this.showElemErr(elem, (cust_err)?cust_err:'Enter correct e-mail', tfield);
                    }
                }
            }).bind(this));
        } catch (e){
            if (e!==BreakException) throw e;
        }
    },

    isPhone:function(elems, tfield, cust_err){
        var BreakException= {};
        try {
            if (typeOf(elems)=='string') elems = [elems];
            Array.each(elems, (function(elem){
                if ($(elem)) {
                    var  regexp = /[2-9]{1}\d{9}/;
                    var data = ($(elem).get('tag')!='div')?$(elem).get('value'):$(elem).get('text');
                    if (!regexp.test(data)) {
                        this.valid = false;
                        this.showElemErr(elem, (cust_err)?cust_err:'Enter US phone!', tfield);
                    }
                }
            }).bind(this));
        } catch (e){
            if (e!==BreakException) throw e;
        }
    },

    isTopping:function(elem, data){
        var BreakException= {};
        try {
            var arr_data = data.split("\n");
            var  regexp = /^[ a-z0-9"()\-]+(?:\|(?:[0-9]+(?:\.{1}[0-9]+)?;?)+(?:\|1)?)?$/i;
            var res = true;
            Array.each(arr_data, (function(val){
                if (!regexp.test(val)){
                    this.valid = false;
                    this.showElemErr(elem, '<br>Topping format: name|price|default<br> "price","default" - non required<br>"name" can contain a-z0-9"() symbols <br>"price" can be digit or digits splited by ;<br>"default" must be 1');
                    throw BreakException;
                }
            }).bind(this));
        } catch (e){
            if (e!==BreakException) throw e;
        }
    },

    /**
     * Отображает сообщение об ошибке и помечает ошибочный елемент красным бордюром.
     * @param relElem Елемент, на котором возникла ошибка
     * @param err Сообщение об ошибке
     * @param tf Контейнер на котором показывать сообщение, если не указан, таковым считается сам елемент
     */
    showElemErr: function(relElem, err, tf){
        var val_id = 'val_'+((tf)?tf:$(relElem).get('id'));
        // -- Если на выбранном поле еще нет сообщения об ошибке - создаем его
        if (!$(val_id)) {
            var epos = $((tf)?tf:$(relElem)).getCoordinates();
            var tip = new Element('div', {
                'class': 'err-cont',
                'id':val_id,
                styles: {
                    top: epos.top,
                    left: epos.left,
                    width: epos.width,
                    height: epos.height
                },
                events: {
                    click: function(){
                        this.destroy();
                        // -- При клике на ошибке, если это поле для ввода - фокусируемся в нем
                        if ($(relElem).get('tag')=='input') $(relElem).focus();
                        // -- При клике на ошибке, если это div - кликаем на нем
                        if ($(relElem).get('tag')=='div') $(relElem).click();
                    }
                }
            }).adopt(
                new Element('div', {'class': 'err-body', 'html':'<b>Error:&nbsp</b><span class="err-text" >'+err+'</span>', styles:{height:epos.height-16}})
            );
            tip.inject($(document.body))
        }
        // -- Добавляем красные ободки
        $(relElem).addClass('ierr');
        // -- Снимаем ободки при кликах на елементе или изменении его (в зависимости от типа елемента)
        if ($(relElem).get('tag')=='input' || $(relElem).get('tag')=='textarea') {
            $(relElem).addEvent('change', function(){this.removeClass('ierr')});
            $(relElem).addEvent('focus', function(){if ($('val_'+this.get('id'))) $('val_'+this.get('id')).destroy()});
        };
        if ($(relElem).get('tag')=='div')   $(relElem).addEvent('click', function(){this.removeClass('ierr')});
    },
    /**
     * Hides all the error messages
     */
    hideErrors: function(cont_name){
        $$('div.err-cont').destroy();
        if (cont_name){
            ($(cont_name).getElements('.ierr')).removeClass('ierr');
        }
    },
    /**
     * The function takes an array of objects, where each object has a structure {vtype: 'The function of validation', vdata: 'The data for the validation}
     * Vdata parameter can be either a text field (ID Dom-elementa) or an array ([0] yelement / s, [1] is the first parameter of the function, [2] is the second parameter of the function)
     * @param val_params
     */
    validate:function(val_params){
        this.valid = true;
        Array.each(val_params, (function(vi){
            if (typeOf(vi.vdata)=='array'){
                this[vi.vtype](vi.vdata[0], (vi.vdata.length>1)?vi.vdata[1]:false, (vi.vdata.length>2)?vi.vdata[2]:false);
            } else if (typeOf(vi.vdata)=='string') this[vi.vtype](vi.vdata);
        }).bind(this));
        return this.valid;
    }
});

var dateRules = new Class({
	rule24hours:function(cdateRef,xdateRef){
		var cdate = Date.parse(cdateRef),
		    curdate = new Date(),
		    killdate = xdateRef.indexOf('00:00:00')>=0 || xdateRef.indexOf('ASAP')>=0 ? cdateRef : Date.parse(xdateRef),
		    datemath = curdate - killdate,
		    hr24 = datemath < 86400000;
		return hr24;
	}
});
