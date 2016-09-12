////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class XhrDeferredException {

	this(message) {

		this.message = message;
		this.name = "Xhr deferred exception";

	}

}
//------------------------------------------------------------------------------
function post_json(obj, path, data) {

	let response, request = JSON.stringify(data, null, '\t');

	if( !obj.deferred_xhrs_ )
		obj.deferred_xhrs_ = {};

	let MD5 = new Hashes.MD5;
	let hash = MD5.hex(path + "\n\n" + request);
	let xhr = obj.deferred_xhrs_[hash];

	if( xhr ) {

		//obj.deferred_xhrs_[hash] = undefined;
		//delete obj.deferred_xhrs_[hash];

		if( xhr.status !== 200 )
			throw new Error(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText);

		response = JSON.parse(xhr.responseText, JSON.dateParser);

	}
	else {

		xhr = new XMLHttpRequest;
		xhr.open('POST', path, true);
		xhr.timeout = 180000;
		xhr.setRequestHeader('Content-Type'		, 'Content-Type: application/json; charset=utf-8');
		xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
		xhr.setRequestHeader('Cache-Control'	, 'no-store, no-cache, must-revalidate, max-age=0');

		xhr.onreadystatechange = function () {

			if( this.readyState === XMLHttpRequest.DONE )
				if( obj.deferred_xhrs_handler )
					obj.deferred_xhrs_handler();

		};

		obj.deferred_xhrs_[hash] = xhr;
		xhr.send(request);

		throw new XhrDeferredException;

	}

	return response;

}
//------------------------------------------------------------------------------
function post_json_async(path, data, success, error) {

	let xhr = new XMLHttpRequest;

	xhr.open('POST', path, true);
	xhr.timeout = 180000;
	xhr.setRequestHeader('Content-Type', 'Content-Type: application/json; charset=utf-8');
	xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
	xhr.setRequestHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

	xhr.onreadystatechange = function() {

		if( this.readyState === XMLHttpRequest.DONE ) {
			if( this.status === 200 ) {

				if( success )
					success(JSON.parse(this.responseText, JSON.dateParser));

			}
			else if( error ) {

				error(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText, this);

			}
			else {

				console.log(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText);

			}

		}

	};

	xhr.send(JSON.stringify(data, null, '\t'));

}
//------------------------------------------------------------------------------
function post_json_sync(path, data) {

	let xhr = new XMLHttpRequest;
	let response = undefined;
	let load_indicator = undefined;
	let timer_handle = undefined;

	try {

		load_indicator = xpath_single('html/body/div[@class=\'cssload-container\']');
		timer_handle = undefined;

		let popup = function () {
			console.log('tadam');
			load_indicator.style.display = 'inline-block';
		}

		if( load_indicator ) {

			load_indicator.style.display = 'none';
			timer_handle = setTimeout(popup, 10);

		}

		xhr.open('POST', path, false);
		xhr.setRequestHeader('Content-Type'		, 'Content-Type: application/json; charset=utf-8');
		xhr.setRequestHeader('If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT');
		xhr.setRequestHeader('Cache-Control'	, 'no-store, no-cache, must-revalidate, max-age=0');
		xhr.send(JSON.stringify(data, null, '\t'));

		if( xhr.status !== 200 )
			throw new Error(xhr.status.toString() + ' ' + xhr.statusText + "\n" + xhr.responseText);

		response = JSON.parse(xhr.responseText, JSON.dateParser);

	}
	finally {

		if( timer_handle )
			clearTimeout(timer_handle);

		if( load_indicator )
			load_indicator.style.display = 'none';

	}

	return response;

}
//------------------------------------------------------------------------------
