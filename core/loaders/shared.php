<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
function get_product_path($uuid, $dir_sep = DIRECTORY_SEPARATOR, $range = 256) {

	$w = strlen(dechex($range - 1));
	$h = hexdec(substr(hash('haval256,3', $uuid), -7)) % $range;

	return 'view' . $dir_sep . 'products' . $dir_sep . 'list' . $dir_sep
		. sprintf("%0${w}x", $h);

}
//------------------------------------------------------------------------------
function get_image_path($uuid, $dir_sep = DIRECTORY_SEPARATOR, $range = 256) {

	$w = strlen(dechex($range - 1));
	$h = hexdec(substr(hash('haval256,3', $uuid), -7)) % $range;

	return 'images' . $dir_sep . 'products' . $dir_sep . sprintf("%0${w}x", $h);

}
//------------------------------------------------------------------------------
function get_image_url($base_image_uuid, $base_image_ext, $canvas = false) {

	$nopic = false;
	$path_name = '';
	$uuid = bin2uuid($base_image_uuid);

	if( $base_image_uuid !== null && $base_image_ext !== null && !empty($base_image_ext) ) {

		$ext = config::$convert_images ? config::$images_format : $base_image_ext;
		$guid = str_replace('-', '+', $uuid);
		$dir = APP_DIR . get_image_path($base_image_uuid);
		$name = $dir . DIRECTORY_SEPARATOR;

		if( $canvas ) {

			if( file_exists($name . $guid . '.' . config::$canvas_format) ) {

				$uuid = $guid;
				$ext = config::$canvas_format;

			}
			else if( file_exists($name . $guid . '.' . $ext) ) {

				$uuid = $guid;

			}
			else if( file_exists($name . $uuid . '.' . $ext) ) {
			}
			else if( file_exists($name . $uuid . '.' . config::$canvas_format) ) {

				$ext = config::$canvas_format;

			}
			else {//if( !file_exists($name . $guid . '.' . $ext) ) {

				$nopic = true;

			}

		}
		else {

			if( file_exists($name . $uuid . '.' . $ext) ) {
			}
			else if( file_exists($name . $uuid . '.' . config::$canvas_format) ) {

				$ext = config::$canvas_format;

			}
			else {//if( !file_exists($name . $uuid . '.' . $ext) ) {

				$nopic = true;

			}

		}

		if( !$nopic )
			$path_name .= get_image_path($base_image_uuid, '/') . '/' . $uuid . '.' . $ext;

	}
	else {

		$nopic = true;

	}

	if( $nopic )
		$path_name .= 'assets/nopic.jpg';

	return $path_name;

}
//------------------------------------------------------------------------------
function uuid2table_name($uuid, $suf = '_') {

	return $uuid !== null ? str_replace('-', '_', $uuid) . $suf : '';

}
//------------------------------------------------------------------------------
function transform_fts_filter($filter) {

	$filter = mb_stri_replace(' OR ', ' OR* ', $filter);
	$filter = mb_stri_replace(' ИЛИ ', ' OR* ', $filter);
	$filter = mb_stri_replace(' AND ', ' AND* ', $filter);
	$filter = mb_stri_replace(' И ', ' AND* ', $filter);

	/*$p = ' ';
	$l = mb_strlen($filter);

	for( $i = 0; $i < $l; $i++ ) {

		$s = mb_substr($filter, $i, 1);

		if( mb_ctype_space($s) && !mb_ctype_space($p) && $p !== '*' ) {

			$p = '*';
			$filter = mb_substr($filter, 0, $i) . $p . mb_substr($filter, $i);
			$l++;

		}

		$p = $s;

	}*/

	$filter = mb_str_replace(' OR* ', ' OR ', $filter);
	$filter = mb_str_replace(' AND* ', ' AND ', $filter);
	//$filter = mb_str_replace('/', ' ', $filter);
	$filter = mb_str_replace('\\', ' ', $filter);
	$filter = mb_str_replace('"', ' ', $filter);
	$filter = mb_str_replace('*', ' ', $filter);

	$filter = mb_stri_replace(' OR ', "\tOR\t", $filter);
	$filter = mb_stri_replace(' AND ', "\tAND\t", $filter);

	while( mb_strpos($filter, '  ') !== FALSE )
		$filter = mb_stri_replace('  ', ' ', $filter);

	$filter = mb_stri_replace(' ', '"* AND "', $filter);
	$filter = mb_stri_replace("\tOR\t", '"* OR "', $filter);
	$filter = mb_stri_replace("\tAND\t", '"* AND "', $filter);

	return '"' . $filter . '"*';

}
//------------------------------------------------------------------------------
function get_orders_directions() {

	return [
		[ 'code', 'name', 'price'/*, 'remainder'*/ ],
		[ 'asc', 'desc' ]
	];

}
//------------------------------------------------------------------------------
function get_pgnon($order, $direction, $pgno, $n) {

	// 31 bit in sum
	return
		(($order & 0b11) << (24 + 4 + 1)) |
		(($direction & 0b1) << (24 + 4)) |
		(($pgno & 0b111111111111111111111111) << (4 + 0)) |
		($n & 0b1111);

}
//------------------------------------------------------------------------------
function request_exchange_node($exchange_url_hide, $exchange_user_hide, $exchange_pass_hide, $request_hide, $request_json_encoded = false) {

	// remove secure data from stacktrace
	$exchange_url = $exchange_url_hide;
	$exchange_url_hide = '';
	$exchange_user = $exchange_user_hide;
	$exchange_user_hide = '';
	$exchange_pass = $exchange_pass_hide;
	$exchange_pass_hide = '';
	$request = $request_json_encoded ? $request_hide : json_encode($request_hide, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
	$request_hide = '';

	$ch = curl_init();

	\runtime_exception::throw_false($ch);

	if( strtolower((substr($exchange_url, 0, 5)) === 'https') ) {
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
	}

	curl_setopt($ch, CURLOPT_HTTPHEADER			, [
		'Content-Type: application/json; charset=utf-8',
		'Cache-Control: no-store, no-cache, must-revalidate, max-age=0',
		'Accept: */*',
		//'Accept: application/json; charset=utf-8',
		//'Accept: text/html, application/xhtml+xml, application/xml; q=0.9,*/*; q=0.8',
		'Accept-Encoding: gzip, deflate'
	]);

	curl_setopt($ch, CURLOPT_USERPWD			, "$exchange_user:$exchange_pass");
	curl_setopt($ch, CURLOPT_HTTPAUTH			, CURLAUTH_BASIC);
	curl_setopt($ch, CURLOPT_FAILONERROR		, false);
	curl_setopt($ch, CURLOPT_URL				, $exchange_url);
	curl_setopt($ch, CURLOPT_REFERER			, $exchange_url);
	curl_setopt($ch, CURLOPT_VERBOSE			, false);
	curl_setopt($ch, CURLOPT_POST				, true);
	curl_setopt($ch, CURLOPT_FOLLOWLOCATION		, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS			, $request);
	//curl_setopt($ch, CURLOPT_USERAGENT		, "Mozilla/4.0 (Windows; U; Windows NT 5.0; En; rv:1.8.0.2) Gecko/20070306 Firefox/1.0.0.4");
	curl_setopt($ch, CURLOPT_HEADER				, true);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER		, true);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT		, 15);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS	, 15000);
	curl_setopt($ch, CURLOPT_TIMEOUT			, 30);
	curl_setopt($ch, CURLOPT_TIMEOUT_MS			, 30000);
	//curl_setopt($ch, CURLOPT_COOKIEJAR		, TMP_DIR . 'cookie.txt');		// get auth
	//curl_setopt($ch, CURLOPT_COOKIEFILE		, TMP_DIR . 'cookie.txt');		// use auth

	$response = curl_exec($ch);

	\curl_exception::throw_curl_error($ch);

	$curl_info = curl_getinfo($ch);
	curl_close($ch);

	// if CURLOPT_FAILONERROR === true && http_code !== 200 then curl library automatical set curl_error to nonzero
	// and this check not needed

	if( $curl_info['http_code'] !== 200 ) {

		$msg = "\n" . $response;

		if( config::$debug )
			$msg .= "\n" . var_export($curl_info, true);

		throw new \runtime_exception($msg, $curl_info['http_code']);

	}

	$data = json_decode(substr($response, $curl_info['header_size']), true, 512, JSON_BIGINT_AS_STRING);
	\invalid_json_exception::throw_json_error();

	return $data;
}
//------------------------------------------------------------------------------
function session_startup() {

	if( @$_SESSION['DATA_ID'] === null )
		session_start([
			'cookie_lifetime' => 10 * 365 * 24 * 60 * 60 // 10 years
		]);

	$data_id = uuid2bin(@$_SESSION['DATA_ID']);

	if( $data_id === null )
		$_SESSION['DATA_ID'] = bin2uuid($data_id = random_bytes(16));

	$orders = @$_SESSION['ORDERS'];

	if( $orders === null )
		$orders = [];
	else
		$orders = unserialize(bzdecompress(base64_decode($orders)));

	return $data_id;
}
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
