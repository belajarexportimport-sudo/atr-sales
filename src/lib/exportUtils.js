import ExcelJS from 'exceljs';

/**
 * Format number as Indonesian Rupiah
 */
function formatRupiah(value) {
    if (!value || value === 0) return 'Rp 0';
    return `Rp ${value.toLocaleString('id-ID')}`;
}

/**
 * Format date as DD/MM/YYYY
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Export inquiries to Excel
 * @param {Array} inquiries - Array of inquiry objects
 * @param {string} filename - Output filename (optional)
 */
export async function exportInquiriesToExcel(inquiries, filename) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inquiries');

        // Define columns
        worksheet.columns = [
            { header: 'Quote Number', key: 'quote_number', width: 15 },
            { header: 'Customer Name', key: 'customer_name', width: 25 },
            { header: 'Company Name', key: 'company_name', width: 25 },
            { header: 'Status', key: 'status', width: 25 },
            { header: 'Revenue (Rp)', key: 'revenue', width: 18 },
            { header: 'GP (Rp)', key: 'gp', width: 18 },
            { header: 'Commission (Rp)', key: 'commission', width: 18 },
            { header: 'AWB Number', key: 'awb', width: 15 },
            { header: 'Created Date', key: 'created_at', width: 15 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E40AF' } // Primary blue
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Add data rows
        inquiries.forEach((inquiry, index) => {
            const row = worksheet.addRow({
                quote_number: inquiry.quote_number || '-',
                customer_name: inquiry.customer_name || '-',
                company_name: inquiry.company_name || '-',
                status: inquiry.status || '-',
                revenue: inquiry.est_revenue || 0,
                gp: inquiry.est_gp || 0,
                commission: inquiry.commission_amount || 0,
                awb: inquiry.awb_number || '-',
                created_at: inquiry.created_at ? formatDate(inquiry.created_at) : '-'
            });

            // Alternate row colors for better readability
            if (index % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF9FAFB' } // Light gray
                };
            }
        });

        // Format currency columns (E, F, G)
        ['E', 'F', 'G'].forEach(col => {
            const column = worksheet.getColumn(col);
            column.numFmt = 'Rp #,##0';
            column.alignment = { horizontal: 'right' };
        });

        // Center align date column
        worksheet.getColumn('I').alignment = { horizontal: 'center' };

        // Add borders to all cells
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
            });
        });

        // Freeze header row
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];

        // Generate filename with date
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const finalFilename = filename || `ATR_Sales_Inquiries_${dateStr}.xlsx`;

        // Download file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting inquiries to Excel:', error);
        throw error;
    }
}

/**
 * Export leaderboard rankings to Excel
 * @param {Array} rankings - Array of ranking objects
 * @param {string} filename - Output filename (optional)
 */
export async function exportLeaderboardToExcel(rankings, filename) {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leaderboard');

        // Define columns
        worksheet.columns = [
            { header: 'Rank', key: 'rank', width: 8 },
            { header: 'Sales Representative', key: 'sales_rep', width: 25 },
            { header: 'Sales Code', key: 'sales_code', width: 15 },
            { header: 'Total Revenue (Rp)', key: 'revenue', width: 20 },
            { header: 'Total GP (Rp)', key: 'gp', width: 20 },
            { header: 'Total Deals', key: 'deals', width: 12 },
            { header: 'Commission (Rp)', key: 'commission', width: 20 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1E40AF' } // Primary blue
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // Add data rows
        rankings.forEach((ranking, index) => {
            const commission = (ranking.total_gp || 0) * 0.10; // 10% of GP

            const row = worksheet.addRow({
                rank: index + 1,
                sales_rep: ranking.full_name || ranking.email?.split('@')[0] || '-',
                sales_code: ranking.sales_code || '-',
                revenue: ranking.total_revenue || 0,
                gp: ranking.total_gp || 0,
                deals: ranking.total_deals || 0,
                commission: commission
            });

            // Highlight top 3
            if (index < 3) {
                row.font = { bold: true };
                if (index === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFEF3C7' } // Gold
                    };
                } else if (index === 1) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFE5E7EB' } // Silver
                    };
                } else if (index === 2) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFED7AA' } // Bronze
                    };
                }
            } else if (index % 2 === 0) {
                // Alternate row colors for others
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF9FAFB' } // Light gray
                };
            }
        });

        // Format currency columns (D, E, G)
        ['D', 'E', 'G'].forEach(col => {
            const column = worksheet.getColumn(col);
            column.numFmt = 'Rp #,##0';
            column.alignment = { horizontal: 'right' };
        });

        // Center align rank and deals columns
        worksheet.getColumn('A').alignment = { horizontal: 'center' };
        worksheet.getColumn('F').alignment = { horizontal: 'center' };

        // Add borders to all cells
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
            });
        });

        // Freeze header row
        worksheet.views = [
            { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];

        // Generate filename with date
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const finalFilename = filename || `ATR_Sales_Leaderboard_${dateStr}.xlsx`;

        // Download file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Error exporting leaderboard to Excel:', error);
        throw error;
    }
}
