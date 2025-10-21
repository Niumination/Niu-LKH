import React, { useState } from 'react';
import { Calendar, Clock, MapPin, FileText, Send, CheckCircle2, Sparkles } from 'lucide-react';

export default function LaporanKegiatanHarian() {
  const [formData, setFormData] = useState({
    nama: '',
    tanggal: '',
    jamMulai: '',
    jamSelesai: '',
    lokasi: '',
    kegiatan: '',
    keterangan: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [focusedField, setFocusedField] = useState(null);

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
      await fetch(GOOGLE_SCRIPT_URL, {
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

      setSubmitStatus('success');
      
      setFormData({
        nama: '',
        tanggal: '',
        jamMulai: '',
        jamSelesai: '',
        lokasi: '',
        kegiatan: '',
        keterangan: ''
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
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
        <div className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" 
             style={{
               backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)',
               backgroundSize: '50px 50px'
             }}>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-sm font-medium">Sistem Pelaporan Digital</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Laporan Kegiatan Harian
          </h1>
          <p className="text-slate-400 text-lg">
            Dokumentasi kegiatan Anda secara real-time
          </p>
        </div>

        {/* Form Container */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-20"></div>
          
          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="space-y-6">
              
              {/* Nama Lengkap */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <div className={`w-1 h-1 rounded-full ${focusedField === 'nama' ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                  Nama Lengkap
                  <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('nama')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Tanggal */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Tanggal
                  <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('tanggal')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                />
              </div>

              {/* Waktu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Jam Mulai
                    <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="time"
                    name="jamMulai"
                    value={formData.jamMulai}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('jamMulai')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Jam Selesai
                    <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="time"
                    name="jamSelesai"
                    value={formData.jamSelesai}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('jamSelesai')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Lokasi */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  Lokasi
                  <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('lokasi')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none"
                  placeholder="Contoh: Kantor, Lapangan, Work From Home"
                />
              </div>

              {/* Deskripsi Kegiatan */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Deskripsi Kegiatan
                  <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  name="kegiatan"
                  value={formData.kegiatan}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('kegiatan')}
                  onBlur={() => setFocusedField(null)}
                  required
                  rows="4"
                  className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none resize-none"
                  placeholder="Jelaskan kegiatan yang dilakukan secara detail..."
                />
              </div>

              {/* Keterangan Tambahan */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <div className={`w-1 h-1 rounded-full ${focusedField === 'keterangan' ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                  Keterangan Tambahan
                  <span className="text-slate-500 text-xs">(opsional)</span>
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('keterangan')}
                  onBlur={() => setFocusedField(null)}
                  rows="3"
                  className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none resize-none"
                  placeholder="Catatan atau keterangan tambahan..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="relative w-full group"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition"></div>
                  <div className="relative flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Mengirim Data...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Kirim Laporan</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-green-500/20 rounded-xl blur"></div>
                  <div className="relative bg-green-500/10 border border-green-500/30 px-4 py-3 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-green-400 font-medium">Laporan berhasil dikirim! Data tersimpan di sistem.</span>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-red-500/20 rounded-xl blur"></div>
                  <div className="relative bg-red-500/10 border border-red-500/30 px-4 py-3 rounded-xl">
                    <span className="text-red-400 font-medium">Terjadi kesalahan. Silakan coba lagi.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <div className="inline-flex items-center gap-2 text-sm text-slate-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Data tersinkronisasi dengan Google Spreadsheet</span>
          </div>
        </div>
      </div>
    </div>
  );
}