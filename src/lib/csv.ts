export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
): void => {
  if (data.length === 0) {
    alert('Tidak ada data untuk diekspor');
    return;
  }

  const headers = columns.map((col) => col.label).join(',');
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const parseCSV = <T>(
  file: File,
  columnMapping: { csvHeader: string; key: keyof T }[]
): Promise<Partial<T>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('File CSV harus memiliki header dan minimal 1 baris data'));
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const data: Partial<T>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          const row: Partial<T> = {};

          columnMapping.forEach((mapping) => {
            const headerIndex = headers.findIndex(
              (h) => h.toLowerCase() === mapping.csvHeader.toLowerCase()
            );
            if (headerIndex !== -1 && values[headerIndex] !== undefined) {
              (row as any)[mapping.key] = values[headerIndex];
            }
          });

          if (Object.keys(row).length > 0) {
            data.push(row);
          }
        }

        resolve(data);
      } catch (error) {
        reject(new Error('Gagal memproses file CSV'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};
