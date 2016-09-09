$(window).on('load', function() {

	// International Text Area
	// ********************
	$('#keyboard').keyboard({
		language	: 'ru',
		layout		: 'russian-qwerty',
		position	: {
			of	: null,
			my	: 'right bottom',
			at	: 'right bottom',
			at2	: 'right bottom'
		},
		//keyBinding	: 'mouseup touchend',
		appendTo	: '#kb_wrap',
		reposition	: true,
		usePreview	: true,
		//alwaysOpen	: true,
		stayOpen	: true,
		userClosed	: false,
		//initialized: function(e, keyboard, el) {},
		//beforeVisible: function(e, keyboard, el) {},
		//visible: function(e, keyboard, el) {},
		//beforeInsert: function(e, keyboard, el, textToAdd) { return textToAdd; },
		//change: function(e, keyboard, el) {},
		//beforeClose: function(e, keyboard, el, accepted) {},
		//accepted: function(e, keyboard, el) {},
		//canceled: function(e, keyboard, el) {},
		//restricted: function(e, keyboard, el) {},
		//hidden: function(e, keyboard, el) {},
	}).addExtender({
		// choose any layout
		layout		: 'numpad',
		// start with extender showing?
		showing		: true,
		// reposition keyboard after toggling extender layout
		reposition	: true
	}).previewKeyset({
		// this adds the "data-normal", "data-shift", etc
		// attributes to each key, which can then be used
		// by the css content: attr()
		sets : [ 'normal', 'shift', 'alt', 'alt-shift' ]
	});
	//$.keyboard.keyaction.extender = null;

	let kb = $('#keyboard').getkeyboard();
	kb.reveal(true);

	// Console showing callback messages
	// ********************
	$('.ui-keyboard-input').bind('visible hidden beforeClose accepted canceled restricted', function(e, keyboard, el, status) {

		//let t = '';
		//	switch (e.type){
		//		case 'visible'  : t += ' keyboard is <span class="event">visible</span>'; break;
		//		case 'hidden'   : t += ' keyboard is now <span class="event">hidden</span>'; break;
		//		case 'accepted' : t += ' content "<span class="content">' + el.value + '</span>" was <span class="event">accepted</span>' + ($(el).is('[type=password]') ? ', yeah... not so secure :(' : ''); break;
		//		case 'canceled' : t += ' content was <span class="event ignored">ignored</span>'; break;
		//		case 'restricted'  : t += ' The "' + String.fromCharCode(e.keyCode) + '" key is <span class="event ignored">restricted</span>!'; break;
		//		case 'beforeClose' : t += ' keyboard is about to <span class="event">close</span>, contents were <span class="event ' + (status ? 'accepted">accepted' : 'ignored">ignored') + '</span>'; break;
		//	}

		if( typeof document.vki_callback === 'function' )
			document.vki_callback(e, keyboard, el, status);

	});

	let dummy = () => {

	$('#switcher').jui_theme_switch({
		stylesheet_link_id : 'ui-theme',
		datasource_url     : 'theme_switcher.json',
		listClass          : 'form-control'
	});

	let layouts = [
		// 'title , file name , layout name'
		"English (qwerty), english, english-qwerty",
		"Russian (qwerty), russian, russian-qwerty",
	];

	// Change display language, if the definitions are available
	let showKb = function (layout) {

		kb.options.layout = layout;
		// redraw keyboard with new layout
		kb.redraw();

	};

	let t, o = '';

	$.each(layouts.sort(), function (i, l) {

		t = l.split(/\s*,\s*/);
		o += '<option data-filename="' + t[1] + '" value="' + t[2] + '">' + t[0] + '</option>';

	});

	// allow theme selector to set up, otherwise it pushes the page down after the
	// keyboard has opened and covers up the <h2> layout title
	$('#lang').html(o).change(function () {

		let kb = $('#keyboard');
		let $this = $(this);
		let $opt = $this.find('option:selected');
		let layout = $this.val();
		
		$('h2').text($opt.text());
        showKb(layout);

	}).trigger('change');

	};

});
