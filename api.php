<?php
header('Content-Type: application/json');
include 'koneksi.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// MENGAMBIL DATA (READ)
if ($action == 'read') {
    $result = $conn->query("SELECT * FROM riwayat ORDER BY id DESC");
    $data = [];
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    echo json_encode($data);
}

// FUNGSI UPDATE DATA
elseif ($action == 'update') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    $prioritas = $data['prioritas'];
    $skor = $data['skor'];
    $matrix = json_encode($data['matrix']); 

    $stmt = $conn->prepare("UPDATE riwayat SET prioritas_utama=?, skor=?, matrix_state=? WHERE id=?");
    $stmt->bind_param("sssi", $prioritas, $skor, $matrix, $id);
    
    if($stmt->execute()) echo json_encode(["status" => "success"]);
    else echo json_encode(["status" => "error", "msg" => $conn->error]);
}
// MENYIMPAN DATA (CREATE)
elseif ($action == 'create') {
    $data = json_decode(file_get_contents("php://input"), true);
    $tanggal = $data['tanggal'];
    $prioritas = $data['prioritas'];
    $skor = $data['skor'];
    $matrix = json_encode($data['matrix']); 

    $stmt = $conn->prepare("INSERT INTO riwayat (tanggal, prioritas_utama, skor, matrix_state) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $tanggal, $prioritas, $skor, $matrix);
    
    if($stmt->execute()) echo json_encode(["status" => "success"]);
    else echo json_encode(["status" => "error", "msg" => $conn->error]);
}
// MENGHAPUS DATA (DELETE)
elseif ($action == 'delete') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'];
    
    $stmt = $conn->prepare("DELETE FROM riwayat WHERE id=?");
    $stmt->bind_param("i", $id);
    
    if($stmt->execute()) echo json_encode(["status" => "success"]);
    else echo json_encode(["status" => "error"]);
}
?>