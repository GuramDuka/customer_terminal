<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
class config {

	public static $debug = false;

};
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
class config extends \config {

	public static $page_size = 6;
	public static $convert_images = true;
	public static $images_format = 'jpg';
	public static $images_interlace = true;
	public static $scale_images = false;
	public static $image_width = 205;
	public static $image_height = 280;
	public static $force_create_infobase = false;
	public static $force_rewrite_pages = false;
	public static $cars_selections_registry_max_values_on_row = 12;

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
