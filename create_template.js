const ExcelJS = require('exceljs');

async function createTemplate() {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');

    // Title or some header info
    sheet.getCell('A1').value = '立替交通費精算書';
    sheet.getCell('A1').font = { size: 16, bold: true };

    // Name label
    sheet.getCell('D2').value = '氏名:';
    // Name value placeholder (code writes to E2)
    // sheet.getCell('E2').value = ''; 

    // Headers at Row 5
    const headers = ['日付', '出発', '', '到着', '交通手段', '片道/往復', '金額'];
    const row = sheet.getRow(5);
    row.values = headers;
    row.font = { bold: true };

    // Add borders to header
    row.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    await workbook.xlsx.writeFile('立替交通費精算書_例.xlsx');
    console.log('Template created successfully.');
}

createTemplate();
