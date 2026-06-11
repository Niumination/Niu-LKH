import React, { useState } from 'react';
import { Calendar, Clock, FileText, Send, CheckCircle } from 'lucide-react';

export default function LaporanKegiatanHarian() {
  const [formData, setFormData] = useState({
    nama: '',
    tanggal: '',
    jamMulai: '',
    jamSelesai: '',
    kegiatan: '',
    keterangan: '',
    lokasi: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // GANTI URL INI dengan Web App URL dari Google Apps Script Anda
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyDYqsyF2a6MkK3ZvLO798dHxYhuxwp6PQEJXzOUXiry1jRxEcluKkW-ePafc4j1qy6/exec';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString()
        })
      });

      // Karena mode 'no-cors', kita tidak bisa membaca response
      // Kita asumsikan berhasil jika tidak ada error
      setSubmitStatus('success');
      
      // Reset form
      setFormData({
        nama: '',
        tanggal: '',
        jamMulai: '',
        jamSelesai: '',
        kegiatan: '',
        keterangan: '',
        lokasi: ''
      });

      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);

    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Laporan Kegiatan Harian
          </h1>
          <p className="text-gray-600">
            Silakan isi form di bawah ini untuk melaporkan kegiatan harian Anda
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Nama */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="inline-block w-4 h-4 mr-1" />
                Tanggal *
              </label>
              <input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
            </div>

            {/* Waktu Mulai dan Selesai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="inline-block w-4 h-4 mr-1" />
                  Jam Mulai *
                </label>
                <input
                  type="time"
                  name="jamMulai"
                  value={formData.jamMulai}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="inline-block w-4 h-4 mr-1" />
                  Jam Selesai *
                </label>
                <input
                  type="time"
                  name="jamSelesai"
                  value={formData.jamSelesai}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            {/* Lokasi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Lokasi *
              </label>
              <input
                type="text"
                name="lokasi"
                value={formData.lokasi}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="Contoh: Kantor, Lapangan, Work From Home"
              />
            </div>

            {/* Kegiatan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <FileText className="inline-block w-4 h-4 mr-1" />
                Deskripsi Kegiatan *
              </label>
              <textarea
                name="kegiatan"
                value={formData.kegiatan}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Jelaskan kegiatan yang dilakukan secara detail..."
              />
            </div>

            {/* Keterangan Tambahan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Keterangan Tambahan
              </label>
              <textarea
                name="keterangan"
                value={formData.keterangan}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                placeholder="Catatan atau keterangan tambahan (opsional)"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kirim Laporan
                  </>
                )}
              </button>
            </div>

            {/* Success/Error Message */}
            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Laporan berhasil dikirim! Terima kasih.</span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <span className="font-medium">Terjadi kesalahan. Silakan coba lagi.</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Data akan tersimpan di Google Spreadsheet</p>
        </div>
      </div>
    </div>
  );
}