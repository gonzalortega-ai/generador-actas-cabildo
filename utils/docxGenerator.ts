
import * as docx from 'docx';
import saveAs from 'file-saver';

interface Attendee {
  name: string;
  title: string;
  attended: boolean;
}

export const generateDocx = (content: string, attendees: Attendee[], fileName: string) => {
  const lines = content.split('\n');
  
  // --- Estilos ---
  const HEADER_FONT_FAMILY = 'Helvetica LT Std Cond Light';
  const HEADER_FONT_SIZE = 18; // 9pt
  const BODY_FONT_FAMILY = 'Arial Narrow';
  const BODY_FONT_SIZE = 24; // 12pt

  // --- Separar Encabezado y Cuerpo ---
  const headerLines = lines.slice(0, 4);
  const bodyLines = lines.slice(4);

  // --- Crear Encabezado de Página ---
  const header = new docx.Header({
    children: headerLines.map(line => new docx.Paragraph({
      children: [new docx.TextRun({
        text: line,
        allCaps: true,
        font: HEADER_FONT_FAMILY,
        size: HEADER_FONT_SIZE,
      })],
      alignment: docx.AlignmentType.RIGHT,
      spacing: { after: 0, line: 240 }
    })),
  });

  const createJustifiedParagraphWithFiller = (text: string, isFirstLineBold: boolean = false): docx.Paragraph => {
      let children: docx.TextRun[] = [];
      if (isFirstLineBold) {
        const match = text.match(/^(PUNTO\s+[A-ZÑÁÉÍÓÚÜ]+\.?\s*[-\–]?\s*)/i);
          if (match) {
              const headerText = match[1];
              const bodyText = text.substring(headerText.length);
              children.push(new docx.TextRun({ text: headerText, bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }));
              children.push(new docx.TextRun({ text: bodyText, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }));
          } else {
              children.push(new docx.TextRun({ text, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }));
          }
      } else {
        const keywords = ['Primer Punto', 'Segundo Punto', 'Tercer Punto', 'Cuarto Punto', 'Quinto Punto', 'Sexto Punto', 'punto uno', 'punto dos', 'punto tres', 'punto cuatro', 'punto cinco', 'punto seis'];
        const keywordRegex = new RegExp(`(${keywords.join('|')})`, 'gi');
        const parts = text.split(keywordRegex);
         children = parts.filter(part => part).map(part => {
            const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
            return new docx.TextRun({ text: part, bold: isKeyword, allCaps: isKeyword, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE });
        });
      }

      children.push(new docx.TextRun("\t"));

      return new docx.Paragraph({
          children: children,
          alignment: docx.AlignmentType.JUSTIFIED,
          spacing: { after: 100 },
          tabStops: [{
              type: docx.TabStopType.RIGHT,
              position: docx.TabStopPosition.MAX,
              // FIX: Replaced `TabStopLeaderType` with `LeaderType` for compatibility with the current `docx` library version.
              leader: docx.LeaderType.DOT,
          }],
      });
  };

  // --- Procesar Cuerpo del Documento ---
  const docChildren: (docx.Paragraph | docx.Table)[] = [];
  
  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const trimmedLine = line.trim();

    if (trimmedLine.length === 0) {
      docChildren.push(new docx.Paragraph({ text: '' }));
      continue;
    }

    if (trimmedLine === '{{ASISTENCIA_TABLE}}') {
      const headerRow = new docx.TableRow({
        children: [
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: 'N°', bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })], alignment: docx.AlignmentType.CENTER })], width: { size: 5, type: docx.WidthType.PERCENTAGE } }),
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: 'NOMBRE', bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })] })], width: { size: 45, type: docx.WidthType.PERCENTAGE } }),
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: 'CARGO', bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })] })], width: { size: 35, type: docx.WidthType.PERCENTAGE } }),
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: 'ASISTENCIA', bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })] })], width: { size: 15, type: docx.WidthType.PERCENTAGE } }),
        ],
      });

      const dataRows = attendees.map((attendee, index) => new docx.TableRow({
        children: [
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: String(index + 1), bold: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })], alignment: docx.AlignmentType.CENTER })] }),
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: attendee.name, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })] })] }),
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: attendee.title, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })] })] }),
          new docx.TableCell({ children: [new docx.Paragraph({ children: [new docx.TextRun({ text: attendee.attended ? 'SI' : 'NO', font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })], alignment: docx.AlignmentType.CENTER })] }),
        ],
      }));

      docChildren.push(new docx.Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: docx.WidthType.PERCENTAGE },
        borders: { top: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" }, bottom: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" }, left: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" }, right: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideHorizontal: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" }, insideVertical: { style: docx.BorderStyle.NONE, size: 0, color: "FFFFFF" } },
      }));
      continue;
    }

    if (trimmedLine === '{{FIRMAS}}') {
        const presentAttendees = attendees.filter(a => a.attended);
        const createSignatureParagraphs = (attendee: Attendee) => [
            new docx.Paragraph({ text: '', spacing: { before: 400 } }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: '_________________________', font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })],
                alignment: docx.AlignmentType.CENTER,
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: attendee.name.toUpperCase(), bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })],
                alignment: docx.AlignmentType.CENTER,
                spacing: { after: 0 },
            }),
            new docx.Paragraph({
                children: [new docx.TextRun({ text: attendee.title.toUpperCase(), bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })],
                alignment: docx.AlignmentType.CENTER,
            }),
        ];

        const presidente = presentAttendees.find(a => a.title === 'Presidente Municipal');
        if (presidente) {
            docChildren.push(...createSignatureParagraphs(presidente));
        }

        const otherMembers = presentAttendees.filter(a => a.title !== 'Presidente Municipal');
        const memberPairs: Attendee[][] = [];
        for (let j = 0; j < otherMembers.length; j += 2) {
            memberPairs.push(otherMembers.slice(j, j + 2));
        }

        memberPairs.forEach(pair => {
            const table = new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                columnWidths: [50, 50],
                borders: docx.TableBorders.NONE,
                rows: [
                    new docx.TableRow({
                        children: [
                            new docx.TableCell({
                                children: createSignatureParagraphs(pair[0]),
                                borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } },
                            }),
                            new docx.TableCell({
                                children: pair[1] ? createSignatureParagraphs(pair[1]) : [new docx.Paragraph('')],
                                borders: { top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } },
                            }),
                        ],
                    }),
                ],
            });
            docChildren.push(table);
        });
      continue;
    }

    if (trimmedLine === 'ACUERDOS') {
        docChildren.push(new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 0, before: 200 },
            children: [
                new docx.TextRun({ text: '--------------------------------', font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }),
                new docx.TextRun({ text: ' ACUERDOS ', bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }),
                new docx.TextRun({ text: '--------------------------------', font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }),
            ]
        }));
        docChildren.push(new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 200, before: 0 },
            children: [new docx.TextRun({ text: '--------', font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })],
        }));
        continue;
    }

    if (trimmedLine === 'CLAUSURA DE LA SESIÓN.') {
        docChildren.push(new docx.Paragraph({
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 200, before: 200 },
            children: [
                new docx.TextRun({ text: '-----------------------------', font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }),
                new docx.TextRun({ text: ' CLAUSURA DE LA SESIÓN. ', bold: true, allCaps: true, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }),
                new docx.TextRun({ text: '-----------------------------', font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE }),
            ]
        }));
        continue;
    }
    
    if (trimmedLine.endsWith('manifestando:')) {
        const nextLine = (i + 1 < bodyLines.length) ? bodyLines[i + 1].trim() : '';
        const combinedText = line + ' ' + nextLine;
        
        const keywords = ['Primer Punto', 'Segundo Punto', 'Tercer Punto', 'Cuarto Punto', 'Quinto Punto', 'Sexto Punto', 'punto uno', 'punto dos', 'punto tres', 'punto cuatro', 'punto cinco', 'punto seis'];
        const keywordRegex = new RegExp(`(${keywords.join('|')})`, 'gi');
        const parts = combinedText.split(keywordRegex);
        const children = parts.filter(part => part).map(part => {
            const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
            return new docx.TextRun({ text: part, bold: isKeyword, allCaps: isKeyword, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE });
        });

        const p = new docx.Paragraph({
            children: children,
            alignment: docx.AlignmentType.JUSTIFIED,
            spacing: { after: 100 },
        });

        docChildren.push(p);
        i++; // Skip the next line as it's been merged
        continue;
    }

    if (/^\d+\.-/.test(trimmedLine) || trimmedLine.toUpperCase().startsWith('PUNTO ')) {
        docChildren.push(createJustifiedParagraphWithFiller(line, trimmedLine.toUpperCase().startsWith('PUNTO ')));
        continue;
    }

    // Default paragraph with potential filler
    const nonFillerEndings = [':', '.'];
    if (nonFillerEndings.includes(trimmedLine.slice(-1))) {
         docChildren.push(createJustifiedParagraphWithFiller(line));
    } else {
        // For paragraphs that shouldn't have filler, like single-line questions or statements.
        docChildren.push(new docx.Paragraph({
            children: [new docx.TextRun({ text: line, font: BODY_FONT_FAMILY, size: BODY_FONT_SIZE })],
            alignment: docx.AlignmentType.JUSTIFIED,
            spacing: { after: 100 },
        }));
    }
  }

  // --- Ensamblar Documento Final ---
  const doc = new docx.Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: header,
      },
      children: docChildren,
    }],
  });

  docx.Packer.toBlob(doc).then(blob => {
    saveAs(blob, fileName);
  });
};