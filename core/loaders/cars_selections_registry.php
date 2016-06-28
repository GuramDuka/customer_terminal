<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class cars_selections_registry_loader extends objects_loader {

	public function load_objects() {

		if( $this->objects_ === null || count($this->objects_) === 0 )
			return;

		$all_fields = [ 'car_uuid', 'category_uuid', 'idx' ];

		for( $i = 0; $i < config::$cars_selections_registry_max_values_on_row; $i++ )
			$all_fields[] = "value${i}_uuid";

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
		$st_erase = null;

		foreach( $this->objects_ as $object ) {

			// object may not present all fields then need initialize
			foreach( $all_fields as $field )
				$$field = null;

			extract(get_object_vars($object));

			foreach( $fields_uuid as $field )
				$$field = uuid2bin(@$$field);

			$car_where		= $car_uuid			!== null ? 'AND car_uuid = :car_uuid'		: '';
			$category_where	= $category_uuid	!== null ? 'AND category_uuid = :car_uuid'	: '';
			$idx_where		= $idx				!== null ? 'AND idx = :car_uuid'			: '';

			$sql = <<<EOT
				DELETE FROM
					cars_selections_registry
				WHERE
					1
					${car_where}
					${category_where}
					${idx_where}
EOT
			;

			$st_erase = $this->infobase_->prepare($sql);

			if( config::$debug ) {

				$stp = $this->infobase_->prepare('EXPLAIN QUERY PLAN ' . $sql);
				$stp->bindParam(':car_uuid'			, $car_uuid		, SQLITE3_BLOB);
				$stp->bindParam(':category_uuid'	, $category_uuid, SQLITE3_BLOB);
				$stp->bindParam(':idx'				, $idx);

				$r = $stp->execute();
				$r = $r->fetchArray(SQLITE3_ASSOC);

				error_log($r['detail']);

			}

			$st_erase->bindParam(':car_uuid'		, $car_uuid		, SQLITE3_BLOB);
			$st_erase->bindParam(':category_uuid'	, $category_uuid, SQLITE3_BLOB);
			$st_erase->bindParam(':idx'				, $idx);

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

					$st = $this->infobase_->prepare("INSERT INTO cars_selections_registry (${gf}) VALUES (:${gv})");

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

	    error_log(sprintf('%u', $cnt) . ' cars selections registry updated, ' . $rps . ' rps, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

	}

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
