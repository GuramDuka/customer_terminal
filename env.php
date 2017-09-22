<?php

$v = 0;
for($i=1;$i<99;$i++) {
$v+=$i;
}

print '<pre style="text-align: justify">'.var_export($v,true).'</pre>';
print '<pre style="text-align: justify">'.var_export($_SERVER,true).'</pre>';
print '<pre style="text-align: justify">'.var_export($_GET,true).'</pre>';
print '<pre style="text-align: justify">'.phpinfo().'</pre>';

$n = tempnam(sys_get_temp_dir(), 'sqlite');
$ib = new SQLite3($n, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
$s = 'SQLITE compile options: ';
$result = $ib->query('PRAGMA compile_options');

while( $r = $result->fetchArray(SQLITE3_ASSOC) )
	$s .= "\n\t" . $r['compile_option'];

$ib->close();
unlink($n);

print '<pre style="text-align: justify">'.$s.'</pre>';

set_time_limit(920);

$begin = startTime();
$scores = array();


foreach(hash_algos() as $algo) {
    $scores[$algo] = 0;
}

for($i=0;$i<10000;$i++) {
    $number = rand()*100000000000000;
    $string = randomString(500);

    foreach(hash_algos() as $algo) {
        $start = startTime();

        hash($algo, $number); //Number
        hash($algo, $string); //String

        $end = endTime($start);

        $scores[$algo] += $end;
    }   
}


asort($scores);

$i=1;
foreach($scores as $alg => $time) {
    print $i.' - '.$alg.' '.$time.'<br />';
    $i++;
}

echo "Entire page took ".endTime($begin).' seconds<br />';

echo "<br /><br /><h2>Hashes Compared</h2>";

foreach($scores as $alg => $time) {
    print $i.' - '.$alg.' '.hash($alg,$string).'<br />';
    $i++;
}

function startTime() {
   $mtime = microtime(); 
   $mtime = explode(" ",$mtime); 
   $mtime = $mtime[1] + $mtime[0]; 
   return $mtime;   
}

function endTime($starttime) {
   $mtime = microtime(); 
   $mtime = explode(" ",$mtime); 
   $mtime = $mtime[1] + $mtime[0]; 
   $endtime = $mtime; 
   return $totaltime = ($endtime - $starttime); 
}

function randomString($length) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyz';
    $string = '';    
    for ($p = 0; $p < $length; $p++) {
        $string .= $characters[mt_rand(0, strlen($characters) - 1)];
    }
    return $string;
}

echo var_export(hash_algos(),true);
?>
