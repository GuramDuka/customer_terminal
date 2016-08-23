<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class constants_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'name', 'value_type', 'value_b', 'value_n', 'value_s', 'value_uuid' ];
		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$this->infobase_->begin_transaction();

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

					$st_erase = $this->infobase_->prepare('DELETE FROM constants WHERE name = :name');
					$st_erase->bindParam(':name', $uuid, SQLITE3_BLOB);

				}

				$st_erase->execute();

			}
			else {

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("REPLACE INTO constants (${gf}) VALUES (:${gv})");

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
			$this->infobase_->exec('ANALYZE constants');

		if( config::$log_timing ) {

			list($ellapsed, $seconds) = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' constants updated, ' . $rps . ' rps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
