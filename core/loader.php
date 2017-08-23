<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
define('LOADERS_DIR', CORE_DIR . 'loaders' . DIRECTORY_SEPARATOR);
//------------------------------------------------------------------------------
require_once LOADERS_DIR . 'base.php';
require_once LOADERS_DIR . 'shared.php';
require_once CORE_DIR . 'mq' . DIRECTORY_SEPARATOR . 'trigger.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class loader_handler extends handler {

	protected function handle_request() {

		if( config::$log_loader_request )
			error_log(var_export($this->request_, true));

		$infobase = new infobase;
		$infobase->initialize();

		$loaders = [
			'constants',
			'prices_registry',
			'barcodes_registry',
			'reserves_registry',
			'remainders_registry',
			'categories_registry',
			'properties_registry',
			'system_remainders_registry',
			'cars_selections_registry',
			'cars',
			'shops',
			'images',
			'products',
			'categories',
			'properties',
			'properties_values',
			'properties_assignments',
			'products_selection_by_properties_setup_registry',
			'products_selection_by_car_setup_registry',
			'products_properties_by_car_setup_registry'
		];

		foreach( $loaders as $loader_name ) {

			$objects = @$this->request_[$loader_name];

			if( $objects === null || count($objects) === 0 )
				continue;

			require_once LOADERS_DIR . $loader_name . '.php';

			$class_name = "srv1c\\${loader_name}_loader";
			$loader = new $class_name;
			$loader->set_infobase($infobase);
			$loader->set_objects($objects);
			$loader->load_objects();

		}

		if( @$this->request_['rewrite_pages'] ) {

			require_once LOADERS_DIR . 'pages_writer.php';

			rewrite_pages($infobase);

		}

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
