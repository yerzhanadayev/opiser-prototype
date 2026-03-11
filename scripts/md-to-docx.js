const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  BorderStyle,
  WidthType,
  AlignmentType,
  convertInchesToTwip,
} = require("docx");

function parseBoldRuns(text) {
  const runs = [];
  let rest = text;
  while (rest.length > 0) {
    const boldStart = rest.indexOf("**");
    if (boldStart === -1) {
      if (rest.length) runs.push({ text: rest.replace(/\*\*/g, ""), bold: false });
      break;
    }
    const boldEnd = rest.indexOf("**", boldStart + 2);
    if (boldEnd === -1) {
      if (rest.length) runs.push({ text: rest.replace(/\*\*/g, ""), bold: false });
      break;
    }
    if (boldStart > 0) runs.push({ text: rest.slice(0, boldStart), bold: false });
    runs.push({ text: rest.slice(boldStart + 2, boldEnd), bold: true });
    rest = rest.slice(boldEnd + 2);
  }
  return runs;
}

function textToRuns(text) {
  const runs = parseBoldRuns(text);
  return runs.map((r) => new TextRun({ text: r.text, bold: r.bold }));
}

function mdToDocx(mdContent) {
  const lines = mdContent.split(/\r?\n/);
  const children = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "---") {
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      children.push(
        new Paragraph({
          text: trimmed.slice(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      children.push(
        new Paragraph({
          text: trimmed.slice(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 360, after: 180 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      children.push(
        new Paragraph({
          text: trimmed.slice(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 0, after: 240 },
        })
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("| ") && trimmed.endsWith(" |")) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const rows = tableLines.map((row) =>
        row
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim())
      );
      if (rows.length >= 2) {
        const headerRow = rows[0];
        const separator = rows[1];
        const dataRows = rows.slice(2).filter((r) => !r.every((c) => /^[-:]+$/.test(c)));
        const table = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: headerRow.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: textToRuns(cell),
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "E0E0E0" },
                  })
              ),
            }),
            ...dataRows.map(
              (row) =>
                new TableRow({
                  children: row.map(
                    (cell) =>
                      new TableCell({
                        children: [new Paragraph({ children: textToRuns(cell) })],
                      })
                  ),
                })
            ),
          ],
        });
        children.push(table);
        children.push(
          new Paragraph({ children: [new TextRun("")], spacing: { after: 120 } })
        );
      }
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listItems = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      for (const item of listItems) {
        children.push(
          new Paragraph({
            children: textToRuns(item),
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      }
      continue;
    }

    if (trimmed.startsWith("- **") || /^- \*\*[^*]+\*\*/.test(trimmed)) {
      children.push(
        new Paragraph({
          children: textToRuns(trimmed.slice(2)),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      i++;
      continue;
    }

    if (trimmed === "") {
      i++;
      continue;
    }

    children.push(
      new Paragraph({
        children: textToRuns(trimmed),
        spacing: { after: 120 },
      })
    );
    i++;
  }

  return new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun("")],
            spacing: { after: 120 },
          }),
          ...children,
        ],
      },
    ],
  });
}

async function convert(mdPath, docxPath) {
  const md = fs.readFileSync(mdPath, "utf8");
  const doc = mdToDocx(md);
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buf);
  console.log("Created:", docxPath);
}

const root = path.join(__dirname, "..");
const files = [
  ["1.1. ТЗ кадры-люди.md", "1.1. ТЗ кадры-люди.docx"],
  ["1.2. ТЗ кадры-партии.md", "1.2. ТЗ кадры-партии.docx"],
  ["КП_Lean_Solutions_РК_Актюбинская_область_100325.md", "КП_Lean_Solutions_РК_Актюбинская_область_100325.docx"],
];

(async () => {
  for (const [md, docx] of files) {
    const mdPath = path.join(root, md);
    const docxPath = path.join(root, docx);
    if (!fs.existsSync(mdPath)) {
      console.error("Not found:", mdPath);
      process.exit(1);
    }
    await convert(mdPath, docxPath);
  }
})();
