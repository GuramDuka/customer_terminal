//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageState {

	get paging_state_template() {

		return {
			category_	: null,
			product_	: null,
			pgno_		: 0,
			pages_ 		: 0,
			page_size_	: 0,
			order_		: 1,
			direction_	: 0
		};

	}

	constructor() {

		// paging

		this.directions_ = [ 'asc', 'desc' ];

		this.orders_ = [
			{
				name		: 'code',
				display		: 'Код',
				ico			: {
					asc		: '/resources/assets/sorting/sort_number_column.ico',
					desc	: '/resources/assets/sorting/sort_number_column.ico'
				},
				order_icons : {
					asc		: '/resources/assets/sorting/sort_number.ico',
					desc	: '/resources/assets/sorting/sort_number_descending.ico'
				}
			},
			{
				name		: 'name',
				display		: 'Наименование',
				ico			: {
					asc		: '/resources/assets/sorting/sort_alphabel_column.ico',
					desc	: '/resources/assets/sorting/sort_alphabel_column.ico'
				},
				order_icons : {
					asc		: '/resources/assets/sorting/sort_asc_az.ico',
					desc	: '/resources/assets/sorting/sort_desc_az.ico'
				}
			},
			{
				name		: 'price',
				display		: 'Цена',
				ico			: {
					asc		: '/resources/assets/sorting/sort_price.ico',
					desc	: '/resources/assets/sorting/sort_price_descending.ico'
				},
				order_icons : {
					asc		: '/resources/assets/sorting/sort_ascending.ico',
					desc	: '/resources/assets/sorting/sort_descending.ico'
				}
			},
			{
				name		: 'quantity',
				display		: 'Количество',
				ico			: {
					asc		: '/resources/assets/sorting/sort_quantity.ico',
					desc	: '/resources/assets/sorting/sort_quantity_descending.ico'
				},
				order_icons : {
					asc		: '/resources/assets/sorting/sort_ascending.ico',
					desc	: '/resources/assets/sorting/sort_descending.ico'
				}
			}
		];

		this.category_		= null;

		this.paging_state_by_category_ = {
			null : Object.assign({}, this.paging_state_template)
		};

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
		p.style.display = s !== null ? 'inline-block' : 'none';

	}

	debug_ellapsed(level, start, http_ellapsed, prefix = '') {

		let finish = microtime();
		let ellapsed = finish - start;

		Render.debug(level, prefix + ellapsed_time_string(ellapsed) + ', ' + http_ellapsed);

	}

	assemble_page(new_paging_state, data) {

		let render = this;
		let state = render.state_;
		let paging_state = new_paging_state;
		let invisible = false;

		paging_state.page_size_	= data.page_size;
		paging_state.pages_		= data.pages;

		// if pages changed suddenly
		if( paging_state.pgno_ >= paging_state.pages_ ) {
			paging_state.pgno_ = paging_state.pages_ > 0 ? paging_state.pages_ - 1 : 0;
			render.rewrite_page();
			return;
		}

		let element = xpath_eval_single('//div[@plist]');

		if( element.innerHTML.isEmpty() ) {

			// create products page list and install events
			let html = '';

			for( let i = 0; i < paging_state.page_size_; i++ )
				html +=
					'<div pitem="' + i + '">'
					+ '<img pimg src="" alt="">'
					+ '<p pname></p>'
					+ '<p pprice></p>'
					+ '<p pquantity></p>'
					+ '<div btn buy>КУПИТЬ</div>'
					+ '</div>';
				;

			element.innerHTML = html;

			this.state_.setup_events(xpath_eval('div[@pitem]/img[@pimg]', element));

		}

		let products = data.products;
		let style = {
			'visibility'	: invisible ? 'hidden' : 'visible'
		};

		let item_width = 99.0 / paging_state.page_size_;

		if( paging_state.item_width_ !== item_width ) {
			style.width = sprintf('%.5f', item_width) + '%';
			paging_state.item_width_ = item_width;
		}

		let get_quantity = function (product) {
			let f = Math.trunc(product.remainder) == product.remainder ? '%d' : '%.3f';
			return sprintf(f, product.remainder);
		};

		let get_reserve = function (product) {
			let f = Math.trunc(product.reserve) == product.reserve ? '%d' : '%.3f';
			return product.reserve ? '&nbsp;(' + sprintf(f, product.reserve) + ')' : '';
		};

		for( let a of xpath_eval('div[@pitem]', element) ) {

			let i = parseInt(a.attributes.pitem.value, 10);
			let uuid = '', name = '', img_url = '', price = '', quantity = '';

			if( i < products.length ) {

				let product = products[i];

				uuid		= product.uuid;
				name		= product.name + '[' + product.code + ']';
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

		Render.debug(2, 'NPAG: ' + paging_state.pgno_);

		let base = xpath_eval_single('//div[@plist_controls]');

		xpath_eval_single('div[@first_page]', base).style.display =
			paging_state.pgno_ < 2 || paging_state.pages_ < 2  ? 'none' : 'inline-block';
		xpath_eval_single('div[@prev_page]', base).style.display =
			paging_state.pgno_ === 0 || paging_state.pages_ < 2 ? 'none' : 'inline-block';
		xpath_eval_single('div[@prev_page]/span[@btn_txt]', base).innerText = (paging_state.pgno_ + 1) - 1;
		xpath_eval_single('div[@next_page]', base).style.display =
			paging_state.pgno_ > paging_state.pages_ - 2 || paging_state.pages_ < 2 ? 'none' : 'inline-block';
		xpath_eval_single('div[@next_page]/span[@btn_txt]', base).innerText = (paging_state.pgno_ + 1) + 1;
		xpath_eval_single('div[@last_page]', base).style.display =
			paging_state.pgno_ > paging_state.pages_ - 3 || paging_state.pages_ < 3 ? 'none' : 'inline-block';
		if( paging_state.pages_ > 0 )
			xpath_eval_single('//div[@plist_controls]/div[@last_page]/span[@btn_txt]').innerText = paging_state.pages_;

		base = xpath_eval_single('//div[@psort_controls]');

		let order = state.orders_[paging_state.order_];
		let direction = state.directions_[paging_state.direction_];

		xpath_eval_single('div[@list_sort_order]/span[@btn_txt]', base).innerText = order.display;
		xpath_eval_single('div[@list_sort_order]/img[@btn_ico]', base).src = order.ico[direction];
		xpath_eval_single('div[@list_sort_direction]/img[@btn_ico]', base).src = order.order_icons[direction];

		this.debug_ellapsed(1, paging_state.start_, data.ellapsed, 'PAGE: ');

	}

	static hide_cursor() {

		// hide cursor
		let cr = touch ? 'none' : 'pointer';

		if( touch )
			xpath_eval_single('//body').style.cursor = cr;

		for( let a of xpath_eval('//div[@btn or @btc]') )
			a.style.cursor = cr;

		for( let a of xpath_eval('//div[@pitem]/img[@pimg]') )
			a.style.cursor = cr;

	}

	assemble_info(paging_state, data) {
	}

	rewrite_page(new_paging_state) {

		let state = this.state_;

		Render.debug(0);
		Render.debug(2);

		new_paging_state.start_ = microtime();

		let plist = xpath_eval_single('//div[@plist]');
		let pinfo = xpath_eval_single('//div[@pinfo]');
		let request = {};

		if( new_paging_state.product_ === null ) {

			request.module		= 'pager';
			request.handler		= 'pager';
			request.category	= new_paging_state.category_;
			request.order		= state.orders_[new_paging_state.order_].name;
			request.direction	= state.directions_[new_paging_state.direction_];
			request.pgno		= new_paging_state.pgno_;

			this.assemble_page(new_paging_state, post_json_sync('proxy.php', request));

			plist.style.display = 'inline-block';
			pinfo.style.display = 'none';

		}
		else {

			request.module		= 'producter';
			request.handler		= 'producter';
			request.product_	= new_paging_state.product_;

			this.assemble_info(new_paging_state, post_json_sync('proxy.php', request));

			plist.style.display = 'none';
			pinfo.style.display = 'inline-block';

		}

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
				paging_state.category_ = c.uuid;
				state.paging_state_by_category_[c.uuid] = paging_state;

			}

			html +=
				'<div btc uuid="' + c.uuid + '"'
					+ (c.uuid === state.category_ ? ' blink' : '')
				+ '>' + c.name + '</div>'
			;

		}

		element.innerHTML = html;

		// set events for new a[@btc] elements
		state.setup_events(xpath_eval('div[@btc]', element));

		render.rewrite_page(state.paging_state_by_category_[state.category_]);
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

		let data = post_json_sync('proxy.php', request);
		
		this.categories_data_ready(start, element, data);

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

		let touchobj, startx, dist;

		let state = this;
		let render = this.render_;
		let element = e.currentTarget;
		let attrs = element.attributes;
		let new_paging_state = Object.assign({}, state.paging_state_by_category_[state.category_]);

		switch( e.type ) {

			case 'click'		:
			case 'touchend'		:

				if( attrs.prev_page ) {

					if( new_paging_state.pgno_ > 0 ) {
						new_paging_state.pgno_--;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.next_page ) {

					if( new_paging_state.pgno_ + 1 < new_paging_state.pages_ ) {
						new_paging_state.pgno_++;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.first_page ) {

					if( new_paging_state.pgno_ != 0 ) {
						new_paging_state.pgno_ = 0;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.last_page ) {

					let newpgno = new_paging_state.pages_ > 0 ? new_paging_state.pages_ - 1 : 0;

					if( newpgno != new_paging_state.pgno_ ) {
						new_paging_state.pgno_ = newpgno;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.btc ) {

					// categories buttons
					let new_category = state.category_ !== attrs.uuid.value ? attrs.uuid.value : null;
					new_paging_state = Object.assign({}, state.paging_state_by_category_[new_category]);

					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[new_category] = new_paging_state;

					// switch on blinking new category
					if( new_category !== state.category_ )
						element.setAttribute('blink', '');

					// switch off blinking current category
					if( state.category_ !== null )
						xpath_eval_single('//div[@categories]/div[@btc and @uuid=\'' + state.category_ + '\']').removeAttribute('blink');

					state.category_ = new_category;

				}
				else if( attrs.list_sort_order ) {

					if( ++new_paging_state.order_ >= state.orders_.length )
						new_paging_state.order_ = 0;

					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[state.category_] = new_paging_state;

				}
				else if( attrs.list_sort_direction ) {

					if( ++new_paging_state.direction_ >= state.directions_.length )
						new_paging_state.direction_ = 0;

					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[state.category_] = new_paging_state;

				}
				else if( attrs.pimg
					&& element.parentNode.attributes.pitem
					&& element.parentNode.parentNode.attributes.plist ) {

					// switch view to product info
					new_paging_state.product_ = element.parentNode.attributes.uuid;

					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[state.category_] = new_paging_state;

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

		for( let element of elements )
			console.log('setup events: ', element);
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

		this.setup_events(xpath_eval('//div[@plist_controls]/div[@prev_page or @next_page or @first_page or @last_page]'));
		this.setup_events(xpath_eval('//div[@psort_controls]/div[@list_sort_order or @list_sort_direction]'));

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
