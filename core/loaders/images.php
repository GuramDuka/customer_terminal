<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class images_loader extends objects_loader {

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

		$start_time = micro_time();

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract($object);

			foreach( $fields_uuid as $field )
				$$field = uuid2bin(@$$field);

			if( $raw !== null && !empty($raw) ) {

				$dir = APP_DIR . get_image_path($uuid);
				$name = $dir . DIRECTORY_SEPARATOR . $object['uuid'];

				$raw = base64_decode($raw);

				if( config::$convert_images ) {

					$im = new \Imagick;

					try {

						$im->readImageBlob($raw);

						//$im->setBackgroundColor(new \ImagickPixel('white'));
						//$im->setImageColorspace(255);

						if( config::$scale_images ) {

							$r = $im->scaleImage(config::$image_width, config::$image_height, false);
							\runtime_exception::throw_false($r);

						}

						if( config::$images_interlace )
							$im->setInterlaceScheme(\Imagick::INTERLACE_PLANE);


						if( config::$images_format === 'jpg' ) {
							$im->setImageCompression(\Imagick::COMPRESSION_JPEG);
							$im->setImageCompressionQuality(config::$images_compression_quality);
						}
						else if( substr(config::$images_format, 0, 3) === 'png' ) {
							$im->setImageCompression(\Imagick::COMPRESSION_ZIP);
						}

						$im->setImageFormat(config::$images_format);

						$raw = $im->getImageBlob();

						$name .= '.' . substr(config::$images_format, 0, 3);

					}
					catch( \Throwable $e ) {

					    error_log($e->getCode() . ', ' . $e->getMessage() . "\n" . $e->getTraceAsString());
					    error_log('Unable decode image ' . $object->uuid);

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

				@$object->raw = null;
				unset($object->raw);

				if( @$erase ) {

					unlink($name);
					\runtime_exception::throw_last_error();

				}
				else {

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

			}

		}

		if( config::$log_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
			$cnt = count($this->objects_);
			$rps = $ellapsed_seconds != 0 ? bcdiv($cnt, $ellapsed_seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' images rewrited, ' . $rps . ' ips, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

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

		$this->infobase_->begin_immediate_transaction();

		$begin_start_time = $start_time = micro_time();

		$st = null;
		$st_erase = null;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract($object);

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

			if( bccomp(bcsub(micro_time(), $begin_start_time), config::$sqlite_tx_duration) >= 0 ) {

				$this->infobase_->commit_immediate_transaction();
				$this->infobase_->begin_immediate_transaction();
				$begin_start_time = micro_time();

			}

		}

		$this->infobase_->commit_immediate_transaction();

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
		$cnt = count($this->objects_);
		$rps = $ellapsed_seconds != 0 ? bcdiv($cnt, $ellapsed_seconds, 2) : $cnt;

	    error_log(sprintf('%u', $cnt) . ' images updated, ' . $rps . ' rps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
