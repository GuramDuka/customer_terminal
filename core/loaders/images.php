<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class images_loader extends objects_loader {

	protected function process_canvas(&$im) {

		// based on code from http://r2d2.cc/2011/01/08/imagemagick-php-image-resizing-imagick-with-canvas/

		$cw = config::$canvas_width;
		$ch = config::$canvas_height;

		$g = $im->getImageGeometry();
		$w = $g['width'];
		$h = $g['height'];

		// resize proportionally to fit on the canvas, base on max dimension
		$im->thumbnailImage($cw, $ch, true);

		$g = $im->getImageGeometry();
		$w = $g['width'];
		$h = $g['height'];

		$canvas = new \Imagick;
		$canvas->newImage($cw, $ch, config::$canvas_color, config::$canvas_format);
		
		if( config::$canvas_interlace )
			$canvas->setInterlaceScheme(\Imagick::INTERLACE_PLANE);

		if( config::$canvas_format === 'jpg' ) {

			$canvas->setImageCompression(\Imagick::COMPRESSION_JPEG);
			$canvas->setImageCompressionQuality(config::$canvas_compression_quality);

		}
		else if( substr(config::$canvas_format, 0, 3) === 'png' ) {

			$canvas->setImageCompression(\Imagick::COMPRESSION_ZIP);

		}
		
		// The overlay x and y coordinates
		$x = (int) (($cw - $w) / 2);
		$y = (int) (($ch - $h) / 2);

		// Composite on the canvas
		$r = $canvas->compositeImage($im, \Imagick::COMPOSITE_OVER, $x, $y);
		\runtime_exception::throw_false($r);

		$r = $canvas->getImageBlob();

		$canvas->clear();
		$canvas->destroy();
		$canvas = null;

		return $r;

	}

	protected function process_image(&$object, &$raw, &$name, &$ext) {

		$canvas = null;

		if( extension_loaded('imagick') && (config::$convert_images || config::$scale_images || config::$scale_canvas) ) {

			$raw = base64_decode($raw);
			$im = new \Imagick;

			try {

				$im->readImageBlob($raw);

				//$im->setBackgroundColor(new \ImagickPixel('white'));
				//$im->setImageColorspace(255);

				if( config::$scale_images ) {

					$r = $im->scaleImage(config::$image_width, config::$image_height, false);
					\runtime_exception::throw_false($r);

				}

				if( config::$convert_images && config::$images_interlace )
					$im->setInterlaceScheme(\Imagick::INTERLACE_PLANE);


				if( config::$convert_images && config::$images_format === 'jpg' ) {

					$im->setImageCompression(\Imagick::COMPRESSION_JPEG);
					$im->setImageCompressionQuality(config::$images_compression_quality);

				}
				else if( config::$convert_images && substr(config::$images_format, 0, 3) === 'png' ) {

					$im->setImageCompression(\Imagick::COMPRESSION_ZIP);

				}

				if( config::$convert_images )
					$im->setImageFormat(config::$images_format);

				$raw = $im->getImageBlob();

				$name .= '.' . (config::$convert_images ? substr(config::$images_format, 0, 3) : $ext);

				if( config::$scale_canvas )
					$canvas = $this->process_canvas($im);

			}
			catch( \Throwable $e ) {

		    	error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
			    error_log('Unable decode image ' . $object['uuid']);

				if( $ext !== null )
					$name .= '.' . $ext;

			}

			$im->clear();
			$im->destroy();
			$im = null;

		}
		else {

			if( $ext !== null )
				$name .= '.' . $ext;

		}

		return $canvas;

	}

	protected function write_image(&$dir, &$name, &$raw) {

		$h = @fopen($name, 'wb');

		if( $h === false ) {

			@mkdir($dir, 0777, true);
			$h = @fopen($name, 'wb');

		}

		\runtime_exception::throw_false($h);

		try {

			$r = flock($h, LOCK_EX);
			\runtime_exception::throw_false($r);

			$r = fwrite($h, $raw);
			\runtime_exception::throw_false($r);

			flock($h, LOCK_UN);

		}
		finally {

			fclose($h);

		}

	}

	public function rewrite_images() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'uuid', 'marked', 'object_uuid', 'ext', 'raw' ];
		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$timer = new \nano_timer;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract($object);

			foreach( $fields_uuid as $field )
				$$field = uuid2bin(@$$field);

			if( $raw !== null && !empty($raw) ) {

				$dir = APP_DIR . get_image_path($uuid);
				$name = $dir . DIRECTORY_SEPARATOR . str_replace('-', '+', $object['uuid']);
				$canvas_name = $dir . DIRECTORY_SEPARATOR . $object['uuid'] . '.' . config::$canvas_format;

				if( @$erase ) {

					$name .= '.' . (config::$convert_images ? substr(config::$images_format, 0, 3) : $ext);

					if( file_exists($name) ) {

						unlink($name);
						\runtime_exception::throw_last_error();

					}

					if( file_exists($canvas_name) ) {
		
						unlink($canvas_name);
						\runtime_exception::throw_last_error();

					}

					@$object->raw = null;
					unset($object->raw);

				}
				else {

					$canvas = $this->process_image($object, $raw, $name, $ext);

					@$object->raw = null;
					unset($object->raw);

					$this->write_image($dir, $name, $raw);

					if( $canvas !== null )
						$this->write_image($dir, $canvas_name, $canvas);

				}

			}

		}

		if( config::$log_timing ) {

			[ $ellapsed, $seconds ] = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' images rewrited, ' . $rps . ' ips, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		// release memory
		if( config::$debug )
        	error_log('Memory usage before: ' . memory_get_usage() . '. ' . __FILE__ . ', ' . __LINE__ . '. ' . __NAMESPACE__ . '::' . __FUNCTION__);

		$this->rewrite_images();

		if( config::$debug )
       		error_log('Memory usage after: ' . memory_get_usage() . '. ' . __FILE__ . ', ' . __LINE__ . '. ' . __NAMESPACE__ . '::' . __FUNCTION__);

		$all_fields = [ 'uuid', 'marked', 'object_uuid', 'ext' ];
		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$event = [];

		$this->infobase_->begin_transaction();

		$timer = new \nano_timer;

		$st = null;
		$st_erase = null;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract($object);

			$event[$uuid] = null;

			foreach( $fields_uuid as $field )
				$$field = uuid2bin(@$$field);

			if( @$erase ) {

				if( $st_erase === null ) {
					$st_erase = $this->infobase_->prepare('DELETE FROM images WHERE uuid = :uuid');
					$st_erase->bindParam(':uuid', $uuid, SQLITE3_BLOB);
				}

				$st_erase->execute();

			}
			else {

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("REPLACE INTO images (${gf}) VALUES (:${gv})");

					foreach( $fields_uuid as $field )
						$st->bindParam(":${field}", $$field, SQLITE3_BLOB);

					foreach( $fields as $field )
						$st->bindParam(":${field}", $$field);

				}

				$st->execute();

			}

			$this->infobase_->sqlite_tx_duration($timer, __FILE__, __LINE__);

		}

		$this->infobase_->commit_transaction();

		if( config::$analyze_sqlite_tables )
			$this->infobase_->exec('ANALYZE images');

		if( config::$log_timing ) {

			[ $ellapsed, $seconds ] = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

		    error_log(sprintf('%u', $cnt) . ' images updated, ' . $rps . ' rps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		$timer->start();

		$trigger = new \events_trigger;
		$trigger->event([ 'images' => array_keys($event) ]);
		$trigger->fire();

		if( config::$log_trigger_timing ) {

			[ $ellapsed ] = $timer->nano_time();
    		error_log('images trigger fired, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
