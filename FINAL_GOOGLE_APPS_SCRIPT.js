/*
  GOOGLE APPS SCRIPT FOR ATR SALES PWA & WEBSITE
  - Handles JSON from Database (Supabase)
  - Handles Form Data from Website
  - Fixes Date & JSON Output issues
*/

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        var params = e.parameter || {};

        // --- KEY FIX: Parse JSON Body from Supabase ---
        if (e.postData && e.postData.contents) {
            try {
                var jsonBody = JSON.parse(e.postData.contents);
                // Merge JSON body into params
                for (var key in jsonBody) {
                    params[key] = jsonBody[key];
                }
            } catch (err) {
                // Ignore if not JSON
            }
        }

        var action = params.action;
        var sheetName = 'Tracking_Data';

        // --- 1. SYNC SHIPMENT (Dari Supabase DB) ---
        if (action == 'sync_shipment') {
            var awb = params.awb;
            if (!awb) return createJSON({ success: false, message: 'No AWB provided' });

            var ss = SpreadsheetApp.getActiveSpreadsheet();
            var sheet = ss.getSheetByName(sheetName);

            // Cek AWB (Update or Insert)
            var data = sheet.getDataRange().getValues();
            var rowIndex = -1;

            for (var i = 1; i < data.length; i++) {
                if (data[i][0] == awb) { rowIndex = i + 1; break; }
            }

            // MAPPING KOLOM: [AWB, Customer, Phone, Origin, Destination, Service, Weight, CreatedAt]
            var rowData = [
                awb,
                params.customer || '',
                params.phone || '', // New Phone Column
                params.origin || '',
                params.destination || '',
                params.service || 'Air Freight',
                params.weight || '0',
                new Date()
            ];

            if (rowIndex > 0) {
                // Update existing row (only first 7+cols)
                sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
                return createJSON({ success: true, message: 'Updated existing AWB' });
            } else {
                // Insert new row
                sheet.appendRow(rowData);
                addHistory(awb, 'Created', 'Sync from Database', 'System');
                return createJSON({ success: true, message: 'Inserted new AWB' });
            }
        }

        // --- 2. GENERATE RESI (Legacy Website) ---
        if (action == 'generate') {
            var trackingNumber = generateTrackingNumber();
            var ss = SpreadsheetApp.getActiveSpreadsheet();
            var sheet = ss.getSheetByName(sheetName);
            sheet.appendRow([
                trackingNumber,
                params.customer_name || '',
                params.phone || '',
                params.origin || 'Jakarta',
                params.destination || '',
                params.service || 'Reguler',
                params.weight || '1',
                params.qty || '1',
                new Date()
            ]);
            addHistory(trackingNumber, 'Created', 'Shipment Created', 'System');
            return createJSON({ success: true, tracking_number: trackingNumber });
        }

        // --- 3. UPDATE STATUS ---
        if (action == 'update') {
            addHistory(params.awb, params.status, params.description, params.location);
            return createJSON({ success: true, message: 'Status updated' });
        }

        // --- 4. TRACKING ---
        if (!action || action == 'track') {
            // Default check params.awb
            return createJSON(getTrackingData(params.awb));
        }

        return createJSON({ success: false, message: 'Unknown Action' });

    } catch (error) {
        return createJSON({ success: false, error: error.toString() });
    } finally {
        lock.releaseLock();
    }
}

// ==========================================
// HELPER FUNCTIONS (JANGAN DIHAPUS)
// ==========================================

function getTrackingData(awb) {
    if (!awb) return { found: false, message: 'AWB empty' };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var mainSheet = ss.getSheetByName('Tracking_Data');
    var historySheet = ss.getSheetByName('Status_Updates');

    // 1. Cari Data Utama
    var mainData = mainSheet.getDataRange().getValues();
    var shipment = null;

    // Skip Header (row 0)
    for (var i = 1; i < mainData.length; i++) {
        if (mainData[i][0] == awb) {
            shipment = {
                awb: mainData[i][0],
                customer_name: mainData[i][1],
                origin: mainData[i][3], // Perhatikan index kolom mungkin bergeser jika header berubah
                destination: mainData[i][4],
                service: mainData[i][5],
                weight: mainData[i][6],
                status: 'Created' // Default
            };
            break;
        }
    }

    if (!shipment) return { found: false };

    // 2. Cari History/Logs
    var histData = historySheet.getDataRange().getValues();
    var history = [];

    // Skip Header
    for (var i = 1; i < histData.length; i++) {
        if (histData[i][0] == awb) {
            history.push({
                status: histData[i][1],
                location: histData[i][2],
                timestamp: formatDate(histData[i][3]),
                notes: histData[i][4]
            });
            // Update status terakhir paket
            shipment.status = histData[i][1];
        }
    }

    // Sort history newest first
    history.reverse();

    shipment.found = true;
    shipment.history = history;
    return shipment;
}

function addHistory(awb, status, notes, location) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Status_Updates');
    // Kolom: [AWB, Status, Location, Timestamp, Notes]
    sheet.appendRow([awb, status, location || '', new Date(), notes || '']);
}

function generateTrackingNumber() {
    var prefix = "ATR";
    var date = new Date();
    var dateStr = Utilities.formatDate(date, "Asia/Jakarta", "yyyyMMdd");
    var random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return prefix + dateStr + random;
}

function createJSON(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(dateObj) {
    try {
        if (!dateObj) return '-';
        var d = new Date(dateObj);
        if (isNaN(d.getTime())) return dateObj;
        return Utilities.formatDate(d, "Asia/Jakarta", "dd MMM yyyy HH:mm");
    } catch (e) {
        return dateObj;
    }
}
