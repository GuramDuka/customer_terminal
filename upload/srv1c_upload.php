<?php
//------------------------------------------------------------------------------
ini_set('max_execution_time', 60);
ini_set('error_log', '/var/www/shintorg/resources/upload/'.date('Y-m-d').'.log');
ini_set('log_errors', 'On');
error_reporting(E_ALL);// ^ E_NOTICE ^ E_WARNING);
ini_set('display_startup_errors', 'On');
mb_internal_encoding('UTF-8');
mb_regex_encoding('UTF-8');
mb_http_output('UTF-8');
//------------------------------------------------------------------------------
header('Content-Type: text/plain; charset=utf-8');

try {

    //error_log(var_export($_SERVER, true));
    //error_log(var_export($_POST, true));
    //error_log(var_export($_FILES, true));

    // Undefined | Multiple Files | $_FILES Corruption Attack
    // If this request falls under any of them, treat it invalid.
    if ( !isset($_FILES['upfile']['error']) || is_array($_FILES['upfile']['error']) )
	throw new RuntimeException('Invalid parameters.');

    // Check $_FILES['upfile']['error'] value.
    switch ( $_FILES['upfile']['error'] ) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new RuntimeException('No file sent.');
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new RuntimeException('Exceeded filesize limit.');
        case UPLOAD_ERR_PARTIAL:
            throw new RuntimeException('The uploaded file was only partially uploaded.');
        default:
            throw new RuntimeException('Unknown errors.');
    }

    // You should also check filesize here.
    //if ($_FILES['upfile']['size'] > 1000000) {
    //    throw new RuntimeException('Exceeded filesize limit.');
    //}

    // DO NOT TRUST $_FILES['upfile']['mime'] VALUE !!
    // Check MIME Type by yourself.
    //$finfo = new finfo(FILEINFO_MIME_TYPE);
    //error_log(var_export(finfo_file($finfo, $_FILES['upfile']['tmp_name']), true));
    //
    //if (false === $ext = array_search(
    //    $finfo->file($_FILES['upfile']['tmp_name']),
    //    array(
    //        'jpg'  => 'image/jpeg',
    //        'png'  => 'image/png',
    //        'gif'  => 'image/gif',
    //        'bmp'  => 'image/bmp',
    //        'svg'  => 'image/svg+xml',
    //        'svgz' => 'image/svg+xml',
    //        'eot'  => 'application/vnd.ms-fontobject',
    //        'ttf'  => 'application/font-sfnt',
    //        'woff' => 'application/font-woff',
    //    ),
    //    true
    //)) {
    //    throw new RuntimeException('Invalid file format.');
    //}

    // You should name it uniquely.
    // DO NOT USE $_FILES['upfile']['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
    if ( !move_uploaded_file(
        $_FILES['upfile']['tmp_name'],
        //sprintf('/var/www/shintorg/resources/%s.%s',
        //    sha1_file($_FILES['upfile']['tmp_name']),
        //    $ext
        //)
        sprintf('/var/www/shintorg/resources/%s', $_FILES['upfile']['name'])
    )) {
        throw new RuntimeException('Failed to move uploaded file.');
    }

    echo 'File is uploaded successfully.';

}
catch (RuntimeException $e) {

    echo $e->getMessage();
    header(':', true, 500);

}

?>
