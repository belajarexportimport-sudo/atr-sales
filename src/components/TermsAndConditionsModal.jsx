import React from 'react';

export default function TermsAndConditionsModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-800">Syarat & Ketentuan (Terms & Conditions)</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-xl">&times;</button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-6 overflow-y-auto text-sm text-gray-700 leading-relaxed space-y-4">

                    <h3 className="font-bold text-lg text-primary-800 border-b pb-1">1. KEPATUHAN ETIKA DAN LARANGAN KONFLIK KEPENTINGAN</h3>
                    <p>Pasal ini dirancang untuk mencegah praktik "kanibalisme" atau pembajakan klien dari tempat kerja asal Afiliator.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>1.1. Larangan Akuisisi Pelanggan Internal (Anti-Poaching):</strong> Afiliator dilarang keras menarik, mengajak, atau mengalihkan pelanggan/klien dari perusahaan tempat mereka bekerja (saat ini atau dalam 12 bulan terakhir) ke dalam ekosistem Atrex Force.</li>
                        <li><strong>1.2. Deklarasi Pekerjaan:</strong> Setiap Afiliator wajib menyatakan status kepegawaiannya. Jika Afiliator bekerja di perusahaan dengan bidang usaha sejenis (Competitor), Afiliator dilarang menggunakan sumber daya, database, atau waktu kerja perusahaan tersebut untuk kepentingan Atrex Force.</li>
                        <li><strong>1.3. Independensi:</strong> Afiliator adalah mitra independen dan bukan karyawan Atrex International. Atrex tidak bertanggung jawab atas segala bentuk pelanggaran kontrak kerja antara Afiliator dengan pemberi kerja pihak ketiga.</li>
                    </ul>

                    <h3 className="font-bold text-lg text-primary-800 border-b pb-1 mt-4">2. KERAHASIAAN DATA (NON-DISCLOSURE AGREEMENT)</h3>
                    <p>Khusus untuk data sensitif yang didapat dari sesi Shark Tank Atrex Force.</p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>2.1. Definisi Data Rahasia:</strong> Mencakup namun tidak terbatas pada: strategi bisnis, data prospek, angka penjualan, algoritma, serta detail presentasi yang dipaparkan dalam sesi Shark Tank Atrex Force.</li>
                        <li><strong>2.2. Larangan Pengungkapan:</strong> Afiliator dilarang membocorkan, menyalin, atau membagikan data tersebut kepada pihak ketiga mana pun tanpa izin tertulis dari manajemen Atrex.</li>
                        <li><strong>2.3. Penggunaan Terbatas:</strong> Data yang didapat dari ekosistem Atrex hanya boleh digunakan untuk tujuan peningkatan performa penjualan di bawah bendera Atrex Force, bukan untuk kepentingan pribadi atau pihak luar.</li>
                    </ul>

                    <h3 className="font-bold text-lg text-primary-800 border-b pb-1 mt-4">3. KEBIJAKAN PELANGGARAN DAN SANKSI (PUNISHMENT)</h3>
                    <p>Atrex menerapkan kebijakan <strong>Zero Tolerance</strong> terhadap pelanggaran integritas.</p>
                    <table className="min-w-full border-collapse border border-gray-300 mt-2">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 p-2 text-left">Jenis Pelanggaran</th>
                                <th className="border border-gray-300 p-2 text-left">Sanksi Administratif</th>
                                <th className="border border-gray-300 p-2 text-left">Sanksi Finansial/Hukum</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-gray-300 p-2">Membajak klien dari kantor asal</td>
                                <td className="border border-gray-300 p-2">Pemutusan hubungan kemitraan seketika (Blacklist).</td>
                                <td className="border border-gray-300 p-2">Pembatalan seluruh komisi yang belum dibayarkan.</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">Membocorkan data Shark Tank</td>
                                <td className="border border-gray-300 p-2">Pencabutan akses ke seluruh platform Atrex.</td>
                                <td className="border border-gray-300 p-2">Denda sebesar 5x lipat dari nilai potensi kerugian atau komisi yang didapat.</td>
                            </tr>
                            <tr>
                                <td className="border border-gray-300 p-2">Penyalahgunaan Data Prospek</td>
                                <td className="border border-gray-300 p-2">Penangguhan akun sementara (Suspension).</td>
                                <td className="border border-gray-300 p-2">Tuntutan hukum berdasarkan UU No. 27/2022 (UU PDP) tentang Perlindungan Data Pribadi.</td>
                            </tr>
                        </tbody>
                    </table>

                    <h3 className="font-bold text-lg text-primary-800 border-b pb-1 mt-4">SURAT PERJANJIAN KEMITRAAN DIGITAL</h3>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="mb-2"><strong>NOMOR: [Auto-Generated-ID]</strong></p>
                        <p className="mb-2">Saya yang bertanda tangan di bawah ini, selanjutnya disebut sebagai "Afiliator", dengan ini menyatakan setuju untuk mengikatkan diri dalam kemitraan dengan PT Atrex International (selanjutnya disebut "Atrex") dengan ketentuan sebagai berikut:</p>

                        <p className="font-bold mt-2">PASAL 1: RUANG LINGKUP & KOMISI</p>
                        <ul className="list-disc pl-5 mb-2">
                            <li>Afiliator bertugas mempromosikan dan membawa customer baru untuk menggunakan jasa logistik Atrex.</li>
                            <li>Afiliator berhak mendapatkan komisi sebesar 10% (sepuluh persen) dari Total Revenue (pendapatan kotor) yang dibayarkan lunas oleh customer.</li>
                            <li>Tanpa Batas Minimum: Atrex akan membayar berapapun jumlah komisi yang didapat Afiliator sesuai jadwal pembayaran resmi perusahaan.</li>
                        </ul>

                        <p className="font-bold mt-2">PASAL 2: LARANGAN KONFLIK KEPENTINGAN</p>
                        <ul className="list-disc pl-5 mb-2">
                            <li>Afiliator dilarang keras membawa, mendaftarkan, atau mengalihkan customer dari perusahaan tempat Afiliator bekerja saat ini (jika bekerja di bidang logistik/sejenis).</li>
                            <li>Segala bentuk kerugian yang timbul akibat pelanggaran kontrak kerja antara Afiliator dengan pihak ketiga adalah tanggung jawab penuh Afiliator.</li>
                        </ul>

                        <p className="font-bold mt-2">PASAL 3: KERAHASIAAN DATA (SHARK TANK)</p>
                        <ul className="list-disc pl-5 mb-2">
                            <li>Afiliator wajib menjaga kerahasiaan seluruh data prospek, strategi, dan informasi yang didapat melalui fitur Shark Tank Atrex Force.</li>
                            <li>Afiliator dilarang membocorkan, menjual, atau membagikan data tersebut kepada pihak lain di luar ekosistem Atrex.</li>
                        </ul>

                        <p className="font-bold mt-2">PASAL 4: SANKSI DAN PELANGGARAN</p>
                        <ul className="list-disc pl-5 mb-2">
                            <li>Apabila Afiliator terbukti melanggar Pasal 2 dan Pasal 3, maka Atrex berhak:
                                <ul className="list-circle pl-5 mt-1">
                                    <li>Memutuskan kemitraan secara sepihak tanpa pemberitahuan.</li>
                                    <li>Membatalkan seluruh komisi yang belum dibayarkan (hangus).</li>
                                    <li>Melakukan tuntutan hukum secara perdata maupun pidana sesuai UU Perlindungan Data Pribadi (UU PDP) yang berlaku.</li>
                                </ul>
                            </li>
                        </ul>

                        <p className="font-bold mt-2">PASAL 5: PERNYATAAN PERSETUJUAN</p>
                        <p>Dengan mengklik tombol "SAYA SETUJU" atau "DAFTAR SEKARANG", Afiliator secara sadar menyatakan bahwa:</p>
                        <ul className="list-disc pl-5">
                            <li>Seluruh data yang diberikan adalah benar dan akurat.</li>
                            <li>Telah membaca, memahami, dan tunduk pada seluruh syarat dan ketentuan ini.</li>
                            <li>Persetujuan digital ini memiliki kekuatan hukum yang setara dengan tanda tangan basah di atas meterai.</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-primary"
                    >
                        Tutup & Lanjutkan
                    </button>
                </div>
            </div>
        </div>
    );
}
