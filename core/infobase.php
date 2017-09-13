<?php
//------------------------------------------------------------------------------
namespace {
//------------------------------------------------------------------------------
define('SQLITE3_OPEN_SHAREDCACHE' , 0x00020000);
//------------------------------------------------------------------------------
}
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class infobase extends \SQLite3 {

	protected $create_if_not_exists_ = true;

	public function set_create_if_not_exists($v) {
		$this->create_if_not_exists = $v;
	}

	public function __construct() {
	}

    public function initialize(int $flags = SQLITE3_OPEN_READWRITE) {
                                                   
		$ib_file_name = APP_DIR . 'data' . DIRECTORY_SEPARATOR . 'base.sqlite';

		if( file_exists(dirname($ib_file_name)) === false )
			mkdir(dirname($ib_file_name), 0777, true);

		$new_ib = file_exists($ib_file_name) === false;

		parent::close();
		parent::open($ib_file_name, $flags | SQLITE3_OPEN_CREATE);
		// must not use SQLITE3_OPEN_SHAREDCACHE and immediately after opening your database connection, you could do this:
		$this->busyTimeout(config::$sqlite_busy_timeout);

		$this->enableExceptions(true);

		if( $new_ib ) {

			$pgsz = config::$sqlite_page_size;

			$this->exec("PRAGMA page_size = ${pgsz}");
			$this->exec('PRAGMA journal_mode = WAL');
			$this->exec('PRAGMA count_changes = OFF');
			$this->exec('PRAGMA auto_vacuum = INCREMENTAL');

		}

		$cachesz = config::$sqlite_cache_size;
		$this->exec("PRAGMA cache_size = -${cachesz}");
		$this->exec('PRAGMA synchronous = NORMAL');

		$temp_store = config::$sqlite_temp_store;
		$this->exec("PRAGMA temp_store = ${temp_store}");
		//$this->exec('PRAGMA busy_timeout = 180000');

		if( config::$debug ) {

			$s = 'SQLITE compile options: ';
			$result = $this->query('PRAGMA compile_options');

			while( $r = $result->fetchArray(SQLITE3_ASSOC) )
				$s .= "\n" . $r['compile_option'];

			error_log($s);

		}

		if( ($new_ib && $this->create_if_not_exists_) || config::$force_create_infobase ) {

			try {

				$this->create_scheme();

			}
			catch( \Throwable $e ) {

				parent::close();

				if( $new_ib )
					unlink($ib_file_name);
				
				throw $e;

			}

		}

		return $new_ib;

    }


	public function begin_transaction($type = 'DEFERRED') {

		$this->exec("BEGIN ${type} /* DEFERRED, IMMEDIATE, EXCLUSIVE */ TRANSACTION");

	}

	public function commit_transaction() {

		$this->exec('COMMIT TRANSACTION');

	}

	public function create_scheme() {

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS dirties (
				entity		TEXT PRIMARY KEY ON CONFLICT REPLACE
			) WITHOUT ROWID
EOT
		);

		// константы
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS constants (
				name			TEXT PRIMARY KEY ON CONFLICT REPLACE,
				value_type		INTEGER,	/* 1 - boolean, 2 - numeric, 3 - string, 4 - reference */
				value_b			INTEGER,	/* boolean */
				value_n			NUMERIC,	/* numeric */
				value_s			TEXT,		/* string */
				value_uuid		BLOB		/* reference */
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'constants_by_value_uuid'), -4)
			. ' ON constants (value_uuid)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS products (
				uuid				BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked				INTEGER,
				code				INTEGER,
				code_fti			TEXT,
				name				TEXT,
				name_fti			TEXT,
				article				TEXT,
				article_fti			TEXT,
				base_image_uuid		BLOB,
				description			TEXT,
				description_fti		TEXT,
				description_in_html	INTEGER
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'products_order_by_code'), -4)
			. ' ON products (code)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'products_order_by_name'), -4)
			. ' ON products (name)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'products_order_by_uuid_base_image_uuid'), -4)
			. ' ON products (uuid, base_image_uuid)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS categories (
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked			INTEGER,
				folder			INTEGER,
				parent_uuid		BLOB,
				code			TEXT,
				name			TEXT,
				selection		INTEGER,
				display			INTEGER
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'categories_order_by_parent'), -4)
			. ' ON categories (parent_uuid)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS shops (
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked			INTEGER,
				vr				INTEGER,	/* if true then virtual value */
				code			INTEGER,
				name			TEXT
			) WITHOUT ROWID
EOT
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS cars (
				uuid				BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked				INTEGER,
				folder				INTEGER,
				parent_uuid			BLOB,
				code				INTEGER,
				name				TEXT,
				manufacturer_uuid	BLOB,
				model_uuid			BLOB,
				modification_uuid	BLOB,
				year_uuid			BLOB
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'cars_order_by_parent'), -4)
			. ' ON cars (parent_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'cars_order_by_parent_manufacturer'), -4)
			. ' ON cars (parent_uuid, manufacturer_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'cars_order_by_parent_manufacturer_model'), -4)
			. ' ON cars (parent_uuid, manufacturer_uuid, model_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'cars_order_by_parent_modification_model'), -4)
			. ' ON cars (parent_uuid, manufacturer_uuid, model_uuid, modification_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'cars_order_by_parent_modification_model_year'), -4)
			. ' ON cars (parent_uuid, manufacturer_uuid, model_uuid, modification_uuid, year_uuid)'
		);

		//$dimensions = [ 'manufacturer' => '_uuid', 'model' => '_uuid', 'modification' => '_uuid', 'year' => '_uuid' ];
		//$this->create_unique_indexes_on_registry('cars', $dimensions);

		// регистр категории объектов
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS categories_registry (
				category_uuid	BLOB,
				product_uuid	BLOB
			)
EOT
		);

		$dimensions = [ 'category' => '_uuid', 'product' => '_uuid' ];
		$this->create_unique_indexes_on_registry('categories_registry', $dimensions);

		// план видов характеристик назначения свойств объектов
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS properties_assignments (
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked			INTEGER,
				folder			INTEGER,
				code			TEXT,
				name			TEXT
			) WITHOUT ROWID
EOT
		);

		// план видов характеристик свойства объектов
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS properties (
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked			INTEGER,
				code			TEXT,
				name			TEXT,
				assignment_uuid	BLOB
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'properties_order_by_assignment_uuid'), -4)
			. ' ON properties (assignment_uuid)'
		);

		// справочник значения свойств объектов
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS properties_values (
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked			INTEGER,
				vr				INTEGER,	/* if true then virtual value */
				code			TEXT,
				property_uuid	BLOB,
				value_type		INTEGER,	/* 1 - boolean, 2 - numeric, 3 - string, 4 - reference */
				value_b			INTEGER,	/* boolean */
				value_n			NUMERIC,	/* numeric */
				value_s			TEXT		/* string */
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'properties_values_by_property'), -4)
			. ' ON properties_values (property_uuid)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS barcodes_registry (
				product_uuid	BLOB,
				barcode			TEXT
			)
EOT
		);

		$dimensions = [ 'product' => '_uuid', 'barcode' => '' ];
		$this->create_unique_indexes_on_registry('barcodes_registry', $dimensions);

		// регистр значения свойств объектов
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS properties_registry (
				object_uuid		BLOB,
				property_uuid	BLOB,
				idx				INTEGER,
				value_uuid		BLOB
			)
EOT
		);

		$dimensions = [ 'object' => '_uuid', 'property' => '_uuid', 'idx' => '' ];
		$this->create_unique_indexes_on_registry('properties_registry', $dimensions);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'properties_registry_by_value'), -4)
			. ' ON properties_registry (value_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'properties_registry_by_object_property_value'), -4)
			. ' ON properties_registry (object_uuid, property_uuid, value_uuid)'
		);

		// регистр ЗначенияПодбораАвтомобилейИнтернетПортала
		$sql = '';

		for( $i = 0; $i < config::$cars_selections_registry_max_values_on_row; $i++ )
			$sql .= <<<EOT
				,
				property${i}_uuid	BLOB,
				value${i}_uuid		BLOB
EOT
		;

		$this->exec(<<<EOT
			CREATE TABLE IF NOT EXISTS cars_selections_registry (
				car_uuid		BLOB,
				category_uuid	BLOB,
				idx				INTEGER
				${sql}
			)
EOT
		);

		$dimensions = [ 'car' => '_uuid', 'category' => '_uuid', 'idx' => '' ];
		$this->create_unique_indexes_on_registry('cars_selections_registry', $dimensions);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS images (
				uuid		BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked		INTEGER,
				object_uuid	BLOB,
				ext			TEXT
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'images_by_object'), -4)
			. ' ON images (object_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'images_by_uuid_ext'), -4)
			. ' ON images (uuid, ext)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS prices_records_registry (
				recorder_uuid	BLOB,
				period			INTEGER,	/* INTEGER as Unix Time, the number of seconds since 1970-01-01 00:00:00 UTC.  */
				product_uuid	BLOB,
				price			NUMERIC
			)
EOT
		);

		$dimensions = [ 'recorder' => '_uuid', 'product' => '_uuid' ];
		$this->create_unique_indexes_on_registry('prices_records_registry', $dimensions);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS prices_registry (
				product_uuid	BLOB PRIMARY KEY ON CONFLICT REPLACE,
				period			INTEGER,	/* INTEGER as Unix Time, the number of seconds since 1970-01-01 00:00:00 UTC.  */
				ref_count		INTEGER,
				price			NUMERIC
			) WITHOUT ROWID
EOT
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'prices_registry_by_product_price'), -4)
			. ' ON prices_registry (product_uuid, price)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS remainders_records_registry (
				recorder_uuid	BLOB,
				product_uuid	BLOB,
				quantity		NUMERIC
			)
EOT
		);

		$dimensions = [ 'recorder' => '_uuid', 'product' => '_uuid' ];
		$this->create_unique_indexes_on_registry('remainders_records_registry', $dimensions);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS remainders_registry (
				product_uuid	BLOB PRIMARY KEY ON CONFLICT REPLACE,
				quantity		NUMERIC
			) WITHOUT ROWID
EOT
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS reserves_records_registry (
				recorder_uuid	BLOB,
				product_uuid	BLOB,
				quantity		NUMERIC
			)
EOT
		);

		$dimensions = [ 'recorder' => '_uuid', 'product' => '_uuid' ];
		$this->create_unique_indexes_on_registry('reserves_records_registry', $dimensions);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS reserves_registry (
				product_uuid	BLOB PRIMARY KEY ON CONFLICT REPLACE,
				quantity		NUMERIC
			) WITHOUT ROWID
EOT
		);

		$dimensions = [
			'infobase'		=> '_uuid',
			'product'		=> '_uuid',
			'storage'		=> '_uuid'
		];

		$gf = implode('_uuid BLOB, ', array_keys($dimensions)) . '_uuid BLOB, ';

		$this->exec(<<<EOT
			CREATE TABLE IF NOT EXISTS system_remainders_records_registry (
				${gf}
				shop_uuid			BLOB,
				remainder_quantity	NUMERIC,
				reserve_quantity	NUMERIC
			)
EOT
		);

		//$this->create_unique_indexes_on_registry('system_remainders_records_registry', $dimensions);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'system_remainders_records_registry_by_dims'), -4)
			. ' ON system_remainders_records_registry (infobase_uuid, product_uuid, storage_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'system_remainders_records_registry_by_shop_product'), -4)
			. ' ON system_remainders_records_registry (shop_uuid, product_uuid)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS system_remainders_registry (
				shop_uuid			BLOB,
				product_uuid		BLOB,
				remainder_quantity	NUMERIC,
				reserve_quantity	NUMERIC
			)
EOT
		);

		$dimensions = [ 'shop' => '_uuid', 'product' => '_uuid' ];
		$this->create_unique_indexes_on_registry('system_remainders_registry', $dimensions);

		$this->exec($this->products_pages_ddl('products_pages'));

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS cart (
				session_uuid	BLOB NOT NULL,
				product_uuid	BLOB NOT NULL,
				quantity		NUMERIC NOT NULL,
				price			NUMERIC,
				UNIQUE(session_uuid, product_uuid) ON CONFLICT REPLACE
			) /*WITHOUT ROWID*/
EOT
		);

		$this->exec(
			'CREATE UNIQUE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'cart_by_session_uuid_product_uuid'), -4)
			. ' ON cart (session_uuid, product_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'cart_by_session_uuid_quantity'), -4)
			. ' ON cart (session_uuid, quantity)'
		);

		// регистр Настройка подбора терминала покупателя
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS products_selection_by_properties_setup_registry (
				category_uuid	BLOB,
				property_uuid	BLOB,
				display			TEXT,
				display_order	INTEGER,
				columns			INTEGER,
				multi_select	INTEGER
			)
EOT
		);

		$dimensions = [ 'category' => '_uuid', 'property' => '_uuid' ];
		$this->create_unique_indexes_on_registry('products_selection_by_properties_setup_registry', $dimensions);

		// регистр Настройки выбора автомобиля
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS products_selection_by_car_setup_registry (
				category_uuid	BLOB,
				car_group_uuid	BLOB
			)
EOT
		);

		$dimensions = [ 'category' => '_uuid', 'car_group' => '_uuid' ];
		$this->create_unique_indexes_on_registry('products_selection_by_car_setup_registry', $dimensions);

		// регистр Настройки подбора по автомобилю терминала покупателя
		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS products_properties_by_car_setup_registry (
				category_uuid	BLOB,
				property_uuid	BLOB,
				enabled			INTEGER
			)
EOT
		);

		$dimensions = [ 'category' => '_uuid', 'property' => '_uuid' ];
		$this->create_unique_indexes_on_registry('products_properties_by_car_setup_registry', $dimensions);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS pending_orders (
				session_uuid		BLOB NOT NULL,
				order_uuid			BLOB NOT NULL,
				request				TEXT,
				data				TEXT NOT NULL,
				UNIQUE(session_uuid, order_uuid) ON CONFLICT REPLACE
			) /*WITHOUT ROWID*/
EOT
		);

		$this->exec(
			'CREATE UNIQUE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'pending_orders_by_session_uuid_order_uuid'), -4)
			. ' ON pending_orders (session_uuid, order_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'pending_orders_by_session_uuid_data'), -4)
			. ' ON pending_orders (session_uuid, data)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'pending_orders_by_order_uuid'), -4)
			. ' ON pending_orders (order_uuid)'
		);

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'pending_orders_by_data'), -4)
			. ' ON pending_orders (data)'
		);

		$this->exec(<<<'EOT'
			CREATE TABLE IF NOT EXISTS customers (
				uuid				BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked				INTEGER,
				code				TEXT,
				name				TEXT,
				name_fti			TEXT,
				inn					TEXT,
				description			TEXT,
				description_fti		TEXT
			) WITHOUT ROWID
EOT
		);

		$this->exec(<<<'EOT'
			CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5 (
				uuid UNINDEXED,
				code,
				name,
				article,
				description,
				barcode,
				--prefix = '2 3 4',
				detail = full,
				--columnsize = 1,
        		tokenize = "unicode61");

			-- Triggers to keep the FTS index up to date.
			CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products FOR EACH ROW
			BEGIN
				INSERT INTO products_fts VALUES (old.uuid, NULL, NULL, NULL, NULL, NULL);
			END;

			CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products FOR EACH ROW
			BEGIN
				INSERT INTO products_fts 
					SELECT
						p.uuid,
						p.code_fti AS code,
						p.name_fti AS name,
						p.article_fti AS article,
						p.description_fti AS description,
						b.barcode
					FROM
						products AS p
							LEFT JOIN barcodes_registry AS b
							ON p.uuid = b.product_uuid
					WHERE
						p.uuid = new.uuid;
			END;
			-- identical
			CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products FOR EACH ROW
			BEGIN
				INSERT INTO products_fts 
					SELECT
						p.uuid,
						p.code_fti AS code,
						p.name_fti AS name,
						p.article_fti AS article,
						p.description_fti AS description,
						b.barcode
					FROM
						products AS p
							LEFT JOIN barcodes_registry AS b
							ON p.uuid = b.product_uuid
					WHERE
						p.uuid = new.uuid;
			END;
			-- identical
			CREATE TRIGGER IF NOT EXISTS barcodes_registry_ai AFTER INSERT ON barcodes_registry FOR EACH ROW
			BEGIN
				INSERT INTO products_fts 
					SELECT
						p.uuid,
						p.code_fti AS code,
						p.name_fti AS name,
						p.article_fti AS article,
						p.description_fti AS description,
						new.barcode AS barcode
					FROM
						products AS p
					WHERE
						p.uuid = new.product_uuid;
			END;
			-- identical
			CREATE TRIGGER IF NOT EXISTS barcodes_registry_au AFTER UPDATE ON barcodes_registry FOR EACH ROW
			BEGIN
				INSERT INTO products_fts 
					SELECT
						p.uuid,
						p.code_fti AS code,
						p.name_fti AS name,
						p.article_fti AS article,
						p.description_fti AS description,
						new.barcode AS barcode
					FROM
						products AS p
					WHERE
						p.uuid = new.product_uuid;
			END;
			-- customers fts
			CREATE VIRTUAL TABLE IF NOT EXISTS customers_fts USING fts5 (
				uuid UNINDEXED,
				name,
				inn,
				description,
				detail = full,
        		tokenize = "unicode61");

			-- Triggers to keep the FTS index up to date.
			CREATE TRIGGER IF NOT EXISTS customers_ad AFTER DELETE ON customers FOR EACH ROW
			BEGIN
				INSERT INTO customers_fts VALUES (old.uuid, NULL, NULL, NULL);
			END;

			CREATE TRIGGER IF NOT EXISTS customers_ai AFTER INSERT ON customers FOR EACH ROW
			BEGIN
				INSERT INTO customers_fts VALUES (new.uuid, new.name_fti, new.inn, new.description_fti);
			END;
			-- identical
			CREATE TRIGGER IF NOT EXISTS customers_au AFTER UPDATE ON customers FOR EACH ROW
			BEGIN
				INSERT INTO customers_fts VALUES (new.uuid, new.name_fti, new.inn, new.description_fti);
			END;
EOT
		);

	}

	public function dump_plan($sql, $force = false) {

		try {

			if( $force || config::$explain ) {

				$sql = "\n" . $sql;

				$result = $this->query('EXPLAIN QUERY PLAN' . $sql);

				$s = "${sql}";

				while( $r = $result->fetchArray(SQLITE3_ASSOC) )
					$s .= "\n" . $r['detail'];

				error_log($s);

			}

		}
		catch( \Throwable $e ) {

			error_log($sql);
			throw $e;

		}

	}

	public function products_pages_ddl($table) {

		return <<<EOT
			CREATE TABLE IF NOT EXISTS ${table} (
				pgnon				INTEGER PRIMARY KEY ON CONFLICT REPLACE,
				uuid				BLOB,
				code				INTEGER,
				name				TEXT,
				base_image_uuid		BLOB,
				base_image_ext		TEXT,
				price				NUMERIC/*,
				remainder			NUMERIC,
				reserve				NUMERIC*/
			) WITHOUT ROWID
EOT
		;

	}

	public function products_pages_version($table, $keep_versions = -1) {

		$entity = $this->escapeString($table);

		$result = $this->query(<<<EOT
			SELECT
				name
			FROM
				sqlite_master
			WHERE
				type = 'table'
				AND name LIKE '${entity}_v%'
EOT
		);

		$vr = [];

		while( $r = $result->fetchArray(SQLITE3_NUM) )
			$vr[] = $r[0];

		natsort($vr);

		while( $keep_versions >= 0 && count($vr) >= $keep_versions ) {

			$entity = $this->escapeString(array_shift($vr));
			$this->exec("DROP TABLE IF EXISTS ${entity}");

		}

		$r = array_pop($vr);

		if( $r === null )
			$r = 0;
		else
			$r = intval(substr($r, strpos($r, '_v') + 2));

		return $r;

	}

	protected function create_unique_indexes_on_registry($rel, $dimensions, $shuffle = true) {

		foreach( $dimensions as $kk => $vv ) {

			$dims = [];

			foreach( $dimensions as $k => $v )
				if( $k !== $kk )
					$dims[] = [ $k, $v ];

			for( $i = count($dims) - 1; $i >= 0; $i-- ) {

				$gf = '_' . $kk;
				$gv = $kk . $vv;

				foreach( $dims as $dim ) {
					$gf .= '_' . $dim[0];
					$gv .= ', ' . $dim[0] . $dim[1];
				}

				$sql = 'CREATE UNIQUE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', "${rel}_by${gf}"), -4)
					. " ON ${rel} (${gv})";

				$this->exec($sql);

				if( $shuffle === false )
					break;

				array_push($dims, array_shift($dims));

			}

		}

	}

	public function sqlite_tx_duration($timer, $src_file_name, $src_line_number) {

		$ellapsed = $timer->last_nano_time();

		if( bccomp($ellapsed, config::$sqlite_tx_duration) >= 0 ) {

			$timer->reset();

			$this->commit_transaction();
			$this->begin_transaction();

			if( config::$log_sqlite_tx_duration )
   				error_log('sqlite tx duration reached, ellapsed: ' . $timer->ellapsed_string($ellapsed)/* . " ${src_file_name}, ${src_line_number}"*/);

		}

	}

}
//------------------------------------------------------------------------------
} // namespace srv1c\db
//------------------------------------------------------------------------------
?>
