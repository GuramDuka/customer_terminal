<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class cars_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'uuid', 'marked', 'folder', 'parent_uuid', 'code', 'name', 'manufacturer_uuid', 'model_uuid', 'modification_uuid', 'year_uuid' ];
		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$this->infobase_->begin_immediate_transaction();

		$timer = new \nano_timer;

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

					$st_erase = $this->infobase_->prepare('DELETE FROM cars WHERE uuid = :uuid');
					$st_erase->bindParam(':uuid', $uuid, SQLITE3_BLOB);

				}

				$st_erase->execute();

			}
			else {

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("REPLACE INTO cars (${gf}) VALUES (:${gv})");

					foreach( $fields_uuid as $field )
						$st->bindParam(":${field}", $$field, SQLITE3_BLOB);

					foreach( $fields as $field )
						$st->bindParam(":${field}", $$field);

				}

				$st->execute();

			}

			$ellapsed = $timer->last_nano_time();

			if( bccomp($ellapsed, config::$sqlite_tx_duration) >= 0 ) {

				$this->infobase_->commit_immediate_transaction();
				$this->infobase_->begin_immediate_transaction();

				if( config::$log_sqlite_tx_duration )
	    			error_log('sqlite tx duration reached, ellapsed: ' . $timer->ellapsed_string($ellapsed));

			}

		}

		$this->infobase_->commit_immediate_transaction();

		if( config::$log_timing ) {

			list($ellapsed, $seconds) = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' cars updated, ' . $rps . ' rps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
