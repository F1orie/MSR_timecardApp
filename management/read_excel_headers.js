const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function readHeaders() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path.join('d:', 'minastar', 'MSR_timecardApp', 'sample', '30XXXX_25年12月.xlsx'));
    const sheet = workbook.getWorksheet(1);
    const row = sheet.getRow(1);

    const headers = [];
    row.eachCell((cell, colNumber) => {
        headers.push(`${colNumber}: ${cell.value}`);
    });

    fs.writeFileSync('headers.txt', headers.join('\n'));
    console.log('Done');
}

readHeaders();
