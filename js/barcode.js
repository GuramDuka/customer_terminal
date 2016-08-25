//------------------------------------------------------------------------------
/*
 * This file is part of HTML Barcode SDK.
 *
 *
 * ConnectCode provides its HTML Barcode SDK under a dual license model designed 
 * to meet the development and distribution needs of both commercial application 
 * distributors and open source projects.
 *
 * For open source projects, please see the GNU GPL notice below. 
 *
 * For Commercial Application Distributors (OEMs, ISVs and VARs), 
 * please see <http://www.barcoderesource.com/duallicense.shtml> for more information.
 *
 *
 *
 *
 * GNU GPL v3.0 License 
 *
 * HTML Barcode SDK is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * HTML Barcode SDK is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Foobar.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Source: http://www.barcoderesource.com/opensource/ean13/csshtmlEAN13Barcode.html
 * Modified 25.08.2016: Guram Duka guram.duka@gmail.com
 */
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class barcode_ean13_render {

	to_cm(v) {

		return this.units_ === 'in' ? v * 2.54 : v;

	}

	to_in(v) {

		return this.units_ === 'in' ? v : v / 2.54;

	}

	check_params() {

		if( this.text_location_ != 'bottom' && this.text_location_ != 'top' )
			this.text_location_ = 'bottom';

		if( this.text_alignment_ != 'center' && this.text_alignment != 'left' && this.text_alignment != 'right' )
			this.text_alignment_ = 'center';

		if( this.units_ != 'in' && this.units_ != 'cm' )
			this.units_ = 'cm';

		if( this.height_ <= 0 || this.to_cm(this.height_) > 38.1 )
			this.height_ = 2.54;

		if( this.width_ <= 0 || this.to_cm(this.width_) > 38.1 )
			this.width_ = 6.35;

		if( this.min_bar_width_ < 0 || this.to_cm(this.min_bar_width_) > 5.08 )
			this.min_bar_width_ = 0;

		if( this.human_readable_ !== true && this.human_readable_ !== false )
			this.human_readable_ = true;

		if( this.mode_ !== 'html' && this.mode_ !== 'text' )
			this.mode_ = 'html';

	}

	constructor(params) {

		// set default parameters values
		this.human_readable_	= true;
		this.units_				= 'cm';
		this.min_bar_width_		= 0;
		this.width_				= 6.35;
		this.height_			= 2.54;
		this.text_location_		= 'bottom';
		this.text_alignment_	= 'center';
		this.text_style_		= '';
		this.color_				= 'black';
		this.background_		= 'white';
		this.mode_				= 'html';
		this.attributes_		= '';

		if( params ) {

			if( params.human_readable !== undefined )
				this.human_readable_ = params.human_readable;

			if( params.units !== undefined )
				this.units_ = params.units;

			if( params.min_bar_width !== undefined )
				this.min_bar_width_ = params.min_bar_width;

			if( params.width !== undefined )
				this.width_ = params.width;

			if( params.height !== undefined )
				this.height_ = params.height;

			if( params.text_location !== undefined )
				this.text_location_ = params.text_location;

			if( params.text_alignment !== undefined )
				this.text_alignment_ = params.text_alignment;

			if( params.text_style !== undefined )
				this.text_style_ = params.text_style;

			if( params.text_style !== undefined )
				this.text_style_ = params.text_style;

			if( params.color !== undefined )
				this.color_ = params.color;

			if( params.background !== undefined )
				this.background_ = params.background;

			if( params.mode !== undefined )
				this.mode_ = params.mode;

			if( params.attributes !== undefined )
				this.attributes_ = params.attributes;

		}

		this.check_params();

	}

	filter_input(data) {

		let result = '';

		for( let i = 0; i < data.length; i++ )
			if( data.charCodeAt(i) >= 48 && data.charCodeAt(i) <= 57 )
				result += data.substr(i, 1);

		return result;

	}

	generate_check_digit(data) {

		let sum = 0;
               
		for( let i = data.length - 1; i >= 0 ; i-- ) {
                 
			let barcode_value = data.charCodeAt(i) - 48;

			sum += (i % 2) === 0 ? barcode_value : barcode_value * 3;

		}
               
		let result = sum % 10;

		if( result !== 0 )
			result = 10 - result;
                 
		return String.fromCharCode(result + 48);

	}

	html_escape(data) {

		let result = '';

		for( let i = 0; i < data.length; i++ )
			result += '&#' + data.charCodeAt(i).toString() + ';';

		return result;

	}

	html_decode(str) {

		let ta = document.createElement('textarea');

		ta.innerHTML = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');

		return ta.value;

	}

	connect_code_encode(data, hr) {

		let parity_map = this.parity_map_;
		let filtered_data = this.filter_input(data);
                   
		if( filtered_data.length > 12 )
			filtered_data = filtered_data.substr(0, 12);
               
		if( filtered_data.length < 12 )
			for( let i = 12 - filtered_data.length; i > 0; i-- )
				filtered_data = '0' + filtered_data;
               
		filtered_data += this.generate_check_digit(filtered_data);

		let parity_bit = 0;
		let first_digit = 0;
		let transform_data_left = '';

		for( let i = 0; i < 7; i++ ) {

			if( i === 0 ) {

				first_digit = filtered_data.charCodeAt(i) - 48; 

			}
			else {

				parity_bit = parity_map[first_digit][i - 1];

				if( parity_bit === 0 )
					transform_data_left += filtered_data.substr(i, 1);
				else
					transform_data_left += String.fromCharCode(filtered_data.charCodeAt(i) + 49 + 14);

			}

		}
                   
		let result = '';
		let transform_data_right = '';
		let transform_char = '';

		for( let i = 7; i < 13; i++ ) {

			transform_char = String.fromCharCode(filtered_data.charCodeAt(i) + 49);
			transform_data_right += transform_char;

		}
                   
		if( hr !== 0 ) {

			result = String.fromCharCode(first_digit + '!'.charCodeAt(0)) + '[' + transform_data_left + '-' + transform_data_right + ']';

		}
		else {

			result = '[' + transform_data_left + '-' + transform_data_right + ']';

		}

		return this.html_decode(this.html_escape(result));

	}

	encode(data) {

		let font_output = this.connect_code_encode(data, 0);
		let output = '';

		for( let i = 0; i < font_output.length; i++ ) {

			let c = font_output.substr(i, 1).charCodeAt(0);

			output += c < this.pattern_.length ? this.pattern_[c] : '';

		}

		return output;

	}

	get_human_text(data) {

		let filtered_data = this.filter_input(data);
                                  
		if( filtered_data.length > 12 )
			filtered_data = filtered_data.substr(0, 12);
               
		if( filtered_data.length < 12 )
			for( let i = 12 - filtered_data.length; i > 0; i-- )
				filtered_data = '0' + filtered_data;

		filtered_data += this.generate_check_digit(filtered_data);

		return this.html_decode(this.html_escape(filtered_data));

	}

	draw_barcode(data) {

		let encoded_data = this.encode(data);
		let thin_length = 0;
		let thick_length = 0.0;
		let increment_width = 0.0;
		let swing = 1;
		let result = '';
		let bar_width = 0;
		let width = this.width_;
		let thick_width = 0.0;
		let svg;

		let encoded_length = encoded_data.length;
		let total_length = encoded_length;
	
		if( this.min_bar_width_ > 0 ) {

			bar_width = this.min_bar_width_.toFixed(2);
			width = bar_width * total_length;

		}
		else {

			bar_width = (width / total_length).toFixed(2);

		}

		let get_human_span = function (obj, data) {

			let s = obj.get_human_text(data);

			let font_size = 1.141;
			let text_top  = 0.870;

			let k = width / 6.35;

			font_size *= k;
			text_top  *= k;

			if( obj.text_location_ === 'bottom' )
				text_top = -text_top;

			let font_style = `font-family: arial; font-size: ${font_size}em; font-weight: normal; font-style: normal; font-stretch: normal`;

			let human_readable_text = '';
			let space = `<font style="${font_style}; width: auto; height: auto; background: transparent">&nbsp;&nbsp;</font>`;
			let digit = `<font style="${font_style}; width: auto; height: auto; background: ${obj.background_}">`;

			human_readable_text += `${digit}${s.substr(0, 1)}</font>`;
			human_readable_text += `${space}${space}`;
			human_readable_text += `${digit}${s.substr(1, 6)}</font>`;
			human_readable_text += `${space}${space}`;
			human_readable_text += `${digit}${s.substr(7, 6)}</font>`;
			human_readable_text += `${space}${space}`;

			let human_text_style = `z-index: 200; position: relative; top: ${text_top}em; width: auto; height: auto; ${font_style}; background: transparent; ${obj.text_style_}`;

			return `<span human_readable_text style="${human_text_style}">${human_readable_text}</span><br />`;

		}

		if( this.mode_ === 'html' ) {

			let attributes = `barcode="${data}"`;

			if( this.attributes_.length !== 0 && this.attributes_.trim() )
				attributes += ' ' + this.attributes_.trim();

			if( this.text_alignment_ === 'center' )
				result = `<div ${attributes} style="text-align: center">`;
			else if( this.text_alignment_ === 'left' )
				result = `<div ${attributes} style="text-align: left">`;
			else if( this.text_alignment_ === 'right' )
				result = `<div ${attributes} style="text-align: right">`;

			let human_span = '';

			if( this.human_readable_ === true && this.text_location_ === 'top' )
				human_span = `${get_human_span(this, data)}<br />`;

			result += human_span;

		}
			  
		let master_style = 'display: inline-block; width: auto; z-index: 100; background: transparent';

		for( let i = 0; i < encoded_data.length; i++ ) {

			let brush = encoded_data.substr(i, 1) === 'b' ? this.color_ : this.background_;

			if( this.mode_ === 'html' )
				result += `<span vbar style="border-left: ${bar_width}${this.units_} solid ${brush}; height: ${this.height_}${this.units_}; ${master_style}"></span>`;

			increment_width += bar_width;
				
		}

		if( this.mode_ === 'html' ) {

			let human_span = '';

			if( this.human_readable_ === true && this.text_location_ === 'bottom' )
				human_span = `<br />${get_human_span(this, data)}`;

			result += human_span + '</div>';

		}
		
		return result;	

	}

}
//------------------------------------------------------------------------------
barcode_ean13_render.prototype.parity_map_ = [

	[ 0, 0, 0, 0, 0, 0 ],
	[ 0, 0, 1, 0, 1, 1 ],
	[ 0, 0, 1, 1, 0, 1 ],
	[ 0, 0, 1, 1, 1, 0 ],
	[ 0, 1, 0, 0, 1, 1 ],
	[ 0, 1, 1, 0, 0, 1 ],
	[ 0, 1, 1, 1, 0, 0 ],
	[ 0, 1, 0, 1, 0, 1 ],
	[ 0, 1, 0, 1, 1, 0 ],
	[ 0, 1, 1, 0, 1, 0 ]

];
//------------------------------------------------------------------------------
barcode_ean13_render.prototype.pattern_ = function () {

	let a = new Array(121);

	for( let i = 0; i < a.length; i++ )
		a[i] = '';

	a[ 45] = 'wbwbw';
	a[ 48] = 'wwwbbwb';
	a[ 49] = 'wwbbwwb';
	a[ 50] = 'wwbwwbb';
	a[ 51] = 'wbbbbwb';
	a[ 52] = 'wbwwwbb';
	a[ 53] = 'wbbwwwb';
	a[ 54] = 'wbwbbbb';
	a[ 55] = 'wbbbwbb';
	a[ 56] = 'wbbwbbb';
	a[ 57] = 'wwwbwbb';
	a[111] = 'wbwwbbb';
	a[112] = 'wbbwwbb';
	a[113] = 'wwbbwbb';
	a[114] = 'wbwwwwb';
	a[115] = 'wwbbbwb';
	a[116] = 'wbbbwwb';
	a[117] = 'wwwwbwb';
	a[118] = 'wwbwwwb';
	a[119] = 'wwwbwwb';
	a[120] = 'wwbwbbb';
	a[ 97] = 'bbbwwbw';
	a[ 98] = 'bbwwbbw';
	a[ 99] = 'bbwbbww';
	a[100] = 'bwwwwbw';
	a[101] = 'bwbbbww';
	a[102] = 'bwwbbbw';
	a[103] = 'bwbwwww';
	a[104] = 'bwwwbww';
	a[105] = 'bwwbwww';
	a[106] = 'bbbwbww';
	a[ 91] = 'bwb';
	a[ 93] = 'bwb';

	return a;

} ();
//------------------------------------------------------------------------------
