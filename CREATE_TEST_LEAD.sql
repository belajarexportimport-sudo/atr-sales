-- BUAT LEAD PANCINGAN UNTUK TEST TOMBOL GRAB DI APP
-- Script ini HANYA bikin lead kosong baru.
-- Tugas Bos adalah mengambil lead ini PAKAI TOMBOL GRAB DI APLIKASI (Bukan pakai SQL).

INSERT INTO inquiries (
    customer_name, status, user_id, 
    origin, destination, service_type, 
    created_at, updated_at
) VALUES (
    'TESTING SYSTEM SHARK TANK (COBA GRAB SAYA)', 
    'Profiling', 
    NULL, -- Sengaja dikosongkan biar masuk Shark Tank
    'Jakarta', 'Bali', 'Udara',
    NOW(), NOW()
);

-- Tampilkan hasilnya
SELECT id, customer_name, status, user_id 
FROM inquiries 
WHERE customer_name = 'TESTING SYSTEM SHARK TANK (COBA GRAB SAYA)';
