<?php
//------------------------------------------------------------------------------
namespace {
//------------------------------------------------------------------------------
function micro_time() {

	list($u, $s) = explode(' ', microtime(false));

    return bcadd(bcmul($s, 1000000, 0), bcmul($u, 1000000, 0), 0);

}
//------------------------------------------------------------------------------
function ellapsed_time_string($ms) {

	$a		= bcdiv($ms, 1000000, 0);
	$days	= bcdiv($a, 60 * 60 * 24, 0);
	$hours	= bcdiv($a, 60 * 60) - bcmul($days, 24, 0);
	$mins	= bcdiv($a, 60, 0) - bcmul($days, 24 * 60) - bcmul($hours, 60);
	$secs	= bcsub(bcsub(bcsub($a, bcmul($days, 24 * 60 * 60, 0), 0), bcmul($hours, 60 * 60, 0), 0), bcmul($mins, 60, 0), 0);
	$msecs	= bcmod($ms, 1000000);

	$s = sprintf('%02u:%02u:%02u.%06u', $hours, $mins, $secs, $msecs);

	if( $days !== 0 )
		$s = sprintf('%u', $days) . ':' . $s;

	return $s;

}
//------------------------------------------------------------------------------
function uuid2bin($u, $delimiter = '-') {

	if( $u === null )
		return $u;

	return hex2bin(str_replace($delimiter, '', $u));
}
//------------------------------------------------------------------------------
function bin2uuid($b, $delimiter = '-') {

	if( $b === null )
		return $b;

	$u = bin2hex($b);
	// sample: 2586af57-9d34-11e4-a702-001e673659ad
	return             substr($u,  0,  8)
		. $delimiter . substr($u,  8,  4)
		. $delimiter . substr($u, 12,  4)
		. $delimiter . substr($u, 16,  4)
		. $delimiter . substr($u, 20, 12)
	;

}
//------------------------------------------------------------------------------
} // namespace srv1c
//------------------------------------------------------------------------------
?>
