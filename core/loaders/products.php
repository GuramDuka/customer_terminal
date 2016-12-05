<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class products_loader extends objects_loader {

	// TODO: remove commented function ???
	/*public function rewrite_html() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$start_time = micro_time();

		foreach( $this->objects_ as $object ) {

			if( @$object->erase )
				continue;

			$img = @$object->base_image;
			$img_ext = @$object->base_image_ext;

			if( $img !== null && $img_ext !== null ) {
				$img_url = '/resources/'
					. get_image_path(uuid2bin($img), '/')
					. '/' . $img . '.' . $img_ext;
			}
			else {
				$img_url = '/resources/assert/nopic.jpg';
			}

			$img_url = htmlspecialchars($img_url, ENT_HTML5);
			$pname = htmlspecialchars($object->name, ENT_HTML5);

			$tmpl = <<<EOT
<img pimg alt="" src="${img_url}">
<p pname>${pname}</p>
<p price>8&nbsp;246&nbsp;₽</p>
<a btn buy>КУПИТЬ</a>
EOT;

			$dir = APP_DIR . get_product_path(uuid2bin($object->uuid));
			$fname = $dir . DIRECTORY_SEPARATOR . $object->uuid . '.html';

			$h = @fopen($fname, 'wb');

			if( $h === false ) {
				@mkdir($dir, 0777, true);
				$h = @fopen($fname, 'wb');
			}

			\runtime_exception::throw_false($h);

			try {

				$r = flock($h, LOCK_EX);
				\runtime_exception::throw_false($r);

				$r = fwrite($h, $tmpl);
				\runtime_exception::throw_false($r);

				flock($h, LOCK_UN);

			}
			finally {
				fclose($h);
			}

		}

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
		$cnt = count($this->objects_);
		$rps = $ellapsed_seconds != 0 ? bcdiv($cnt, $ellapsed_seconds, 2) : $cnt;

	    error_log(sprintf('%u', $cnt) . ' products html rewrited, ' . $rps . ' hps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}*/

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [
			'uuid',
			'marked',
			'code',
			'name',
			'article',
			'base_image_uuid',
			'description',
			'description_in_html'
		];
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

					$st_erase = $this->infobase_->prepare('DELETE FROM products WHERE uuid = :uuid');
					$st_erase->bindParam(':uuid', $uuid, SQLITE3_BLOB);

				}

				$st_erase->execute();

			}
			else {

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("REPLACE INTO products (${gf}) VALUES (:${gv})");

					foreach( $fields_uuid as $field )
						$st->bindParam(":${field}", $$field, SQLITE3_BLOB);

					foreach( $fields as $field )
						$st->bindParam(":${field}", $$field);

				}

				$st->execute();

			}

			$this->infobase_->sqlite_tx_duration($timer, __FILE__, __LINE__);

		}

		$entity = $this->infobase_->escapeString('products_pages');
		$this->infobase_->exec("REPLACE INTO dirties (entity) VALUES ('${entity}')");

		$this->infobase_->commit_transaction();

		if( config::$analyze_sqlite_tables )
			$this->infobase_->exec('ANALYZE products');

		if( config::$log_timing ) {

			[ $ellapsed, $seconds ] = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' products updated, ' . $rps . ' rps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

		$timer->start();

		$trigger = new \events_trigger;
		$event = [ 'products' => array_keys($event) ];
		$trigger->event(json_encode($event, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION));
		$trigger->fire();

		if( config::$log_trigger_timing ) {

			[ $ellapsed ] = $timer->nano_time();
	    	error_log('products trigger fired, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
