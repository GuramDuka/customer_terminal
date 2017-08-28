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

	$p = ' ';
	$l = mb_strlen($filter);

	for( $i = 0; $i < $l; $i++ ) {

		$s = mb_substr($filter, $i, 1);

		if( mb_ctype_space($s) && !mb_ctype_space($p) && $p !== '*' ) {

			$p = '*';
			$filter = mb_substr($filter, 0, $i) . $p . mb_substr($filter, $i);
			$l++;

		}

		$p = $s;

	}

	$filter = mb_str_replace(' OR* ', ' OR ', $filter);
	$filter = mb_str_replace(' AND* ', ' AND ', $filter);
	$filter = mb_str_replace('/', ' ', $filter);
	$filter = mb_str_replace('\\', ' ', $filter);

	$filter .= '*';

	return $filter;

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
} // namespace srv1c
//------------------------------------------------------------------------------
?>
