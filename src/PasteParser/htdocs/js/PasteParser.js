/*
 * Copyright (C) 2017 Richard Lyders <Richard@Lyders.com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions
are met:

 1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in
    the documentation and/or other materials provided with the
    distribution.
 3. The name of the author may not be used to endorse or promote
    products derived from this software without specific prior
    written permission.

THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS
OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN
IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

jQuery(document).ready(function ($) {
	
	/*  GLOBAL: paste_parser_config 
	 *   This global is created using in post_process_request() in PasteParser.py which calls 
	 *   trac.web.chrome.add_script_data
	 *   
	 *   This is a set of user-defined rules from the trac.ini that contains 
	 *   1) cross-references used to map key/value pairs to fields
	 *   2) value translations to convert the mapped values to their final form
	 *   
	 *  
	 */	
	
	/* the name of the Trac ticket field that the user will paste text into to be parsed
	 * NOTE: the actual DOM field name and field ID are prefixed with 'field-/_' by default.
	 */
	var field_to_parse = paste_parser_config['field_to_parse'];

	/*
	 * set to false to avoid any debug message being sent to the
	 *  console or alert dialogs
	 */
	var dbg_on = (paste_parser_config['debug_on'].toLowerCase() == 'true' ? true : false);
	
	/*
	 * sends message to console.log (or alert dialog if display_alert) as long as 
	 * global variable dbg_on==true and msg is non-empty string
	 * 
	 * @param msg           if non-empty, this string will be sent to either console or alert dialog
	 * @param objToJSON     if a non-null object, then a JSON string is created for this object using 
	 *                      JSON.stringify(objToJSON) and concatenated to the given msg
	 * @param display_alert if not undefined, msg will be displayed using alert()
	 */
	function dbg(msg, objToJSON, display_alert) {
		if (dbg_on && !(typeof msg === 'undefined' || msg === null || msg === "")) {
			if (typeof objToJSON === 'object' && objToJSON !== null) {
				msg = msg + JSON.stringify(objToJSON);
			}
			if (typeof display_alert !== 'undefined') {
				alert(msg);				
			} else {
				console.log(msg);
			}
		}
	} 
	
	/* When developing/debugging this is helpful to have an immediate
     * alert signaling that at least this Javascript file was loaded.
	 */
	dbg('PasteParser activated');

	/*
	 * Returns an associative array (an object) of key/value pairs parsed from  
	 * the given multiline string containing key/value pairs delimited by key_value_delimiter.
	 * Prior to processing, all text that matches the optional ignore_pattern is stripped out.
	 * 
	 *  @param  key_values_str            string of lines to be parsed
	 *  @param  key_value_delimiter       this delimiter is used to split up each line into a key/value pair
	 *  @param  ignore_pattern            text that matches this regex pattern will be ignored/skipped during processing
	 *  @param  key_value_end_pattern     this optional delimiter denotes the end of a key/value pair.  This is useful if values span multiple lines.
	 *  @return                           the associative array (an object) of key/value pairs parsed from the given string of lines
	 */
	function parse_key_values(key_values_str, key_value_delimiter, ignore_pattern, key_value_end_pattern) {
        dbg('BEGIN parse_key_values');
        //empty associative array (an object) to hold the parsed key/value pairs to be returned
		var key_values = {};
		// an empty array that will initially store all the key/value pairs 
        var key_value_strs = [];
		
        var re_flags = '';

        // if a pattern is defined to ignore parts of the string 
    	if (ignore_pattern && ignore_pattern.length) {
    		// Get rid of all the stuff that should be ignored...
    		dbg('ignore_pattern='+ignore_pattern);
        	// we need to allow the regex pattern to span multiple lines and run this for all matches
        	re_flags = 'gm';
        	var ignore_matcher = new RegExp(ignore_pattern, re_flags);
	        // strip out everything from the given string that matches the ignore pattern 
        	key_values_str = key_values_str.replace( ignore_matcher, '' );
        	dbg('Stripped out strings to ignore: key_values_str='+key_values_str);
    	}

        // Is a rexexp pattern declared that defines the end of each key/value pair? 
        if (key_value_end_pattern && key_value_end_pattern.length) {
            dbg('key_value_end_pattern='+key_value_end_pattern);
        	// we need to allow the regex pattern to span multiple lines and run this for all matches in the string
        	re_flags = 'mg';
        	//first we break up the string of key/value pairs using the end pattern
            var key_value_end_matcher = new RegExp(key_value_end_pattern, re_flags);

            var matched_len = 0;
            var key_value_start_pos = 0;
            var key_value_end_pos = 0;
            var match_start_pos = 0;
            var key_value_pair_str = '';
    		// loop through all matches of the key/value end regexp pattern within the full string of key/value pairs
			while (key_value_match = key_value_end_matcher.exec(key_values_str)) {
				// the position in the str where the match begins
				match_start_pos = key_value_match['index'];
				dbg('match_start_pos['+key_values_str[match_start_pos]+']='+match_start_pos);
				// the previous key/value pair ends immediately before this matched "key_value_end_pattern"
				key_value_end_pos = match_start_pos -1;
				dbg('key_value_end_pos['+key_values_str[key_value_end_pos]+']='+key_value_end_pos);
				dbg('key value len='+(match_start_pos - key_value_start_pos));
				// get the full string for the key/value pair starting at the key/value start pos up to just before this match
				// and strip of leading and trailing newlines and carriages returns
				key_value_pair_str = key_values_str.substring( key_value_start_pos, key_value_end_pos ).replace(/\s*$/, "").replace(/^\s*/, "");
				dbg('key_value_pair_str.length='+key_value_pair_str.length);
				// record this key/value pair in our array for further processing
				key_value_strs.push( key_value_pair_str );
				dbg('PUSHED: key_value_pair_str='+key_value_pair_str);
				// the length of the string that was matched by the pattern 
				matched_len = key_value_match[0].length;
				dbg('matched_len='+matched_len);
				// the next key/value pair starts immediately after the end of this matched "key_value_end_pattern"
				key_value_start_pos = match_start_pos + matched_len;  
				dbg('key_value_start_pos='+key_value_start_pos);
    		}
			// if we have't gobbled up the whole key/value string yet 
			if (key_value_start_pos < key_values_str.length) {
				// get the rest of key/value string as a key/value pair
				key_value_pair_str = key_values_str.substring( key_value_start_pos );
				// record this key/value pair in our array for further processing
				key_value_strs.push( key_value_pair_str );
				dbg('PUSHED: key_value_pair_str='+key_value_pair_str);
			}
            
        } else {
    		// split given string into array of strings by the newline char
            key_value_strs = key_values_str.split('\n');        	
        }
		// regex pattern to match against each line to get the key/value pair
        var key_value_pattern = '^\\s*(.+?)\\s*'+key_value_delimiter+'\\s*([\\s\\S]*)\\s*';
        dbg('key_value_pattern='+key_value_pattern);
		// regex object to match against each line to get the key/value pair
        var key_value_matcher = new RegExp(key_value_pattern, 'm');

        // loop through all elements in the array of key/value pair strings
    	for(var key_value_idx=0,key_value_strs_len=key_value_strs.length; key_value_idx < key_value_strs_len; key_value_idx++){
    		let key_value_str = key_value_strs[key_value_idx];
    		dbg('key_value_str='+key_value_str);

    		// run the key/value regexp pattern against this string to see if we get a match
    		var key_value_matches = key_value_matcher.exec(key_value_str,'m');
    		// if this line matched the key/value regexp, then process it to record the key/value pair
    		if (key_value_matches) {
    			// get the key of the key/value pair
    			var key = key_value_matches[1];
    			// get the value of the key/value pair
    			var value = key_value_matches[2];
    			//record the key/value pair in our associative array (an object) of key/value pairs to be returned
    			key_values[key] = value;
    			dbg('(key)'+key+'=(value)'+value);
          }
        }
    	// return the associative array (an object) of key/value pairs
        return key_values;
	}
	
	/*
	 * Returns an associative array (an object) of mapped key/value pairs based on the 
	 * simple 'source_key' field mappings in the given xref 
	 *  
	 *  @param  key_values       string of lines to be parsed
	 *  @param  xrefs            an ordered array of field mappings to use to generate the mapped key/value pairs
	 *  @return                  the associative array (an object) of mapped key/value pairs
	 */
	function map_key_values(key_values, xrefs) {
		dbg('[map_key_values] xrefs=', xrefs);
		dbg('[map_key_values] key_values=', key_values);
        //empty associative array (an object) to hold the mapped key/value pairs to be returned
        var mapped_key_values = {};
        // dbg('Object.keys(key_values).length='+Object.keys(key_values).length)
        for (var kv_key in key_values) {
        	// ensure key is not unexpected results of inheritance:
        	if (key_values.hasOwnProperty(kv_key)) {
	        	dbg('kv_key=', kv_key);
	        	// loop through all field mappings in the given xref array 
	        	for(xref_idx=0,xrefs_len=xrefs.length;xref_idx<xrefs_len;xref_idx++){
	        		let xref = xrefs[xref_idx];
	        		dbg('xref=', xref);
	        		// before using it, check if a source_key reference exists in this xref field mapping
	        		if (xref['source_key']) {
	        			dbg('Check: kv_key['+kv_key+'] == xref["source_key"]['+xref['source_key']+']');
	        			// check if the key of the current key/value pair matches the source_key in the field mapping  
		        		if (kv_key == xref['source_key']) {
		        			/* now that we found a xref field mapping with a source_key that matches the 
		        			 * key in the current key/value pair, we need to record a new kay/value pair 
		        			 * in the associate array (an object) of mapped key/value pairs using the xref field's name
		        			 * as the key.
		        			 */
		        			mapped_key_values[xref['name']] = key_values[kv_key];	        			  
		        		}
	        		}
	           }
        	}
        }
  		dbg('[map_key_values] mapped_key_values=', mapped_key_values);
        // return the new associate array (an object) of mapped key/value pairs
  		return mapped_key_values;
    }

	/* FROM: https://stackoverflow.com/a/17606289/5572674
	 *  Escape all regexp special characters in the given string
	 *  
	 *   @param     str the string to search for special characters
	 *   @return        the string resulting from the replacement of 
	 *                  all special regexp characters in the given str
	 */
	function escapeRegExp(str) {
		if (str && str.length)
		  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
	    else
	    	return '';
	}
	/*
	 * FROM: https://stackoverflow.com/a/1144788/5572674
	 *  replace all occurrences on the find string in the given str
	 *   
	 *   @param     str       the string to search
	 *   @param     find      the string to find in the given str
	 *   @param     replace   the string to replace all occurrences of find in str
	 *   @return              the string resulting from the replacement of 
	 *                        all occurrences of find in str
	 */
	function replaceAll(str, find, replace) {
		if (str && str.length)
	    	return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
	    else
	    	return '';
	}
	
	/*
	 * Translate the given associative array (an object) of mapped key/value pairs using the 
	 * more complicated JavaScript formula field mappings in the given xref. 
	 *  
	 *  @param  field_values     associative array (an object) of mapped key/value pairs to be translated
	 *  @param  xrefs            an ordered array of field mappings to use to translate the given field_values 
	 */
	function translate_embedded_key_values(field_values, xrefs) {
		// loop through all field mappings in the given xref array
    	for(xref_idx=0,xrefs_len=xrefs.length;xref_idx<xrefs_len;xref_idx++){
			//this is the field mapping object or XREF
    		let xref = xrefs[xref_idx];
    		// this is the name of the field to be mapped. 
			let xref_name = xrefs[xref_idx]['name'];
			dbg('[translate_embedded_key_values] xref_name='+xref_name);
			//does the xrefs item have Javascript code associated with it?
			if (xref.hasOwnProperty('js')) {
				/* if there is Javascript code for this xrefs item
				  then we need to replace the embedded field names in the JS
				  and then execute it to get the resulting value for the field
				*/
				var xref_js = xref['js'];
				dbg('[translate_embedded_key_values] xref_js='+xref_js);
				// regex to find embedded field names in the JS code
				var embeded_field_matcher = /\$\{(.*?)\}/g;
				var embeded_field_matches;
				// there could be multiple embedded field names in JS, so loop through them all
				var decoded_xref_js = xref_js;
				while (embeded_field_matches = embeded_field_matcher.exec(xref_js)) {
					// this is the full matched string (including enclosing characters ${})
					var matched_str = embeded_field_matches[0];
					dbg('matched_str='+matched_str);
					// this is just the matched embedded field name (inside the enclosing ${} characters)
					var embedded_field_name = embeded_field_matches[1];
					dbg('embedded_field_name='+embedded_field_name);
					// this is the value to replace that embedded field name with
					var embedded_field_value = field_values[embedded_field_name];
					if (typeof embedded_field_value === 'undefined' 
						|| embedded_field_value === null ) {
						embedded_field_value = '';
					} else {
						/* We need to prepare this field value for use within a JavaScript snippet
						 * To allow this, we need to escape any single quotes in the field value.
						 * Additionally, since this field value could span multiple lines, 
						 * we need to escape all newline characters to abide by JavaScript's
						 * rules for supporting string across multiple lines.
						 */ 						
						embedded_field_value = 
							embedded_field_value
								// escape all single quotes
								.replace(/'/g, "\\'")
								// replace all newline/carriage return combinations to just a newline.
								.replace(/(\n\r|\r\n)/g, "\n")
								// then escape all newline characters to allow for use in a JavaScript snippet
								.replace(/\n/g, "\\\\n")
								;
					}
					dbg('embedded_field_value='+embedded_field_value);
					// regex pattern that will allow us to replace the embedded field name with the field value
					var embedded_matcher_pattern = '\\$\\{'+embedded_field_name+'\\}';
					dbg('embedded_matcher_pattern='+embedded_matcher_pattern);
					// regex matcher to replace the embedded field name with the field value
					var embedded_matcher = new RegExp(embedded_matcher_pattern, 'g');
					// use the regex matcher to replace the embedded field name with the field's value
					decoded_xref_js = 
						decoded_xref_js.replace(
							embedded_matcher, 
							"'" + embedded_field_value + "'" );
					dbg('decoded_xref_js='+decoded_xref_js);
				}
				/* after we've gone through all the embedded fields, we finally have the final 
				 * cross-referenced value to apply to the field
				 */ 
				dbg('[translate_embedded_key_values] END decoded_xref_js='+decoded_xref_js);
				xref_value = eval(decoded_xref_js);
				dbg('[translate_embedded_key_values] xref_value='+xref_value);
				// now put back the newline characters that were escaped in order to use the string in a JavaScript snippet
				xref_value = xref_value.replace(/\\n/g, "\n");
				// set the field's value to the final cross-referenced field value
				field_values[xref_name] = xref_value;
			//does the xrefs item have a value associated with it?
			} else if (xref.hasOwnProperty('value')) {
				// if a static value was defined in the config for this field, then use that value
				var xref_value = xref['value'];
				// set the static config-defined value to the field
				field_values[xref_name] = xref_value;
			}
		}
		dbg('[translate_embedded_key_values] field_values=', field_values);
	}

	/*
	 * Populate tickets fields in the DOM with their new field values found in the 
	 * given associative array (an object) of final key/value pairs. 
	 *  
	 *  @param  field_values               associative array (an object) of final key/value pairs to populate fields in the DOM with
	 */
	function populate_field_values(field_values) {
		// loop through the given associative array (an object) of final field values to be assigned to the DOM
		for (field_name in field_values) {
			// ensure key is not unexpected results of inheritance:
			if (field_values.hasOwnProperty(field_name)) {
				// the value to be assigned to the field's DOM object
				let field_value = field_values[field_name].trim();
				dbg('[populate_field_values] field_value='+field_value );
				// the field ID of the DOM object that is to be assigned the value
				var fieldId = get_field_id(field_name);
				dbg('[populate_field_values] fieldId='+fieldId );
				// the field's DOM object
				var field = $('#'+fieldId);
				// if the field's DOM objects was found, then populate it with the field's new value
				if (field.length > 0) {
					dbg('[populate_field_values] '+fieldId+'=', field );
					dbg('[populate_field_values] '+fieldId+'.val() PRE: '+field.val());
					field.val(field_value);
					dbg('[populate_field_values] '+fieldId+'.val() POST: '+field.val());
				}
			}
		}
	}
	
	/*
	 * Return the text pasted into a DOM field based on a DOM event
	 *  
	 *  @param  e DOM event that we will use to get the pasted text from
	 *  @return   the pasted text from the given DOM event
	 */
	function get_pasted_text(e) {
		//FROM: https://stackoverflow.com/questions/11605415/jquery-bind-to-paste-event-how-to-get-the-content-of-the-paste
	    // access the clipboard using the api
	    var pasted_text; // = e.originalEvent.clipboardData.getData('text');
	    //FROM: https://stackoverflow.com/questions/2176861/javascript-get-clipboard-data-on-paste-event-cross-browser
		if (!pasted_text) {
			if ((e.originalEvent || e).clipboardData) {
				pasted_text = (e.originalEvent || e).clipboardData
						.getData('text/plain');
				//document.execCommand('insertText', false, content);
			} else if (window.clipboardData) {
				pasted_text = window.clipboardData.getData('Text');
				//document.selection.createRange().pasteHTML(content);
			}	
		}
		return pasted_text;
	}
	
	/*
	 * Main procedure that uses a DOM event to 
	 *   1) get the text that was pasted into a DOM field
	 *   2) parse the pasted text into key/value pairs
	 *   3) map the key/value pairs to field names defined in a config from a global var named paste_parser_config
	 *   4) translate the values of each key/value pair using as defined in the config
	 *   5) populate the resulting values to the proper field object in the DOM
	 *  
	 *  @param  e DOM event that we will use to get the pasted text
	 */
	function parse_field_value(e) {
		// text that was pasted into a DOM object
		var pasted_text = get_pasted_text(e);
        dbg('pasted_text='+pasted_text);

		//pattern to match against the pasted text to determine if we should do anything with it 
        var pasted_text_pattern = paste_parser_config['pasted_text_pattern'];
		dbg('paste_parser_config=', paste_parser_config);
	
		dbg('pasted_text_pattern='+pasted_text_pattern);
		        
		// regex matcher object to match against the pasted text to find the text of interest
		var pasted_text_matcher = new RegExp(pasted_text_pattern, 'm');
		// the resulting match from the regex 
		var pasted_text_matches = pasted_text_matcher.exec(pasted_text);
		
		// if the pattern to be matched was found in the pasted text
		// then we attempt to parse the text based on the xrefs
		// defined in the config
		if (pasted_text_matches) {
			// the part of the pasted text that will be parsed for key/value pairs
			var text_to_parse = pasted_text_matches[1];
			dbg('text_to_parse[len='+text_to_parse.length+']='+text_to_parse);
			// delimiter that separates each key/value pair on each line
			var key_value_delimiter = paste_parser_config['key_value_delimiter'];
			// optional pattern that determines strings to be ignored/skipped during processing
			var ignore_pattern = paste_parser_config['ignore_pattern'];

			// optional pattern that defines the end of each key/value pair
			var key_value_end_pattern = paste_parser_config['key_value_end_pattern'];
						
			// cross-reference that defines relationship between the pasted key/value pairs and fields in the DOM
			var xrefs = paste_parser_config['xrefs'];							        	

			// the associative array (an object) of key/value pairs parsed from the given string of lines
			var key_values = parse_key_values(text_to_parse, key_value_delimiter, ignore_pattern, key_value_end_pattern);
        	
        	//the associative array (an object) of mapped key/value pairs
			var mapped_key_values = map_key_values(key_values, xrefs);

        	//translate the values of each key/value pair using static values or JavaScript as defined in the xrefs
			translate_embedded_key_values(mapped_key_values, xrefs);
        	dbg('[translate_embedded_key_values]: mapped_key_values=', mapped_key_values);

	        //populate the fields in the DOM with the new values generated using the cross-reference
        	populate_field_values(mapped_key_values);
    		e.preventDefault();
	        } else {
				dbg('FYI: pasted text did not match the pasted_text_pattern.');
	        }
	}

	/*
	 * Return the field ID of a given field name 
	 *  
	 *  @param  field_name      the name of the field that will be used to get the field's ID
	 *  @return                 given field's ID
	 *  
	 *  @see    paste_parser_config  (global defined at top) 
	 */
	function get_field_id(field_name) {
		// the DOM ID of the given field that will be returned
		var field_id;
		// regexp matching pattern used to convert the field_name to the field ID of the field's DOM object 		
		var field_name_to_id_match = paste_parser_config['field_name_to_id_match'];
		// regexp replace pattern used to convert the field_name to the field ID of the field's DOM object
		var field_name_to_id_replace = paste_parser_config['field_name_to_id_replace'];
		// make sure the field name is not empty
		if (field_name && field_name.length) {
			// make sure match pattern is not empty 
			if (field_name_to_id_match && field_name_to_id_match.length) {
				// make sure replace pattern is not empty 
				if (field_name_to_id_replace && field_name_to_id_replace.length) {
					// use the given match/replace patterns to compute the field's ID
					field_id = field_name.replace(new RegExp(field_name_to_id_match), field_name_to_id_replace);
				} else
					console.log('ERROR: field_name_to_id_replace is either undefined or zero length.');
			} else
				console.log('ERROR: field_name_to_id_match is either undefined or zero length.');
		} else
			console.log('WARNING: field_name is either undefined or zero length.');
		return field_id;
	}

	
	/*
	 * Bind to the paste event on the given field 
	 *  
	 *  @param  field_name     name of the ticket field to bind to and listen for paste events
	 */
	function bind_to_field_paste_event(field_name) {
		// get the ID of the given field name
		var field_id = get_field_id(field_name)
		// check that the computed field ID is not empty
		if (field_id && field_id.length) {
			var fieldObj = $('#'+field_id);
			if (fieldObj) {
				/* bind our paste-processing handler "parse_field_value" to the 
				 * paste event of the field that is to be parsed
				 */
				fieldObj.bind('paste', parse_field_value );
			}
		}
	}
	
	// bind our paste-processing handler to the paste event of the field that is to be parsed
	bind_to_field_paste_event(field_to_parse);

});
