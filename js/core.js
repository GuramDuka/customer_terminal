//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageState {

	get paging_state_template() {

		return {
			pgno_		: 0,
			pages_ 		: 0,
			page_size_	: 0,
			page_html_	: '',
			order_		: 'name',
			direction_	: 'asc'
		};

	}

	constructor() {

		// paging
		this.paging_state_by_category_ = {
			null : Object.assign({}, this.paging_state_template)
		};

		this.category_		= null;

		// render
		this.start_ 		= 0;
		this.wait_images_	= false;
		this.request_		= null;

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class Render {

	get state() {
    	return this.state_;
	}

	set state(s) {
    	this.state_ = s;
	}

	constructor() {
		this.state_ = null;
	}

	static debug(level, s = null) {

		let element = xpath_eval_single('//div[@debug]');
		let p = xpath_eval_single('p[@debug' + level + ']', element);

		p.innerHTML = s;
		p.style.display = s !== null ? 'block' : 'none';

	}

	debug_ellapsed(level, start, http_ellapsed, prefix = '') {

		let finish = microtime();
		let ellapsed = finish - start;

		Render.debug(level, prefix + ellapsed_time_string(ellapsed) + ', ' + http_ellapsed);

	}

	assemble_page(paging_state, element, data, invisible) {

		let products = data.products;
		let style = {
			'visibility'	: invisible ? 'hidden' : 'visible'
		};

		let item_width = 97.7 / paging_state.page_size_;

		if( paging_state.item_width_ !== item_width ) {
			style.width = sprintf('%.5f', item_width) + '%';
			paging_state.item_width_ = item_width;
		}

		if( element.innerHTML.isEmpty() ) {

			let html = '';

			for( let i = 0; i < paging_state.page_size_; i++ )
				html +=
					'<div pitem="' + i + '">'
					+ '<img pimg src="" alt="">'
					+ '<p pname></p>'
					+ '<p pprice></p>'
					+ '<p pquantity></p>'
					+ '<a btn buy>КУПИТЬ</a>'
					+ '</div>';
				;

			element.innerHTML = html;

		}

		let get_quantity = function (product) {
			return sprintf(Math.trunc(product.quantity) == product.quantity ? '%u' : '%.3f', product.quantity);
		};

		let get_reserve = function (product) {
			return product.reserve ? '&nbsp;('
					+ sprintf(Math.trunc(product.reserve) == product.reserve ? '%u' : '%.3f', product.reserve)
					+ ')'
				: '';
		};

		for( let a of xpath_eval('div[@pitem]', element) ) {

			let i = parseInt(a.attributes.pitem.value, 10);
			let uuid = '', name = '', img_url = '', price = '', quantity = '';

			if( i < products.length ) {

				let product = products[i];

				uuid		= product.uuid;
				name		= product.name;
				img_url 	= product.img_url;
				price		= Math.trunc(product.price) + '&nbsp;₽';
				quantity	= get_quantity(product) + get_reserve(product);

				style.visibility = 'visible';

			}
			else {
				style.visibility = 'hidden';
			}

			a.setAttribute('uuid', uuid);

			xpath_eval_single('img[@pimg]'		, a).src		= img_url;
			xpath_eval_single('p[@pname]'		, a).innerHTML	= name;
			xpath_eval_single('p[@pprice]'		, a).innerHTML	= price;
			xpath_eval_single('p[@pquantity]'	, a).innerHTML	= quantity;

			style.float = i + 1 < paging_state.page_size_ ? 'left' : 'right';

			for( let key in	style )
				if( a.style[key] !== style[key] )
					a.style[key] = style[key];

		}

		return element.innerHTML;

	}

	static hide_cursor() {

		// hide cursor
		if( touch ) {

			xpath_eval_single('//body').style.cursor = 'none';

			for( let a of xpath_eval('//a[@btn or @btc]') )
				a.style.cursor = 'none';

		}

	}

	pager_data_ready(start, element, data) {

		let render = this;
		let state = render.state_;
		let paging_state = state.paging_state_by_category_[state.category_];

		paging_state.page_size_	= data.page_size;
		paging_state.pages_		= data.pages;

		// if pages changed suddenly
		if( paging_state.pgno_ >= paging_state.pages_ ) {
			paging_state.pgno_ = paging_state.pages_ > 0 ? paging_state.pages_ - 1 : 0;
			render.rewrite_page();
			return;
		}

		paging_state.page_html_	= this.assemble_page(paging_state, element, data, state.wait_images_);
		Render.debug(2, 'NPAG: ' + paging_state.pgno_);

		// make element visible on all images loaded
		if( state.wait_images_ ) {

			let imgs = xpath_eval('div[@pitem]/img', element);
			let cnt = imgs.length;

			for( let img of imgs ) {

				add_event(img, 'load', function () {

					if( --cnt > 0 )
						return;

					for( let e of xpath_eval('div[@pitem]', element) )
						e.style.visibility = 'visible';

					render.debug_ellapsed(1, start, data.ellapsed, 'PAGE: ');
				
				});

			}

		}
		else {

			this.debug_ellapsed(1, start, data.ellapsed, 'PAGE: ');

		}

	}

	rewrite_page() {

		let start = microtime();
		let state = this.state_;
		let paging_state = state.paging_state_by_category_[state.category_];
		let element = xpath_eval_single('//div[@plist]');
		let request = {
			'module'	: 'pager',
			'handler'	: 'pager',
			'category'	: state.category_,
			'order'		: paging_state.order_,
			'direction' : paging_state.direction_,
			'pgno'		: paging_state.pgno_
		};

		Render.debug(0);
		Render.debug(2);
		post_json('proxy.php', request, (data) => this.pager_data_ready(start, element, data));

	}

	categories_data_ready(start, element, data) {

		let render = this;
		let state = render.state_;
		let categories = data.categories;
		let html = '';

		for( let i = 0; i < categories.length; i++ ) {

			let c = categories[i];
			let paging_state = state.paging_state_by_category_[c.uuid];

			if( !paging_state ) {

				paging_state = Object.assign({}, state.paging_state_template);
				state.paging_state_by_category_[c.uuid] = paging_state;

			}

			html +=
				'<a btc uuid="' + c.uuid + '"'
					+ (c.uuid === state.category_ ? ' blink' : '')
				+ '>' + c.name + '</a>'
			;

		}

		element.innerHTML = html;

		// set events for new a[@btc] elements
		state.setup_events(xpath_eval('a[@btc]', element));

		render.rewrite_page();
		render.debug_ellapsed(0, start, data.ellapsed, 'CATG: ');

	}

	rewrite_category() {

		let start = microtime();
		let state = this.state_;
		let element = xpath_eval_single('//div[@categories]');
		let request = {
			'module'	: 'categorer',
			'handler'	: 'categorer',
			'parent'	: state.category_
		};

		Render.debug(1);
		post_json('proxy.php', request, (data) => this.categories_data_ready(start, element, data));

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageEvents extends HtmlPageState {

	constructor() {

		super();

		this.render_ = null;
		this.events_ = [
			/*'click',
			'mousedown',
			'mouseenter',
			'mouseleave',
			'mousemove',
			'mouseout',
			'mouseover',
			'mouseup',*/
			'touchstart',
			'touchend',
			'touchcancel',
			'touchmove',
			'touchenter',
			'touchleave'
		];

	}

	events_handler(e) {

		let state = this;
		let render = this.render_;
		let element = e.target;
		let attrs = element.attributes;
		let paging_state = state.paging_state_by_category_[state.category_];
		let touchobj, startx, dist;

		switch( e.type ) {

			case 'click'		:
			case 'touchend'		:

				if( attrs.prev_page ) {

					if( paging_state.pgno_ > 0 ) {
						paging_state.pgno_--;
						render.rewrite_page();
					}

				}
				else if( attrs.next_page ) {

					if( paging_state.pgno_ + 1 < paging_state.pages_ ) {
						paging_state.pgno_++;
						render.rewrite_page();
					}

				}
				else if( attrs.first_page ) {

					if( paging_state.pgno_ != 0 ) {
						paging_state.pgno_ = 0;
						render.rewrite_page();
					}

				}
				else if( attrs.last_page ) {

					let newpgno = paging_state.pages_ > 0 ? paging_state.pages_ - 1 : 0;

					if( newpgno != paging_state.pgno_ ) {
						paging_state.pgno_ = newpgno;
						render.rewrite_page();
					}

				}
				else if( attrs.btc ) {

					// categories buttons

					// switch off blinking current category
					if( state.category_ !== null )
						xpath_eval_single('//div[@categories]/a[@btc and @uuid=\'' + state.category_ + '\']').removeAttribute('blink');

					if( state.category_ !== attrs.uuid.value ) {
						state.category_ = attrs.uuid.value;
						element.setAttribute('blink', '');
					}
					else {
						state.category_ = null;
					}

					render.rewrite_page();

				}

				break;

			case 'touchstart'	:
				touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
				startx = parseInt(touchobj.clientX) // get x position of touch point relative to left edge of browser
				break;

			case 'touchmove'	:
				touchobj = e.changedTouches[0] // reference first touch point (ie: first finger)
				dist = parseInt(touchobj.clientX) - startx;
				break;

			case 'touchcancel'	:
				break;

			case 'touchenter'	:
				break;

			case 'touchleave'	:
				break;

		}

		e.preventDefault();

	}

	setup_events(elements) {

		// xpath-to-select-multiple-tags
		// //body/*[self::div or self::p or self::a]

		for( let event of this.events_ )
			for( let element of elements )
				add_event(element, event , e => this.events_handler(e));

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageManager extends HtmlPageEvents {

	constructor() {

		super();

		Render.hide_cursor();

		this.setup_events(xpath_eval('//div[@plist_controls]/a[@prev_page or @next_page or @first_page or @last_page]'));

		this.render_ = new Render;
		this.render_.state = this;
		this.render_.rewrite_category();

	}

}
//------------------------------------------------------------------------------
let manager = new HtmlPageManager;
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
/*let idle = new Idle();
//------------------------------------------------------------------------------
let idle_away_callback = function() {

	console.log(new Date().toTimeString() + ": away");

};
//------------------------------------------------------------------------------
let idle_away_back_callback = function() {

	console.log(new Date().toTimeString() + ": back");

};
//------------------------------------------------------------------------------
idle.onAway = idle_away_callback;
idle.onAwayBack = idle_away_back_callback;
idle.setAwayTimeout(15000);
idle.start();*/
//------------------------------------------------------------------------------
