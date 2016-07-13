<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class runtime_exception extends RuntimeException {

	public static function throw_last_error() {

		$err = error_get_last();

		if( $err['type'] !== 0 ) {

			$constants = get_defined_constants(true);
			$errors = [];

			foreach( $constants['Core'] as $name => $value )
			    if( !strncmp($name, 'E_', 2) )
			        $errors[$value] = $name;

   			throw new runtime_exception($errors[$err['type']] . ' ' . $err['message'], $err['type']);

		}

	}

	public static function throw_false($v) {

		if( $v === false )
			runtime_exception::throw_last_error();

	}

};
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class invalid_json_exception extends runtime_exception {

	public static function throw_json_error() {

		$err = json_last_error();

		if( $err !== JSON_ERROR_NONE ) {

			$constants = get_defined_constants(true);
			$json_errors = [];

			foreach( $constants['json'] as $name => $value )
			    if( !strncmp($name, 'JSON_ERROR_', 11) )
			        $json_errors[$value] = $name;

   			throw new invalid_json_exception('Yep, it\'s not JSON, ' . $json_errors[$err], $err);

		}

	}

};
//------------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////
//------------------------------------------------------------------------------
class curl_exception extends runtime_exception {

	public static function throw_curl_error(&$ch) {

		$err = curl_errno($ch);

		if( $err ) {

			$emsg = curl_error($ch);
			$curl_info = curl_getinfo($ch);

			$constants = get_defined_constants(true);
			$errors = [];

			foreach( $constants['curl'] as $name => $value )
			    if( !strncmp($name, 'CURLE_', 6) )
			        $errors[$value] = $name;

			$msg = $emsg . ', ' . $errors[$err];

			if( config::$debug )
				$msg .= "\n" . var_export($curl_info, true);

   			throw new curl_exception($msg, $err);

		}

	}

};
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>
