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
class authorizer_handler extends handler {

	protected $infobase_;
	protected $session_uuid_;

	protected function fetch_constants() {

		$constants = [
			'exchange_node'					=> null,
			'exchange_url'					=> null,
			'exchange_user'					=> null,
			'exchange_pass'					=> null
		];

		extract($constants);

		$in = '\'' . implode('\', \'', array_keys($constants)) . '\'';

		$sql = <<<EOT
			SELECT
				name							AS name,
				value_type						AS value_type,
				COALESCE(value_uuid, value_s)	AS value
			FROM
				constants
			WHERE
				name IN (${in})
EOT
		;

		$this->infobase_->dump_plan($sql);

		$result = $this->infobase_->query($sql);

		$a = [];

		while( $r = $result->fetchArray(SQLITE3_ASSOC) ) {

			extract($r);

			if( $value_type === 4 )
				$a[$name] = bin2uuid($value);
			else
				$a[$name] = $value;

		}

		return $a;

	}

	protected function handle_request() {

		$timer = new \nano_timer;

		$this->session_uuid_ = session_startup();
		$this->infobase_ = new infobase;
		$this->infobase_->initialize();

		$this->infobase_->begin_transaction();
		extract($this->fetch_constants());
		$this->infobase_->commit_transaction();

		extract($this->request_);

		if( @$login !== null ) {

			$request = [
				'exchange_node' => $exchange_node,
				'user'			=> $user,
				'pass'			=> $pass	// sha256 hash
			];

			$data = request_exchange_node($exchange_url . '/auth', $exchange_user, $exchange_pass, $request);
			$this->response_['auth'] = $data;

			if( @$data['authorized'] === true )
				$_SESSION['AUTH'] = $data;
		}
		else {
			$auth = @$_SESSION['AUTH'];

			if( @$logout !== null && $auth !== null ) {
				unset($_SESSION['AUTH']);
			}
			else if( $auth !== null ) {
				$this->response_['auth'] = $auth;
			}
		}

		$ellapsed = $timer->nano_time(false);

		$this->response_['ellapsed'] = $ellapsed;

		if( config::$log_timing )
		    error_log('authorizer, ellapsed: ' . $timer->ellapsed_string($ellapsed));

    }

};
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
