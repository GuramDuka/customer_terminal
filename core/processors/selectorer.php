<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'infobase.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'handler.php';
require_once LOADERS_DIR . 'shared.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class selectorer_handler extends handler {

	protected $infobase_;

	protected function fetch_setup() {

		extract($this->request_);

		$category_uuid = uuid2bin($category);

		$sql = <<<EOT
			WITH cte AS (
				SELECT DISTINCT
					property_uuid,
					display,
					display_order,
					display_type
				FROM
					products_selection_by_properties_setup_registry
				WHERE
					category_uuid = :category_uuid
			),
			cte0 AS (
				SELECT DISTINCT
					p.name_asc_uuid AS object_uuid,
					c.property_uuid,
					c.display,
					c.display_order,
					c.display_type
				FROM
					products_83f528bc_481a_11e2_9a03_ace5647d95bd_pages AS p
						INNER JOIN cte AS c
						ON 1
			),
			cte2 AS (
				SELECT DISTINCT
					p.property_uuid,
					p.display,
					p.display_order,
					p.display_type,
					r.value_uuid
				FROM
					cte0 AS p
						INNER JOIN properties_registry AS r
						ON p.object_uuid = r.object_uuid
							AND p.property_uuid = r.property_uuid
			)

			SELECT
				r.property_uuid								AS property_uuid,
				r.display									AS display,
				r.display_order								AS display_order,
				r.display_type								AS display_type,
				v.uuid										AS value_uuid,
				v.value_type								AS value_type,
				COALESCE(v.value_b, v.value_n, v.value_s)	AS value
			FROM
				cte2 AS r
					INNER JOIN properties_values AS v
					ON r.value_uuid = v.uuid

			ORDER BY
				r.display_order, r.property_uuid
EOT
		;

		$this->infobase_->dump_plan($sql);

		$st = $this->infobase_->prepare($sql);
		$st->bindParam(':category_uuid', $category_uuid, SQLITE3_BLOB);

		$result = $st->execute();
		$map = [];
		$setup = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$property_uuid	= bin2uuid($property_uuid);
			$value_uuid		= bin2uuid($value_uuid);

			if( !array_key_exists($property_uuid, $map) )
				$map[$property_uuid] = count($map);

			$idx = $map[$property_uuid];

			if( $idx >= count($setup) )
				$setup[$idx] = [
					'uuid'			=> $property_uuid,
					'display'		=> htmlspecialchars($display, ENT_HTML5),
					'display_order'	=> $display_order,
					'display_type'	=> $display_type,
					'values'		=> []
				];

			$setup[$idx]['values'][] = [
				'uuid'			=> $value_uuid,
				'value_type'	=> $value_type,
				'value'			=> is_string($value) ? htmlspecialchars($value, ENT_HTML5) : $value
			];

		}

		$this->response_['setup'] = $setup;

	}

	protected function handle_select() {
	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract($this->request_);

		$this->infobase_->begin_immediate_transaction();

		if( @$setup !== null ) {

			$this->fetch_setup();

			if( config::$log_timing ) {

				$ellapsed = $timer->last_nano_time();
	    		error_log('selections setup fetch, ellapsed: ' . $timer->ellapsed_string($ellapsed));

			}

		}

		if( @$select !== null )
			$this->handle_select();

		$this->infobase_->commit_immediate_transaction();

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('selections retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
