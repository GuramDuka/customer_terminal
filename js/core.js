//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageState {

	get paging_state_template() {

		return {
			category_				: null,
			product_				: null,
			products_				: {},
			cart_edit_				: false,
			pgno_					: 0,
			pages_ 					: 0,
			page_size_				: 0,
			order_					: 1,
			direction_				: 0
		};

	}

	constructor() {

		// paging

		this.directions_	= [ 'asc', 'desc' ];

		this.orders_		= [
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
				name		: 'remainder',
				display		: 'Остаток',
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

		this.cart_			= [];
		this.cart_by_uuid_	= {};

		// render
		this.start_ 		= 0;

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

		this.get_remainder = function (product) {
			let f = Math.trunc(product.remainder) == product.remainder ? '%d' : '%.3f';
			return sprintf(f, product.remainder);
		};

		this.get_reserve = function (product) {
			let f = Math.trunc(product.reserve) == product.reserve ? '%d' : '%.3f';
			return product.reserve ? '&nbsp;(' + sprintf(f, product.reserve) + ')' : '';
		};

	}

	static debug(level, s = null) {

		let element = xpath_eval_single('html/body/div[@debug]');
		let p = xpath_eval_single('p[@debug' + level + ']', element);

		p.innerHTML = s;
		p.style.display = s !== null ? 'inline-block' : 'none';

	}

	debug_ellapsed(level, start, http_ellapsed, prefix = '') {

		let finish = microtime();
		let ellapsed = finish - start;

		Render.debug(level, prefix + ellapsed_time_string(ellapsed) + ', ' + http_ellapsed);

	}

	static hide_cursor() {

		// hide cursor
		/*let cr = touch ? 'none' : 'pointer';

		if( touch )
			xpath_eval_single('html/body').style.cursor = cr;

		for( let a of xpath_eval('//div[@btn or @btc]') )
			a.style.cursor = cr;

		for( let a of xpath_eval('//div[@pitem]/div[@pimg]') )
			a.style.cursor = cr;
		*/
	}

	assemble_page(new_paging_state, data) {

		let render = this;
		let state = render.state_;
		let paging_state = new_paging_state;

		paging_state.page_size_	= data.page_size;
		paging_state.pages_		= data.pages;

		// if pages changed suddenly
		if( paging_state.pgno_ >= paging_state.pages_ ) {
			paging_state.pgno_ = paging_state.pages_ > 0 ? paging_state.pages_ - 1 : 0;
			render.rewrite_page();
			return;
		}

		let element = xpath_eval_single('html/body/div[@plist]');

		if( element.innerHTML.isEmpty() ) {

			// create products page list and install events
			let html = '';

			for( let i = 0; i < paging_state.page_size_; i++ )
				html +=
					'<div pitem="' + i + '" fadein>'
					+ '<div pimg></div>'
					+ '<p pname></p>'
					+ '<p pprice></p>'
					+ '<p pquantity></p>'
					+ '<div btn buy>'
					+ '<img btn_ico src="/resources/assets/cart/cart_put.ico">'
					//+ '<span btn_txt>КУПИТЬ</span>'
					+ '</div>'
					+ '</div>';
				;

			element.innerHTML = html;

			this.state_.setup_events(xpath_eval('div[@pitem]', element), false);
			this.state_.setup_events(xpath_eval('div[@pitem]/div[@pimg]', element));

		}

		let products = data.products;
		let style = {};

		let item_width = 99.0 / paging_state.page_size_;

		if( paging_state.item_width_ !== item_width ) {
			style.width = sprintf('%.5f', item_width) + '%';
			paging_state.item_width_ = item_width;
		}

		let items = xpath_eval('div[@pitem]', element);

		//let head = document.getElementsByTagName('head')[0];
		//
		//for( let a of items ) {
		//	let i = parseInt(a.attributes.pitem.value, 10);
		//	let lnk = document.createElement('link');
		//	lnk.setAttribute('rel', 'prefetch');
		//	lnk.setAttribute('href', products[i].img_url);
		//	head.appendChild(lnk);
		//}

		for( let a of items ) {

			let i = parseInt(a.attributes.pitem.value, 10);
			let uuid = '', name = '', img_url = '', price = '', quantity = '';

			if( i < products.length ) {

				let product = products[i];

				uuid		= product.uuid;
				name		= product.name + '[' + product.code + ']';
				img_url 	= product.img_url;
				price		= Math.trunc(product.price) + '&nbsp;₽';
				quantity	= this.get_remainder(product) + this.get_reserve(product);

				a.setAttribute('uuid'		, uuid);
				a.setAttribute('remainder'	, product.remainder);
				a.setAttribute('reserve'	, product.reserve);

			}
			else {

				a.removeAttribute('uuid');
				a.removeAttribute('remainder');
				a.removeAttribute('reserve');
			}


			xpath_eval_single('div[@pimg]'		, a).style.backgroundImage = 'url(' + img_url + ')';
			xpath_eval_single('p[@pname]'		, a).innerHTML	= name;
			xpath_eval_single('p[@pprice]'		, a).innerHTML	= price;
			xpath_eval_single('p[@pquantity]'	, a).innerHTML	= quantity;

			style.float = i + 1 < paging_state.page_size_ ? 'left' : 'right';

			for( let key in	style )
				if( a.style[key] !== style[key] )
					a.style[key] = style[key];

		}

		let base = xpath_eval_single('html/body/div[@pcontrols]/div[@plist_controls]');

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
			xpath_eval_single('html/body/div[@pcontrols]/div[@plist_controls]/div[@last_page]/span[@btn_txt]').innerText = paging_state.pages_;

		base = xpath_eval_single('html/body/div[@pcontrols]/div[@psort_controls]');

		let order = state.orders_[paging_state.order_];
		let direction = state.directions_[paging_state.direction_];

		xpath_eval_single('div[@list_sort_order]/span[@btn_txt]', base).innerText = '';//order.display;
		xpath_eval_single('div[@list_sort_order]/img[@btn_ico]', base).src = order.ico[direction];
		xpath_eval_single('div[@list_sort_direction]/img[@btn_ico]', base).src = order.order_icons[direction];

	}

	static display_product_buy_quantity(quantity) {

		xpath_eval_single('html/body/div[@pinfo]/div[@pright]/p[@pbuy_quantity]').innerHTML = quantity;

	}

	assemble_info(paging_state, data) {

		let render = this;
		let state = render.state_;
		let product = data.product;
		let pq = paging_state.products_[product.uuid];

		if( pq ) {

			pq.remainder = product.remainder;

		}
		else {

			pq = {
				'remainder'		: product.remainder,
				'buy_quantity'	: 1
			};

			paging_state.products_[product.uuid] = pq;

		}

		if( pq.buy_quantity > pq.remainder )
			pq.buy_quantity = pq.remainder;

		let pinfo_element = xpath_eval_single('html/body/div[@pinfo]');

		pinfo_element.setAttribute('uuid', product.uuid);

		xpath_eval_single('div[@pimg]', pinfo_element).style.backgroundImage = 'url(' + product.img_url + ')';
		xpath_eval_single('div[@pmid]/p[@pname]', pinfo_element).innerHTML = product.name + '[' + product.code + ']';

		let coefficients = [ 0, 0 ];
		let html = '';

		for( let p of data.properties ) {

			coefficients[0] = Math.max(coefficients[0], p.property_name.length);
			coefficients[1] = Math.max(coefficients[1], p.value.toString().length);

			html = html
				+ '<p pproperty property_uuid="' + p.property_uuid + '" property_idx="' + p.property_idx + '" value_uuid="' + p.value_uuid + '" value_type="' + p.value_type + '">'
				+ '<span pproperty_name>' + p.property_name + '</span>'
				+ '<span pproperty_value>&nbsp;' + p.value + '</span>'
				+ '</p>'
			;

		}

		xpath_eval_single('div[@pmid]/div[@pproperties]', pinfo_element).innerHTML = html;

		// 13 rows -> 350px on my display debug
		// x rows  <- y px  on target display
		let y = sscanf(window.getComputedStyle(pinfo_element).height, '%u')[0];
		let x = y * 13 / 350;
		let e = xpath_eval_single('div[@pmid]/div[@pproperties]', pinfo_element);
		e.style.MozColumnCount = Math.trunc(data.properties.length / x) + 1;

		let proportions = distribute_proportionally(100, coefficients);
		proportions[0] = sprintf('%.2f%%', proportions[0]);
		proportions[1] = sprintf('%.2f%%', proportions[1]);

		for( let e of xpath_eval('div[@pmid]/div[@pproperties]/p[@pproperty]/span[@pproperty_name]', pinfo_element) )
			e.style.width = proportions[0];
		for( let e of xpath_eval('div[@pmid]/div[@pproperties]/p[@pproperty]/span[@pproperty_value]', pinfo_element) )
			e.style.width = proportions[1];

		xpath_eval_single('div[@pright]/p[@pprice]'		, pinfo_element).innerHTML	= 'Цена&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;' + Math.trunc(product.price) + '&nbsp;₽';
		xpath_eval_single('div[@pright]/p[@pquantity]'	, pinfo_element).innerHTML	= 'Остаток&nbsp;:&nbsp;' + this.get_remainder(product) + this.get_reserve(product);

		let in_cart = state.cart_by_uuid_[product.uuid];
		xpath_eval_single('div[@pright]/p[@pincart]'	, pinfo_element).innerHTML	= in_cart ? 'Заказано:&nbsp;' + in_cart.buy_quantity : '';

		Render.display_product_buy_quantity(pq.buy_quantity);

		html = '';

		for( let p of data.remainders ) {

			html = html
				+ '<p premainder>'
				+ '<span pshop_name shop_uuid="' + p.shop_uuid + '">' + p.shop_name + '</span>'
				+ '<span pshop_quantity shop_uuid="' + p.shop_uuid + '">' + this.get_remainder(p) + this.get_reserve(p) + '</span>'
				+ '</p>'
			;

		}

		xpath_eval_single('div[@pright]/div[@premainders]', pinfo_element).innerHTML = html;

	}

	assemble_cart(paging_state, data) {

		let state = this.state_;

	}

	assemble_cart_informer(paging_state, data = null) {

		let state = this.state_;
		let cart = data ? data.cart : state.cart_;
		let pcrin = xpath_eval_single('html/body/div[@top]/div[@cart_informer]');

		if( cart.length > 0 ) {
	
			let ccount = 0;
			let csum = 0;

			for( let e of cart ) {
				ccount	+= e.buy_quantity;
				csum	+= e.buy_quantity * e.price;
			}

			let cinfo = xpath_eval_single('div[@cinfo]', pcrin);

			xpath_eval_single('span[@ccount]'	, cinfo).innerText = 'В корзине: ' + ccount + ' товар' + (ccount == 1 ? '' : ccount <= 4 ? 'а' : 'ов');
			xpath_eval_single('span[@csum]'		, cinfo).innerHTML = 'На сумму : ' + csum + '&nbsp;₽';

			pcrin.style.display = 'inline-block';

		}
		else {

			pcrin.style.display = 'none';

		}

	}

	rewrite_page(new_paging_state) {

		let state = this.state_;

		Render.debug(1);
		Render.debug(2);

		let start = microtime();
		let ellapsed = 0;
		let plist = xpath_eval_single('html/body/div[@plist]');
		let pinfo = xpath_eval_single('html/body/div[@pinfo]');
		let backb = xpath_eval_single('html/body/div[@btn and @back]');
		let pctrl = xpath_eval_single('html/body/div[@pcontrols]');
		let pcart = xpath_eval_single('html/body/div[@pcart]');
		let pcrin = xpath_eval_single('html/body/div[@top]/div[@cart_informer]');
		let request = {};

		if( new_paging_state.cart_edit_ ) {

			pcart.style.display = 'inline-block';

			//this.assemble_cart(new_paging_state, post_json_sync('proxy.php', request));

		}
		else if( new_paging_state.product_ === null ) {

			request.module		= 'pager';
			request.handler		= 'pager';
			request.category	= new_paging_state.category_;
			request.order		= state.orders_[new_paging_state.order_].name;
			request.direction	= state.directions_[new_paging_state.direction_];
			request.pgno		= new_paging_state.pgno_;

			let data = post_json_sync('proxy.php', request);
			ellapsed = data.ellapsed;

			this.assemble_page(new_paging_state, data);
			this.assemble_cart_informer(new_paging_state);

			pctrl.style.display = 'inline-block';
			plist.style.display = 'inline-block';
			pinfo.style.display = 'none';
			backb.style.display = 'none';
			pcart.style.display = 'none';

		}
		else {

			request.module		= 'producter';
			request.handler		= 'producter';
			request.product		= new_paging_state.product_;

			let data = post_json_sync('proxy.php', request);
			ellapsed = data.ellapsed;

			this.assemble_info(new_paging_state, data);
			this.assemble_cart_informer(new_paging_state);

			pcart.style.display = 'none';
			pctrl.style.display = 'none';
			plist.style.display = 'none';
			pinfo.style.display = 'inline-block';
			backb.style.display = 'inline-block';

		}

		// restore fadein annimation effect if needed
		for( let e of xpath_eval('//*[@fadein_rest]') ) {
			e.removeAttribute('fadein_rest');
			e.setAttribute('fadein', '');
		}

		this.debug_ellapsed(1, start, ellapsed, 'PAGE: ');

	}

	rewrite_cart_informer(new_paging_state) {

		Render.debug(2);

		let start = microtime();
		let render = this;
		let state = render.state_;

		let pq = new_paging_state.products_[new_paging_state.product_];

		let request = {
			'module'		: 'cart',
			'handler'		: 'cart'
		};

		if( new_paging_state.product_ && pq ) {

			let cart_entity = state.cart_by_uuid_[new_paging_state.product_];

			request.buy_product		= new_paging_state.product_;
			request.buy_quantity	= pq.buy_quantity + (cart_entity ? cart_entity.buy_quantity : 0);

			if( request.buy_quantity > pq.remainder )
				request.buy_quantity = pq.remainder;

		}

		let data = post_json_sync('proxy.php', request);

		data.cart_by_uuid = {};

		for( let e of data.cart )
			data.cart_by_uuid[e.uuid] = e;

		this.assemble_cart_informer(new_paging_state, data);

		state.cart_ = data.cart;
		state.cart_by_uuid_ = data.cart_by_uuid;

		this.debug_ellapsed(2, start, data.ellapsed, 'PCIN: ');

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

		let paging_state = state.paging_state_by_category_[state.category_];

		render.rewrite_page(paging_state);
		render.rewrite_cart_informer(paging_state);

		render.debug_ellapsed(0, start, data.ellapsed, 'CATG: ');

	}

	rewrite_category() {

		Render.debug(0);

		let start = microtime();
		let state = this.state_;
		let element = xpath_eval_single('html/body/div[@categories]');
		let request = {
			'module'	: 'categorer',
			'handler'	: 'categorer',
			'parent'	: state.category_
		};


		this.categories_data_ready(start, element, post_json_sync('proxy.php', request));

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
			'animationend',
			//'mousedown',
			//'mouseenter',
			//'mouseleave',
			//'mousemove',
			//'mouseout',
			//'mouseover',
			'mouseup',
			'touchstart',
			'touchend',
			'touchcancel',
			//'touchmove',
			//'touchenter',
			//'touchleave'
		];

	}

	events_handler(e) {

		let touchobj, startx, dist;

		let state = this;
		let render = this.render_;
		let element = e.currentTarget;
		let attrs = element.attributes;
		let new_paging_state;

		switch( e.type ) {

			case 'animationend'	:

				if( attrs.fadein && attrs.fadein.value.isEmpty() ) {
					element.removeAttribute('fadein');
					element.setAttribute('fadein_rest', '');
				}
				break;

			case 'mouseup'		:

				if( e.button !== 0 )
					break;

			case 'touchend'		:

				new_paging_state = Object.assign({}, state.paging_state_by_category_[state.category_]);

				if( attrs.btn && attrs.prev_page ) {

					if( new_paging_state.pgno_ > 0 ) {
						new_paging_state.pgno_--;
						new_paging_state.product_ = null;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.btn && attrs.next_page ) {

					if( new_paging_state.pgno_ + 1 < new_paging_state.pages_ ) {
						new_paging_state.pgno_++;
						new_paging_state.product_ = null;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.btn && attrs.first_page ) {

					if( new_paging_state.pgno_ != 0 ) {
						new_paging_state.pgno_ = 0;
						new_paging_state.product_ = null;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.btn && attrs.last_page ) {

					let newpgno = new_paging_state.pages_ > 0 ? new_paging_state.pages_ - 1 : 0;

					if( newpgno != new_paging_state.pgno_ ) {
						new_paging_state.pgno_ = newpgno;
						new_paging_state.product_ = null;
						render.rewrite_page(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;
					}

				}
				else if( attrs.btc ) {

					// categories buttons
					let new_category = state.category_ !== attrs.uuid.value ? attrs.uuid.value : null;
					new_paging_state = Object.assign({}, state.paging_state_by_category_[new_category]);

					new_paging_state.product_ = null;
					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[new_category] = new_paging_state;

					// switch on blinking new category
					if( new_category !== state.category_ )
						element.setAttribute('blink', '');

					// switch off blinking current category
					if( state.category_ !== null )
						xpath_eval_single('html/body/div[@categories]/div[@btc and @uuid=\'' + state.category_ + '\']').removeAttribute('blink');

					state.category_ = new_category;

				}
				else if( attrs.btn && attrs.list_sort_order ) {

					if( ++new_paging_state.order_ >= state.orders_.length )
						new_paging_state.order_ = 0;

					new_paging_state.product_ = null;
					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[state.category_] = new_paging_state;

				}
				else if( attrs.btn && attrs.list_sort_direction ) {

					if( ++new_paging_state.direction_ >= state.directions_.length )
						new_paging_state.direction_ = 0;

					new_paging_state.product_ = null;
					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[state.category_] = new_paging_state;

				}
				else if( attrs.pimg
					&& element.parentNode.attributes.pitem
					&& element.parentNode.parentNode.attributes.plist ) {

					// switch view to product info
					new_paging_state.product_ = element.parentNode.attributes.uuid.value;
					new_paging_state.product_buy_quantity_ = 1;

					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[state.category_] = new_paging_state;

				}
				else if( attrs.btn && attrs.back ) {

					new_paging_state.product_ = null;

					render.rewrite_page(new_paging_state);
					// success rewrite page, save new state
					state.paging_state_by_category_[state.category_] = new_paging_state;

				}
				else if( element.parentNode.attributes.pright
					&& element.parentNode.parentNode.attributes.pinfo ) {

					let pq = new_paging_state.products_[new_paging_state.product_];

					if( attrs.buy ) {

						render.rewrite_cart_informer(new_paging_state);
						// success rewrite page, save new state
						state.paging_state_by_category_[state.category_] = new_paging_state;

					}
					else if( attrs.plus_one ) {
						
						if( pq.buy_quantity < pq.remainder ) {

							pq.buy_quantity++;

							Render.display_product_buy_quantity(pq.buy_quantity);
							state.paging_state_by_category_[state.category_] = new_paging_state;

						}

					}
					else if( attrs.minus_one ) {

						if( pq.buy_quantity > 1 ) {

							pq.buy_quantity--;

							Render.display_product_buy_quantity(pq.buy_quantity);
							state.paging_state_by_category_[state.category_] = new_paging_state;

						}

					}

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

	setup_events(elements, phase = true) {

		/*for( let element of elements )
			console.log('setup events: ', element);
		 */
			// xpath-to-select-multiple-tags
			// //body/*[self::div or self::p or self::a]

		for( let event of this.events_ )
			for( let element of elements )
				add_event(element, event , e => this.events_handler(e), phase);

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageManager extends HtmlPageEvents {

	constructor() {

		super();

		Render.hide_cursor();

		this.setup_events(xpath_eval('html/body/div[@back]'));
		this.setup_events(xpath_eval('html/body/div[@pcontrols]/div[@plist_controls]/div[@prev_page or @next_page or @first_page or @last_page]'));
		this.setup_events(xpath_eval('html/body/div[@pcontrols]/div[@psort_controls]/div[@list_sort_order or @list_sort_direction]'));
		this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pright]/div[@buy or @plus_one or @minus_one]'));

		this.render_ = new Render;
		this.render_.state = this;
		this.render_.rewrite_category();

	}

}
//------------------------------------------------------------------------------
let manager = null;
let msg_source = null;
//------------------------------------------------------------------------------
function core() {
/*
	// https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
	// http://www.html5rocks.com/en/tutorials/eventsource/basics/
	// http://stackoverflow.com/questions/9070995/html5-server-sent-events-prototyping-ambiguous-error-and-repeated-polling
	// http://stackoverflow.com/questions/14202191/broadcasting-messages-with-server-sent-events
	// SSE Server-Side Events
	msg_source = new EventSource('message.php');

	msg_source.onmessage = function (e) {
  		//let new_element = document.createElement('li');
		//new_element.innerHTML = 'message: ' + e.data;
		//eventList.appendChild(new_element);
		Render.debug(7, 'message: ' + e.data);

switch (mgs_source.readyState) {
  case EventSource.CONNECTING:
    // do something
    break;
  case EventSource.OPEN:
    // do something
    break;
  case EventSource.CLOSED:
    // do something
    break;
  default:
    // this never happens
    break;
}

	};

	msg_source.addEventListener('ping', function (e) {
		//let newElement = document.createElement("li");
  		let obj = JSON.parse(e.data);
  		//newElement.innerHTML = "ping at " + obj.time;
		//eventList.appendChild(newElement);
		Render.debug(8, 'ping at ' + obj.time);
	}, false);

	msg_source.onerror = function (e) {
		console.log('EventSource failed.', e);
	};
*/
	manager = new HtmlPageManager;

}
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
