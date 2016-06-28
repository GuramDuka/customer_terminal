<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
require_once LOADERS_DIR . 'base.php';
require_once LOADERS_DIR . 'shared.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class loader_handler extends handler {

	protected function handle_request() {

		$infobase = new infobase;

		$loaders = [
			'prices_registry',
			'remainders_registry',
			'reserves_registry',
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
			'properties_assignments'
		];

		foreach( $loaders as $loader_name ) {

			$objects = @$this->request_->{$loader_name};

			if( $objects === null || count($objects) === 0 )
				continue;

			require_once LOADERS_DIR . $loader_name . '.php';

			$class_name = "srv1c\\${loader_name}_loader";
			$loader = new $class_name;
			$loader->set_infobase($infobase);
			$loader->set_objects($objects);
			$loader->load_objects();

		}

		if( @$this->request_->rewrite_pages !== null
			&& $this->request_->rewrite_pages )
			rewrite_pages($infobase);

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>