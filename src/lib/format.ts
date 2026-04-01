/**
 * Mengubah angka menjadi teks terbilang dalam bahasa Indonesia
 * Contoh: 100.000 -> "Seratus Ribu Rupiah"
 */
function angkaKeKata(num: number): string {
  const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  
  if (num < 12) return units[num];
  if (num < 20) return units[num - 10] + " Belas";
  if (num < 100) return units[Math.floor(num / 10)] + " Puluh " + units[num % 10];
  if (num < 200) return "Seratus " + angkaKeKata(num - 100);
  if (num < 1000) return units[Math.floor(num / 100)] + " Ratus " + angkaKeKata(num % 100);
  if (num < 2000) return "Seribu " + angkaKeKata(num - 1000);
  if (num < 1000000) return (angkaKeKata(Math.floor(num / 1000)) + " Ribu " + angkaKeKata(num % 1000)).trim();
  if (num < 1000000000) return (angkaKeKata(Math.floor(num / 1000000)) + " Juta " + angkaKeKata(num % 1000000)).trim();
  if (num < 1000000000000) return (angkaKeKata(Math.floor(num / 1000000000)) + " Miliar " + angkaKeKata(num % 1000000000)).trim();
  
  return "";
}

export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return "Nol Rupiah";
  const result = angkaKeKata(Math.floor(n)).trim().replace(/\s+/g, " ");
  return result + " Rupiah";
}

/**
 * Format number to Indonesian Rupiah currency string
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Format period string like "2024-03" to "Maret 2024"
 */
export function formatBillingPeriod(period: string): string {
  if (!period || !period.includes("-")) return period;
  const [year, month] = period.split("-");
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthIdx = parseInt(month) - 1;
  return `${months[monthIdx]} ${year}`;
}
