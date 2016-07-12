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
class categorer_handler extends handler {

	protected $infobase_;

	protected function handle_request() {

		$start_time = micro_time();

		$this->infobase_ = new infobase;
		$this->infobase_->set_create_if_not_exists(false);
		$this->infobase_->initialize();

		extract(get_object_vars($this->request_));

		$parent_uuid = uuid2bin($parent);
		$category_table = 'products_' . uuid2table_name($parent_uuid) . 'pages';

		$this->infobase_->exec('BEGIN TRANSACTION');

		$where = $parent === null ? 'IS NULL' : '= :parent_uuid';

		$st = $this->infobase_->prepare(<<<EOT
			SELECT
				uuid,
				name
			FROM
				categories
			WHERE
				parent_uuid ${where}
				AND display
				AND selection
			ORDER BY
				name
EOT
		);

		$st->bindParam(":parent_uuid", $parent_uuid, SQLITE3_BLOB);
		$result = $st->execute();

		$categories = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			$uuid = bin2uuid($uuid);

			$category_table = 'products_' . uuid2table_name($uuid) . 'pages';
			$st_e = $this->infobase_->query("SELECT pgnon FROM ${category_table} LIMIT 1");

			if( $st_e->fetchArray(SQLITE3_NUM) === false )
				continue;

			$categories[] = [
				'uuid' => $uuid,
				'name' => htmlspecialchars($name, ENT_HTML5)
			];

		}

		$this->response_['categories'] = $categories;

		$this->infobase_->exec('COMMIT TRANSACTION');

		$finish_time = micro_time();
		$ellapsed_ms = bcsub($finish_time, $start_time);

		$this->response_['ellapsed'] = $ellapsed_ms;

		if( config::$log_timing )
		    error_log('categories list retrieved, ellapsed: ' . ellapsed_time_string($ellapsed_ms));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
