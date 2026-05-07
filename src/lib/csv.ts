export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escape(cell: string): string {
  if (/[",\n\r]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export function rowsToCsv<T>(rows: T[], cols: CsvColumn<T>[]): string {
  const head = cols.map((c) => escape(c.header)).join(",");
  const body = rows
    .map((row) =>
      cols
        .map((c) => {
          const v = c.value(row);
          if (v == null) return "";
          return escape(String(v));
        })
        .join(","),
    )
    .join("\n");
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function csvFilename(prefix: string, address: string): string {
  const short = address ? `${address.slice(2, 8)}` : "wallet";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `hyper-display_${prefix}_${short}_${stamp}.csv`;
}
