import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';

export const exportToPDF = (title: string, content: string) => {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text(title, 20, 20);
  doc.setFontSize(12);
  const splitText = doc.splitTextToSize(content, 170);
  doc.text(splitText, 20, 30);
  doc.save(`${title}.pdf`);
};

export const exportToDocx = async (title: string, content: string) => {
  // Split content by lines to create multiple paragraphs
  const lines = content.split('\n');
  const paragraphs = lines.map(line => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: 24, // 12pt
        }),
      ],
      spacing: {
        after: 200,
      }
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 36, // 18pt
              }),
            ],
            spacing: {
              after: 400,
            }
          }),
          ...paragraphs,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title}.docx`);
};

export const exportToExcel = (title: string, content: string) => {
  // Simple conversion: each line is a row
  const rows = content.split('\n').map(line => [line]);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dokumen AI");
  XLSX.writeFile(workbook, `${title}.xlsx`);
};

export const exportToPPTX = (title: string, slides: { title: string; content: string }[]) => {
  const pres = new pptxgen();
  slides.forEach((slideData) => {
    const slide = pres.addSlide();
    slide.addText(slideData.title, { x: 1, y: 1, fontSize: 24, color: "363636" });
    slide.addText(slideData.content, { x: 1, y: 2, fontSize: 14, color: "646464" });
  });
  pres.writeFile({ fileName: `${title}.pptx` });
};
