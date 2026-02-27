/**
 * Utility functions for exporting data to different formats
 */

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: ExportData) => {
  const { headers, rows, filename } = data;
  const csv = [
    headers.join(','),
    ...rows.map(r => r.map(c => `"${c}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export data to XLSX format using SheetJS
 */
export const exportToXLSX = (data: ExportData) => {
  const { headers, rows, filename } = data;
  
  // Dynamically import xlsx library
  import('xlsx').then(XLSX => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    
    // Auto-size columns
    const colWidths = headers.map((header, idx) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map(row => String(row[idx]).length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;
    
    // Format header row
    headers.forEach((_, idx) => {
      const cellRef = XLSX.utils.encode_col(idx) + '1';
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0066CC' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    });
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }).catch(() => {
    console.error('XLSX library not available. Please install xlsx package.');
  });
};

/**
 * Export data to PDF format using jsPDF and autoTable
 */
export const exportToPDF = (data: ExportData) => {
  const { headers, rows, filename } = data;
  
  // Dynamically import jsPDF and autoTable
  Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]).then(([jsPDFModule]) => {
    // Handle both default and named exports
    const jsPDFClass = (jsPDFModule as any).default || (jsPDFModule as any).jsPDF;
    const doc = new jsPDFClass();
    
    // Add title
    doc.setFontSize(16);
    doc.text(filename.replace(/_/g, ' '), 14, 15);
    
    // Add table
    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [50, 50, 50]
      },
      columnStyles: {
        0: { halign: 'left' }
      },
      margin: { top: 10, right: 10, bottom: 10, left: 10 },
      didDrawPage: function() {
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.getHeight();
        const pageWidth = pageSize.getWidth();
        
        // Footer
        doc.setFontSize(9);
        doc.text(
          `Page ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });
    
    doc.save(`${filename}.pdf`);
  }).catch(() => {
    console.error('PDF libraries not available. Please install jspdf and jspdf-autotable packages.');
  });
};

/**
 * Main export function that handles all formats
 */
export const handleExport = (format: 'csv' | 'pdf' | 'xlsx', data: ExportData) => {
  switch (format) {
    case 'csv':
      exportToCSV(data);
      break;
    case 'xlsx':
      exportToXLSX(data);
      break;
    case 'pdf':
      exportToPDF(data);
      break;
    default:
      console.error(`Unsupported export format: ${format}`);
  }
};
