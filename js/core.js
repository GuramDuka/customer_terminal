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
			vk_							: false,
			fts_filter_					: ''
		};

		// render
		this.start_ 		= mili_time();
		this.ellapsed_		= 0;

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

		let m = xpath_eval('html/body/div[@debug]');

		if( m.length === 0 )
			return;

		let p = xpath_eval_single('p[@debug' + level + ']', m[0]);

		p.innerHTML = s;
		p.style.display = s !== null ? 'inline-block' : 'none';

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
					+ '<img btn_ico src="/resources/assets/cart/cart_put.ico">'
					//+ '<span btn_txt>КУПИТЬ</span>'
					+ '</div>'
					+ '</div>';
				;

			element.innerHTML = html;

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
				price		= Math.trunc(product.price) + '&nbsp;₽';
				quantity	= this.get_remainder(product) + this.get_reserve(product);

				style.visibility = 'visible';

				a.setAttribute('uuid'		, uuid);
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
		pproperties_element.innerHTML = html;

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

		xpath_eval_single('div[@pright]/p[@pprice]'		, pinfo_element).innerHTML	= 'Цена&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;' + Math.trunc(product.price) + '&nbsp;₽';
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

		xpath_eval_single('div[@pright]/div[@premainders]', pinfo_element).innerHTML = html;
		xpath_eval_single('div[@pright]/p[@premainders_head]', pinfo_element).fade(data.remainders.length > 0);

		for( let e of xpath_eval('div[@pright]/hr', pinfo_element) )
			e.fade(data.remainders.length > 0);

		e = xpath_eval_single('div[@pmid]/div[@pdescription]', pinfo_element);
		//e.innerHTML = product.description ? product.description_in_html ? product.description : `<pre>${product.description}</pre>` : '';
		e.innerHTML = product.description ? product.description : '';

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

			xpath_eval_single('p[@ccount]'	, cinfo).innerText = 'В корзине: ' + ccount + ' товар' + (ccount == 1 ? '' : ccount <= 4 ? 'а' : 'ов');
			xpath_eval_single('p[@csum]'	, cinfo).innerHTML = 'На сумму : ' + csum + '&nbsp;₽';

		}

	}

	assemble_cart(new_page_state, data) {

		let state = this.state_;
		let pcrin = xpath_eval_single('html/body/div[@top]/div[@cart_informer]/div[@btn and @cart]');
		let base = xpath_eval_single('html/body/div[@pcart]');
		let element = xpath_eval_single('div[@ptable]', base);
		let cart = new_page_state.cart_;

		if( !new_page_state.cart_page_size_ ) {
			//let height = sscanf(getComputedStyle(element).height, '%u')[0];
			//let line_height = sscanf(getComputedStyle(pcrin).height, '%u')[0];
			//new_page_state.cart_page_size_ = page_size = Math.trunc(height / line_height);
			new_page_state.cart_page_size_ = navigator.userAgent.match(/altair$/i) ? 9 : Math.trunc(9 * 720 / 390);
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
					+ '<img btn_ico src="/resources/assets/plus.ico">'
					+ '</div>'
					+ '<span pbuy_quantity></span>'
					+ '<div btn minus_one>'
					+ '<img btn_ico src="/resources/assets/minus.ico">'
					+ '</div>'
					+ '</div>'
				;

			element.innerHTML = html;

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
				xpath_eval_single('span[@pprice]'			, a).innerHTML				= Math.trunc(e.price) + '&nbsp;₽';
				xpath_eval_single('span[@psum]'				, a).innerHTML				= Math.trunc(e.price) * e.buy_quantity + '&nbsp;₽';
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

		let data = post_json_sync('proxy.php', request);
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

		let data = post_json_sync('proxy.php', request);
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

	rewrite_cart(new_page_state = null, product = null_uuid, buy_quantity = null) {

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

			request.products.push({
				'uuid'		: product,
				'quantity'	: buy_quantity
			});

		}

		for( let e of new_page_state.cart_ ) {

			if( !e.modified )
				continue;

			if( !request.products )
				request.products = [];

			let req = {
				'uuid'		: e.uuid,
				'quantity'	: e.buy_quantity
			};

			request.products.push(req);

		}

		let data = post_json_sync('proxy.php', request);
		//state.ellapsed_ += data.ellapsed;

		new_page_state.cart_ = data.cart;
		new_page_state.cart_by_uuid_ = {};

		for( let e of data.cart )
			new_page_state.cart_by_uuid_[e.uuid] = e;

		this.assemble_cart_informer(new_page_state, data);
		this.assemble_cart(new_page_state, data);

		if( product === new_page_state.product_ ) {
	
			cart_entity = new_page_state.cart_by_uuid_[product];
			xpath_eval_single('html/body/div[@pinfo]/div[@pright]/p[@pincart]').innerHTML = cart_entity ? 'Заказано:&nbsp;' + cart_entity.buy_quantity : '';

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
		element.innerHTML = html;

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

		let data = post_json_sync('proxy.php', request);

		this.assemble_selections(new_page_state, data);

	}

	assemble_select_by_car(new_page_state, data) {

		let state = this.state_;
		let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];
		let select_by_car_state = new_paging_state.select_by_car_state_;
		let html = '';

		for( let i = 0; i < data.values.length; i++ ) {

			let v = data.values[i];

			html = html + `
				<div value uuid="${v.uuid}">
				${v.value}
				</div>`
			;

		}

		new_paging_state.select_by_car_state_.values = data.values;

		if( data.car )
			new_paging_state.select_by_car_state_.car = data.car;

		let frame = xpath_eval_single('html/body/div[@categories]/div[@select_by_car_frame and @uuid=\'' + new_page_state.category_ + '\']');
		let e = xpath_eval_single('div[@values]', frame);
		e.innerHTML = html;

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

		let data = post_json_sync('proxy.php', request);

		this.assemble_select_by_car(new_page_state, data);

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

		let data = post_json_sync('proxy.php', request);
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
					<img btn_ico src="/resources/assets/filter_clear.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>`
			;

			html = html + `
				<div select_by_car_frame fadein instant uuid="${c.uuid}">
					<div selector manufacturer>
						<!--<span ico search_field></span>
						<span ico list_box></span>-->
						<span label>Производитель</span>
						<img arrow src="/resources/assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector model>
						<span label>Модель</span>
						<img arrow src="/resources/assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector modification>
						<span label>Модификация</span>
						<img arrow src="/resources/assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector year>
						<span label>Год выпуска</span>
						<img arrow src="/resources/assets/arrows/arrow_right.ico">
						<span value></span>
					</div>
					<div selector values></div>
				</div>
				<div btn clear_select_by_car uuid="${c.uuid}">
					<img btn_ico src="/resources/assets/car_clear.ico">
					<span btn_txt>ОЧИСТИТЬ</span>
				</div>`
			;

		}

		element.innerHTML = html;

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

		let plist = xpath_eval_single('html/body/div[@plist]');
		let pinfo = xpath_eval_single('html/body/div[@pinfo]');
		let backb = xpath_eval_single('html/body/div[@btn and @back]');
		let selsb = xpath_eval_single('html/body/div[@btn and @selections]');
		let carbb = xpath_eval_single('html/body/div[@btn and @select_by_car]');
		let pcart = xpath_eval_single('html/body/div[@pcart]');
		let pctrl = xpath_eval_single('html/body/div[@pcontrols]');
		let pcrin = xpath_eval_single('html/body/div[@top]/div[@cart_informer]');
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

		largeimg.style.backgroundImage = element.style.backgroundImage;
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

	btn_buy_pright_pinfo_handler(product, buy_quantity) {

		let [ new_page_state ] = this.clone_page_state();

		new_page_state.modified_ = true;

		this.render_.rewrite_cart(new_page_state, product, buy_quantity);

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

			new_page_state = this.btn_buy_pright_pinfo_handler(product, buy_quantity);

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

		try {

			let data = post_json_sync('proxy.php', request);
			//state.ellapsed_ += data.ellapsed;

			if( data.errno !== 0 )
				throw new Error(data.error + "\n" + data.stacktrace);

			if( data.order.availability ) {

				// fail, modify buy quantities and show cart alert

				for( let p of data.order.availability ) {

					let e = new_page_state.cart_by_uuid_[p.product];

					if( e.buy_quantity > p.remainder - p.reserve ) {

						e.buy_quantity = p.remainder - p.reserve;
						e.modified = true;

					}

					//data.availability[i].product
					//data.availability[i].remainder
					//data.availability[i].reserve
					//data.availability[i].quantity
					//data.availability[i].na

				}

				this.render_.rewrite_cart(new_page_state);

				let msg = 'Недостаточное количество товара для заказа, Ваш заказ изменён, проверьте пожалуйста и попробуйте ещё раз';
				this.show_alert(msg, new_page_state, 15000);

				new_page_state.cart_edit_ = new_page_state.cart_.length > 0;

			}
			else {

				// success, print cheque

				for( let ncopy = 1; ncopy <= 2; ncopy++ ) {

					let iframe_content = xpath_eval_single('html/body/iframe[@cheque_print and @copy=\'' + ncopy + '\']').contentWindow;
					let iframe	= iframe_content.document;

					let head	= xpath_eval_single('html/body/div[@head]', iframe, iframe);
					xpath_eval_single('p[@node_name]'			, head, iframe).innerHTML = data.order.name;
					xpath_eval_single('p[@uuid]'				, head, iframe).innerHTML = data.order.uuid;
					xpath_eval_single('p[@number]'				, head, iframe).innerHTML = 'Заказ&nbsp;:&nbsp;' + data.order.number;
					xpath_eval_single('p[@date]'				, head, iframe).innerHTML = 'Время&nbsp;:&nbsp;' + data.order.date.toLocaleFormat('%d.%m.%Y %H:%M:%S');
					xpath_eval_single('p[@barcode]'				, head, iframe).innerHTML = 'EAN13&nbsp;:&nbsp;' + data.order.barcode;

					let table = xpath_eval_single('html/body/div[@table]', iframe, iframe);
					let html = '';

					for( let i = 0; i < new_page_state.cart_.length; i++ ) {

						let e = new_page_state.cart_[i];

						html = html + `
							<p product>
							${i + 1}. ${e.name + ' [' + e.code + ']'} ${Math.trunc(e.price) + '₽'} ${e.buy_quantity + '&nbsp;шт'}
							<span psum>&nbsp;=${Math.trunc(e.price) * e.buy_quantity + '₽'}</span>
							</p>`
						;

					}

					table.innerHTML = html;

					let footer = xpath_eval_single('html/body/div[@footer]', iframe, iframe);
					xpath_eval_single('p[@totals]/span[@txt]'	, footer, iframe).innerHTML = 'Сумма:';
					xpath_eval_single('p[@totals]/span[@sum]'	, footer, iframe).innerHTML = data.order.totals + '₽';

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

				// successfully, clear cart now
				for( let e of new_page_state.cart_ ) {

					e.buy_quantity = 0;
					e.modified = true;

				}

				this.render_.rewrite_cart(new_page_state);

				new_page_state.cart_edit_ = false;

			}

			new_page_state.product_ = null_uuid;

		}
		catch( ex ) {

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

			if( new_paging_state.select_by_car_ )
				this.render_.rewrite_select_by_car(new_page_state);

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

		return new_page_state;

	}

	btn_vk_handler(cur_page_state, cur_paging_state, element) {

		let [ new_page_state, new_paging_state ] = this.clone_page_state();

		new_page_state.vk_ = !cur_page_state.vk_;
		new_page_state.modified_ = true;

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

			let e = xpath_eval_single('html/body/img[@vk]');
			let evt = document.createEvent('MouseEvents');
			evt.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			e.dispatchEvent(evt);

		}

		if( change ) {

			//let vki_iframe_content = xpath_eval_single('html/body/iframe[@vk]').contentWindow;
			//let vki_iframe_document = vki_iframe_content.document;
			//let e = xpath_eval_single('html/body/div/input[@vki]', vki_iframe_document, vki_iframe_document);
			//e = e;

			if( this.page_state_.fts_value_ !== keyboard.preview.value ) {

				this.page_state_.fts_filter_ = keyboard.preview.value;

				this.start_		= mili_time();
				this.ellapsed_	= 0;
				this.render_.rewrite_page();
				this.render_.debug_ellapsed(0, 'PAGE:&nbsp;');

			}

		}

	}

	events_handler(e) {

		let touchobj, startx, dist;

		let state		= this;
		let element		= e.currentTarget;
		let attrs		= element.attributes;

		this.start_		= mili_time();
		this.ellapsed_	= 0;

		let cur_page_state = state.page_state_;
		let cur_paging_state = state.page_state_.paging_state_by_category_[state.page_state_.category_];
		let new_page_state;

		switch( e.type ) {

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
				else if( attrs.pimg && element.ascend('pinfo') ) {

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

					new_page_state = this.btn_buy_pright_pinfo_handler(element.parentNode.attributes.uuid.value, 1);

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

		// success rewrite page, save new state
		if( new_page_state && new_page_state.modified_ ) {

			/*if( !element.ascend('values/property/selections_frame/categories', true)
				&& !element.ascend('values/select_by_car_frame/categories', true) ) {

				let new_paging_state = new_page_state.paging_state_by_category_[new_page_state.category_];

				new_paging_state.selections_	= new_paging_state.selections_ && !cur_paging_state.selections_;
				new_paging_state.select_by_car_	= new_paging_state.select_by_car_ && !cur_paging_state.select_by_car_;
				new_page_state.modified_ = true;

			}*/

			this.render_.show_new_page_state(new_page_state);

			this.page_state_ = new_page_state;

			this.render_.debug_ellapsed(0, 'PAGE:&nbsp;');

		}

		e.preventDefault();

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
				add_event(element, event , e => this.animation_events_handler(e), phase);

	}

	setup_events(elements, phase = true) {

		for( let element of elements )
			for( let event of this.events_ )
				add_event(element, event , e => this.events_handler(e), phase);

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

			if( reload ) {

				this.render_.rewrite_page();

				let date = new Date;
				console.log(date.toLocaleFormat('%d.%m.%Y %H:%M:%S') + ': products on current page changed, reloaded');

			}

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

			let walk = function (uuids) {

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

				if( e.reserves )
					walk(e.reserves);

				if( e.images )
					walk(e.images);

				ids.push(e.id);

			}

			if( reload ) {

				this.render_.rewrite_page();

				let date = new Date;
				console.log(date.toLocaleFormat('%d.%m.%Y %H:%M:%S') + ': products on current page changed, reloaded');

			}

			let request = {
				'module'	: 'eventer',
				'handler'	: 'eventer',
				'received'	: ids
			};

			post_json('proxy.php',request);

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

		post_json(
			'proxy.php',
			request,
			(data)		=> this.sse_success_handler(data.events),
			(msg, xhr)	=> this.sse_error_handler(msg, xhr)
		);

	}

	idle_away_reload_handler() {

		this.render_.rewrite_page();

		let date = new Date;
		console.log(date.toLocaleFormat('%d.%m.%Y %H:%M:%S') + ': current page reloaded on user idle away');

	}

}
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class HtmlPageManager extends HtmlPageEvents {

	constructor() {

		super();

		Render.hide_cursor();

		this.setup_animation_events(xpath_eval('//*[@fadein or @fadeout]'));
		this.setup_events(xpath_eval('html/body/div[@btn]'));
		this.setup_events(xpath_eval('html/body/div[@pcontrols]/div[@plist_controls or @psort_controls]/div[@btn]'));
		this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pright]/div[@btn]'));
		this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pmid]/div[@pdescription]'));
		this.setup_events(xpath_eval('html/body/div[@pinfo]/div[@pimg]'));
		this.setup_events(xpath_eval('html/body/div[@plargeimg or @alert]'));
		this.setup_events(xpath_eval('html/body/div[@top]/div[@cart_informer]/div[@btn]'));
		this.setup_events(xpath_eval('html/body/div[@pcart]/div[@pcontrols]/div[@btn]'));

		this.render_ = new Render;
		this.render_.state = this;

		this.render_.rewrite_category();
		this.render_.rewrite_page();
		this.render_.rewrite_page();
		this.render_.rewrite_cart();
		this.render_.show_new_page_state();

		this.render_.debug_ellapsed(0, 'BOOT:&nbsp;');

		//this.sseq_ = new ServerSentEvents({ url : '/resources/core/mq/sse_server.php'});
		//this.sseq_.message = e => this.sse_handler_(e);
		//this.sseq_.start();

		this.sse_start();

		this.idle_away_reloader_ =
			new Idle({
				oneshot	: false,
				retry	: true,
				start	: true,
				timeout	: 60000, // 60s
				away	: () => this.idle_away_reload_handler()
			});

		// switch to tyres category by default
		let e = xpath_eval_single('html/body/div[@categories]/div[@btc and @uuid=\'83f528bc-481a-11e2-9a03-ace5647d95bd\']');
		let evt = document.createEvent('MouseEvents');
		evt.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		e.dispatchEvent(evt);

		// virtual keyboard initiator
		this.setup_events(xpath_eval('html/body/img[@vk]'));
		let vki_iframe_content = xpath_eval_single('html/body/iframe[@vk]').contentWindow;
		vki_iframe_content.document.vki_callback = (e, keyboard, el, status) => this.vk_input_callback_handler(e, keyboard, el, status);

	}

}
//------------------------------------------------------------------------------
function core() {

	let browser = get_browser();

	if( navigator.userAgent.match(/altair$/i) ) {

		let div = document.createElement('div');
		div.setAttribute('debug', '');
		div.innerHTML = `
			<p debug0></p><p debug1></p>
			<p debug2></p><p debug3></p>
			<p debug4></p><p debug5></p>
			<p debug6></p><p debug7></p>
			<p debug8></p><p debug9></p>`
		;

		let body = document.getElementsByTagName('body')[0];
		body.appendChild(div);

		let lnk = document.createElement('link');
		lnk.setAttribute('rel', 'stylesheet');
		lnk.setAttribute('type', 'text/css');
		lnk.setAttribute('href', '/resources/css/debug.css');

		let head = document.getElementsByTagName('head')[0];
		head.appendChild(lnk);

	}

	manager = new HtmlPageManager;

	// TODO: debug only, need to remove
	//let barcode_render = new barcode_ean13_render({ width: 7.62 });
	//let barcode_html = barcode_render.draw_barcode('5099206021877');

	//xpath_eval_single('html/body/div[@barcode]').innerHTML = barcode_html;

}
//------------------------------------------------------------------------------
