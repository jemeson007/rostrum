/*
* rostrum.shell.js
* Shell module for SPA
*/

/*jslint browser:true, continue:true,
  devel:true, indent:2, maxerr:50,
  newcap:true, nomen:true, plusplus:true,
  regexp:true, sloppy:true, vars:false,
  white:true
*/
/*global $, rostrum */

rostrum.shell = (function(){
	//-------------------BEGIN MODULE SCOPE VARIABLES----------------
	var
	  configMap={
	  	anchor_schema_map: {
	  		chat : {opened  : true, closed : true}
	  	},
	  	main_html : String()
	  	+ '<div class="rostrum-shell-head">'
	  	+ '<div class="rostrum-shell-head-logo"></div>'
	  	+ '<div class="rostrum-shell-head-acct"></div>'
	  	+ '<div class="rostrum-shell-head-search"></div>'
	  	+ '</div>'
	  	+ '<div class="rostrum-shell-main">'
	  	+ '<div class="rostrum-shell-main-content"></div>'
	  	+ '</div>'
	  	+ '<div class="rostrum-shell-foot"></div>'
	  	/*+ '<div class="rostrum-shell-chat"></div>'*/
	  	+ '<div class="rostrum-shell-modal"></div>',
	  	chat_extend_time :250,
	  	chat_clam_time : 300,
	  	chat_extend_height : 450,
	  	chat_clam_height : 15,
	  	chat_extended_title : 'Click to clam',
	  	chat_clam_title : 'Click to extend',
	  	resize_interval : 200
	  },
	  stateMap = {
	  	$container: null,
	  	anchor_map :{},
	  	is_chat_clammed :true,
	  	resize_idto : undefined
	  },
	  jqueryMap = {},

	  copyAnchorMap, setJqueryMap, setChatAnchor, /*toggleChat,*/
	  changeAnchorPart, onHashChange, onResize, onClickChat, initModule;
	  //---------------END MODULE SCOPE VARIABLES----------------------

	  //---------------BEGIN UTILITY METHODS-------------------------
	  // Returns copy of stored anchor map; minimizes overhead 
	  copyAnchorMap = function(){
	  	return $.extend(true, {}, stateMap.anchor_map);
	  };
	  //---------------END UTILITY METHODS---------------------------

	  //---------------BEGIN DOM METHODS-------------------------------
	  //  Begin DOM method / changeAnchorPart / 
	  // Purpose: Changes part of the URI anchor component
	  // Arguements:
	  //  *arg_map - The map describing what part of the URI anchor we want changed
	  //
	  //  Returns: boolean
	  //   *true: The Anchor portion of the URI was updated
	  //   *false: The Anchor portion of the URI could not be updated
	  //  Action:
	  //   The current anchor rep stored in the stateMap.anchor_map
	  //   See uriAnchor for a discussion of encoding
	  //   This method
	  //    *Creates a copy of this map using copyAnchorMap().
	  //    *Modifies the key-values using arg_map
	  //    *Manages the distinction between the independent and the dependent values of the encoding
	  //    *Attempts to change the URI using uriAnchor
	  //    *Returns true on success, and false on failure
	  //
	  changeAnchorPart = function(arg_map){
	  	var 
	  	  anchor_map_revise = copyAnchorMap(),
	  	  bool_return = true,
	  	  key_name, key_name_dep;

	  	  //Begin merge changes into anchor map
	  	KEYVAL:
	  	for (key_name in arg_map) {
	  	  if(arg_map.hasOwnProperty(key_name)){
	  	  	//skip dependent keys on iteration
	  	  	if(key_name.indexOf('_')===0){
	  	  		continue KEYVAL;
	  	  	}
	  	  	//update independent key value
	  	  	anchor_map_revise[key_name] = arg_map[key_name];
	  	  
	  	    //update matching dependent key
	  	    key_name_dep = '_' + key_name;
	  	    if(arg_map[key_name_dep]){
	  	    	anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
	  	    }
	  	    else{
	  	    	delete anchor_map_revise[key_name_dep];
	  	    	delete anchor_map_revise['s' + key_name_dep];
	  	    }
	  	  }	  
	  	}
	  	   //End merge changes into anchor map

	  	   //Begin attempt to update URI; revert if not successful
	  	   try{
	  	   	$.uriAnchor.setAnchor(anchor_map_revise);
	  	   }
	  	   catch(error){
	  	   	//replace URI with existing state
	  	   	$.uriAnchor.setAnchor(stateMap.anchor_map, null, true);
	  	   	bool_return = false;
	  	   }
	  	   //End attempt to update URI

	  	   return bool_return;
	  };
	  //  End DOM method / changeAnchorPart /
	  //  Begin DOM method / setJqueryMap/
	  setJqueryMap = function(){
	  	var $container = stateMap.$container;

	  	jqueryMap = {
	  		$container : $container,
	  		/*$chat : $container.find('.rostrum-shell-chat')*/
	  	};
	  };
	  //  End DOM method / setJqueryMap/

	  //  Begin DOM method / toggleChat/
	  //  Aim : Extends or clams chat slider
	  //  Arguments : 
	  //  *do_extend - if true, extends slider; if false clams
	  //  *callback - optional function to execute at the end of animation
	  // Settings  :
	  //  *chat_extend_time, chat_cla_time
	  //  *chat_extend_height, chat_clam_height
	  //  Returns  : boolean
	  //  *true - slider animation activated
	  //  *false - slider animation not activated
	  //
	  // State : sets stateMap.is_chat_clammed
	  //	*true - slider is clammed
	  //	*false - slider is extended
	  /*toggleChat = function(do_extend, callback){
	  	var
	  	  px_chat_ht = jqueryMap.$chat.height(),
	  	  is_open = px_chat_ht === configMap.chat_extend_height,
	  	  is_closed = px_chat_ht === configMap.chat_clam_height,
	  	  is_sliding = !is_open && !is_closed;

	  	  //avoid race condition
	  	  if(is_sliding){
	  	  	return false;
	  	  }
	  	  //Begin extend chat slider
	  	  if(do_extend){
	  	  	jqueryMap.$chat.animate({
	  	  		height :configMap.chat_extend_height
	  	  	}, configMap.chat_extend_time,
	  	  	function(){
	  	  		jqueryMap.$chat.attr(
	  	  			'title', configMap.chat_extended_title
	  	  			);
	  	  		stateMap.is_chat_clammed = false;
	  	  		if(callback){
	  	  			callback(jqueryMap.$chat);
	  	  		}
	  	  	}
	  	  	);
	  	  	return true;
	  	  }
	  	  //End extend chat slider

	  	  //Begin clam chat slider
	  	  jqueryMap.$chat.animate({
	  	  	height : configMap.chat_clam_height
	  	  },configMap.chat_clam_time,
	  	    function(){
	  	    	jqueryMap.$chat.attr(
	  	    		'title', configMap.chat_clam_title
	  	    		);
	  	    	stateMap.is_chat_clammed = true;
	  	      if(callback){callback(jqueryMap.$chat);}	
	  	  });
	  	  return true;
	  	  //End clam chat slider
	  };*/
	  //End DOM method /toggleChat/

	  //Begin DOM method / changeAnchorPart /
	  //Purpose: Changes part of the URI anchor component
	  //Arguements:
	  // *arg_map - The map describing what part of the URI anchor we want changed.
	  //Returns: boolean
	  // *true - the Anchor portion of the URI was updated
	  // *false - the Anchor portion of the URI could not be updated
	  //Action:
	  //  The current anchor rep stored in stateMap.anchor_map.
	  //  See uriAnchor for a discussion of encoding.
	  //  This method
	  //     *Creates a copy of this map using copyAnchorMap().
	  //     *Modifies the key-values using arg-map.
	  //     *Manages the distinction between the independent and dependent values in the encoding.
	  //     * Attempts to change the URI using uriAnchor.
	  //     * Returns true on success, and false on failure.

	  //----------------END DOM METHODS--------------------------------
	  // ---------------LEADERSHIP NOTES --------------30TH Avril-----------------
	  // Developing the innate leader  
	  // In Christianity , failure is not an option - Christ connection - 3 days precision
	  // Administrative and Spiritual Structure 
	  // ------------------------{Admin}-----------------------------------------------------
	  // ---{Board-of-Elders}---------------------------{Board of Pastors}---------------------
	  //---------------------------------------------{Board of Ministers / Deacon}-----------
	  //----------------------{Business Manager}---------------------------------------------
	  //-------------------------------------{Assistant Business Manager}--------------------
	  //----{Bishop office Coordinator}------{Building Security}---------{Church & Community}---{Covenant Partners}----Communications Officer ----Accountant
	  //-------------------------------------------------------------Mentoring Matters----Building Fund-------Office Clerks---------------Assistant Accountant > Cashiers > Note Counters
	  //----Protocol Officer----Communications Liaison Officer----Resources Officer
	  //
	  //
	  //--Building Maintenance--Events & Organising --Hospitality--Decorations--Communications--Protocol--Security--Transport--Weddings & Bereavement
	  //------------------Projects Team===========================IT & Media---Sound Engineering----------Broadcasting-------



	  //------------------------{Spiritual}-------------------------------------------
	  //-----------------------{BISHOP}----------------------------------------
	  //-------------------{Board of Pastors}--------------------------------
	  //------{Board of Elders} ---------------------------------{Board of Ministers /  Deacons}
	  //---{Praise & Worship}-------------{Intercession}--------------{Zone Shephards}
	  //----------------------{Sound}----------------------------------{Cell Group Leaders}
	  //---{Single & Complete}===={Ushering}======{Joseph Ministries}========={Deborah Ministries}==={Little Angels}==={Joshua Ministries}
	  //
	  //----[Solids] - - -:: Never cannot
	  //----------------::Spiritual Gospel Principles :: Forgiveness
	  //----------------::Leadership is Influence
	  //----------------:leadership: "control",
	  //----------------: Key: Priorities ,
	  //----------------: Key: "Integrity", 
	  //----------------: Test {Ultimate}: "Creating Positive Change",
	  //----------------: ++: Attitude{Genuine},
	  //----------------: Develop the most appreciable asset : people
	  //----------------: The church is a zone for sinners
	  //----------------: The price tag {sacrifice/cost} for leadership: self discipline
	  //----------------: The most incredible asset for leadership: staff development
	  //----------------: Leadership be a function ::position be a placeholder

	  /*---------------------5 LEVELS OF LEADERSHIP DEVELOPMENT ----------------*/
	  //----------------1.0) POSITION AND RIGHTS----[LOVE folks]-----{Offer creative ideas for change and improvement}------------------
	  //----------------2.0) PERMISSION AND RELATIONSHIPS ----------{Possess Genuine LOVE for people}----------{Love Folks more than procedures}----{Include others in your journey}
	  //----------------3.0) PRODUCTION / RESULTS ----------{Initiate and accept responsibility of growth}----
	  //----------------4.0) PEOPLE DEVELOPMENT / REPRODUCTION ---------{Realise that people are your most valuable asset}--{Place a priority on developing people}--{Expose key leaders to growth opportunities}--{Be able to attract other winners producers to a common goal}--{Surround yourself with an inner core that complements your leadership}
	  //----------------5.0) PERSONHOOD / RESPECT -------------{Your followers are loyal and sacrificial} -- 

	  //----------------BEGIN EVENT HANDLERS----------------------------
	  //  Begin Event Handler / onHashChange / 
	  //  Purpose: Handles the hashchange event
	  //  Arguements:
	  //    *event - jQuery event object
	  //  Settings : none
	  //  Returns : false
	  //  Action:
	  //    *Parses the URI anchor component
	  //    *Compares proposed application state with current
	  //    *Adjust the application only where proposed state
	  //    differs from existing and is allowed by anchor schema
	  //
	  onHashChange = function(event){
	  	var 
	  	  _s_chat_previous, _s_chat_proposed, s_chat_proposed,
	  	  anchorMap_proposed,
	  	   is_ok = true,
	  	  anchor_map_previous = copyAnchorMap();	  	  
	  	  
	  	// attempt to parse anchor
	  	try{anchor_map_proposed = $.uriAnchor.makeAnchorMap();}
	  	catch(error){
	  		$.uriAnchor.setAnchor(anchor_map_previous, null, true);
	  		return false;
	  	}
	  	stateMap.anchor_map = anchor_map_proposed;

	  	//convenience vars
	  	_s_chat_previous = anchor_map_previous._s_chat;
	  	_s_chat_proposed = anchor_map_proposed._s_chat;

	  	//Begin adjust chat component if changed
	  	if(!anchor_map_previous || _s_chat_previous !== _s_chat_proposed){
	  		s_chat_proposed = anchor_map_proposed.chat;
	  		switch(s_chat_proposed){
	  			case 'opened':
	  			/*toggleChat(true);*/
	  			is_ok = rostrum.chat.setSliderPosition('opened');
	  			break;
	  			case 'closed':
	  			/*toggleChat(false);*/
	  			is_ok = rostrum.chat.setSliderPosition('closed');
	  			break;
	  			default :
	  			  toggleChat(false);
	  			  delete anchor_map_proposed.chat;
	  			  $.uriAnchor.setAnchor(anchor_map_proposed, null, true);
	  		}
	  	}
	  	// End adjust chat component if changed

	  	// Begin revert anchor if slider change denied
	  	if(!is_ok){
	  		if(anchor_map_previous){
	  			$.uriAnchor.setAnchor(anchor_map_previous, null, true);
	  			stateMap.anchor_map = anchor_map_previous;
	  		}else{
	  			delete anchor_map_proposed.chat;
	  			$.uriAnchor.setAnchor(anchor_map_proposed, null, true);
	  		}
	  	}
	  	// End revert anchor if slider change denied
	  	return false;
	  };
	  // End Event Handler / onHashChange /
	  // Begin Event Handler / onClickChat /
	    onClickChat = function(event){
	    	if(toggleChat(stateMap.is_chat_clammed)){
	    	  $.uriAnchor.setAnchor({
	    	  	chat:(stateMap.is_chat_clammed ? 'open' : 'closed')
	    	  });	
	    	}
	    	changeAnchorPart({
	    		chat:(stateMap.is_chat_clammed ? 'open':'closed')
	    	});
	    	return false;
	    };
	  // End Event Handler /onClickChat / 
	  // Begin Event Handler / onResize / 
	  onResize = function(){
	  	if(stateMap.resize_idto){return true;}

	  	rostrum.chat.handleResize();
	  	stateMap.resize_idto = setTimeout(
	  		function(){stateMap.resize_idto = undefined;},
	  		configMap.resize_interval
	  		);
	  	return true;
	  };
	  // End Event handler / onResize /
	  //----------------END EVENT HANDLERS------------------------------

	  //-----------------BEGIN CALLBACK METHODS-------------------------
	  // Begin callback method / setChatAnchor/
	  // Example : setChatAnchor('closed');
	  // Purpose: Change the chat component of the anchor
	  // Arguments :
	  //  *position_type - may be 'closed' or 'opened'
	  // Action :
	  // Changes the URI anchor parameter 'chat' to the requested
	  // value if possible.
	  // Returns :
	  //  *true - requested anchor part was updated
	  //  *false - requested anchor part was not updated
	  // Throws : none
	  //
	  setChatAnchor = function(position_type){
	  	return changeAnchorPart({chat : position_type});
	  };
	  // End Callback method / setChatAnchor /
	  //----------------END CALLBACK METHODS ----------------------------

	  //----------------BEGIN PUBLIC METHODS---------------------------
	  //  Begin Public Method /initModule/
	  //  Example : rostrum.shell.InitModule($('#app_div_id'));
	  //  Purpose :
	  //  Directs the Shell to offer its capability to the user
	  //  Arguments :
	  //    *$container (example:$('#app_div_id')).
	  //    A jQuery collection that should represent a single DOM container
	  //  Action:
	  //    Populates $container with the shell of the UI
	  //    and then configures and initializes feature modules.
	  //    The Shell is also responsible for browser-wide issues
	  //    such as URI anchor and cookie management.
	  //  Returns  : none
	  //  Throws  : none
	  //
	  initModule = function($container){
	
	  	//load HTML and map jQuery collections
	  	stateMap.$container = $container;
	  	$container.html(configMap.main_html);
	  	setJqueryMap();

	  	//initialize chat slider and bind click handler
	  	/*stateMap.is_chat_clammed = true;
	  	jqueryMap.$chat
	  	  .attr('title', configMap.chat_clam_title)
	  	  .click(onClickChat);
*/
/*	  	//test toggle
	  	setTimeout(function(){toggleChat(true);},3000);
	  	setTimeout(function(){toggleChat(false);},8000);
*/
	   	// configure uriAnchor to use our schema
	  	$.uriAnchor.configModule({
	  		schema_map:configMap.anchor_schema_map
	  	});

	  	//configure and initialize feature modules
	  	rostrum.chat.configModule( {
	  		set_chat_anchor : setChatAnchor,
	  		chat_model : rostrum.model.chat,
	  		people_model : rostrum.model.people
	  	} );
	  	rostrum.chat.initModule( jqueryMap.$container );
	  	// Handle URI anchor change events
	  	// This is done /after / all feature modules are configured and initialized,
	  	// otherwise they will not be ready to handle the trigger event, which is used
	  	// to ensure the anchor is considered on-load
	  	//
	  	$(window)
	  	.bind('resize', onResize)
	  	.bind('hashchange', onHashChange)
	  	.trigger('hashchange');
	  };
	  //  End Public Method /initModule/

	  return {initModule : initModule};
	  //----------------END PUBLIC METHODS----------------------------
}());
