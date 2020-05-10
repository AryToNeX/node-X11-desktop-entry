/*
 * X11-desktop-entry https://github.com/opatry/node-X11-desktop-entry
 * 
 * Copyright (c) 2013 opatry Licensed under the MIT license.
 */

'use strict';

/*
 * 3rd Party Modules imports
 */
var fs = require("fs");

/**
 * <p>
 * Loads a Desktop Entry and give its JSON representation to
 * <code>onSuccess</code> callback (or calling <code>onError</code> callback
 * on invalid entry).<br>
 * Each header resides at the JSON representation root.
 * </p>
 * <p>
 * Example:
 * </p>
 * 
 * <pre>
 * desktop_entry.load({
 * 	entry:'xxx.entry',
 * 	onSuccess:function(model) {
 * 		// everything goes fine
 * 	},
 * 	onError:function(errorMessage) {
 * 		// something goes wrong
 * 	}
 * });
 * </pre>
 * 
 * @param config Configuration of the loading.
 * 	<ul>
 * 		<li><code>'config.entry'</code> the Desktop Entry file to be loaded.
 * 		<li><code>'config.onSuccess'</code> the function to call once loading is done (giving the JSON
 *						representation of the Desktop Entry if valid).
 * 		<li><code>'config.onError'</code> the function to call once loading ends with an error.
 * 		<li><code>'config.onError'</code> the function to call once loading ends with an error.
 * 	</ul>
 */
exports.load = function(entry) {
	// TODO JSDoc the Key[foo] to JSON mapping

	// TODO ensures entry is a valid file
	// TODO allow direct stream to be used as entry

	var model = {}; // the JSON representation of this desktop entry
	var currentHeaderContents = null;
	
	var hasError = false;

	// walk over each not filtered lines
	const lines = fs.readFileSync(entry).split("\n");
	for(let line of lines){
		// ignore comments and empty lines
		if(line.startsWith('#') || line.trim().length === 0){
			return;
		}
		
		if (line.startsWith('[') && line.endsWith(']')) {
			// we've got a new header here
			var header = line.substring(line.indexOf('['), line.indexOf(']'));
			
			// if the header is [Desktop Entry], it must be the first header
			if ('Desktop Entry'.localeCompare(currentHeader) && currentHeaderContents !== null && !model['Desktop Entry']) { // FIXME const
				throw new Error('Invalid Desktop Entry: the Desktop Entry must be the first header.'); // FIXME const + NLS
			}
			var currentHeader = header.trim();
			// each new header ends the previous one
			currentHeaderContents = [];
			model[currentHeader] = currentHeaderContents;
		} else {
			// regular line: key = value
			if (currentHeaderContents === null) {
				// reading an entry without a header first denotes an invalid Desktop Entry
				throw new Error('Invalid Desktop Entry: no top level header.'); // FIXME NLS
			}


			var tokens = line.split('=');
			if (tokens.length < 2) {
				// we expect key = value lines here
				throw new Error('Invalid Desktop Entry: ' + line + ' not a valid Entry format.'); // FIXME NLS
			}

			// /!\ ignore space around '=' sign
			var key = tokens.shift().trim();

			// FIXME handle key[locale] patterns
			if (!key.match(/[a-zA-Z0-9\-]+/g)) { // FIXME put in cache as a RegExp object
				throw new Error('Invalid Desktop Entry: invalid key: ' + key + ' (must match [a-zA-Z0-9\-])'); // FIXME NLS
			}

			var value = tokens.join('=').trim();
			currentHeaderContents[key] = value;
		}
	}
	
	if (model['Desktop Entry'] === undefined) { // FIXME const
		throw new Error('Invalid Desktop Entry: no Desktop Entry header.'); // FIXME const + NLS
	}
	return model;
};
