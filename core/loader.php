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

		$infobase = null;

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
			'customers',
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

			if( $infobase === null ) {
				$infobase = new infobase;
				$infobase->initialize();
			}

			require_once LOADERS_DIR . $loader_name . '.php';

			$class_name = "srv1c\\${loader_name}_loader";
			$loader = new $class_name;
			$loader->set_infobase($infobase);
			$loader->set_objects($objects);
			$loader->load_objects();

		}

		if( @$this->request_['rewrite_pages'] ) {

			if( $infobase === null ) {
				$infobase = new infobase;
				$infobase->initialize();
			}

			require_once LOADERS_DIR . 'pages_writer.php';

			rewrite_pages($infobase);

		}

		if( @$this->request_['pending_orders'] !== null ) {
			require_once LOADERS_DIR . 'pending_orders.php';
			$class_name = "srv1c\\pending_orders";
			$class_object = new $class_name;
			$class_object->set_parameters($this->request_['pending_orders']);
			$class_object->handler();
			$this->response_['pending_orders'] = $class_object->get_response();
		}

		if( @$this->request_['maintenance'] !== null ) {
			require_once LOADERS_DIR . 'maintenance.php';
			$class_name = "srv1c\\maintenancer";
			$class_object = new $class_name;
			$class_object->set_parameters($this->request_['maintenance']);
			$class_object->handler();
		}

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
