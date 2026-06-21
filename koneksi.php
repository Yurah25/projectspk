<?php

$host = "localhost";    // Server lokal
$user = "root";         // Username default untuk server lokal
$pass = "";             // Password default biasanya dibiarkan kosong
$db   = "db_spk_saw"; // Ganti dengan nama database yang kamu buat di phpMyAdmin

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Koneksi gagal: " . $conn->connect_error);
}
?>