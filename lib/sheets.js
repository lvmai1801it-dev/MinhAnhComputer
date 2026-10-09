/**
 * ============================================================
 * GOOGLE SHEETS CLIENT
 * ============================================================
 * - Đọc credentials từ biến môi trường
 * - Export 3 hàm chính:
 *     readRange(sheetName, range)   → đọc 1 vùng
 *     appendRow(sheetName, values)  → thêm 1 dòng
 *     updateCell(sheetName, cell, value) → ghi 1 ô
 * ============================================================
 */

import { google } from 'googleapis';

// ==================== KHỞI TẠO CLIENT ====================
let sheetsClient = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  // Xử lý private key: biến môi trường lưu \n dạng 2 ký tự,
  // cần chuyển thành ký tự xuống dòng thật
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ==================== HÀM ĐỌC ====================
/**
 * Đọc dữ liệu từ 1 sheet.
 * @param {string} sheetName Tên sheet (VD: "NhanVien")
 * @param {string} range Vùng ô (VD: "A1:Z1000", mặc định là toàn sheet)
 * @returns {Promise<Array>} Mảng 2 chiều [ [row1], [row2], ... ]
 */
export async function readRange(sheetName, range = 'A1:Z10000') {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!${range}`,
  });
  return res.data.values || [];
}

// ==================== HÀM GHI ====================
/**
 * Thêm 1 dòng mới vào cuối sheet.
 * @param {string} sheetName
 * @param {Array} values Mảng các giá trị (VD: ["NV001", "Nguyễn Văn A"])
 */
export async function appendRow(sheetName, values) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',   // Cho phép ghi Date, Number đúng kiểu
    requestBody: { values: [values] },
  });
}

/**
 * Ghi giá trị vào 1 ô cụ thể.
 * @param {string} sheetName
 * @param {string} cell VD: "B5"
 * @param {*} value
 */
export async function updateCell(sheetName, cell, value) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!${cell}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
}

/**
 * Ghi nhiều ô cùng lúc.
 * @param {string} sheetName
 * @param {string} range VD: "A5:C5"
 * @param {Array} values Mảng 2 chiều
 */
export async function updateRange(sheetName, range, values) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!${range}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

/**
 * Xóa 1 dòng theo số dòng (1-indexed).
 * Dùng batchUpdate để delete dimension.
 */
export async function deleteRow(sheetName, rowIndex) {
  const sheets = getSheetsClient();

  // Lấy sheetId (số) từ tên sheet
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const sheet = meta.data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Không tìm thấy sheet: ${sheetName}`);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,   // 0-indexed
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}