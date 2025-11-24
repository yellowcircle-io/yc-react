/**
 * PDF Export Utility
 * Generates downloadable PDF version of article content
 * Uses print-to-PDF approach for better styling control
 */

/**
 * Generate and download PDF of the article
 * @param {string} title - Article title
 * @param {string} filename - Filename for download (without .pdf extension)
 */
export function exportArticleToPDF(title, filename = 'yellowcircle-article') {
  // Create print-optimized version
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  // Get article content (excluding navigation, modals, etc.)
  const articleContent = document.querySelector('[data-article-content]');

  if (!articleContent) {
    console.error('Article content not found');
    return;
  }

  // Generate print-friendly HTML
  const printHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        @page {
          size: A4;
          margin: 2cm;
        }

        body {
          font-family: Georgia, "Times New Roman", serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
          background: #fff;
        }

        /* Cover page */
        .cover {
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          text-align: center;
        }

        .cover h1 {
          font-family: Helvetica, Arial, sans-serif;
          font-size: 36pt;
          font-weight: 900;
          margin-bottom: 20px;
          color: #fbbf24;
          text-transform: uppercase;
        }

        .cover h2 {
          font-size: 18pt;
          font-weight: 400;
          color: #333;
          margin-bottom: 60px;
        }

        .cover .meta {
          font-size: 10pt;
          color: #666;
        }

        /* Content sections */
        section {
          page-break-inside: avoid;
          margin-bottom: 40px;
        }

        h1, h2, h3, h4 {
          font-family: Helvetica, Arial, sans-serif;
          color: #000;
          margin-top: 24px;
          margin-bottom: 12px;
          page-break-after: avoid;
        }

        h1 { font-size: 24pt; font-weight: 900; }
        h2 { font-size: 18pt; font-weight: 700; }
        h3 { font-size: 14pt; font-weight: 600; }
        h4 { font-size: 12pt; font-weight: 600; }

        p {
          margin-bottom: 12px;
          orphans: 3;
          widows: 3;
        }

        ul, ol {
          margin-left: 20px;
          margin-bottom: 12px;
        }

        li {
          margin-bottom: 6px;
        }

        /* Data/stat boxes */
        .stat-box {
          border: 2px solid #fbbf24;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          background: #fffef0;
          page-break-inside: avoid;
        }

        .stat-box h3 {
          color: #fbbf24;
          margin-top: 0;
        }

        /* Warning/error boxes */
        .error-box {
          border: 2px solid #ef4444;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          background: #fff5f5;
          page-break-inside: avoid;
        }

        .error-box h3 {
          color: #ef4444;
          margin-top: 0;
        }

        /* Success boxes */
        .success-box {
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          background: #f0fdf4;
          page-break-inside: avoid;
        }

        .success-box h3 {
          color: #22c55e;
          margin-top: 0;
        }

        /* Tables */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
          font-size: 10pt;
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        th {
          background-color: #fbbf24;
          color: #000;
          font-weight: 600;
        }

        /* Footer on each page */
        @media print {
          .page-footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 9pt;
            color: #666;
            padding: 10px 0;
            border-top: 1px solid #ddd;
          }
        }

        /* Hide interactive elements in print */
        button, .no-print {
          display: none !important;
        }

        /* Ensure links are visible */
        a {
          color: #000;
          text-decoration: underline;
        }

        a[href]:after {
          content: " (" attr(href) ")";
          font-size: 9pt;
          color: #666;
        }
      </style>
    </head>
    <body>
      <!-- Cover Page -->
      <div class="cover">
        <h1>${title}</h1>
        <h2>A yellowCircle Perspective</h2>
        <div class="meta">
          <p>Downloaded: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p>yellowcircle.io</p>
        </div>
      </div>

      <!-- Article Content -->
      <div class="content">
        ${articleContent.innerHTML}
      </div>

      <!-- Footer -->
      <div class="page-footer">
        <p>${title} | yellowCircle | Page <span class="page-number"></span></p>
      </div>
    </body>
    </html>
  `;

  // Write content to new window
  printWindow.document.write(printHTML);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();

      // Close window after print dialog
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  };
}

/**
 * Alternative: Generate PDF using canvas-based rendering
 * Requires jsPDF library (install via npm: npm install jspdf)
 * Uncomment and use if print-to-PDF doesn't meet requirements
 */

/*
import jsPDF from 'jspdf';

export async function exportArticleToPDFCanvas(title, filename = 'yellowcircle-article') {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const articleContent = document.querySelector('[data-article-content]');

  if (!articleContent) {
    console.error('Article content not found');
    return;
  }

  // Add content to PDF
  // This requires html2canvas or similar for complex layouts
  // Simplified text-only example:

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let y = margin;

  // Title
  pdf.setFontSize(24);
  pdf.setFont(undefined, 'bold');
  pdf.text(title, margin, y);
  y += lineHeight * 2;

  // Content (simplified - real implementation would need layout engine)
  const text = articleContent.textContent || '';
  const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);

  pdf.setFontSize(11);
  pdf.setFont(undefined, 'normal');

  lines.forEach(line => {
    if (y > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  });

  // Download
  pdf.save(`${filename}.pdf`);
}
*/

export default {
  exportArticleToPDF
};
