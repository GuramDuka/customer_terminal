<?php
//------------------------------------------------------------------------------
namespace srv1c {
//------------------------------------------------------------------------------
require_once CORE_DIR . 'except.php';
require_once CORE_DIR . 'infobase.php';
require_once CORE_DIR . 'utils.php';
require_once CORE_DIR . 'handler.php';
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
abstract class objects_loader {

	protected $infobase_;

	public function set_infobase($infobase) {
		return $this->infobase_ = $infobase;
	}

	protected $objects_;

	public function set_objects($objects) {
		return $this->objects_ = $objects;
	}

	abstract public function load_objects();

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
