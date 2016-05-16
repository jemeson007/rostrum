/*
 *rostrum.js
 * Root namespace module
*/

 /*jslint		browser:true, continue:true,
 devel: true, indent:2, maxerr : 50,
 newcap: true, nomenL true, plusplus : true
 regexp: true, sloppy:true, vars: false,
 white:true
 */
 /*global $, rostrum */

 var rostrum = (function(){
 	var initModule = function($container){
 		rostrum.shell.initModule($container);
 	};
 	return{initModule: initModule};
 }());                                                                                                                                                   