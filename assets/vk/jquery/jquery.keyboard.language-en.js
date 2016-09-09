// Keyboard Language
// please update this section to match this language and email me with corrections!
// ru = ISO 639-1 code for Russian
// ***********************
jQuery.keyboard.language.en = {
	language: 'English (US)',
	display: {
		// check mark - same action as accept
		'a': '\u2714:Accept (Shift+Enter)',
		'accept': 'Accept:Accept (Shift+Enter)',
		// other alternatives \u2311
		'alt': 'Alt:\u2325 AltGr',
		// Left arrow (same as &larr;)
		'b': '\u232b:Backspace',
		'bksp': 'Bksp:Backspace',
		// big X, close - same action as cancel
		'c': '\u2716:Cancel (Esc)',
		'cancel': 'Cancel:Cancel (Esc)',
		// clear num pad
		'clear': 'C:Clear',
		'combo': '\u00f6:Toggle Combo Keys',
		// decimal point for num pad (optional), change '.' to ',' for European format
		'dec': '.:Decimal',
		// down, then left arrow - enter symbol
		'e': '\u23ce:Enter',
		'empty': '\u00a0',
		'enter': 'Enter:Enter \u23ce',
		// left arrow (move caret)
		'left': '\u2190',
		// caps lock
		'lock': 'Lock:\u21ea Caps Lock',
		'next': 'Next \u21e8',
		'prev': '\u21e6 Prev',
		// right arrow (move caret)
		'right': '\u2192',
		// thick hollow up arrow
		's': '\u21e7:Shift',
		'shift': 'Shift:Shift',
		// +/- sign for num pad
		'sign': '\u00b1:Change Sign',
		'space': '\u00a0:Space',
		// right arrow to bar (used since this virtual keyboard works with one directional tabs)
		't': '\u21e5:Tab',
		// \u21b9 is the true tab symbol (left & right arrows)
		'tab': '\u21e5 Tab:Tab',
		// replaced by an image
		'toggle': ' ',

		// added to titles of keys
		// accept key status when acceptValid:true
		'valid': 'valid',
		'invalid': 'invalid',
		// combo key states
		'active': 'active',
		'disabled': 'disabled'
	},
};
