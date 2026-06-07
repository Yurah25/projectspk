<?php

$host = "sql210.infinityfree.com"; 
$user = "if0_42124018";           
$pass = "5FMLl27ndQKCB";      
$db   = "if0_42124018_XXX";  

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>