const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function analyzeExcel() {
    const workbook = new ExcelJS.Workbook();
    const filePath = path.resolve(process.cwd(), '立替交通費精算書_例.xlsx');
    const outputPath = path.resolve(process.cwd(), 'analysis_result.txt');

    let output = `Analyzing: ${filePath}\n`;

    try {
        await workbook.xlsx.readFile(filePath);

        workbook.eachSheet((sheet, id) => {
            output += `\n--- Sheet ${id}: ${sheet.name} ---\n`;

            sheet.eachRow((row, rowNumber) => {
                row.eachCell((cell, colNumber) => {
                    const val = cell.value ? String(cell.value) : '';

                    const keywords = [
                        '所属', '氏名', '期間',
                        '日付', '訪問先', '経路', '交通手段', '金額',
                        '合計'
                    ];

                    for (const keyword of keywords) {
                        if (val.includes(keyword)) {
                            // Also get the cell address
                            output += `Found "${keyword}" at Row ${rowNumber}, Col ${colNumber} (Address: ${cell.address}) (Value: ${val})\n`;
                        }
                    }
                });
            });
        });
    } catch (e) {
        output += `Error: ${e.message}\n`;
    }

    fs.writeFileSync(outputPath, output, 'utf8');
    console.log('Analysis written to analysis_result.txt');
}

analyzeExcel().catch(console.error);
