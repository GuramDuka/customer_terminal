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

		$timer = new \nano_timer;

		$this->infobase_ = new infobase;
		$this->infobase_->initialize();

		extract($this->request_);

		$parent_uuid = uuid2bin($parent);
		$category_table = 'products_' . uuid2table_name($parent_uuid) . 'pages';

		$this->infobase_->begin_transaction();

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
			$table_version = $this->infobase_->products_pages_version($category_table);
			$category_table .= '_v' . $table_version;
			$st_e = $this->infobase_->query("SELECT pgnon FROM ${category_table} LIMIT 1");

			if( $st_e->fetchArray(SQLITE3_NUM) === false )
				continue;

			$categories[] = [
				'uuid' => $uuid,
				'name' => htmlspecialchars($name, ENT_HTML5)
			];

		}

		$this->response_['categories'] = $categories;

		$this->infobase_->commit_transaction();

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('categories list retrieved, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
