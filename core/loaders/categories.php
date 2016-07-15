<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class categories_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'uuid', 'marked', 'folder', 'parent_uuid', 'code', 'name', 'selection', 'display' ];
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

					$st_erase = $this->infobase_->prepare('DELETE FROM categories WHERE uuid = :uuid');
					$st_erase->bindParam(':uuid', $uuid, SQLITE3_BLOB);

				}

				$st_erase->execute();

				$category_table = 'products_' . uuid2table_name(bin2uuid($uuid)) . 'pages';
				$this->infobase_->exec("DROP TABLE IF EXISTS ${category_table}");

			}
			else {

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("REPLACE INTO categories (${gf}) VALUES (:${gv})");

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

		$entity = $this->infobase_->escapeString('products_pages');
		$this->infobase_->exec("REPLACE INTO dirties (entity) VALUES ('${entity}')");

		$this->infobase_->commit_immediate_transaction();

		if( config::$log_timing ) {

			$finish_time = micro_time();
			$ellapsed_ms = bcsub($finish_time, $start_time);
			$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
			$cnt = count($this->objects_);
			$rps = $ellapsed_seconds != 0 ? bcdiv($cnt, $ellapsed_seconds, 2) : $cnt;

		    error_log(sprintf('%u', $cnt) . ' categories updated, ' . $rps . ' rps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
