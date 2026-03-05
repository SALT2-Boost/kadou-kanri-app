export interface CsvColumn {
  key: string;
  label: string;
}

export function jsonToCsv(data: Record<string, unknown>[], columns: CsvColumn[]): string {
  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(','),
  );
  return [header, ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, type: 'csv' | 'json'): void {
  const mimeType =
    type === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8';
  const bom = type === 'csv' ? '\uFEFF' : '';
  const blob = new Blob([bom + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
