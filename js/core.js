//------------------------------------------------------------------------------
let null_uuid = '00000000-0000-0000-0000-000000000000';
let manager = null;
let msg_source = null;
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageState {

	get paging_state_template() {

		return {
			pgno_					: 0,
			pages_ 					: 0,
			page_size_				: 0,
			order_					: 1,
			direction_				: 0,
			selections_				: false,
			selections_state_		: [],
			selections_checked_		: false,
			select_by_car_			: false,
			select_by_car_state_	: {},
			select_by_car_checked_	: false
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
					asc		: 'assets/sorting/sort_number_column.ico',
					desc	: 'assets/sorting/sort_number_column.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_number.ico',
					desc	: 'assets/sorting/sort_number_descending.ico'
				}
			},
			{
				name		: 'name',
				display		: 'Наименование',
				ico			: {
					asc		: 'assets/sorting/sort_alphabel_column.ico',
					desc	: 'assets/sorting/sort_alphabel_column.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_asc_az.ico',
					desc	: 'assets/sorting/sort_desc_az.ico'
				}
			},
			{
				name		: 'price',
				display		: 'Цена',
				ico			: {
					asc		: 'assets/sorting/sort_price.ico',
					desc	: 'assets/sorting/sort_price_descending.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_ascending.ico',
					desc	: 'assets/sorting/sort_descending.ico'
				}
			}/*,
			{
				name		: 'remainder',
				display		: 'Остаток',
				ico			: {
					asc		: 'assets/sorting/sort_quantity.ico',
					desc	: 'assets/sorting/sort_quantity_descending.ico'
				},
				order_icons : {
					asc		: 'assets/sorting/sort_ascending.ico',
					desc	: 'assets/sorting/sort_descending.ico'
				}
			}*/
		];

		this.page_state_	= {
			category_					: null_uuid,
			paging_state_by_category_	: { [null_uuid] : this.paging_state_template },
			product_					: null_uuid,
			cart_edit_					: false,
			cart_pgno_					: 0,
			cart_						: [],
			cart_by_uuid_				: {},
			cart_page_size_				: 0,
			cart_pages_					: 0,
			alert_						: false,
			large_img_view_				: false,
			search_panel_				: false,
			vk_							: false,
			fts_filter_					: ''
		};

		// render
		this.start_ 		= mili_time();
		this.ellapsed_		= 0;

	}

	post_json(path, data) {
		let response, request = JSON.stringify(data, null, '\t');
		let object = this;
		let current_event = object.current_event_;

		if( !current_event.deferred_xhrs_ )
			current_event.deferred_xhrs_ = {};

		if( !this.md5_ )
			this.md5_ = new Hashes.MD5;

		let hash = this.md5_.hex(path + "\n\n" + request);
		let xhr = current_event.deferred_xhrs_[hash];

		if( xhr ) {
			if( xhr.status !== 200 ) {
				let status = xhr.status;
				let statusText = xhr.statusText;
				let responseText = xhr.responseText;
				throw new Error(status.toString() + ' ' + statusText + "\n" + responseText);
			}

			response = JSON.parse(xhr.responseText, JSON.dateParser);
		}
		else {
			let xhr = new XMLHttpRequest;
			xhr.timeout = 180000;
			xhr.open('PUT', path, true);
			xhr.setRequestHeader('Content-Type'		, 'application/json; charset=utf-8');
			xhr.setRequestHeader('If-Modified-Since'	, 'Sat, 1 Jan 2000 00:00:00 GMT');
			xhr.setRequestHeader('Cache-Control'		, 'no-store, no-cache, must-revalidate, max-age=0');

			xhr.onreadystatechange = () => {
				if( xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 0 )
					object.events_handler(current_event);
			};

			current_event.deferred_xhrs_[hash] = xhr;

			xhr.send(request);

			throw new XhrDeferredException;
		}

		return response;
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

			if( product.remainder == 0 )
				return '-';

			let n = Math.trunc(product.remainder) != product.remainder;
			let f = n ? '%.3f' : '%d';
			let s = sprintf(f, product.remainder);

			while( n && s.endsWith('0') )
				s = s.substr(0, s.length - 1);

			return s;

		};

		this.get_reserve = function (product) {

			let n = Math.trunc(product.reserve) != product.reserve;
			let f = n ? '%.3f' : '%d';
			let s = sprintf(f, product.reserve);

			while( n && s.endsWith('0') )
				s = s.substr(0, s.length - 1);

			return product.reserve != 0 ? '&nbsp;(' + s + ')' : '';

		};

	}

	static debug(level, s = null) {

		let p = xpath_single('html/body/div[@debug]/div[@debug=\'' + level + '\']');

		if( p ) {
			p.innerHTML = s;
			p.style.display = s !== null ? 'inline-block' : 'none';
		}

	}

	debug_ellapsed(level, prefix = '') {

		let state = this.state_;
		let finish = mili_time();
		let ellapsed = (finish - state.start_) + state.ellapsed_;

		Render.debug(level, prefix + '<font>' + ellapsed_time_string(ellapsed) + '</font>');

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

	assemble_page(new_page_state, data) {

		let state = this.state_;
		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let element = xpath_eval_single('html/body/div[@plist]/div[@ptable]');

		if( element.innerHTML.isEmpty() ) {

			// create products page list and install events
			let html = '';

			for( let i = 0; i < new_paging_state.page_size_; i++ )
				html +=
					'<div pitem="' + i + '">'
					+ '<div pimg></div>'
					+ '<p pname></p>'
					+ '<p pprice></p>'
					+ '<p pquantity></p>'
					+ '<div btn buy>'
					+ '<img btn_ico src="assets/cart/cart_put.ico">'
					//+ '<span btn_txt>КУПИТЬ</span>'
					+ '</div>'
					+ '</div>';
				;

			element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

			state.setup_events(xpath_eval('div[@pitem]/div[@pimg]', element));
			state.setup_events(xpath_eval('div[@pitem]/div[@btn]', element));

		}

		let products = data.products;
		let style = {};

		let item_width = 99.0 / new_paging_state.page_size_;

		if( new_paging_state.item_width_ !== item_width ) {
			style.width = sprintf('%.5f', item_width) + '%';
			new_paging_state.item_width_ = item_width;
		}

		let items = xpath_eval('div[@pitem]', element);

		for( let a of items ) {

			let i = parseInt(a.attributes.pitem.value, 10);
			let uuid = '', name = '', img_uuid = '', img_url = '', price = '', quantity = '';

			if( i < products.length ) {

				let product = products[i];

				uuid		= product.uuid;
				name		= product.name + ' [' + product.code + ']';
				img_uuid 	= product.img;
				img_url 	= product.img_url;
				price		= product.price + '&nbsp;<i rouble>&psi;</i>';//₽';
				quantity	= this.get_remainder(product) + this.get_reserve(product);

				style.visibility = 'visible';

				a.setAttribute('uuid'		, uuid);
				a.setAttribute('price'		, product.price);
				a.setAttribute('remainder'	, product.remainder);
				a.setAttribute('reserve'	, product.reserve);

			}
			else {

				style.visibility = 'hidden';

				a.removeAttribute('uuid');
				a.removeAttribute('remainder');
				a.removeAttribute('reserve');
			}

			let img = xpath_eval_single('div[@pimg]', a);
			img.setAttribute('uuid', img_uuid);
			img.style.backgroundImage = 'url(' + img_url + ')';

			xpath_eval_single('p[@pname]'		, a).innerHTML	= name;
			xpath_eval_single('p[@pprice]'		, a).innerHTML	= price;
			xpath_eval_single('p[@pquantity]'	, a).innerHTML	= quantity;

			style.float = i + 1 < new_paging_state.page_size_ ? 'left' : 'right';

			for( let key in	style )
				if( a.style[key] !== style[key] )
					a.style[key] = style[key];

		}

		let pctrl = xpath_eval_single('html/body/div[@pcontrols]');
		let base = xpath_eval_single('div[@plist_controls]', pctrl);

		xpath_eval_single('div[@first_page]', base).fade(new_paging_state.pgno_ >= 2 && new_paging_state.pages_ >= 2);
		xpath_eval_single('div[@prev_page]', base).fade(new_paging_state.pgno_ !== 0 && new_paging_state.pages_ >= 2);
		xpath_eval_single('div[@prev_page]/span[@btn_txt]', base).innerText = (new_paging_state.pgno_ + 1) - 1;
		xpath_eval_single('div[@next_page]', base).fade(new_paging_state.pgno_ <= new_paging_state.pages_ - 2 && new_paging_state.pages_ >= 2);
		xpath_eval_single('div[@next_page]/span[@btn_txt]', base).innerText = (new_paging_state.pgno_ + 1) + 1;
		xpath_eval_single('div[@last_page]', base).fade(new_paging_state.pgno_ <= new_paging_state.pages_ - 3 && new_paging_state.pages_ >= 3);
		xpath_eval_single('div[@last_page]/span[@btn_txt]', base).innerText = new_paging_state.pages_ > 0 ? new_paging_state.pages_ : '';

		base = xpath_eval_single('div[@psort_controls]', pctrl);

		let order = state.orders_[new_paging_state.order_];
		let direction = state.directions_[new_paging_state.direction_];

		xpath_eval_single('div[@list_sort_order]/span[@btn_txt]', base).innerText = '';//order.display;
		xpath_eval_single('div[@list_sort_order]/img[@btn_ico]', base).src = order.ico[direction];
		xpath_eval_single('div[@list_sort_direction]/img[@btn_ico]', base).src = order.order_icons[direction];

	}

	assemble_info(new_page_state, data) {

		let state = this.state_;
		let product = data.product;
		let pinfo_element = xpath_eval_single('html/body/div[@pinfo]');
		let pbuy_quantity = xpath_eval_single('div[@pright]/p[@pbuy_quantity]', pinfo_element);
		let cart_entity = new_page_state.cart_by_uuid_[product.uuid];

		pbuy_quantity.innerText = cart_entity ? cart_entity.buy_quantity : '-';

		pinfo_element.setAttribute('uuid'		, product.uuid);
		pinfo_element.setAttribute('price'		, product.price);
		pinfo_element.setAttribute('remainder'	, product.remainder);
		pinfo_element.setAttribute('reserve'	, product.reserve);

		xpath_eval_single('div[@pimg]', pinfo_element).style.backgroundImage = 'url(' + product.img_url + ')';
		xpath_eval_single('div[@pmid]/p[@pname]', pinfo_element).innerHTML = product.name + ' [' + product.code + ']';

		let coefficients = [ 1, 1 ];
		let html = '';

		for( let p of data.properties ) {

			coefficients[0] = Math.max(coefficients[0], p.property_name.length);
			coefficients[1] = Math.max(coefficients[1], p.value.toString().length);

			html = html + `
				<div pproperty property_uuid="${p.property_uuid}" property_idx="${p.property_idx}" value_uuid="${p.value_uuid}" value_type="${p.value_type}">
				<span pproperty_name>${p.property_name}</span>
				<span pproperty_value>&nbsp;${p.value}</span>
				</div>`
			;

		}

        let pproperties_element = xpath_eval_single('div[@pmid]/div[@pproperties]', pinfo_element);
		pproperties_element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		// 13 rows -> 350px on my display debug
		// x rows  <- y px  on target display
		let y = sscanf(getComputedStyle(pinfo_element).height, '%u')[0];
		let x = y * 10 / 350;
		let e = xpath_eval_single('div[@pmid]/div[@pproperties]', pinfo_element);
		e.style.MozColumnCount = Math.trunc(data.properties.length / x) + 1;

		let proportions = distribute_proportionally(100, coefficients);
		proportions[0] = sprintf('%.2f%%', proportions[0]);
		proportions[1] = sprintf('%.2f%%', proportions[1]);

		for( let e of xpath_eval('div[@pmid]/div[@pproperties]/div[@pproperty]/span[@pproperty_name]', pinfo_element) )
			e.style.width = proportions[0];
		for( let e of xpath_eval('div[@pmid]/div[@pproperties]/div[@pproperty]/span[@pproperty_value]', pinfo_element) )
			e.style.width = proportions[1];

		xpath_eval_single('div[@pright]/p[@pprice]'		, pinfo_element).innerHTML	= 'Цена&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;' + product.price + '&nbsp;<i rouble>&psi;</i>';//₽';
		xpath_eval_single('div[@pright]/p[@pquantity]'	, pinfo_element).innerHTML	= 'Остаток&nbsp;:&nbsp;' + this.get_remainder(product) + this.get_reserve(product);
		xpath_eval_single('div[@pright]/p[@pincart]'	, pinfo_element).innerHTML	= cart_entity ? 'Заказано:&nbsp;' + cart_entity.buy_quantity : '';

		html = '';

		for( let p of data.remainders ) {

			html = html
				+ '<p premainder>'
				+ '<span pshop_name shop_uuid="' + p.shop_uuid + '">' + p.shop_name + '</span>'
				+ '<span pshop_quantity shop_uuid="' + p.shop_uuid + '">' + this.get_remainder(p) + this.get_reserve(p) + '</span>'
				+ '</p>'
			;

		}

		xpath_eval_single('div[@pright]/div[@premainders]', pinfo_element).innerHTML = html.replace(/(?:[\r\n\t])/g, '');
		xpath_eval_single('div[@pright]/p[@premainders_head]', pinfo_element).fade(data.remainders.length > 0);

		for( let e of xpath_eval('div[@pright]/hr', pinfo_element) )
			e.fade(data.remainders.length > 0);

		e = xpath_eval_single('div[@pmid]/div[@pdescription]', pinfo_element);
		//e.innerHTML = product.description ? product.description_in_html ? product.description : `<pre>${product.description}</pre>` : '';
		e.innerHTML = product.description ? product.description.replace(/(?:[\r\n\t])/g, '') : '';

		// when description rollup then rolldown
		pproperties_element.fadein();

	}

	assemble_cart_informer(new_page_state) {

		let state = this.state_;
		let cart = new_page_state.cart_;
		let pcrin = xpath_eval_single('html/body/div[@top]/div[@cart_informer]');

		if( cart.length > 0 ) {
	
			let ccount = 0;
			let csum = 0;

			for( let e of cart ) {
				ccount	+= e.buy_quantity;
				csum	+= e.buy_quantity * e.price;
			}

			let cinfo = xpath_eval_single('div[@cinfo]', pcrin);

			xpath_eval_single('p[@ccount]'	, cinfo).innerHTML = 'В корзине: ' + ccount;// + ' товар' + (ccount == 1 ? '' : ccount <= 4 ? 'а' : 'ов');
			xpath_eval_single('p[@csum]'	, cinfo).innerHTML = 'На сумму : ' + csum + '<i rouble>&psi;</i>';// + '&nbsp;₽';

		}

	}

	assemble_cart(new_page_state, data) {

		let state = this.state_;
		let pcrin = xpath_single('html/body/div[@top]/div[@cart_informer]/div[@btn and @cart]');
		let base = xpath_single('html/body/div[@pcart]');
		let element = xpath_single('div[@ptable]', base);

		if( !(pcrin && base && element) )
			return;

		let cart = new_page_state.cart_;

		if( !new_page_state.cart_page_size_ ) {
			//let height = sscanf(getComputedStyle(element).height, '%u')[0];
			//let line_height = sscanf(getComputedStyle(pcrin).height, '%u')[0];
			//new_page_state.cart_page_size_ = page_size = Math.trunc(height / line_height);
			new_page_state.cart_page_size_ = this.debug_ ? 9 : Math.trunc(9 * 720 / 390);
		}

		new_page_state.cart_pages_ = Math.trunc(cart.length / new_page_state.cart_page_size_) + (cart.length % new_page_state.cart_page_size_ !== 0 ? 1 : 0);

		// if pages changed suddenly
		if( new_page_state.cart_pgno_ >= new_page_state.cart_pages_ )
			new_page_state.cart_pgno_ = new_page_state.cart_pages_ > 0 ? new_page_state.cart_pages_ - 1 : 0;

		if( element.innerHTML.isEmpty() ) {

			let html = '';

			for( let i = 0; i < new_page_state.cart_page_size_; i++ )
				html = html
					+ '<div pitem="' + i + '">'
					+ '<span pno></span>'
					+ '<div pimg></div>'
					+ '<span pname></span>'
					+ '<span pprice></span>'
					+ '<span psum></span>'
					+ '<div btn plus_one>'
					+ '<img btn_ico src="assets/plus.ico">'
					+ '</div>'
					+ '<span pbuy_quantity></span>'
					+ '<div btn minus_one>'
					+ '<img btn_ico src="assets/minus.ico">'
					+ '</div>'
					+ '</div>'
				;

			element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

			state.setup_events(xpath_eval('div[@pitem]/div[@btn]', element));

		}

		let items = xpath_eval('div[@pitem]', element);
		let buy_quantity_one = true;

		for( let a of items ) {

			let i = parseInt(a.attributes.pitem.value, 10);
			let n = i + new_page_state.cart_pgno_ * new_page_state.cart_page_size_;

			if( n < cart.length ) {

				let e = cart[n];

				xpath_eval_single('span[@pno]'				, a).innerHTML				= n + 1;
				xpath_eval_single('div[@pimg]'				, a).style.backgroundImage	= 'url(' + e.img_url + ')';
				xpath_eval_single('span[@pname]'			, a).innerHTML				= e.name + ' [' + e.code + ']';
				xpath_eval_single('span[@pprice]'			, a).innerHTML				= e.price + '&nbsp;<i rouble>&psi;</i>';//₽';
				xpath_eval_single('span[@psum]'				, a).innerHTML				= e.price * e.buy_quantity + '&nbsp;<i rouble>&psi;</i>';//₽';
				xpath_eval_single('span[@pbuy_quantity]'	, a).innerText				= e.buy_quantity;

				if( e.buy_quantity > 1 )
					buy_quantity_one = false;

				a.setAttribute('uuid'		, e.uuid);
				a.setAttribute('remainder'	, e.remainder);
				a.setAttribute('reserve'	, e.reserve);

				a.style.visibility = 'visible';

			}
			else {

				a.style.visibility = 'hidden';

			}

		}

		let pctrl = xpath_eval_single('div[@pcontrols]', base);

		xpath_eval_single('div[@prev_page]', pctrl).fade(new_page_state.cart_pgno_ > 0);
		xpath_eval_single('div[@next_page]', pctrl).fade(new_page_state.cart_pgno_ + 1 < new_page_state.cart_pages_);

		for( let a of xpath_eval('div[@pitem]/span[@psum]', element) )
			a.fade(!buy_quantity_one);

		if( new_page_state.constants_ ) {
			xpath_eval_single('html/body/div[@top]/div[@mag]').innerHTML = `
				<p>&nbsp;</p>
				<p>${new_page_state.constants_['ТекущийМагазинПредставление']}</p>
				<p>${new_page_state.constants_['ТекущийМагазинАдрес']}</p>
			`.replace(/(?:[\r\n\t])/g, '');

			delete new_page_state.constants_;
		}
	}

	rewrite_info(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let request = {
			'module'	: 'producter',
			'handler'	: 'producter',
			'product'	: new_page_state.product_
		};

		let data = state.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;

		this.assemble_info(new_page_state, data);

	}

	rewrite_page(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let request = {
			'module'			: 'pager',
			'handler'			: 'pager',
			'category'			: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null,
			'order'				: state.orders_[new_paging_state.order_].name,
			'direction'			: state.directions_[new_paging_state.direction_],
			'pgno'				: new_paging_state.pgno_
		};

		let new_selections_state = new_paging_state.selections_state_;
		let selections = [];

		for( let p of new_selections_state ) {

			let a = [];

			for( let v of p.values ) {

				if( !v.checked )
					continue;

				a.push(extend_object(v));

			}

			if( a.length !== 0 ) {

				let q = extend_object(p);

				q.values = a;

				selections.push(q);

			}

		}

		if( selections.length !== 0 )
			request.selections = selections;

		let select_by_car_state = new_paging_state.select_by_car_state_;

		if( select_by_car_state.car )
			request.car = select_by_car_state.car;

		request.fts_filter = new_page_state.fts_filter_;

		let data = state.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;

		new_paging_state.page_size_	= data.page_size;
		new_paging_state.pages_		= data.pages;

		// if pages changed suddenly
		if( new_paging_state.pgno_ > 0 && new_paging_state.pgno_ >= new_paging_state.pages_ ) {
			new_paging_state.pgno_ = new_paging_state.pages_ > 0 ? new_paging_state.pages_ - 1 : 0;
			this.rewrite_page(new_page_state);
			return;
		}

		this.assemble_page(new_page_state, data);

	}

	rewrite_cart(new_page_state = null, product = null_uuid, buy_quantity = null, buy_price = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let request = {
			'module'		: 'carter',
			'handler'		: 'carter'
		};

		let cart_entity = new_page_state.cart_by_uuid_[product];

		if( cart_entity ) {

			cart_entity.buy_quantity = buy_quantity > cart_entity.remainder ? cart_entity.remainder : buy_quantity;

			if( cart_entity.buy_quantity < 0 )
				cart_entity.buy_quantity = 0;

			cart_entity.modified = true;

		}
		else if( product !== null_uuid && buy_quantity !== null ) {

			if( !request.products )
				request.products = [];

			let price = typeof buy_price === 'string' ? Number.parseFloat(buy_price) : buy_price;

			if( Number.isNaN(price) )
				price = 0;

			request.products.push({
				'uuid'		: product,
				'quantity'	: buy_quantity,
				'price'		: price
			});

		}

		for( let e of new_page_state.cart_ ) {

			if( !e.modified )
				continue;

			if( !request.products )
				request.products = [];

			let req = {
				'uuid'		: e.uuid,
				'quantity'	: e.buy_quantity,
				'price'		: e.price
			};

			request.products.push(req);

		}

		let data = state.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;

		new_page_state.constants_ = data.constants;
		new_page_state.cart_ = data.cart;
		new_page_state.cart_by_uuid_ = {};

		for( let e of data.cart )
			new_page_state.cart_by_uuid_[e.uuid] = e;

		this.assemble_cart_informer(new_page_state);
		this.assemble_cart(new_page_state, data);

		if( product === new_page_state.product_ ) {
	
			cart_entity = new_page_state.cart_by_uuid_[product];

			let p = xpath_single('html/body/div[@pinfo]/div[@pright]/p[@pincart]');

			if( p )
				p.innerHTML = cart_entity ? 'Заказано:&nbsp;' + cart_entity.buy_quantity : '';

		}

		// if cart empty go back
		if( new_page_state.cart_.length === 0 )
			new_page_state.cart_edit_ = false;

	}

	assemble_selections(new_page_state, data) {

		let state = this.state_;
		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let selections_state = new_paging_state.selections_state_;
		let html = '';

		for( let i = 0; i < data.setup.length; i++ ) {

			let p = data.setup[i];
			let cols = p.columns;

			html = html + `
				<div property uuid="${p.uuid}">
				<div>${p.display}</div>
				<div values ${cols === 0 ? 'one_column' : ''}
					${cols !== 0 ? ' style="-moz-column-count: ' + cols + '"' : ''}>`
			;

			let br = p.columns > 1 ? '<br>' : '';

			for( let j = 0; j < p.values.length; j++ ) {

				let v = p.values[j];
				let prop = selections_state.find(e => e.uuid === p.uuid);
				let val = prop ? prop.values.find(e => e.uuid === v.uuid) : undefined;

				v.checked = val ? val.checked : false;

				html = html + `
					<div value uuid="${v.uuid}"${v.checked ? ' checked' : ''}>
					<span ico check_box></span>
					<span txt check_box>${v.value}</span>
					</div>`
				;

			}

			html = html
				+ '</div>'
				+ '</div>'
			;

		}

		new_paging_state.selections_state_ = data.setup;

		let element = xpath_eval_single('html/body/div[@categories]/div[@selections_frame and @uuid=\'' + new_page_state.category_ + '\']');
		element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		state.setup_events(xpath_eval('div[@property]/div[@values]/div[@value]', element));

	}

	rewrite_selections(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];

		let request = {
			'module'	: 'selectorer',
			'handler'	: 'selectorer',
			'category'	: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null,
			'setup'		: true
		};

		let data = state.post_json('proxy.php', request);

		this.assemble_selections(new_page_state, data);

	}

	assemble_select_by_car(new_page_state) {

		let state = this.state_;
		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let select_by_car_state = new_paging_state.select_by_car_state_;
		let html = '';

		for( let i = 0; i < select_by_car_state.values.length; i++ ) {

			let v = select_by_car_state.values[i];

			html = html + `
				<div value uuid="${v.uuid}">
				${v.value}
				</div>`
			;

		}

		let frame = xpath_eval_single('html/body/div[@categories]/div[@select_by_car_frame and @uuid=\'' + new_page_state.category_ + '\']');
		let e = xpath_eval_single('div[@values]', frame);
		e.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		state.setup_events(xpath_eval('div[@value]', e));

		xpath_eval_single('div[@manufacturer]/span[@value]'	, frame).innerText = select_by_car_state.manufacturer	? select_by_car_state.manufacturer.value	: '';
		xpath_eval_single('div[@model]/span[@value]'		, frame).innerText = select_by_car_state.model			? select_by_car_state.model.value			: '';
		xpath_eval_single('div[@modification]/span[@value]'	, frame).innerText = select_by_car_state.modification	? select_by_car_state.modification.value	: '';
		xpath_eval_single('div[@year]/span[@value]'			, frame).innerText = select_by_car_state.year			? select_by_car_state.year.value			: '';

	}

	rewrite_select_by_car(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let select_by_car_state = new_paging_state.select_by_car_state_;

		let request = {
			'module'	: 'by_car_selectorer',
			'handler'	: 'by_car_selectorer',
			'category'	: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null
		};

		if( select_by_car_state.manufacturer )
			request.manufacturer = select_by_car_state.manufacturer.uuid;
		if( select_by_car_state.model )
			request.model = select_by_car_state.model.uuid;
		if( select_by_car_state.modification )
			request.modification = select_by_car_state.modification.uuid;
		if( select_by_car_state.year )
			request.year = select_by_car_state.year.uuid;

		let data = state.post_json('proxy.php', request);

		new_paging_state.select_by_car_state_.values = data.values;

		if( data.car )
			new_paging_state.select_by_car_state_.car = data.car;

	}

	rewrite_category(new_page_state = null) {

		let state = this.state_;

		if( new_page_state === null )
			new_page_state = state.page_state_;

		let element = xpath_eval_single('html/body/div[@categories]');
		let request = {
			'module'	: 'categorer',
			'handler'	: 'categorer',
			'parent'	: new_page_state.category_ !== null_uuid ? new_page_state.category_ : null
		};

		let data = state.post_json('proxy.php', request);
		let categories = data.categories;
		let html = '';

		for( let i = 0; i < categories.length; i++ ) {

			let c = categories[i];
			let new_paging_state = new_page_state.paging_state_by_category_[c.uuid];

			if( !new_paging_state ) {

				new_paging_state = state.paging_state_template;
				new_paging_state.category_ = c.uuid;
				new_page_state.paging_state_by_category_[c.uuid] = new_paging_state;

			}

			html = html + `
				<div btc uuid="${c.uuid}"
			 		${c.uuid === new_page_state.category_ ? ' blink' : ''}>
					${c.name}
				</div>
				<div selections_frame fadein instant uuid="${c.uuid}"></div>
				<div btn clear_selections uuid="${c.uuid}">
					<img btn_ico src="assets/filter_clear.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>`
			;

			html = html + `
				<div select_by_car_frame fadein instant uuid="${c.uuid}">
					<div selector manufacturer>
						<!--<span ico search_field></span>
						<span ico list_box></span>-->
						<span label>Производитель</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector model>
						<span label>Модель</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector modification>
						<span label>Модификация</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector year>
						<span label>Год выпуска</span>
						<img arrow src="assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector values></div>
				</div>
				<div btn clear_select_by_car uuid="${c.uuid}">
					<img btn_ico src="assets/car_clear.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>`
			;

		}

		element.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

		// set events for new a[@btc] elements
		state.setup_animation_events(xpath_eval('//*[@fadein or @fadeout]', element));
		state.setup_events(xpath_eval('div[@btc or @btn]', element));

	}

	show_new_page_state(new_page_state = null) {

		let zero = new_page_state === null;
		let state = this.state_;
		let cur_state = state.page_state_;
		let cur_paging_state = cur_state.paging_state_by_category_[cur_state.category_];

		if( new_page_state === null )
			new_page_state = cur_state;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];

		let plist = xpath_single('html/body/div[@plist]');
		let pinfo = xpath_single('html/body/div[@pinfo]');
		let backb = xpath_single('html/body/div[@btn and @back]');
		let selsb = xpath_single('html/body/div[@btn and @selections]');
		let carbb = xpath_single('html/body/div[@btn and @select_by_car]');
		let pcart = xpath_single('html/body/div[@pcart]');
		let pctrl = xpath_single('html/body/div[@pcontrols]');
		let pcrin = xpath_single('html/body/div[@top]/div[@cart_informer]');
		let catsb = xpath_eval('html/body/div[@categories]/div[@btc]');

		if( new_page_state.cart_.length > 0 && (cur_state.cart_.length === 0 || zero) )
			pcrin.fadein();

		if( new_page_state.cart_.length === 0 && cur_state.cart_.length > 0 )
			pcrin.fadeout();

		let setup_categories_selections = function () {

			let f = new_page_state.category_ !== null_uuid && new_page_state.product_ === null_uuid;

			selsb.fade(f);
			carbb.fade(f);

			let e = xpath_eval_single('html/body/div[@categories]');

			for( let cat_uuid in new_page_state.paging_state_by_category_ ) {

				if( cat_uuid === null_uuid )
					continue;

				let s = xpath_eval_single('div[@selections_frame and @uuid=\'' + cat_uuid + '\']', e);
				let c = xpath_eval_single('div[@clear_selections and @uuid=\'' + cat_uuid + '\']', e);

				if( new_page_state.paging_state_by_category_[cat_uuid].selections_ && cat_uuid === new_page_state.category_ ) {

					s.fade(true);
					c.fade(new_paging_state.selections_checked_);

				}
				else {

					s.fade(false);
					c.fade(false);

				}

			}

			selsb.blink(new_paging_state.selections_checked_);

		};

		let setup_categories_select_by_car = function () {

			let f = new_page_state.category_ !== null_uuid && new_page_state.product_ === null_uuid;

			selsb.fade(f);
			carbb.fade(f);

			let e = xpath_eval_single('html/body/div[@categories]');

			for( let cat_uuid in new_page_state.paging_state_by_category_ ) {

				if( cat_uuid === null_uuid )
					continue;

				let s = xpath_eval_single('div[@select_by_car_frame and @uuid=\'' + cat_uuid + '\']', e);
				let c = xpath_eval_single('div[@clear_select_by_car and @uuid=\'' + cat_uuid + '\']', e);

				let new_paging_state = new_page_state.paging_state_by_category_[cat_uuid];

				if( new_paging_state.select_by_car_ && cat_uuid === new_page_state.category_ ) {

					s.fade(true);

					let select_by_car_state = new_paging_state.select_by_car_state_;

					f = new_paging_state.select_by_car_checked_
						|| select_by_car_state.manufacturer
						|| select_by_car_state.model
						|| select_by_car_state.modification
						|| select_by_car_state.year;

					c.fade(f);

					for( let a of xpath_eval('div[@selector and not(@values)]', s) )
						a.fade(new_paging_state.select_by_car_checked_);
					
				}
				else {

					s.fade(false);
					c.fade(false);

				}

			}

			carbb.blink(new_paging_state.select_by_car_checked_);

		};

		let to_cart = function () {

			backb.fadein();
			pcart.fadein();
			plist.fadeout();
			pctrl.fadeout();
			pinfo.fadeout();
			selsb.fadeout();
			carbb.fadeout();

			for( let e of catsb )
				e.fadeout();

			for( let e of xpath_eval('html/body/div[@categories]/div[@selections_frame or @clear_selections or @select_by_car_frame or @clear_select_by_car]') )
				e.fadeout();

		};

		let to_list = function () {

			backb.fadeout();
			pcart.fadeout();
			plist.fadein();
			pctrl.fadein();
			pinfo.fadeout();
			selsb.fadeout();
			carbb.fadeout();

			for( let e of catsb )
				e.fadein();

			setup_categories_selections();
			setup_categories_select_by_car();

		};

		let to_info = function () {

			backb.fadein();
			pcart.fadeout();
			plist.fadeout();
			pctrl.fadeout();
			pinfo.fadein();
			selsb.fadeout();
			carbb.fadeout();

			for( let e of catsb )
				e.fadeout();

			for( let e of xpath_eval('html/body/div[@categories]/div[@selections_frame or @clear_selections or @select_by_car_frame or @clear_select_by_car]') )
				e.fadeout();

		};

		if( new_page_state.cart_edit_ !== cur_state.cart_edit_ || new_page_state.product_ !== cur_state.product_ ) {

			if( new_page_state.cart_edit_ )
				to_cart();
			else if( new_page_state.product_ === null_uuid )
				to_list();
			else
				to_info();

		}

		if( new_paging_state.pgno_ !== cur_paging_state.pgno_ ) {

			plist.fadein();

		}

		if( new_page_state.category_ !== cur_state.category_ ) {

			plist.fadein();
			setup_categories_selections();
			setup_categories_select_by_car();

		}

		if( new_paging_state.selections_ !== cur_paging_state.selections_
			|| new_paging_state.selections_checked_ !== cur_paging_state.selections_checked_ ) {

			setup_categories_selections();

		}

		let cur_select_by_car_state = cur_paging_state.select_by_car_state_;
		let new_select_by_car_state = new_paging_state.select_by_car_state_;
		
		if( new_paging_state.select_by_car_ !== cur_paging_state.select_by_car_
			|| new_paging_state.select_by_car_checked_ !== cur_paging_state.select_by_car_checked_
			|| new_select_by_car_state.manufacturer !== cur_select_by_car_state.manufacturer
			|| new_select_by_car_state.model != cur_select_by_car_state.model
			|| new_select_by_car_state.modification !== cur_select_by_car_state.modification
			|| new_select_by_car_state.year !== cur_select_by_car_state.year ) {

			setup_categories_select_by_car();

		}

		if( cur_state.vk_ !== new_page_state.vk_ ) {

			let e = xpath_eval_single('html/body/iframe[@vk]');
			e.fade(new_page_state.vk_);

		}

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
			'click',
			'mousedown',
			'mouseenter',
			'mouseleave',
			'mousemove',
			'mouseout',
			'mouseover',
			'mouseup',
			'touchstart',
			'touchend',
			'touchcancel',
			'touchmove',
			'blur',
			'focus'
		];

	}

	show_alert(msg, state, idle_timeout = 0) {

		let e = xpath_eval_single('html/body/div[@alert]');
		e.innerHTML = msg;
		e.fadein();

		if( idle_timeout > 0 ) {

			new Idle({
				oneshot	: true,
				start	: true,
				timeout	: idle_timeout,
				away	: () => { e.fade(false, 'inline-block'); state.alert_ = false; }
			});

		}

		state.alert_ = true;

	}

	clone_page_state() {

		let new_page_state = extend_object(this.page_state_);

		new_page_state.cart_by_uuid_ = {};

		for( let e of new_page_state.cart_ )
			new_page_state.cart_by_uuid_[e.uuid] = e;

		new_page_state.modified_ = false;

		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];

		return [ new_page_state, new_paging_state ];

	}

	btn_prev_page_handler(cur_paging_state) {

		if( cur_paging_state.pgno_ > 0 ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_--;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

		// return undefined;

	}

	btn_next_page_handler(cur_paging_state) {

		if( cur_paging_state.pgno_ + 1 < cur_paging_state.pages_ ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_++;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

	}

	btn_first_page_handler(cur_paging_state) {

		if( cur_paging_state.pgno_ != 0 ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_ = 0;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

	}

	btn_last_page_handler(cur_paging_state) {

		let newpgno = cur_paging_state.pages_ > 0 ? cur_paging_state.pages_ - 1 : 0;

		if( newpgno != cur_paging_state.pgno_ ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.pgno_ = newpgno;
			new_page_state.modified_ = true;

			this.render_.rewrite_page(new_page_state);

			return new_page_state;

		}

	}

	btc_handler(cur_page_state, element, attrs) {

		// categories buttons
		let cur_category = cur_page_state.category_;
		let new_category = cur_page_state.category_ !== attrs.uuid.value ? attrs.uuid.value : null_uuid;

		let [ new_page_state ] = this.clone_page_state();

		new_page_state.category_ = new_category;
		new_page_state.product_ = null_uuid;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		// switch on blinking new category
		if( cur_category !== new_category )
			element.blink(true);

		// switch off blinking current category
		if( cur_category !== null_uuid )
			xpath_eval_single('html/body/div[@categories]/div[@btc and @uuid=\'' + cur_category + '\']').blink(false);

		return new_page_state;

	}

	btn_list_sort_order_handler() {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		if( ++new_paging_state.order_ >= this.orders_.length )
			new_paging_state.order_ = 0;

		new_page_state.product_ = null_uuid;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	btn_list_sort_direction_handler() {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		if( ++new_paging_state.direction_ >= this.directions_.length )
			new_paging_state.direction_ = 0;

		new_page_state.product_ = null_uuid;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	btn_back_handler() {

		let [ new_page_state ] = this.clone_page_state();

		if( new_page_state.cart_edit_ ) {
			// switch back from cart
			new_page_state.cart_edit_ = false;
		}
		else {
			// switch back from product info
			new_page_state.product_ = null_uuid;
		}

		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	pimg_pitem_ptable_plist_handler(element) {

		let [ new_page_state ] = this.clone_page_state();

		// switch view to product info
		new_page_state.product_ = element.parentNode.attributes.uuid.value;
		new_page_state.modified_ = true;

		this.render_.rewrite_info(new_page_state);

		return new_page_state;

	}

	pimg_pinfo_handler(cur_page_state, element) {

		// switch on product image large view
		let largeimg = xpath_eval_single('html/body/div[@plargeimg]');

		largeimg.style.backgroundImage = element.attributes.img_url ? 'url(' + element.attributes.img_url.value + ')' : element.style.backgroundImage;
		//largeimg.style.display = 'inline-block';
		largeimg.fadein();

		cur_page_state.large_img_view_ = true;

	}

	btn_prev_page_pcontrols_pcart_handler(cur_page_state) {

		if( cur_page_state.cart_pgno_ > 0 ) {

			let [ new_page_state ] = this.clone_page_state();

			new_page_state.cart_pgno_--;
			new_page_state.modified_ = true;

			return new_page_state;

		}

		// return undefined;

	}

	btn_next_page_pcontrols_pcart_handler(cur_page_state) {

		if( cur_page_state.cart_pgno_ + 1 < cur_page_state.cart_pages_ ) {

			let [ new_page_state ] = this.clone_page_state();

			new_page_state.cart_pgno_++;
			new_page_state.modified_ = true;

			return new_page_state;

		}

		// return undefined;

	}

	btn_plus_one_pitem_ptable_pcart_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity < cart_entity.remainder ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity++;
			cart_entity.modified = true;
			new_page_state.modified_ = true;

			this.render_.rewrite_cart(new_page_state);

			return new_page_state;

		}

	}

	btn_minus_one_pitem_ptable_pcart_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity > 0 ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity--;
			cart_entity.modified = true;
			new_page_state.modified_ = true;

			this.render_.rewrite_cart(new_page_state);

			return new_page_state;

		}

	}

	btn_buy_pright_pinfo_handler(product, buy_quantity, buy_price) {

		let [ new_page_state ] = this.clone_page_state();

		new_page_state.modified_ = true;

		this.render_.rewrite_cart(new_page_state, product, buy_quantity, buy_price);

		return new_page_state;

	}

	pright_pinfo_handler(element, cur_page_state) {

		let new_page_state;

		let product = element.parentNode.parentNode.attributes.uuid.value;
		let remainder = parseInt(element.parentNode.parentNode.attributes.remainder.value, 10);

		let pbuy_quantity_element = xpath_eval_single('p[@pbuy_quantity]', element.parentNode);
		let buy_quantity = parseInt(pbuy_quantity_element.innerText, 10);

		if( Number.isNaN(buy_quantity) )
			buy_quantity = 0;

		if( element.attributes.buy ) {

			new_page_state = this.btn_buy_pright_pinfo_handler(product, buy_quantity, element.parentNode.parentNode.attributes.price.value);

		}
		else if( element.attributes.plus_one ) {

			if( buy_quantity < remainder )
				pbuy_quantity_element.innerText = buy_quantity + 1;

		}
		else if( element.attributes.minus_one ) {

			pbuy_quantity_element.innerText = buy_quantity > 1 ? buy_quantity - 1 : '-';

		}

		return new_page_state;

	}

	btn_drop_cart_informer_handler() {

		let [ new_page_state ] = this.clone_page_state();

		for( let e of new_page_state.cart_ ) {

			e.buy_quantity = 0;
			e.modified = true;

		}

		new_page_state.modified_ = true;

		this.render_.rewrite_cart(new_page_state);

		return new_page_state;

	}

	btn_cart_cart_informer_handler() {

		let [ new_page_state ] = this.clone_page_state();

		new_page_state.cart_edit_ = true;
		new_page_state.modified_ = true;

		this.render_.rewrite_cart(new_page_state);

		return new_page_state;

	}

	btn_cheque_cart_informer_handler(cur_page_state) {

		let [ new_page_state ] = this.clone_page_state();

		try {
			let request = {
				'module'	: 'carter',
				'handler'	: 'carter',
				'order'		: []
			};

			for( let e of new_page_state.cart_ )
				request.order.push({
					'uuid'		: e.uuid,
					'price'		: e.price,
					'quantity'	: e.buy_quantity
				});

			if( this.dct_ ) {
				request.paper = true;

				if( cur_page_state.authorized_ && cur_page_state.auth_ ) {
					request.user = cur_page_state.auth_.user_uuid;
					request.pass = cur_page_state.auth_.pass;
				}
			}

			let data = this.post_json('proxy.php', request);

			if( data.errno !== 0 )
				throw new Error(data.error + "\n" + data.stacktrace);

			let clear_cart = () => {
				// successfully, clear cart now
				for( let e of new_page_state.cart_ ) {
					e.buy_quantity = 0;
					e.modified = true;
				}

				this.render_.rewrite_cart(new_page_state);
			};

			if( data.order && data.order.availability ) {
				// fail, modify buy quantities and show cart alert

				for( let p of data.order.availability ) {

					let e = new_page_state.cart_by_uuid_[p.product];

					if( e.buy_quantity > p.remainder - p.reserve ) {

						e.buy_quantity = p.remainder - p.reserve;
						e.modified = true;

					}

				}

				this.render_.rewrite_cart(new_page_state);

				if( this.dct_ )
					this.barcode_scanner_rewrite(new_page_state, cur_page_state);

				let msg = 'Недостаточное количество товара на складе для заказа, Ваш заказ изменён, проверьте пожалуйста и попробуйте ещё раз';
				this.show_alert(msg, new_page_state, 15000);

				new_page_state.cart_edit_ = new_page_state.cart_.length > 0;
			}
			else if( this.cst_ ) {
				// success, print cheque

				for( let ncopy = 1; !this.cheque_printed_ && ncopy <= 2; ncopy++ ) {

					let iframe_content = xpath_eval_single('html/body/iframe[@cheque_print and @copy=\'' + ncopy + '\']').contentWindow;
					let iframe	= iframe_content.document;

					let head	= xpath_eval_single('html/body/div[@head]', iframe, iframe);
					xpath_eval_single('p[@node_name]'			, head, iframe).innerHTML = data.order.name;
					xpath_eval_single('p[@uuid]'				, head, iframe).innerHTML = data.order.uuid;
					xpath_eval_single('p[@number]'				, head, iframe).innerHTML = 'Заказ&nbsp;:&nbsp;' + data.order.number;
					xpath_eval_single('p[@date]'				, head, iframe).innerHTML = 'Время&nbsp;:&nbsp;' + this.date_formatter_(data.order.date);//.toLocaleFormat('%d.%m.%Y %H:%M:%S');
					xpath_eval_single('p[@barcode]'				, head, iframe).innerHTML = 'EAN13&nbsp;:&nbsp;' + data.order.barcode;

					let table = xpath_eval_single('html/body/div[@table]', iframe, iframe);
					let html = '';

					for( let i = 0; i < new_page_state.cart_.length; i++ ) {

						let e = new_page_state.cart_[i];

						html = html + `
							<p product>
							${i + 1}. ${e.name + ' [' + e.code + ']'} ${e.price + '<i rouble>&psi;</i>'} ${e.buy_quantity + '&nbsp;шт'}
							<span psum>&nbsp;=${e.price * e.buy_quantity + '<i rouble>&psi;</i>'}</span>
							</p>`
						;

					}

					table.innerHTML = html.replace(/(?:[\r\n\t])/g, '');

					let footer = xpath_eval_single('html/body/div[@footer]', iframe, iframe);
					xpath_eval_single('p[@totals]/span[@txt]'	, footer, iframe).innerHTML = 'Сумма:';
					xpath_eval_single('p[@totals]/span[@sum]'	, footer, iframe).innerHTML = data.order.totals + '<i rouble>&psi;</i>';

					let barcode = data.order.barcode;
					//barcode = data.order.barcode_eangnivc;
					let barcode_render = new barcode_ean13_render({ width: 6.1 });
					let barcode_html = barcode_render.draw_barcode(barcode);
					let tail = xpath_eval_single('html/body/div[@tail]', iframe, iframe);
					xpath_eval_single('div[@barcode]', tail, iframe).innerHTML = barcode_html;

					// http://stackoverflow.com/a/11823629
					// Open about:config then change the pref dom.successive_dialog_time_limit to zero integer
					iframe_content.print();
				}

				this.cheque_printed_ = true;
				clear_cart();
				delete this.cheque_printed_;
				new_page_state.cart_edit_ = false;
			}
			else if( this.dct_ ) {
				clear_cart();

				this.barcode_scanner_rewrite(new_page_state, cur_page_state);

				if( this.pending_orders_ )
					this.setup_pending_orders_refresh();
				else
					this.barcode_scanner_insert_order(data.order);
			}

			new_page_state.product_ = null_uuid;
		}
		catch( ex ) {

			if( ex instanceof XhrDeferredException )
				throw ex;

			delete this.cheque_printed_;
			this.show_alert('<pre error>' + ex.message + "\n" + ex.stack + '</pre>', cur_page_state);
			console.error(ex.message);
			throw ex;

		}

		new_page_state.modified_ = true;

		return new_page_state;

	}

	btn_selections_handler(cur_page_state, cur_paging_state) {

		if( cur_page_state.category_ !== null_uuid ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.selections_ = !cur_paging_state.selections_;
			new_page_state.modified_ = true;

			if( new_paging_state.select_by_car_ )
				new_paging_state.select_by_car_ = false;

			if( new_paging_state.selections_ )
				this.render_.rewrite_selections(new_page_state);

			return new_page_state;

		}

	}

	checkbox_values_property_selections_frame_handler(element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let new_selections_state = new_paging_state.selections_state_;

		let property_uuid	= element.parentNode.parentNode.attributes.uuid.value;
		let value_uuid		= element.attributes.uuid.value;
		let checked, p, v;

		new_paging_state.selections_checked_ = false;

		for( let pp of new_selections_state )
			for( let vv of pp.values ) {

				if( pp.uuid === property_uuid && vv.uuid === value_uuid ) {

					p = pp;
					v = vv;
					checked = v.checked = !v.checked;

				}

				if( vv.checked )
					new_paging_state.selections_checked_ = true;

			}

		if( checked && !p.multi_select )
			for( let q of p.values )
				if( q.uuid !== v.uuid )
					q.checked = false;

		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		if( checked ) {

			if( !p.multi_select )
				for( let q of xpath_eval('div[@value]', element.parentNode) )
					q.removeAttribute('checked');

			element.setAttribute('checked', '');

		}
		else {

			element.removeAttribute('checked');

		}

		let e = xpath_eval_single('html/body/div[@categories]/div[@clear_selections and @uuid=\'' + new_page_state.category_ + '\']');
		e.fade(new_paging_state.selections_checked_);

		return new_page_state;

	}

	btn_clear_selections_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let new_selections_state = new_paging_state.selections_state_;

		for( let p of new_selections_state )
			for( let v of p.values )
				v.checked = false;

		new_paging_state.selections_checked_ = false;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		let path = 'html/body/div[@categories]/div[@selections_frame and @uuid=\'' + new_page_state.category_ + '\']';

		for( let e of xpath_eval(path + '/div[@property]/div[@values]/div[@value and @checked]') )
			e.removeAttribute('checked');

		element.fadeout();

		return new_page_state;

	}

	btn_select_by_car_handler(cur_page_state, cur_paging_state) {

		if( cur_page_state.category_ !== null_uuid ) {

			let [ new_page_state, new_paging_state ] = this.clone_page_state();

			new_paging_state.select_by_car_ = !cur_paging_state.select_by_car_;
			new_page_state.modified_ = true;

			if( new_paging_state.selections_ )
				new_paging_state.selections_ = false;

			if( new_paging_state.select_by_car_ ) {

				this.render_.rewrite_select_by_car(new_page_state);
				this.render_.assemble_select_by_car(new_page_state);

			}

			return new_page_state;

		}

	}

	values_select_by_car_frame_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let select_by_car_state = new_paging_state.select_by_car_state_;

		if( select_by_car_state.manufacturer ) {

			if( select_by_car_state.model ) {
			
				if( select_by_car_state.modification ) {

					let uuid = element.attributes.uuid.value;

					select_by_car_state.year = select_by_car_state.values.find(e => e.uuid === uuid);
					new_paging_state.select_by_car_checked_ = true;

				}
				else {

					let uuid = element.attributes.uuid.value;

					select_by_car_state.modification = select_by_car_state.values.find(e => e.uuid === uuid);

				}

			}
			else {

				let uuid = element.attributes.uuid.value;

				select_by_car_state.model = select_by_car_state.values.find(e => e.uuid === uuid);

			}

		}
		else {

			let uuid = element.attributes.uuid.value;

			select_by_car_state.manufacturer = select_by_car_state.values.find(e => e.uuid === uuid);

		}

		if( new_paging_state.select_by_car_checked_ )
			new_paging_state.select_by_car_ = false;

		new_page_state.modified_ = true;

		this.render_.rewrite_select_by_car(new_page_state);

		if( !cur_paging_state.select_by_car_checked_ && new_paging_state.select_by_car_checked_ )
			this.render_.rewrite_page(new_page_state);

		this.render_.assemble_select_by_car(new_page_state);

		let e = xpath_eval_single('html/body/div[@categories]/div[@clear_select_by_car and @uuid=\'' + new_page_state.category_ + '\']');
		e.fade(new_paging_state.select_by_car_checked_);

		return new_page_state;

	}

	btn_clear_select_by_car_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();
		let new_selections_state = new_paging_state.selections_state_;
		let select_by_car_state = new_paging_state.select_by_car_state_;

		select_by_car_state.manufacturer = undefined;
		select_by_car_state.model = undefined;
		select_by_car_state.modification = undefined;
		select_by_car_state.year = undefined;

		if( select_by_car_state.car )
			select_by_car_state.car = undefined;

		new_paging_state.select_by_car_checked_ = false;
		new_page_state.modified_ = true;

		this.render_.rewrite_select_by_car(new_page_state);

		if( cur_paging_state.select_by_car_checked_ )
			this.render_.rewrite_page(new_page_state);

		this.render_.assemble_select_by_car(new_page_state);

		return new_page_state;

	}

	btn_vk_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.vk_ = !cur_page_state.vk_;
		new_page_state.modified_ = true;

		return new_page_state;

	}

	btn_vki_type_handler(e, cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.fts_filter_ = e.detail;
		new_page_state.modified_ = true;

		this.render_.rewrite_page(new_page_state);

		return new_page_state;

	}

	vk_input_callback_handler(e, keyboard, el) {

		let sw = false, change = false;

		switch( e.type ) {

			case 'keyboardChange'   : break;
			case 'change'   		: change = true; break;
			case 'visible'			: break;
			case 'hidden'			: break;
			case 'accepted'			: sw = true; break;
			case 'canceled'			: sw = true; break;
			case 'restricted'		: break;
			case 'beforeClose'		: break;

		}

		if( sw ) {

			let el = xpath_eval_single('html/body/img[@vk]');
			let evt = document.createEvent("MouseEvents");
			evt.initEvent('mouseup', true, true);
			el.dispatchEvent(evt);

		}

		if( change ) {

			if( this.vk_input_timer_ )
				clearTimeout(this.vk_input_timer_);

			this.vk_input_timer_ = setTimeout( () => {

				let m = new CustomEvent('vki_type', { detail : keyboard.preview.value });
				window.dispatchEvent(m);

			}, 1000);

		}

	}

	startup_handler(cur_page_state, cur_paging_state, element) {

		if( this.cst_ ) {

			if( !this.startup_stage_ )
				this.startup_stage_ = 1;

			if( this.startup_stage_ === 1 ) {
				this.render_.rewrite_category();
				this.startup_stage_ = 2;
			}

			if( this.startup_stage_ === 2 ) {
				this.render_.rewrite_page();
				this.startup_stage_ = 3;
			}

			if( this.startup_stage_ === 3 ) {
				this.render_.rewrite_cart();
				this.startup_stage_ = 4;
			}

			if( this.startup_stage_ === 4 ) {
				this.render_.show_new_page_state();
				delete this.startup_stage_;

				// switch to tyres category by default
				let e = xpath_eval_single('html/body/div[@categories]/div[@btc and @uuid=\'83f528bc-481a-11e2-9a03-ace5647d95bd\']');
				let evt = document.createEvent("MouseEvents");
				evt.initEvent('mouseup', true, true);
				setTimeout(() => e.dispatchEvent(evt));
			}
		}

		if( this.dct_ ) {
			if( this.debug_ && this.dct_ /*&& !SmartPhone.isAny()*/ )
				this.debug_barcodes_ = [
					'2000556067968',
					'5904608006653',
					'0009603055103',
					'4606746008919',
					'4606746008933',
					'4606746008926',
					'4606746008810',
					'2000556207968',
					'4260041010796',
					'4100420037061',
					'4100420037078'
				];

			// fetch delayed cart
			setTimeout(() => window.dispatchEvent(new CustomEvent('barcode')));
		}
	}

	startup_auth_handler(cur_page_state, cur_paging_state) {

		let [ new_page_state ] = this.clone_page_state();

		let request = {
			'module'	: 'authorizer',
			'handler'	: 'authorizer'
		};

		let data = this.post_json('proxy.php', request);

		if( data.errno === 0 && data.auth && data.auth.authorized ) {
			new_page_state.modified_ = true;
			new_page_state.auth_ = data.auth;
			new_page_state.authorized_ = data.auth.authorized;
		
			xpath_eval_single('html/body/div[@top]/div[@auth]').innerHTML = `<br>Авторизовано: ${data.auth.user}`;
		}

		return new_page_state;
	}

	idle_away_reload_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.modified_ = true;

		this.render_.rewrite_page();

		let date = new Date;

		console.log(this.date_formatter_(date) + ': current page reloaded on user idle away');
		//console.log(date.toLocaleFormat('%d.%m.%Y %H:%M:%S') + ': current page reloaded on user idle away');

		return new_page_state;

	}

	sse_reload_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.modified_ = true;

		this.render_.rewrite_page();

		let date = new Date;
		console.log(this.date_formatter_(date) + ': products on current page changed, reloaded');

		return new_page_state;

	}

	/*events_handler(e) {

		setTimeout((e) => this.dispatch_handler(e), 0);

	}*/

	window_resize_handler() {

		/*let [ w, h ] = window_size();
		let b = xpath_eval_single('html/body');
		let sp = SmartPhone.isAny();

		if( this.debug_ && this.dct_ && !SmartPhone.isAny() ) {
			let m = xpath_eval_single('html/body/div[@debug]');
			m.style.left = '5%';
			m.style.width = '35%';

			b.style.left = 'calc(50% - 35mm)';
			b.style.top = '20px';
			b.style.width = '70mm';
			b.style.height = '140mm';
			b.style.border = 'solid 1px black';

			for( let btn of xpath_eval('html/body/i[@btn]') )
				btn.style.top = '4%';
		}
		else if( sp ) { // prevent virtual keyboard appear resize body
			if( this.debug_ && this.dct_ ) {
				let m = xpath_eval_single('html/body/div[@debug]');
				m.style.left = '0';
				m.style.width = '55%';
			}

			let ww = this.deviceWidth_  !== undefined ? this.deviceWidth_  : 0;
			let hh = this.deviceHeight_ !== undefined ? this.deviceHeight_ : 0;

			if( w > ww || h > hh ) {
				b.style.width  = w + 'px';
				b.style.height = h + 'px';
				this.deviceWidth_  = w;
				this.deviceHeight_ = h;
			}

			//if( this.dct_ ) {
			//	let icon_scan = xpath_eval_single('html/body/i[@btn and @scan]');
			//	icon_scan.style.top = 'calc(100% - 9.999%)';
			//	icon_scan.style.left = 'calc(100% - 10.5mm)';
			//	icon_scan.style.width = '10mm';
			//	icon_scan.style.height = '10mm';
			//}
		}
		else {
			b.style.width  = w + 'px';
			b.style.height = h + 'px';
		}

		let p = xpath_single('html/body/div[@search_panel]');

		if( p ) {
			let r = p.getCoords();

			if( h < screen.height ) {
				let viewport_h = Math.min(b.getCoords().bottom, h);
				let nh = Math.trunc(viewport_h - r.top * 1.4);
				p.style.height = nh.toString() + 'px';
			}
			else
				p.removeAttribute('style');
		}*/
	}

	get_quagga_params() {
		return {
			inputStream : {
				name		: 'Live',
				type		: 'LiveStream',
				target		: xpath_eval_single('html/body/div[@middle]/div[@scanner]/div[@viewport]'),//document.querySelector('#yourElement'),    // Or '#yourElement' (optional)
				constraints	: {
					width		: { min: 320 },
					height		: { min: 240 },
					facingMode	: 'environment',
					aspectRatio	: { min: 1, max: 2 }
				}
			},
			decoder			: {
				readers : [
					{ format : 'code_128_reader', config : {} },
					{ format : 'ean_reader'		, config : {} },
					{ format : 'upc_reader'		, config : {} },
					{ format : 'upc_e_reader'	, config : {} },
					{ format : 'codabar_reader'	, config : {} }
				]
			},
			locator		: {
				patchSize	: 'medium',
				halfSample	: true
			},
			numOfWorkers	: navigator.hardwareConcurrency,
			frequency		: 10,
			locate			: false
		};
	};

	switch_dst_middle_pitem(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		if( element.attributes.expanded ) {
			for( let e of xpath_eval('div[@btn]', element) )
				e.display(false);

			let e = xpath_eval_single('div[@btn and @discount]', element);
			for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', element) )
				q.display(false);

			xpath_eval_single('div[@pbuy_quantity]', element).display(false);
			//xpath_eval_single('div[@txt]/font[@pprice]', element).display(true);
			xpath_eval_single('div[@txt]/font[@pcomma]', element).display(true);
			xpath_eval_single('div[@txt]/font[@pbuy_quantity]', element).display(true);
			element.removeAttribute('expanded');
		}
		else {
			for( let e of xpath_eval('div[@btn]', element) )
				e.display(e.attributes.discount ? new_page_state.authorized_ : true);

			let e = xpath_eval_single('div[@btn and @discount]', element);
			for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', element) )
				q.display(e.attributes.expanded
					&& (
						!q.attributes.btn
						|| (q.attributes.discount_price && e.attributes.mode.value === 'price')
						|| (q.attributes.discount_percent && e.attributes.mode.value === 'percent')
						|| q.attributes.discount_accept
					)
				);

			xpath_eval_single('div[@pbuy_quantity]', element).display(true);
			//xpath_eval_single('div[@txt]/font[@pprice]', element).display(false);
			xpath_eval_single('div[@txt]/font[@pcomma]', element).display(false);
			xpath_eval_single('div[@txt]/font[@pbuy_quantity]', element).display(false);
			element.setAttribute('expanded', '');
		}

		new_page_state.modified_ = true;

		return new_page_state;
	}

	btn_dst_plus_one_pitem_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity < cart_entity.remainder ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity++;
			cart_entity.modified = true;

			this.render_.rewrite_cart(new_page_state);
			this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			new_page_state.modified_ = true;

			return new_page_state;

		}

	}

	btn_dst_minus_one_pitem_handler(cur_page_state, product = null) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity.buy_quantity > 0 ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];

			cart_entity.buy_quantity--;
			cart_entity.modified = true;

			this.render_.rewrite_cart(new_page_state);
			this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			new_page_state.modified_ = true;

			return new_page_state;

		}

	}

	btn_dst_discount_accept_handler(cur_page_state, product, value) {

		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity ) {

			let [ new_page_state ] = this.clone_page_state();

			cart_entity = new_page_state.cart_by_uuid_[product];
			cart_entity.price = Number.parseFloat(value);
			cart_entity.modified = true;

			this.render_.rewrite_cart(new_page_state);
			this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			new_page_state.modified_ = true;

			return new_page_state;
		}
	}

	discount_value_text_type_handler(element, cur_page_state, text) {

		if( element.value !== text )
			return;

		let product = element.parentNode.parentNode.attributes.uuid.value;
		let cart_entity = cur_page_state.cart_by_uuid_[product];

		if( cart_entity ) {
			let n = Number.parseFloat(text);

			if( !Number.isNaN(n) ) {
				let holder = xpath_eval_single('div[@btn and @discount]', element.parentNode.parentNode);
				let mode = holder.attributes.mode.value;

				if( mode === 'price' )
					n = n;
				else if( mode === 'percent' ) 
					n = Math.max(0, round(cart_entity.price - cart_entity.price * n / 100, 2));

				holder.setAttribute('value', n);

				let e = xpath_eval_single('div[@discount_value]', element.parentNode.parentNode);
				xpath_eval_single('font[@price]', e).innerHTML = n;
				xpath_eval_single('font[@summ]', e).innerHTML = n * cart_entity.buy_quantity;
			}
		}
	}

	switch_dst_discount_middle_pitem(element) {

		let a = element.attributes;

		if( a.expanded )
			element.removeAttribute('expanded');
		else
			element.setAttribute('expanded', '');

		for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', element.parentNode) )
			q.display(a.expanded
				&& (
					!q.attributes.btn
					|| (q.attributes.discount_price && a.mode.value === 'price')
					|| (q.attributes.discount_percent && a.mode.value === 'percent')
					|| q.attributes.discount_accept
				)
			);

		let p = xpath_eval_single('div[@discount_value]/input[@discount_value]', element.parentNode);

		if( a.expanded ) {
			p.focus();
			p.click();
		}
	}

	barcode_scanner_rewrite(new_page_state, cur_page_state) {

		let m = xpath_eval_single('html/body/div[@middle]/div[@scanner]');
		let cart = new_page_state.cart_;
		let n = 1;
		let modified = false;

		for( let e of xpath_eval('div[@uuid]', m.parentNode) ) {
			if( new_page_state.cart_by_uuid_[e.attributes.uuid.value] )
				continue;
			m.parentNode.removeChild(e);
			modified = true;
		}

		for( let p of cart ) {
			let o = cur_page_state.cart_by_uuid_[p.uuid] || {};

			if( o.buy_quantity === p.buy_quantity
				&& o.price === p.price
				&& o.remainder === p.remainder
				&& new_page_state.authorized_ === cur_page_state.authorized_ )
				continue;

			modified = true;

			let g = () => xpath_single('div[@uuid=\'' + p.uuid + '\']', m.parentNode);
			let e = g();

			if( !e ) {
				m.insertAdjacentHTML('afterend', `
					<div pitem="${n}" uuid="${p.uuid}" price="${p.price}" fliphin>
						<div txt${p.img_uuid ? ' have_img' : ''}>
							<font pcode style="color:darkblue" blink2></font>
							<font pname></font>
							<font pprice></font>
							<font pcomma>, </font>
							<font pbuy_quantity></font>
						</div>
						<i pimg></i>
						<div btn plus_one></div>
						<div pbuy_quantity></div>
						<div btn minus_one></div>
						<div btn discount mode="price"></div>
						<div discount_value setup>
							<input discount_value text_type type="number">
							<br>
							<font>Цена&nbsp;: </font><font price></font><i rouble>&psi;</i></font>
							<br>
							<font>Сумма: </font><font summ></font><i rouble>&psi;</i></font>
						</div>
						<div btn discount_price></div>
						<div btn discount_percent></div>
						<div btn discount_accept></div>
					</div>
				`.replace(/(?:[\r\n\t])/g, ''));

				e = g();

				this.setup_events(xpath_eval('div[@discount_value]/input[@discount_value]', e));
				this.setup_events(xpath_eval('i[@pimg]', e));
				this.setup_events(xpath_eval('div[@btn]', e));
				this.setup_events(e);
			}

			let txt = xpath_eval_single('div[@txt]', e);

			xpath_eval_single('font[@pcode]' , txt).innerHTML = `[${p.code}]`;
			xpath_eval_single('font[@pname]' , txt).innerHTML = p.name;
			xpath_eval_single('font[@pprice]', txt).innerHTML = `, ${p.price}<i rouble>&psi;</i>`;//₽`;

			let bq = xpath_eval_single('font[@pbuy_quantity]', txt);
			bq.innerHTML = `${p.buy_quantity}`;
			if( p.buy_quantity <= p.remainder ) {
				bq.style.color = 'darkmagenta';
				if( bq.attributes.blink2 )
					bq.removeAttribute('blink2');
			}
			else {
				bq.style.color = 'red';
				bq.setAttribute('blink2', '');
			}

			let img = xpath_eval_single('i[@pimg]', e);
			img.setAttribute('img_url', p.img_url);
			img.style.backgroundImage = `url(${p.img_ico})`;
			img.display(p.img_uuid);

			// http://en.wikipedia.org/wiki/Arrow_%28symbol%29#Arrows_in_Unicode
			// https://en.wikipedia.org/wiki/Geometric_Shapes
			// BLACK DOWN-POINTING TRIANGLE, HTML HEX: &#x25BC;
			// name += '<font triangle style="color:black;font-size:250%">▼</font>';

			xpath_eval_single('div[@pbuy_quantity]', e).innerHTML = '<span>Кол-во&nbsp;: ' + p.buy_quantity
				+ '<br>Сумма&nbsp;&nbsp;: ' + p.price * p.buy_quantity + '<i rouble>&psi;</i>'
				+ '<br>Остаток: ' + p.remainder
				+ '</span>';

			let dis = xpath_eval_single('div[@btn and @discount]', e);
			dis.display(new_page_state.authorized_ && e.attributes.expanded);

			for( let q of xpath_eval('div[@discount_value or (@btn and (@discount_price or @discount_percent or @discount_accept))]', e) )
				q.display(dis.attributes.expanded
					&& (
						!q.attributes.btn
						|| (q.attributes.discount_price && dis.attributes.mode.value === 'price')
						|| (q.attributes.discount_percent && dis.attributes.mode.value === 'percent')
						|| q.attributes.discount_accept
					)
				);

			let dv = xpath_eval_single('div[@discount_value]', e);

			if( dv.attributes.setup ) {
				xpath_eval_single('input[@discount_value]', dv).value = p.price;
				xpath_eval_single('font[@price]', dv).innerHTML = p.price;
				xpath_eval_single('font[@summ]', dv).innerHTML = p.price * p.buy_quantity;
				dv.removeAttribute('setup');
			}

			if( dis.attributes.value && !dis.attributes.value.value.isEmpty() )
				xpath_eval_single('font[@summ]', dv).innerHTML = Number.parseFloat(dis.attributes.value.value) * p.buy_quantity;

			n++;
		}

		if( modified ) {
			this.render_.assemble_cart_informer(new_page_state);

			if( new_page_state.cart_.length !== 0 && cur_page_state.cart_.length === 0 )
				xpath_eval_single('html/body/i[@btn and @order]').display(true);
			else if( new_page_state.cart_.length === 0 && cur_page_state.cart_.length !== 0 )
				xpath_eval_single('html/body/i[@btn and @order]').display(false);
		}

		if( new_page_state.constants_ ) {
			xpath_eval_single('html/body/div[@mount]/p[@mag]').innerHTML =
				'Магазин: ' + new_page_state.constants_['ТекущийМагазинПредставление'];
			xpath_eval_single('html/body/div[@mount]/p[@address]').innerHTML =
				'Адрес: ' + new_page_state.constants_['ТекущийМагазинАдрес'];

			this.pending_orders_ = new_page_state.constants_.pending_orders;
			delete new_page_state.constants_;
		}

		let panel = xpath_eval_single('html/body/div[@middle]/div[@orders_panel]');

		if( new_page_state.cart_.length === 0 ) {
			panel.style.left = 0;
			panel.style.width = '98%';
		}
		else {
			panel.removeAttribute('style');
		}

		if( new_page_state.orders_ ) {
			let orders = [];

			for( let n in new_page_state.orders_ )
				if( new_page_state.orders_.hasOwnProperty(n) )
					orders.push(new_page_state.orders_[n]);

			orders.sort((a, b) => a.date - b.date);

			let panel = xpath_eval_single('html/body/div[@middle]/div[@orders_panel]');

			for( let order of orders ) {
				let p = xpath_single('div[@uuid=\'' + order.uuid + '\']', panel);

				if( !p || p.attributes.customer_uuid.value !== order.customer_uuid )
					modified = true;

				this.barcode_scanner_insert_order(order);
			}

			for( let p of xpath_eval('div[@uuid]', panel) ) {
				let i = orders.findIndex(order => order.uuid === p.attributes.uuid.value);
				if( i < 0 ) {
					panel.removeChild(p);
					modified = true;
				}
			}

			delete new_page_state.orders_;
		}

		if( !modified && this.pending_orders_refresh_timeout_id_ ) {
			this.setup_pending_orders_refresh();
		}
		else if( modified && this.pending_orders_refresh_timeout_id_ ) {
			delete this.pending_orders_refresh_timeout_id_;
		}

		return modified;
	}

	barcode_scanner_insert_order(order, panel) {

		panel = panel || xpath_eval_single('html/body/div[@middle]/div[@orders_panel]');

		let e = xpath_single('div[@uuid=\'' + order.uuid + '\']', panel);

		if( e ) {
			e.setAttribute('customer_uuid', order.customer_uuid);
			xpath_eval_single('div[@txt]/font[@customer_name]', e).innerHTML = order.customer;
		}
		else {
			panel.insertAdjacentHTML('afterbegin', `
				<div order uuid="${order.uuid}" customer_uuid="${order.customer_uuid}">
					<div txt>
						<font>Заказ&nbsp;</font><font style="color:darkblue" blink2>№&nbsp;${order.number}</font>
						<font> от ${this.date_formatter_(order.date).trim()}</font>
						<font>, </font><font customer_name>${order.customer}</font>
						<font>, Сумма:&nbsp;${order.totals}<i rouble>&psi;</i></font>
						<font>, EAN13:&nbsp;${order.barcode}</font>
					</div>
					<div btn customer></div>
					<div btn remove></div>
				</div>
			`.replace(/(?:[\r\n\t])/g, ''));

			this.setup_events(xpath_eval('div[@order and @uuid=\'' + order.uuid + '\']', panel));
			this.setup_events(xpath_eval('div[@order and @uuid=\'' + order.uuid + '\']/div[@btn]', panel));
		}

		/*let iframe = document.createElement('iframe');
		iframe.setAttribute('seamless', '');
		iframe.setAttribute('frameborder', 0);
		iframe.setAttribute('scrolling', 'no');
		iframe.setAttribute('order', '');
		iframe.src = 'data:text/html;base64,' + base64_encode(order.paper);
		iframe.onload = () => {
		//for( let iframe of xpath_eval('div[@order]/iframe[@order]', panel) ) {
			let doc = iframe.contentWindow.document;
			let body = doc.body;
			let html = doc.documentElement;
			
			//for( let e of xpath_eval('html/body/*', doc, doc) )
			//	e.style.width = '10px';
		};*/

		//xpath_eval_single('div[@order]', panel).appendChild(iframe);

		return panel;

	}

	setup_pending_orders_refresh() {

		this.pending_orders_refresh_timeout_id_ = setTimeout(() => {
			window.dispatchEvent(new CustomEvent('barcode'));
		}, 5000);

	}

	barcode_scan_handler(cur_page_state, code) {

		if( this.barcode_event_ && this.barcode_event_ !== this.current_event_ )
			return;

		this.barcode_event_ = this.current_event_;

		let ex;
		let cleanup = true;
		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		try {

			//Render.debug(3, 'B:&nbsp;' + code);
			//let m = xpath_eval_single('html/body/div[@middle]/div[@scanner]/div[@viewport]');
			//m.insertAdjacentHTML('afterend', `<div barcode="${code}">${code}</div>`);

			let request = {
				'module'		: 'carter',
				'handler'		: 'carter'
			};

			if( code )
				request.products = [{ 'barcode' : code }];
			else
				request.orders = true;

			let data = this.post_json('proxy.php', request);

			if( !code && data.cart.length !== 0 )
				delete this.debug_barcodes_;

			new_page_state.constants_ = data.constants;
			new_page_state.orders_ = data.orders;
			new_page_state.cart_ = data.cart;
			new_page_state.cart_by_uuid_ = {};

			for( let e of data.cart )
				new_page_state.cart_by_uuid_[e.uuid] = e;

			let modified = this.barcode_scanner_rewrite(new_page_state, cur_page_state);

			if( modified && code )
				this.scanner_beep();

			new_page_state.modified_ = true;

		}
		catch( e ) {
			ex = e;
			if( e instanceof XhrDeferredException )
				cleanup = false;
			throw e;
		}
		finally {
			if( cleanup ) {
				if( this.debug_barcodes_ && this.debug_barcodes_.length !== 0 ) {
					delete this.barcode_event_;

					let code = this.debug_barcodes_.pop();

					if( this.debug_barcodes_.length === 0 )
						delete this.debug_barcodes_;

					setTimeout(() => window.dispatchEvent(new CustomEvent('barcode', { detail : code })));
				}
				else {
					// allow scan barcode only once per second
					setTimeout(() => delete this.barcode_event_, 1000);
				}
			}
		}

		return new_page_state;
	}

	switch_scanner() {

		if( this.quagga_initialized_ ) {
			let btn_scan = xpath_eval_single('html/body/i[@btn and @scan]');
			let scanner = xpath_eval_single('html/body/div[@middle]/div[@scanner]');

			if( this.quagga_started_ ) {
				Quagga.stop();
				this.quagga_started_ = false;
				btn_scan.blink(false);
				scanner.fade(false);
				console.log("Quagga stopped");
				this.quagga_initialized_ = false;
			}
			else {
    			/*Quagga.onProcessed(result => {
					let drawingCtx = Quagga.canvas.ctx.overlay;
					let drawingCanvas = Quagga.canvas.dom.overlay;

					if( result ) {
						if( result.boxes ) {
							drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width')), parseInt(drawingCanvas.getAttribute('height')));
							result.boxes.filter(box => box !== result.box).forEach((box) => {
                    			Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: 'green', lineWidth: 2 });
							});
						}

						if( result.box )
							Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: '#00F', lineWidth: 2 });

						if( result.codeResult && result.codeResult.code )
							Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
					}
				});*/

				Quagga.onDetected(result => {
					window.dispatchEvent(new CustomEvent('barcode', { detail : result.codeResult.code }));
					//let code = result.codeResult.code;

					//if( App.lastResult !== code ) {
    	        	//	App.lastResult = code;
					//	let $node = null, canvas = Quagga.canvas.dom.image;
					//	$node = $('<li><div class="thumbnail"><div class="imgWrapper"><img /></div><div class="caption"><h4 class="code"></h4></div></div></li>');
					//	$node.find("img").attr("src", canvas.toDataURL());
					//	$node.find("h4.code").html(code);
					//	$("#result_strip ul.thumbnails").prepend($node);
					//}
				});

				Quagga.start();
				this.quagga_started_ = true;
				btn_scan.blink(true);
				scanner.fade(true);
				console.log("Quagga started");
			}
		}
		else {
			this.quagga_scripts_loaded_ = true;
			
			Quagga.init(this.get_quagga_params(), err => {
				if( err ) {
					console.log(err);
					return;
				}

				this.quagga_initialized_ = true;
				console.log("Quagga initialization finished. Ready to start");

            	let track = Quagga.CameraAccess.getActiveTrack();

            	if( track && typeof track.getCapabilities === 'function' ) {
                    track.applyConstraints({advanced: [{zoom: parseFloat(2.0)}]});
					track.applyConstraints({advanced: [{torch: true}]});
                }

				this.switch_scanner();
			});
		}
	}

	amplifyMedia(mediaElem, multiplier) {
		let context = new (window.AudioContext || window.webkitAudioContext),
			result = {
				context: context,
				source: context.createMediaElementSource(mediaElem),
				gain: context.createGain(),
				media: mediaElem,
				amplify: function(multiplier) { result.gain.gain.value = multiplier; },
				getAmpLevel: function() { return result.gain.gain.value; }
		};
		result.source.connect(result.gain);
		result.gain.connect(context.destination);
		result.amplify(multiplier);
		return result;
	}

	scanner_beep(volume = 1.0) {

		try {
			let beep = document.getElementById('scanner_beep');
			//let amp = this.amplifyMedia(beep, volume);
			beep.volume = volume;
			beep.play();
		}
		catch( e ) {
			console.log(e.message);
			//Render.debug(2, 'PLAY:&nbsp;' + e.message);
		}

	}

	btn_scan_handler() {

		this.scanner_beep(0.0001);

		if( this.quagga_scripts_loaded_ ) {
			this.switch_scanner();
		}
		else {
			load_script('assets/scanner/vendor/jquery-3.2.1.slim.min.js', () =>
			load_script('assets/scanner/adapter_no_edge_no_global-4.2.2.js', () =>
			load_script('assets/scanner/quagga.min.js', () => this.switch_scanner())));
		}

	}

	setup_text_type_event(elements, delay_ms = 300) {

		for( let element of (elements instanceof Array ? elements : [elements]) ) {
			if( !element.attributes || !element.attributes.text_type )
				continue;

			if( element.text_type_timeout_id_ )
				clearTimeout(element.text_type_timeout_id_);

			if( delay_ms === null )
				continue;

			element.text_type_handler_ = () => {
				delete element.text_type_timeout_id_;

				let stms = () => {
					element.text_type_timeout_id_ = setTimeout(element.text_type_handler_, delay_ms);
				};

				if( element.text_typed_ !== element.value ) {
					delete element.text_typed_fired_;
					element.text_typed_ = element.value;
					stms();
				}
				else if( element.text_typed_fired_ ) {
					stms();
				}
				else {
					try {
						element.dispatchEvent(new CustomEvent('text_type', { detail : element.text_typed_ }));
					}
					finally {
						element.text_typed_fired_ = true;
						stms();
					}
				}
			};

			if( !element.text_typed_event_ )
				add_event(element, 'text_type', e => this.events_handler(e), false);

			element.text_typed_ = element.value;
			element.text_typed_fired_ = true;
			element.text_typed_event_ = true;
			element.text_type_handler_();
		}
	}

	search_panel_text_type_handler(text) {

		if( xpath_eval_single('html/body/div[@search_panel]/input[@vks]').value !== text )
			return;

		let panel = xpath_eval_single('html/body/div[@search_panel]');

		let request = {
			'module'			: 'searcher',
			'handler'			: 'searcher',
			'view'				: panel.attributes.view.value,
			'fts_filter'		: text
		};

		let data = this.post_json('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;
		let html = '';

		if( data.products && data.products.length !== 0 ) {
			for( let p of data.products ) {
				let name = p.name.replace(/ ,/, ',').trim();

				/*for( let l = name.length, i = 0, j = 0; i < l; i++, j++ ) {
					if( j >= 35 && name[i] === ' ' ) {
						name = name.substr(0, i) + '<br>' + name.substr(i).trim();
						l = name.length;
						j = -1;
					}
				}*/

				let pimg = p.img_uuid ? `<i pimg img_url="${p.img_url}" style="background-image:url(${p.img_ico})"></i>` : '';

				html += `
					<div result uuid="${p.uuid}" price="${p.price}" fliphin>
						<div txt${p.img_uuid ? ' have_img' : ''}>
							<font pcode style="color:darkblue" blink2>[${p.code}]</font>
							<font pname> ${name}</font>
							<font pcomma>, </font>
							<font pprice style="color:darkmagenta">${p.price}<i rouble>&psi;</i></font>
							<font pcomma>, </font>
							<font premainder style="color:navy">${p.remainder}</font>
							<font pcomma>, </font>
							<font preserve style="color:gray">${p.reserve}</font>
						</div>
						${pimg}
					</div>
				`;
			}
		}
		else if( data.customers && data.customers.length !== 0 ) {
			for( let p of data.customers ) {
				let inn = p.inn.isEmpty() ? '' : '[' + p.inn + '] ';
				html += `
					<div result uuid="${p.uuid}" fliphin>
						<div txt>
							<font pcode style="color:darkblue" blink2>${inn}</font>
							<font pname>${p.name}</font>
						</div>
					</div>
				`;
			}
		}

		let results = xpath_eval_single('div[@results]', panel);
		results.innerHTML = html.replace(/(?:[\r\n\t])/g, '');
		this.setup_events(xpath_eval('div[@result]', results));

	}

	//dispatch_handler(e) {
	events_handler(e) {

		let prevent_default = true, show_alert = false;

		this.current_event_ = e;

		let state				= this;
		let cur_page_state 		= state.page_state_;
		let cur_paging_state 	= state.page_state_.paging_state_by_category_[state.page_state_.category_];
		let new_page_state;
		let x;

		try {

			if( !this.load_indicator_ )
				this.load_indicator_ = xpath_single('html/body/div[@class=\'cssload-container\']');

			if( this.load_indicator_ && !this.load_indicator_timer_ ) {

				//this.load_indicator_.style.display = 'none';
				this.load_indicator_.fadeout();

				this.load_indicator_timer_ = setTimeout(() => {

					//this.load_indicator_.style.display = 'inline-block';
					this.load_indicator_.fadein();

				},
				125);

			}

			let element		= e.currentTarget ? e.currentTarget : e.deferredTarget;
			let attrs		= element && element.attributes ? element.attributes : {};

			this.start_		= e.start ? e.start : mili_time();
			e.start			= this.start_;
			this.ellapsed_	= 0;

			switch( e.type ) {

				case 'resize'		:
					this.window_resize_handler();
					break;

				case 'mouseup'		:

					if( e.button !== 0 )
						break;

				case 'touchend'		:

					// check for modal elements

					if( attrs.alert ) {

						// switch off product image large view
						//xpath_eval_single('html/body/div[@alert]').fadeout('inline-block');
						element.fadeout('inline-block');
						state.page_state_.alert_ = false;
						break;

					}
				
					if( attrs.plargeimg ) {

						// switch off product image large view
						//let largeimg = xpath_eval_single('html/body/div[@plargeimg]');
						//largeimg.style.display = 'none';
						element.fadeout('inline-block');
						state.page_state_.large_img_view_ = false;
						break;

					}

					// block input while modal element showing
					if( state.page_state_.alert_ || state.page_state_.large_img_view_ )
						break;

						if( attrs.btn && element.ascend('plist_controls/pcontrols') ) {

						if( attrs.prev_page ) {

							new_page_state = this.btn_prev_page_handler(cur_paging_state);

						}
						else if( attrs.next_page ) {

							new_page_state = this.btn_next_page_handler(cur_paging_state);

						}
						else if( attrs.first_page ) {

							new_page_state = this.btn_first_page_handler(cur_paging_state);

						}
						else if( attrs.last_page ) {

							new_page_state = this.btn_last_page_handler(cur_paging_state);

						}

					}
					else if( attrs.btc ) {

						new_page_state = this.btc_handler(cur_page_state, element, attrs);

					}
					else if( attrs.btn && element.ascend('psort_controls/pcontrols') ) {

						if( attrs.list_sort_order ) {

							new_page_state = this.btn_list_sort_order_handler();

						}
						else if( attrs.list_sort_direction ) {

							new_page_state = this.btn_list_sort_direction_handler();

						}

					}
					else if( attrs.btn && attrs.back ) {

						new_page_state = this.btn_back_handler();

					}
					else if( attrs.pimg && element.ascend('pitem/ptable/plist') ) {

						new_page_state = this.pimg_pitem_ptable_plist_handler(element);

					}
					else if( attrs.pimg && (element.ascend('pinfo') || element.ascend('pitem/middle')) && !attrs.touchmove ) {

						this.pimg_pinfo_handler(cur_page_state, element);

					}
					else if( attrs.btn && element.ascend('pcontrols/pcart') ) {

						if( attrs.prev_page ) {

							new_page_state = this.btn_prev_page_pcontrols_pcart_handler(cur_page_state);

						}
						else if( attrs.next_page ) {

							new_page_state = this.btn_next_page_pcontrols_pcart_handler(cur_page_state);

						}

					}
					else if( attrs.btn && element.ascend('pitem/ptable/pcart') ) {

						// change cart
						let product = element.parentNode.attributes.uuid.value;

						if( attrs.plus_one ) {

							new_page_state = this.btn_plus_one_pitem_ptable_pcart_handler(cur_page_state, product);

						}
						else if( attrs.minus_one ) {

							new_page_state = this.btn_minus_one_pitem_ptable_pcart_handler(cur_page_state, product);

						}

					}
					else if( attrs.btn && element.ascend('pright/pinfo') ) {

						new_page_state = this.pright_pinfo_handler(element, cur_page_state);

					}
					else if( attrs.buy && element.ascend('pitem/ptable/plist') ) {

						new_page_state = this.btn_buy_pright_pinfo_handler(element.parentNode.attributes.uuid.value, 1, element.parentNode.attributes.price.value);

					}
					else if( attrs.btn && attrs.drop && element.ascend('cart_informer') ) {

						new_page_state = this.btn_drop_cart_informer_handler();

					}
					else if( attrs.btn && attrs.cart && element.ascend('cart_informer') ) {

						new_page_state = this.btn_cart_cart_informer_handler();

					}
					else if( attrs.btn && attrs.cheque && element.ascend('cart_informer') ) {

						new_page_state = this.btn_cheque_cart_informer_handler(cur_page_state);

					}
					else if( attrs.btn && attrs.selections ) {

						new_page_state = this.btn_selections_handler(cur_page_state, cur_paging_state);

					}
					else if( attrs.value && element.ascend('values/property/selections_frame/categories') ) {

						new_page_state = this.checkbox_values_property_selections_frame_handler(element);

					}
					else if( attrs.btn && attrs.clear_selections ) {

						new_page_state = this.btn_clear_selections_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.btn && attrs.select_by_car ) {

						new_page_state = this.btn_select_by_car_handler(cur_page_state, cur_paging_state);

					}
					else if( attrs.value && element.ascend('values/select_by_car_frame/categories') ) {

						new_page_state = this.values_select_by_car_frame_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.btn && attrs.clear_select_by_car ) {

						new_page_state = this.btn_clear_select_by_car_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.pdescription && element.ascend('pmid/pinfo') ) {

						let e = xpath_eval_single('html/body/div[@pinfo]/div[@pmid]/div[@pproperties]');

						if( e.style.display === 'none' ) {

							e.fadein();

						}
						else {

							e.fadeout();
							element.fadein();

						}

					}
					else if( attrs.vk ) {

						new_page_state = this.btn_vk_handler(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.btn && attrs.scan && !attrs.touchmove ) {

						this.btn_scan_handler();

					}
					else if( attrs.btn && attrs.order && !attrs.touchmove ) {

						new_page_state = this.btn_cheque_cart_informer_handler(cur_page_state);

					}
					else if( attrs.btn && element.ascend('pitem/middle') && !attrs.touchmove ) {
						// change cart
						let product = element.parentNode.attributes.uuid.value;

						if( attrs.plus_one ) {

							new_page_state = this.btn_dst_plus_one_pitem_handler(cur_page_state, product);

						}
						else if( attrs.minus_one ) {

							new_page_state = this.btn_dst_minus_one_pitem_handler(cur_page_state, product);

						}
						else if( attrs.discount ) {

							this.switch_dst_discount_middle_pitem(element);

						}
						else if( attrs.discount_price ) {
							let btn = xpath_eval_single('div[@btn and @discount]', element.parentNode);
							btn.setAttribute('mode', 'percent');
							element.display(false);
							xpath_eval_single('div[@btn and @discount_percent]', element.parentNode).display(true);
						}
						else if( attrs.discount_percent ) {
							let btn = xpath_eval_single('div[@btn and @discount]', element.parentNode);
							btn.setAttribute('mode', 'price');
							element.display(false);
							xpath_eval_single('div[@btn and @discount_price]', element.parentNode).display(true);
						}
						else if( attrs.discount_accept ) {
							let holder = xpath_eval_single('div[@btn and @discount]', element.parentNode);
							if( holder.attributes.value ) {
								let value = holder.attributes.value.value;
								if( !value.isEmpty() ) {
									new_page_state = this.btn_dst_discount_accept_handler(cur_page_state, product, value);
									this.switch_dst_discount_middle_pitem(holder);
								}
							}
						}
					}
					else if( attrs.discount_value && element.ascend('discount_value/pitem/middle') && !attrs.touchmove ) {
					}
					else if( attrs.pitem && element.ascend('middle')
						&& !(((e.target.attributes.btn || e.target.attributes.pimg) && e.target.ascend('pitem/middle')) || e.target.ascend('discount_value/pitem/middle'))
						&& !attrs.touchmove ) {

						new_page_state = this.switch_dst_middle_pitem(cur_page_state, cur_paging_state, element);

					}
					else if( attrs.order && element.ascend('orders_panel')
						&& !(e.target.attributes.btn && e.target.ascend('order/orders_panel'))
						&& !attrs.touchmove ) {
						
						for( let p of xpath_eval('div[@btn]', element) )
							p.display(!attrs.expanded);

						if( attrs.expanded )
							element.removeAttribute('expanded');
						else
							element.setAttribute('expanded', '');

					}
					else if( attrs.btn && element.ascend('order/orders_panel') && !attrs.touchmove ) {

						let order = element.parentNode.attributes.uuid.value;

						// switch on search panel
						if( attrs.customer ) {
							let panel = xpath_eval_single('html/body/div[@search_panel]');
							panel.display(true);
							panel.setAttribute('view', 'customers');
							panel.setAttribute('order', order);
							xpath_eval_single('html/body/i[@btn and @vks]').display(false);
							xpath_eval_single('input[@vks]', panel).focus();
							xpath_eval_single('input[@vks]', panel).click();
							cur_page_state.search_panel_ = true;
						}
						else if( attrs.remove ) {
							[ new_page_state ] = this.clone_page_state();

							let request = {
								'module'		: 'orderer',
								'handler'		: 'orderer',
								'order'			: order,
								'remove'		: true
							};

							if( cur_page_state.authorized_ && cur_page_state.auth_ ) {
								request.user = cur_page_state.auth_.user_uuid;
								request.pass = cur_page_state.auth_.pass;
							}

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;

							if( new_page_state && new_page_state.modified_ ) {

								if( this.pending_orders_ ) {
									this.setup_pending_orders_refresh();
								}
								else {
									let p = xpath_eval_single('html/body/div[@middle]/div[@orders_panel]/div[@order and @uuid=\'' + order + '\']');
									p.parentNode.removeChild(p);
								}

								new_page_state.search_panel_ = false;
							}
						}
					}
					else if( attrs.search_panel ) {
						if( document.activeElement === xpath_eval_single('input[@vks]', element) )
							document.activeElement.blur();
					}
					else if( attrs.vks && attrs.btn && element.ascend('search_panel') && !attrs.touchmove ) {
						// switch off search panel
						xpath_eval_single('html/body/div[@search_panel]').display(false);
						xpath_eval_single('html/body/i[@btn and @vks]').display(true);
						cur_page_state.search_panel_ = false;
					}
					else if( attrs.vks && element.ascend('search_panel') && !attrs.touchmove ) {

						if( element === document.activeElement ) {
							prevent_default = false;
						}
						else {
							e.stopImmediatePropagation();
							e.preventDefault();
							e.target.focus();
							e.target.click();
						}

					}
					else if( attrs.results && element.ascend('search_panel') ) {
						if( document.activeElement === xpath_eval_single('input[@vks]', element.parentNode) )
							document.activeElement.blur();
					}
					else if( attrs.result && element.ascend('results/search_panel') ) {
						let panel = element.parentNode.parentNode;

						if( !attrs.touchmove && panel.attributes.view.value === 'products' ) {
							let product = attrs.uuid.value;
							let cart_entity = cur_page_state.cart_by_uuid_[product];

							if( cart_entity ) {
								if( cart_entity.buy_quantity < cart_entity.remainder ) {
									[ new_page_state ] = this.clone_page_state();

									cart_entity = new_page_state.cart_by_uuid_[product];

									cart_entity.buy_quantity++;
									cart_entity.modified = true;

									this.render_.rewrite_cart(new_page_state);
									this.barcode_scanner_rewrite(new_page_state, cur_page_state);
									new_page_state.modified_ = true;
								}
							}
							else {
								[ new_page_state ] = this.clone_page_state();
								this.render_.rewrite_cart(new_page_state, product, 1, attrs.price.value);
								this.barcode_scanner_rewrite(new_page_state, cur_page_state);
								new_page_state.modified_ = true;
							}

							if( new_page_state && new_page_state.modified_ ) {
								// switch off search panel
								panel.display(false);
								xpath_eval_single('html/body/i[@btn and @vks]').display(true);

								if( document.activeElement === xpath_eval_single('input[@vks]', panel) )
									document.activeElement.blur();

								new_page_state.search_panel_ = false;
							}
						}
						else if( !attrs.touchmove && panel.attributes.view.value === 'customers' ) {
							[ new_page_state ] = this.clone_page_state();
							let order = panel.attributes.order.value;

							let request = {
								'module'		: 'orderer',
								'handler'		: 'orderer',
								'order'			: order,
								'customer'		: attrs.uuid.value
							};

							if( cur_page_state.authorized_ && cur_page_state.auth_ ) {
								request.user = cur_page_state.auth_.user_uuid;
								request.pass = cur_page_state.auth_.pass;
							}

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;

							if( new_page_state && new_page_state.modified_ ) {
								// switch off search panel
								panel.display(false);
								xpath_eval_single('html/body/i[@btn and @vks]').display(true);

								if( document.activeElement === xpath_eval_single('input[@vks]', panel) )
									document.activeElement.blur();

								if( this.pending_orders_ ) {
									this.setup_pending_orders_refresh();
								}
								else {
									xpath_eval_single('html/body/div[@middle]/div[@orders_panel]/div[@order and @uuid=\'' + order + '\']/div[@txt]/font[@customer_name]').innerHTML =
										xpath_eval_single('div[@txt]/font[@pname]', element).innerHTML;
								}

								new_page_state.search_panel_ = false;
							}
						}
					}
					else if( attrs.btn && attrs.vks && !attrs.touchmove ) {

						// switch on search panel
						let panel = xpath_eval_single('html/body/div[@search_panel]');
						panel.display(true).setAttribute('view', 'products');
						xpath_eval_single('html/body/i[@btn and @vks]').display(false);
						xpath_eval_single('input[@vks]', panel).focus();
						xpath_eval_single('input[@vks]', panel).click();
						cur_page_state.search_panel_ = true;

					}
					else if( attrs.logo && element.ascend('top') && !attrs.touchmove ) {
						// switch on auth panel
						let panel = xpath_eval_single('html/body/div[@auth_panel]');
						panel.display(true);

						let p = xpath_eval_single('input[@login_user]', panel);
						p.focus();
						p.click();

						p = xpath_eval_single('label[@vk_logout]', panel);
						p.display(cur_page_state.authorized_);

					}
					else if( attrs.login_user && element.ascend('auth_panel') && !attrs.touchmove ) {
						if( document.activeElement !== element ) {
							element.focus();
							element.click();
						}
					}
					else if( attrs.login_pass && element.ascend('auth_panel') && !attrs.touchmove ) {
						if( document.activeElement !== element ) {
							element.focus();
							element.click();
						}
					}
					else if( attrs.btn && element.ascend('auth_panel') && !attrs.touchmove ) {

						if( attrs.vk_login ) {
							[ new_page_state ] = this.clone_page_state();
							let panel = element.parentNode;

							let request = {
								'module'	: 'authorizer',
								'handler'	: 'authorizer',
								'login'		: true,
								'user'		: xpath_eval_single('input[@login_user]', panel).value,
								'pass'		: xpath_eval_single('input[@login_pass]', panel).value
							};

							if( !this.sha256_ )
								this.sha256_ = new Hashes.SHA256;

							request.pass = this.sha256_.hex(request.pass).toUpperCase();

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;
							new_page_state.auth_ = data.auth;
							new_page_state.authorized_ = data.auth && data.auth.authorized;

							if( new_page_state.authorized_ ) {
								element.parentNode.display(false);
								xpath_eval_single('html/body/div[@top]/div[@auth]').innerHTML = `<br>Авторизовано: ${data.auth.user}`;
							}
							else {
								for(;;) {
									let error_panel = xpath_single('div[@error]', panel);

									if( error_panel ) {
										error_panel.innerHTML = 'Ошибка авторизации, неверное имя или пароль';
										setTimeout(() => panel.removeChild(error_panel), 5000);
										break;
									}

									panel.insertAdjacentHTML('beforeend', '<div error></div>');
								}
							}

							this.barcode_scanner_rewrite(new_page_state, cur_page_state);
						}
						else if( element.attributes.vk_logout ) {
							[ new_page_state ] = this.clone_page_state();
							let panel = e.target.parentNode;

							let request = {
								'module'	: 'authorizer',
								'handler'	: 'authorizer',
								'logout'	: true
							};

							show_alert = true;
							let data = this.post_json('proxy.php', request);

							if( data.errno !== 0 )
								throw new Error(data.error + "\n" + data.stacktrace);

							new_page_state.modified_ = true;
							delete new_page_state.auth_;
							new_page_state.authorized_ = false;

							element.parentNode.display(false);
							xpath_eval_single('html/body/div[@top]/div[@auth]').innerHTML = '';
							this.barcode_scanner_rewrite(new_page_state, cur_page_state);
						}
						else if( element.attrs.vk_cancel ) {
							element.parentNode.display(false);
						}

					}

					if( attrs.touchmove )
						element.removeAttribute('touchmove');
					//Render.debug(2, e.currentTarget.innerHTML);
					break;

				case 'touchcancel'	:
					if( attrs.touchmove )
						element.removeAttribute('touchmove');
					prevent_default = false;
					break;

				case 'touchstart'	:
					if( attrs.touchmove )
						element.removeAttribute('touchmove');
					//if( attrs.middle && this.debug_ && this.dct_ ) {
					//	this.startx_ = e.touches[0].pageX;
					//	this.starty_ = e.touches[0].pageY;
					//}
					prevent_default = false;
					break;

				case 'touchmove'	:
					//if( attrs.middle && this.debug_ && this.dct_ ) {
					//	let distx = this.startx_ - e.touches[0].pageX;
					//	let disty = this.starty_ - e.touches[0].pageY;
					//	Render.debug(1, 'TM:&nbsp;' + Math.trunc(distx) + '&nbsp;' + Math.trunc(disty));
					//}
					//Render.debug(1, e.currentTarget.innerHTML);
					if( typeof element.setAttribute === 'function' )
						element.setAttribute('touchmove', '');

					prevent_default = false;
					break;

				case 'mouseover'	:
					break;

				case 'mouseout'	:
					break;

				case 'mouseenter'	:
					if( attrs.middle && this.debug_ && this.dct_ ) {
						this.startx_ = parseInt(e.clientX);
						this.starty_ = parseInt(e.clientY);
					}
					break;

				case 'mouseleave'	:
					break;

				case 'mousemove'	:
					if( attrs.middle && this.debug_ && this.dct_ ) {
						let distx = parseInt(e.clientX) - this.startx_;
						let disty = parseInt(e.clientY) - this.starty_;
						//Render.debug(0, 'ME:&nbsp;' + this.startx_ + '&nbsp;' + this.starty_);
						//Render.debug(1, 'MM:&nbsp;' + distx + '&nbsp;' + disty);
					}
					break;

				case 'blur'			:		
					this.setup_text_type_event(element, null);
					break;

				case 'focus'		:
					if( attrs.vks && element.ascend('search_panel') )
						this.setup_text_type_event(element);
					else if( attrs.discount_value && element.ascend('discount_value/pitem/middle') )
						this.setup_text_type_event(element, 100);
					else
						this.setup_text_type_event(element);
					break;

				case 'contextmenu'	:
				case 'selectstart'	:
					return false;

				// custom events
				case 'text_type'	:
					if( attrs.vks && element.ascend('search_panel') )
						this.search_panel_text_type_handler(e.detail);
					else if( attrs.discount_value && element.ascend('discount_value/pitem/middle') )
						this.discount_value_text_type_handler(element, cur_page_state, e.detail);
					break;

				case 'barcode'		:
					new_page_state = this.barcode_scan_handler(cur_page_state, e.detail);
					break;

				case 'startup'		:
					new_page_state = this.startup_handler(cur_page_state, cur_paging_state, element);
					break;

				case 'startup_auth'		:
					new_page_state = this.startup_auth_handler(cur_page_state, cur_paging_state);
					break;

				case 'away'			:
					new_page_state = this.idle_away_reload_handler(cur_page_state, cur_paging_state, element);
					break;

				case 'sse_reload'	:
					new_page_state = this.sse_reload_handler(cur_page_state, cur_paging_state, element);
					break;

				case 'vki_type'		:
					new_page_state = this.btn_vki_type_handler(e, cur_page_state, cur_paging_state, element);
					break;

			}

			// success rewrite page, save new state
			if( new_page_state && new_page_state.modified_ ) {

				this.render_.show_new_page_state(new_page_state);
				this.page_state_ = new_page_state;

				this.render_.debug_ellapsed(0, 'PAGE:&nbsp;');

			}

		}
		catch( ex ) {

			if( ex instanceof XhrDeferredException ) {
				x = ex;
				e.deferredTarget = e.currentTarget ? e.currentTarget : e.deferredTarget;
			}
			else {
				if( show_alert ) {
					this.show_alert('<pre error>' + ex.message + "\n" + ex.stack + '</pre>', cur_page_state);
					console.error(ex.message);
				}
				throw ex;
			}

		}
		finally {

			if( prevent_default ) {
				//e.stopImmediatePropagation();
				e.preventDefault();
			}

			if( !x ) {

				if( this.load_indicator_timer_ ) {

					clearTimeout(this.load_indicator_timer_);
					delete this.load_indicator_timer_;//this.load_indicator_timer_ = undefined;

				}

				if( this.load_indicator_ )
					this.load_indicator_.fadeout();//this.load_indicator_.style.display = 'none';

			}

		}

		return false;
	}

	animation_events_handler(e) {

		if( e.animationName !== 'fadein' && e.animationName !== 'fadeout' )
			return;

		let element	= e.currentTarget;
		let attrs	= element.attributes;

		if( attrs.fadein || attrs.fadeout ); else return;

		switch( e.type ) {

			case 'animationstart'	:
				break;

			case 'animationend'		:

				if( attrs.fadein )
					element.removeAttribute('fadein');

				if( attrs.fadeout ) {

					if( attrs.fadeout.value.isEmpty() )
						element.style.display = 'none';

					element.removeAttribute('fadeout');

				}

				break;

		}

		e.preventDefault();

	}

	setup_animation_events(elements, phase = false) {

		for( let element of elements )
			for( let event of [ 'animationstart', 'animationend' ] )
				add_event(element, event, e => this.animation_events_handler(e), phase);

	}

	setup_events(elements, phase = true) {

		for( let event of this.events_ )
			for( let element of (elements instanceof Array ? elements : [elements]) )
				add_event(element, event, e => this.events_handler(e), phase);

	}

	sse_handler_(e) {

		if( e.data ) {

			//console.log('message: ' + e.data + ', last-event-id: ' + e.lastEventId);
			let data = JSON.parse(e.data, JSON.dateParser);

			//if( data.timestamp )
			//	console.log(data.timestamp + ', last-event-id: ' + e.lastEventId);
			let reload = false;
			let ptable = xpath_eval_single('html/body/div[@plist]/div[@ptable]');
			let walk = function (uuids) {

				for( let uuid of uuids ) {

					let items = xpath_eval('div[@pitem and @uuid=\'' + uuid + '\']', ptable);

					if( items.length === 0 )
						continue;

					reload = true;

				}

			};

			if( data.products )
				walk(data.products);

			if( data.prices )
				walk(data.prices);

			if( data.remainders )
				walk(data.remainders);

			if( data.reserves )
				walk(data.reserves);

			if( data.system_remainders )
				walk(data.system_remainders);

			if( reload )
				window.dispatchEvent(new CustomEvent('sse_reload'));

		}

	}

	sse_start() {
		this.sseq_timer_ = setTimeout(() => this.sse_handler(), 1000);
	}

	sse_success_handler(events) {

		try {

			let ids = [];
			let reload = false;
			let table = xpath_eval_single('html/body/div[@plist]/div[@ptable]');
			let m = {};

			for( let e of xpath_eval('div[@pitem]', table) )
				if( e.attributes.uuid )
					m[e.attributes.uuid.value] = true;

			for( let e of xpath_eval('div[@pitem]/div[@pimg]', table) )
				if( e.attributes.uuid )
					m[e.attributes.uuid.value] = true;

			let walk = (uuids) => {

				for( let uuid of uuids )
					if( m[uuid] )
						reload = true;

			};

			for( let e of events ) {

				if( e.products )
					walk(e.products);

				if( e.prices )
					walk(e.prices);

				if( e.remainders )
					walk(e.remainders);

				if( e.system_remainders )
					walk(e.system_remainders);

				if( e.reserves )
					walk(e.reserves);

				if( e.images )
					walk(e.images);

				ids.push(e.id);

			}

			if( reload )
				window.dispatchEvent(new CustomEvent('sse_reload'));

			let request = {
				'module'	: 'eventer',
				'handler'	: 'eventer',
				'received'	: ids
			};

			post_json_async('proxy.php', request);

		}
		catch( e ) {

			console.log(e.message + "\n" + e.stack);
			this.sse_start();
			throw e;

		}

		this.sse_start();

	}

	sse_error_handler(msg, xhr) {

		console.log(msg);
		this.sse_start();

	}

	sse_handler() {

		let request = {
			'module'	: 'eventer',
			'handler'	: 'eventer',
			'get'		: true
		};

		post_json_async(
			'proxy.php',
			request,
			(data)		=> this.sse_success_handler(data.events),
			(msg, xhr)	=> this.sse_error_handler(msg, xhr)
		);

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageManager extends HtmlPageEvents {

	constructor() {
		super();
	}

	startup() {

		this.dct_ = location_search().dct;
		this.cst_ = !this.dct_; // customer terminal mode
		this.debug_ = location_search().debug;

		this.window_resize_handler();

		// Intl not work under android
		//this.date_formatter_ = date => {
		//	let f = new Intl.DateTimeFormat('ru-RU', {
		//		year	: 'numeric', 
		//		month	: '2-digit',
		//		day		: '2-digit',
		//		hour	: '2-digit',
		//		minute	: '2-digit',
		//		second	: '2-digit',
		//		hour12	: false
		//	});
		//	return f.format(date);
		//};
		this.date_formatter_ = date => strftime('%d.%m.%Y %H:%M:%S', date);

		Render.hide_cursor();

		this.setup_animation_events(xpath_eval('//*[@fadein or @fadeout]'));
		this.setup_events(xpath_eval('html/body/div[@btn]'));

		if( this.cst_ ) {
			this.setup_events(xpath_eval('html/body/div[@pcontrols]/div[@plist_controls or @psort_controls]/div[@btn]'));
			this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pright]/div[@btn]'));
			this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pmid]/div[@pdescription]'));
			this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pimg]'));
			this.setup_events(xpath_eval('html/body/div[@top]/div[@cart_informer]/div[@btn]'));
		}

		this.setup_events(xpath_eval('html/body/div[@plargeimg or @alert]'));

		if( this.dct_ ) {
			this.setup_events([document]);
			this.setup_events(xpath_eval('html/body'));
			this.setup_events(xpath_eval('html/body/div[@middle]'));
			this.setup_events(xpath_eval('html/body/i[@btn]'));
			this.setup_events(xpath_eval_single('html/body/div[@search_panel]/div[@results]'));

			this.setup_events(xpath_eval('html/body/div[@search_panel]/label'), false);
			this.setup_events(xpath_eval('html/body/div[@search_panel]/input'), false);
			this.setup_events(xpath_eval_single('html/body/div[@top]/div[@logo]'), false);

			this.setup_events(xpath_eval('html/body/div[@auth_panel]/label'), false);
			this.setup_events(xpath_eval('html/body/div[@auth_panel]/input'), false);
		}

		this.setup_events(xpath_eval('html/body/div[@pcart]/div[@pcontrols]/div[@btn]'));

		this.render_ = new Render;
		this.render_.state = this;

		if( this.cst_ ) {
			add_event(window, 'sse_reload', e => this.events_handler(e), false);
			this.sse_start();

			add_event(window, 'away', e => this.events_handler(e), false);
			this.idle_away_reloader_ = new Idle({
				oneshot	: false,
				retry	: true,
				start	: true,
				timeout	: 60000, // 60s
				away	: () => {
					window.dispatchEvent(new CustomEvent('away'));
				}
			});

			// virtual keyboard initiator
			add_event(window, 'vki_type', e => this.events_handler(e), false);
			this.setup_events(xpath_eval('html/body/img[@vk]'));
			let vki_iframe_content = xpath_eval_single('html/body/iframe[@vk]').contentWindow;
			vki_iframe_content.vki_callback = (e, keyboard, el, status) => this.vk_input_callback_handler(e, keyboard, el, status);
		}

		add_event(window, 'resize', e => this.events_handler(e), false);

		if( !this.debug_ ) { // disable text selection and context menu
			add_event(document, 'contextmenu', (e) => { e.preventDefault(); return false; }, true);
			add_event(document, 'selectstart', (e) => { e.preventDefault(); return false; }, true);
		}

		if( this.dct_ )
			add_event(window, 'barcode', e => this.events_handler(e), false);

		add_event(window, 'startup', e => this.events_handler(e), false);
		add_event(window, 'startup_auth', e => this.events_handler(e), false);
		setTimeout(() => {
			window.dispatchEvent(new CustomEvent('startup_auth'));
			window.dispatchEvent(new CustomEvent('startup'));
		});
	}
}
//------------------------------------------------------------------------------
function dct_html_body() {
	return `
		<div top>
			<div logo></div>
			<div auth></div>
			<div cart_informer>
				<div cinfo>
					<p ccount></p>
					<p csum></p>
				</div>
				<div btn cheque>
					<img btn_ico src="assets/cheque.ico">
					<span btn_txt>ПРЕДЧЕК</span>
				</div>
				<div btn cart>
					<img btn_ico src="assets/cart/cart_edit.ico">
					<span btn_txt>ИЗМЕНИТЬ</span>
				</div>
				<div btn drop>
					<img btn_ico src="assets/cart/cart_delete.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>
			</div>
		</div>
		<div middle>
			<div scanner fadein>
				<div viewport></div>
			</div>
			<!--<iframe scanner src="assets/scanner/index.html"></iframe>-->
			<div orders_panel></div>
		</div>
		<i btn scan></i>
		<i btn order></i>
		<i btn vks blink2></i>
		<div mount>
			<p>&nbsp;</p>
			<p mag></p>
			<p address></p>
		</div>
		<div plargeimg fadein></div>
		<div alert fadein></div>
		<div search_panel>
			<input vks text_type placeholder="Вводите текст поиска ..." type="text">
			<label vks btn blink2></label>
			<div results></div>
		</div>
		<div auth_panel>
			<input login_user placeholder="Регистрационное имя ..." type="text">
			<br>
			<input login_pass placeholder="Пароль ..." type="password">
			<br>
			<label btn vk_login blink2></label>
			<label btn vk_logout blink2></label>
			<label btn vk_cancel></label>
		</div>
		<audio id="scanner_beep">
			<source src="assets/scanner/beep-07.ogg" type="audio/ogg">
			<source src="assets/scanner/beep-07.mp3" type="audio/mpeg">
			<source src="assets/scanner/beep-07.wav" type="audio/x-wav">
		</audio>
	`;
}
//------------------------------------------------------------------------------
function cst_html_body() {
	return `
		<div top>
			<div logo></div>
			<div mag></div>
			<div cart_informer>
				<div cinfo>
					<p ccount></p>
					<p csum></p>
				</div>
				<div btn cheque>
					<img btn_ico src="assets/cheque.ico">
					<span btn_txt>ПРЕДЧЕК</span>
				</div>
				<div btn cart>
					<img btn_ico src="assets/cart/cart_edit.ico">
					<span btn_txt>ИЗМЕНИТЬ</span>
				</div>
				<div btn drop>
					<img btn_ico src="assets/cart/cart_delete.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>
			</div>
		</div>
		<div categories></div>
		<div btn back fadein>
			<img btn_ico src="assets/arrows/arrow_undo.ico">
			<span btn_txt>НАЗАД</span>
		</div>
		<div btn selections fadein>
			<img btn_ico src="assets/filter.ico">
			<span btn_txt>&nbsp;&nbsp;ФИЛЬТР&nbsp;&nbsp;</span>
		</div>
		<div btn select_by_car fadein>
			<img btn_ico src="assets/car.ico">
			<span btn_txt>АВТОМОБИЛЬ</span>
		</div>
		<div plist fadein>
			<div ptable></div>
		</div>
		<div pcontrols>
			<div psort_controls>
				<div btn list_sort_order fadein>
					<span btn_txt></span>
					<img btn_ico src="">
				</div>
				<div btn list_sort_direction fadein>
					<img btn_ico src="">
				</div>
			</div>
			<div plist_controls>
				<div btn first_page fadein>
					<img btn_ico_condensed src="assets/arrows/arrow_left.ico">
					<img btn_ico_condensed src="assets/arrows/arrow_left.ico">
				</div>
				<div btn prev_page fadein>
					<span btn_txt></span>
					<img btn_ico src="assets/arrows/arrow_left.ico">
				</div>
				<div btn next_page fadein>
					<img btn_ico src="assets/arrows/arrow_right.ico">
					<span btn_txt></span>
				</div>
				<div btn last_page fadein>
					<img btn_ico_condensed src="assets/arrows/arrow_right.ico">
					<img btn_ico_condensed src="assets/arrows/arrow_right.ico">
					<span btn_txt></span>
				</div>
			</div>
		</div>
		<div pinfo fadein>
			<div pimg></div>
				<div pmid>
				<p pname></p>
				<hr><p pproperties_head>Характеристики</p><hr>
				<div pproperties fadein></div>
				<div pdescription fadein></div>
			</div>
			<div pright>
				<p pprice></p>
				<p pquantity></p>
				<p pincart></p>
				<div btn minus_one fadein>
					<img btn_ico src="assets/minus.ico">
				</div>
				<p pbuy_quantity></p>
				<div btn plus_one fadein>
					<img btn_ico src="assets/plus.ico">
				</div>
				<div btn buy>
					<img btn_ico src="assets/cart/cart_put.ico">
					<span btn_txt>КУПИТЬ</span>
				</div>
				<hr><p premainders_head>Наличие в магазинах</p><hr>
				<div premainders></div>
			</div>
		</div>
		<div plargeimg fadein></div>
		<div pcart fadein>
			<div ptable></div>
			<div pcontrols>
				<div btn prev_page fadein>
					<span btn_txt></span>
					<img btn_ico src="assets/arrows/arrow_left.ico">
				</div>
				<div btn next_page fadein>
					<img btn_ico src="assets/arrows/arrow_right.ico">
					<span btn_txt></span>
				</div>
			</div>
		</div>
		<div middle></div>
		<div mount></div>
		<div alert fadein></div>

		<iframe cheque_print copy="1" src="assets/print/cheque_template.html"></iframe>
		<iframe cheque_print copy="2" src="assets/print/cheque_template.html"></iframe>

		<img vk fadein src="assets/vk/jquery/keyboard.svg">

		<div barcode></div>

		<div class="cssload-container" fadein>
			<div class="cssload-text">
				<span>ЗАГРУЗКА<br>ЖДИТЕ...</span>
			</div>
			<div class="cssload-bell">
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
				<div class="cssload-circle">
					<div class="cssload-inner"></div>
				</div>
			</div>
		</div>
	`;
}
//------------------------------------------------------------------------------
function core() {
	let qp = location_search();
	//let browser = get_browser();
	let t = qp.dct ? dct_html_body() : cst_html_body();

	if( qp.debug && qp.dct && !SmartPhone.isAny() )
		t += '<img debug_barcode src="assets/scanner/barcode-7638900411416.svg">';

	document.getElementsByTagName('body')[0].insertAdjacentHTML('beforeend', t.replace(/(?:[\r\n\t])/g, ''));
	//document.getElementsByTagName('title')[0].innerText = 'Терминал сбора данных, ТСД (data collection terminal, DCT)';

	if( qp.debug ) {

		let div = document.createElement('div');
		div.setAttribute('debug', '');
		div.innerHTML = `
			<div debug="0"></div><div debug="1"></div>
			<div debug="2"></div><div debug="3"></div>
			<div debug="4"></div><div debug="5"></div>
			<div debug="6"></div><div debug="7"></div>
			<div debug="8"></div><div debug="9"></div>
		`.replace(/(?:[\r\n\t])/g, '');

		let body = document.getElementsByTagName('body')[0];
		body.appendChild(div);

		let lnk = document.createElement('link');
		lnk.setAttribute('rel', 'stylesheet');
		lnk.setAttribute('type', 'text/css');
		lnk.setAttribute('href', 'css/debug.css');

		let head = document.getElementsByTagName('head')[0];
		head.appendChild(lnk);

	}

	if( !qp.dct ) {

		//<iframe vk fadein src="assets/vk/jquery/vk.html"></iframe>
		let iframe = document.createElement('iframe');
		iframe.setAttribute('seamless', '');
		iframe.setAttribute('frameborder', 0);
		iframe.setAttribute('scrolling', 'no');
		iframe.setAttribute('vk', '');
		iframe.setAttribute('fadein', '');
		iframe.src = 'assets/vk/jquery/vk.html';
		iframe.onload = () => {
			if( qp.debug )
				return;

			let doc = iframe.contentWindow.document;
			let body = doc.body;
			let html = doc.documentElement;
			
			//let vki_iframe_content = xpath_eval_single('html/body/iframe[@vk]').contentWindow;
			let vki_iframe_document = iframe.contentWindow.document;
			let lnk = vki_iframe_document.createElement('link');
			lnk.setAttribute('rel', 'stylesheet');
			lnk.setAttribute('type', 'text/css');
			lnk.setAttribute('href', 'vkn.css');

			vki_iframe_document.getElementsByTagName('head')[0].appendChild(lnk);
		};

		xpath_eval_single('html/body').insertBefore(iframe, xpath_eval_single('html/body/img[@vk]').nextElementSibling);
	}

	manager = new HtmlPageManager;
	manager.startup();

	// TODO: debug only, need to remove
	//let barcode_render = new barcode_ean13_render({ width: 7.62 });
	//let barcode_html = barcode_render.draw_barcode('5099206021877');

	//xpath_eval_single('html/body/div[@barcode]').innerHTML = barcode_html;

	/*{
		//let c = xpath_eval_single('html/body/canvas[@id=\'■\']');
		let c = document.createElement('Canvas');
		c.style.position = 'fixed';
		c.style.left = '10px';
		c.style.top = '80px';
		c.style.zIndex = 999;
		c.style.border = 'solid 1px black';
		c.width = c.height = 300;
		document.getElementsByTagName('body')[0].appendChild(c);
		let ctx = c.getContext('2d');
		ctx.imageSmoothingEnabled = false;
		//ctx.translate(c.width, c.height);
		// 1 metre is equal to 237.10630158366 em
		// 1 mm is equal to 0.28453 em
		ctx.textBaseline = 'top';
		ctx.textAlign = 'left';
		ctx.font = '638px Arial';
		ctx.font = '300px Arial';
		ctx.fillStyle = 'black';
		ctx.fillText('■', 0, -30);
		//ctx.fillRect(0, 0, 5, 5);
		//document.getElementsByTagName('body')[0].removeChild(c);
		console.log(screen.width, screen.height);

		let imgData = ctx.getImageData(0, 0, c.width, c.height);
		// array [r,g,b,a,r,g,b,a,r,g,..]

		function getPixel(imgData, index) {
			let i = index * 4, d = imgData.data;
			return [ d[i], d[i + 1], d[i + 2], d[i + 3] ]; // array [R,G,B,A]
		}

		// AND/OR

		function getPixelXY(imgData, x, y) {
			let i = (y * imgData.width + x) * 4, d = imgData.data;
  			return [ d[i], d[i + 1], d[i + 2], d[i + 3] ]; // array [R,G,B,A]
		}

		function getPixelAlpha(imgData, x, y) {
			let i = (y * imgData.width + x) * 4, d = imgData.data;
  			return d[i + 3];
		}

		let data = imgData.data;
		let width = imgData.width;
		let pitch = width * 4;
		let find_corner = (d) => {
			let s = d > 0 ? 0 : width - 1;
			let t = d > 0 ? 0 : width;

			for( let i = s; d > 0 ? i < width : i >= 0; i += d ) {
				if( data[pitch * i + i * 4 + 3] === 0 )
					continue;

				let x = i, y = i;

				for(;;) {
					let lp = x !== t ? data[pitch * y + (x - d) * 4 + 3] : 0;
					let tp = y !== t ? data[pitch * (y - d) + x * 4 + 3] : 0;

					if( lp !== 0 )
						x -= d;
					else if( tp !== 0 )
						y -= d;
					else
						break;
				}

				return [ x, y ];
			}
		};

		let [ x1, y1 ] = find_corner(+1);
		let [ x2, y2 ] = find_corner(-1);

		console.log(x1, y1, x2, y2, (x2 - x1 + 1) / (y2 - y1 + 1));
		Render.debug(2, '' + x1 + ', ' + y1 + ', ' + x2 + ', ' + y2 + ', ' + (x2 - x1 + 1) / (y2 - y1 + 1));
	}*/
	//Render.debug(2, res().dpi);
	//Render.debug(3, verge.aspect(screen));
}
//------------------------------------------------------------------------------
