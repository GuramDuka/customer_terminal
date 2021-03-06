<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class barcodes_registry_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'product_uuid', 'barcode' ];
		$dimensions = array_merge($all_fields, []);
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
		$where = null;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract($object);

			foreach( $fields_uuid as $field )
				$$field = uuid2bin(@$$field);

			$w = '';

			foreach( $dimensions as $dim ) {

				if( $$dim === null )
					continue;

				$w .= " AND ${dim} = :${dim}";

			}

			if( $w !== $where ) {

				$st_erase = null;
				$where = $w;
				$w = null;

			}

			if( $st_erase === null ) {

				$sql = <<<EOT
					DELETE FROM
						barcodes_registry
					WHERE
						1
						${where}
EOT
				;

				$this->infobase_->dump_plan($sql);

				$st_erase = $this->infobase_->prepare($sql);

				foreach( $dimensions as $field )
					if( substr($field, -4) === 'uuid' )
						$st_erase->bindParam(":${field}", $$field, SQLITE3_BLOB);
					else
						$st_erase->bindParam(":${field}", $$field);

			}

			$st_erase->execute();

			if( @$recordset === null )
				continue;

			foreach( $recordset as $record ) {

				// object may not present all fields then need initialize
				foreach( $all_fields as $field )
					$$field = null;

				extract($record);

				foreach( $fields_uuid as $field )
					$$field = uuid2bin(@$$field);

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("INSERT INTO barcodes_registry (${gf}) VALUES (:${gv})");

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
			$this->infobase_->exec('ANALYZE barcodes_registry');

		if( config::$log_timing ) {

			[ $ellapsed, $seconds ] = $timer->nano_time();
			$cnt = count($this->objects_);
			$rps = $seconds != 0 ? bcdiv($cnt, $seconds, 2) : $cnt;

	    	error_log(sprintf('%u', $cnt) . ' barcodes registry updated, ' . $rps . ' rps, ellapsed: ' . $timer->ellapsed_string($ellapsed));

		}

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
