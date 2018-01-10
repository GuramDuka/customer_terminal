<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
class config {

	public static $debug										= false;
	public static $log_files									= 10;
	public static $log_request									= false;
	public static $log_response									= false;
	//public static $zmq_socket									= 'tcp://127.0.0.1:65481';
	public static $sqlite_busy_timeout							= 1200000;	// 1200 seconds - 20 minutes
	public static $sqlite_tx_duration							= 50000000;	// in nanoseconds, 1000ns == 1micros, 1000000ns == 1ms, 1000000000ns = 1s. 50ms by default
	public static $sqlite_page_size								= 4096;
	public static $sqlite_cache_size							= 524288;	// 131072, 262144, 524288
	public static $sqlite_temp_store							= 'MEMORY';

};
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
class config extends \config {

	public static $analyze_sqlite_tables						= false;
	public static $log_sqlite_tx_duration						= false;
	public static $log_loader_request							= false;
	public static $explain										= false;
	public static $rewrite_pages_timing							= false;
	public static $pager_timing									= false;
	public static $producter_timing								= false;
	public static $cart_timing									= false;
	public static $log_timing									= true;
	public static $log_trigger_timing							= false;
	public static $page_size									= 6;
	public static $convert_images								= true;
	public static $images_format								= 'jpg';
	public static $images_interlace								= false;
	public static $images_compression_quality					= 95;
	public static $scale_images									= false;
	public static $image_width									= 211;
	public static $image_height									= 280;
	public static $scale_canvas									= true;
	public static $canvas_color									= 'white';
	public static $canvas_width									= 400;
	public static $canvas_height								= 400;
	public static $canvas_format								= 'jpg';
	public static $canvas_interlace								= false;
	public static $canvas_compression_quality					= 35;
	public static $force_create_infobase						= false;
	public static $force_rewrite_pages							= false;
	public static $cars_selections_registry_max_values_on_row	= 12;

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
