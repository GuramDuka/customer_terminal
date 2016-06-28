<?php
//------------------------------------------------------------------------------
namespace { // global
//------------------------------------------------------------------------------
// PHP_VERSION_ID доступна в версиях PHP 5.2.7 и выше. Если
// наша версия ниже, можно ее сэмулировать
if( !defined('PHP_VERSION_ID') ) {

    $version = explode('.', PHP_VERSION);

    define('PHP_VERSION_ID', ($version[0] * 10000 + $version[1] * 100 + $version[2]));

}
//------------------------------------------------------------------------------
// PHP_VERSION_ID определена как число. Чем больше число, тем новее
// PHP. Эта константа задается по той же схеме, что приведена выше:
//
// $version_id = $major_version * 10000 + $minor_version * 100 + $release_version;
//
// Теперь с PHP_VERSION_ID можно проверять, какой функционал есть в 
// текущей версии PHP. Не обязательно пользоваться version_compare()
// каждый раз, когда требуется проверить, поддерживает ли PHP нужную
// нам функцию. 
//
// Например, мы можем задать значения констант PHP_VERSION_*,
// которые недоступны в версиях ранее 5.2.7
//------------------------------------------------------------------------------
if( PHP_VERSION_ID < 50207 ) {

    define('PHP_MAJOR_VERSION',   $version[0]);
    define('PHP_MINOR_VERSION',   $version[1]);
    define('PHP_RELEASE_VERSION', $version[2]);

}
//------------------------------------------------------------------------------
} // global namespace
//------------------------------------------------------------------------------
?>