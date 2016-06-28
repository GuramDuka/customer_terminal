<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class properties_registry_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'object_uuid', 'property_uuid', 'idx' ];
		$dimensions = array_merge($all_fields, []);
		$all_fields[] = 'value_uuid';
		$fields = [];
		$fields_uuid = [];

		foreach( $all_fields as $field )
			if( substr($field, -4) === 'uuid' )
				$fields_uuid[] = $field;
			else
				$fields[] = $field;

		$start_time = micro_time();

		$this->infobase_->exec('BEGIN TRANSACTION');

		$st = null;
		$where = null;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract(get_object_vars($object));

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

			$sql = <<<EOT
				DELETE FROM
					properties_registry
				WHERE
					1
					${where}
EOT
			;

			if( config::$debug ) {

				$stp = $this->infobase_->prepare('EXPLAIN QUERY PLAN ' . $sql);

				foreach( $dimensions as $field )
					if( substr($field, -3) === 'uuid' )
						$stp->bindParam(":${field}", $$field, SQLITE3_BLOB);
					else
						$stp->bindParam(":${field}", $$field);

				$r = $stp->execute()->fetchArray(SQLITE3_ASSOC);

				error_log($r['detail']);

			}

			if( $st_erase === null ) {

				$st_erase = $this->infobase_->prepare($sql);

				foreach( $dimensions as $field )
					if( substr($field, -3) === 'uuid' )
						$stp->bindParam(":${field}", $$field, SQLITE3_BLOB);
					else
						$stp->bindParam(":${field}", $$field);

			}

			$st_erase->execute();

			if( @$recordset === null )
				continue;

			foreach( $recordset as $record ) {

				// object may not present all fields then need initialize
				foreach( $all_fields as $field )
					$$field = null;

				extract(get_object_vars($record));

				foreach( $fields_uuid as $field )
					$$field = uuid2bin(@$$field);

				if( $st === null ) {

					$gf = implode(', ', $all_fields);
					$gv = implode(', :', $all_fields);

					$st = $this->infobase_->prepare("INSERT INTO properties_registry (${gf}) VALUES (:${gv})");

					foreach( $fields_uuid as $field )
						$st->bindParam(":${field}", $$field, SQLITE3_BLOB);

					foreach( $fields as $field )
						$st->bindParam(":${field}", $$field);

				}

				$st->execute();

			}

		}

		$this->infobase_->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);
		$ellapsed_seconds = bcdiv($ellapsed_ms, 1000000, 6);
		$cnt = count($this->objects_);
		$rps = $ellapsed_seconds != 0 ? bcdiv($cnt, $ellapsed_seconds, 2) : $cnt;

	    error_log(sprintf('%u', $cnt) . ' properties_registry updated, ' . $rps . ' rps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
