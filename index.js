const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.use(cors());
// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const DATA_RANGE = 'Data!A2:I';
const ID_RANGE = 'Data!A2:A';
const LAST_COL = 'I';

// Inisialisasi client Google Sheets
async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return await auth.getClient();
}

// Baca data dari Google Sheets
async function readSheet(range) {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
  });
  return result.data.values || [];
}

// Tulis data ke Google Sheets
async function writeSheet(range, values) {
  const authClient = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  // Pastikan tidak menulis jika data kosong
  if (!values.length) {
    console.log("No data left to write. Clearing the sheet...");
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: range, // Hapus seluruh range
    });
    return;
  }

  // Bersihkan data lama sebelum menulis ulang
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
  });

  // Tulis ulang data yang tersisa ke dalam Google Sheets
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'RAW',
    requestBody: { values: values },
  });

  console.log(`Updated sheet with range: ${range}, Total rows: ${values.length}`);
}

// Tambah data ke Google Sheets
async function appendSheet(values) {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: DATA_RANGE,
      valueInputOption: 'RAW',
      requestBody: { values: values },
    });
    return response.data;
  } catch (error) {
    console.error("Error appending to sheet:", error.message);
    throw new Error("Failed to write to Google Sheets. Check permissions and credentials.");
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Proses formulir dari frontend
app.post('/processForm', async (req, res) => {
  const formObject = req.body;
  const idList = await readSheet(ID_RANGE);
  const existingId = idList.flat().includes(formObject.recId);
  
  // Pastikan semua field ada nilainya (hilangkan "condition" jika tidak digunakan)
  const newValues = [[
    formObject.recId || uuidv4(),
    formObject.name || "", // Default kosong jika tidak ada
    formObject.description || "",
    formObject.category || "",
    formObject.country || "",
    formObject.condition || "", // Hapus jika tidak digunakan
    formObject.price || "0",
    formObject.quantity || "0",
    new Date().toLocaleString("id-ID") // Format tanggal Indonesia
  ]];

  try {
    if (existingId) {
      const rowIndex = idList.findIndex(row => row[0] === formObject.recId) + 2;
      const updateRange = `Data!A${rowIndex}:${LAST_COL}${rowIndex}`;
      await writeSheet(updateRange, newValues);
    } else {
      await appendSheet(newValues);
    }
    res.json(await readSheet(DATA_RANGE));
  } catch (error) {
    console.error('Error processing form:', error);
    res.status(500).json({ error: error.message }); // Tampilkan pesan error lengkap
  }
});

app.get('/getAllRecords', async (req, res) => {
  res.json(await readSheet(DATA_RANGE));
});

// Get search records
app.get('/getSearchRecords/:searchText', async (req, res) => {
  let searchText = req.params.searchText.toLowerCase().trim(); // Hapus spasi ekstra & lowercase
  if (searchText.length < 3) {
    return res.json([]); // Jika kurang dari 3 karakter, kembalikan array kosong
  }  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  const records = await readSheet(DATA_RANGE);
  // Filter data dengan pencocokan minimal 3 karakter
  const filteredRecords = records.filter(row => 
    row.some(cell => {
      const cellText = cell.toString().toLowerCase();
      return cellText.includes(searchText) && searchText.length >= 3;
    })
  );
  res.json(filteredRecords);
});

// Delete record
app.delete('/deleteRecord/:id', async (req, res) => {
  const idRecord = req.params.id;
  console.log("Request to delete ID:", idRecord);

  try {
    let records = await readSheet(DATA_RANGE);

    // Cek apakah ID benar-benar ada
    const recordIndex = records.findIndex(row => row[0].trim() === idRecord.trim());

    if (recordIndex === -1) {
      console.log("Record not found in sheet.");
      return res.status(404).json({ message: "Record not found" });
    }

    // Hapus record dari array
    records.splice(recordIndex, 1);

    // Simpan kembali data tanpa record yang dihapus
    await writeSheet(DATA_RANGE, records);
    console.log("Record successfully deleted.");

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get single record
app.get('/getRecord/:id', async (req, res) => {
  const id = req.params.id;
  const records = await readSheet(DATA_RANGE);
  const record = records.find(row => row[0] === id);
  res.json(record || {});
});

// Update record
app.put('/updaterecord/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  try {
    const records = await readSheet(DATA_RANGE);

    // Temukan indeks data yang akan diperbarui
    const recordIndex = records.findIndex(row => row[0] === id);

    if (recordIndex === -1) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Update data pada indeks yang ditemukan
    records[recordIndex] = [
      id, // ID tetap
      updatedData.name || "",
      updatedData.description || "",
      updatedData.category || "",
      updatedData.country || "",
      updatedData.condition || "",
      updatedData.price || "0",
      updatedData.quantity || "0",
      new Date().toLocaleString("id-ID") // Perbarui waktu terakhir update
    ];

    // Tulis ulang ke Google Sheets
    await writeSheet(DATA_RANGE, records);
    res.json({ message: "Record updated successfully", data: records[recordIndex] });
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));