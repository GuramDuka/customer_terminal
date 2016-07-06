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
function get_image_url($base_image_uuid, $base_image_ext) {

	if( $base_image_uuid !== null )
		return
			'/resources/'
			. get_image_path($base_image_uuid, '/')
			. '/' . bin2uuid($base_image_uuid)
			. '.' . (config::$convert_images ? config::$images_format : $base_image_ext);

	return '/resources/asserts/nopic.jpg';

}
//------------------------------------------------------------------------------
function uuid2table_name($uuid, $suf = '_') {

	return $uuid !== null ? str_replace('-', '_', $uuid) . $suf : '';

}
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
