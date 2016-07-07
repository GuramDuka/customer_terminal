<?php
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

		parent::open($ib_file_name, $flags | SQLITE3_OPEN_CREATE);
		$this->enableExceptions(true);

		if( $new_ib ) {
			$this->exec('PRAGMA page_size = 4096');
			$this->exec('PRAGMA cache_size = -131072'); // 524288
			$this->exec('PRAGMA count_changes = OFF');
			$this->exec('PRAGMA synchronous = NORMAL');
			$this->exec('PRAGMA journal_mode = WAL');
			$this->exec('PRAGMA temp_store = MEMORY');
			$this->exec('PRAGMA auto_vacuum = NONE');
			$this->exec('PRAGMA default_cache_size = -131072');
		}

		$this->busyTimeout(180000);

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

				unlink($ib_file_name);
				
				throw $e;

			}

		}

		return $new_ib;

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
				uuid			BLOB PRIMARY KEY ON CONFLICT REPLACE,
				marked			INTEGER,
				code			INTEGER,
				name			TEXT,
				article			TEXT,
				base_image_uuid	BLOB
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

		$dimensions = [ 'manufacturer' => '_uuid', 'model' => '_uuid', 'modification' => '_uuid', 'year' => '_uuid' ];
		$this->create_unique_indexes_on_registry('cars', $dimensions);

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

		// регистр ЗначенияПодбораАвтомобилейИнтернетПортала
		$sql = '';

		for( $i = 0; $i < config::$cars_selections_registry_max_values_on_row; $i++ )
			$sql .= <<<EOT
				,
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

		// need only if select cars by products
		/*for( $i = 0; $i < config::$cars_selections_registry_max_values_on_row; $i++ )
			$this->exec(
				'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', "cars_selections_registry_by_value${i}"), -4)
				. " ON cars_selections_registry (value${i}_uuid)"
			);*/

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

		$this->exec(
			'CREATE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', 'remainders_registry_by_product_quantity'), -4)
			. ' ON remainders_registry (product_uuid, quantity)'
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
			'storage'		=> '_uuid',
			'organization'	=> '_uuid',
			'recipient'		=> '_uuid',
			'package_id'	=> '_uuid'
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

		$this->create_unique_indexes_on_registry('system_remainders_records_registry', $dimensions);

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

		$this->exec($this->create_table_products_pages('products_pages'));

	}

	public function dump_plan($sql) {

		try {

			if( config::$explain ) {

				$result = $this->query('EXPLAIN QUERY PLAN ' . $sql);

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

	public function create_table_products_pages($table_name) {

		$sql = '';

		foreach( [ 'asc', 'desc' ] as $direction )
			foreach( [ 'code', 'name', 'price', 'remainder' ] as $order )
				$sql .= <<<EOT
					,
					${order}_${direction}_uuid				BLOB,
					${order}_${direction}_code				INTEGER,
					${order}_${direction}_name				TEXT,
					${order}_${direction}_base_image_uuid	BLOB,
					${order}_${direction}_base_image_ext	TEXT,
					${order}_${direction}_price				NUMERIC,
					${order}_${direction}_remainder			NUMERIC,
					${order}_${direction}_reserve			NUMERIC
EOT
				;

		return <<<EOT
			CREATE TABLE IF NOT EXISTS ${table_name} (
				pgnon									INTEGER PRIMARY KEY ON CONFLICT REPLACE
				${sql}
			) WITHOUT ROWID
EOT
		;

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

				$this->exec(
					'CREATE UNIQUE INDEX IF NOT EXISTS i' . substr(hash('haval256,3', "${rel}_by${gf}"), -4)
					. " ON ${rel} (${gv})"
				);

				if( $shuffle === false )
					break;

				array_push($dims, array_shift($dims));

			}

		}

	}

}
//------------------------------------------------------------------------------
} // namespace srv1c\db
//------------------------------------------------------------------------------
?>
