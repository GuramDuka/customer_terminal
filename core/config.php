<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
class config {

	public static $debug										= false;
	public static $log_request									= false;
	public static $log_response									= false;

};
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
class config extends \config {

	public static $sqlite_page_size								= 4096;
	public static $sqlite_cache_size							= 262144;  // 131072, 262144, 524288
	public static $log_loader_request							= false;
	public static $explain										= false;
	public static $rewrite_pages_timing							= false;
	public static $pager_timing									= true;
	public static $producter_timing								= true;
	public static $cart_timing									= true;
	public static $log_timing									= true;
	public static $page_size									= 6;
	public static $convert_images								= false;
	public static $images_format								= 'jpg';
	public static $images_interlace								= true;
	public static $images_compression_quality					= 85;
	public static $scale_images									= false;
	public static $image_width									= 205;
	public static $image_height									= 280;
	public static $force_create_infobase						= false;
	public static $force_rewrite_pages							= false;
	public static $cars_selections_registry_max_values_on_row	= 12;

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
