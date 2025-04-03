// Include jQuery and Bootstrap JS
const scriptJQuery = document.createElement('script');
scriptJQuery.src = "https://code.jquery.com/jquery-3.5.1.js";
document.head.appendChild(scriptJQuery);

const scriptBootstrap = document.createElement('script');
scriptBootstrap.src = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js";
scriptBootstrap.integrity = "sha384-ENjdO4Dr2bkBIFxQpeoTz1HIcje39Wm4jDKdf19U8gI4ddQ3GYNS7NTKfAdVQSZe";
scriptBootstrap.crossOrigin = "anonymous";
document.head.appendChild(scriptBootstrap);

/*
function for formatting the input
*/
document.getElementById('price').addEventListener('input', function () {
  const numericValue = parseFloat(this.value.replace(/[^0-9]+/g, '')) || ""; // Remove non-numeric characters
  const formattedValue = numericValue.toLocaleString('id-ID'); // Format with dots as thousand separators
  this.value = formattedValue; // Update the input value
});

// Fetch countries from API and populate the dropdown
async function fetchCountries() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    const countries = await response.json();
    const countryDropdown = document.getElementById('country');

    // Clear existing options
    countryDropdown.innerHTML = '<option value="">--Select a country--</option>';

    // Add countries to the dropdown
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.name.common; // Use common name as value
      option.textContent = country.name.common; // Display common name
      countryDropdown.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
  }
}

/* 
Spinner 
*/
function showSpinner(){
$('#spinnerModal').modal('show');
}

function showSpinnerTimer() {
  $('#spinnerModal').modal('show');
  setTimeout(() => {
    $('#spinnerModal').modal('hide');
  }, 1500);
}

function hideSpinner() {
  $('#spinnerModal').modal('hide'); 
}

/* 
function to fetch HTTP Method to formatting the data
*/

// Handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();
  
  const priceForm = document.getElementById('price').value;
  const quantityForm = document.getElementById('quantity').value;
  
  if (priceForm <= 0 || quantityForm <= 0) {
    alert("Price and Quantity must be greater than 0");
    return;
  }

  document.getElementById("cancelButton").style.display = "none";

  const formObject = event.target;
  const formData = new FormData(formObject);
  const jsonData = Object.fromEntries(formData.entries());

  // Ambil ID dari form (jika ada)
  const recordId = formObject.dataset.recordId;

  try {
    showSpinner(); // Tampilkan spinner sebelum fetch dimul
    let response;
    if (recordId) {
      // Jika ID ada, lakukan UPDATE
      response = await fetch(`http://localhost:3000/updaterecord/${recordId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });

      delete formObject.dataset.recordId; //hapus ID dari form setelah selesai update 
    } else {
      // Jika ID tidak ada, lakukan CREATE
      response = await fetch("http://localhost:3000/processForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Reset form setelah submit atau cancel
    formObject.reset();

    const deleteButtonOf = document.querySelectorAll(".btn-danger");
    deleteButtonOf.forEach(button => {
      button.disabled = true;
    });

  } catch (error) {
    console.error("Error:", error);
    alert("Failed to submit form. Check console for details.");
  }finally{
  hideSpinner(); // Sembunyikan modal spinner
  loadRecords(); // load data terbaru setelah submit
}
}

// Contoh penggunaan
async function loadRecords() {
  try {
    showSpinner(); // Tampilkan modal spinner
    const response = await fetch('http://localhost:3000/getAllRecords');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    createTable(data.slice(0, 10)); // Tampilkan 10 data terbaru
  } catch (error) {
    console.error('Error fetching records:', error);
    alert('Failed to fetch records. Check console for details.');
  }finally{
    hideSpinner(); // Sembunyikan modal spinner
  }
}

// retrieve all records
async function getAllRecords() {
  showSpinnerTimer(); // Tampilkan modal
  try {
    const response = await fetch('http://localhost:3000/getAllRecords');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(data);
    createTable(data); //tampilkan semua data
  } catch (error) {
    console.error('Error fetching records:', error);
    alert('Failed to fetch records. Check console for details.');
  }
}

// Create table dynamically
async function createTable(dataArray) {
  
  let result = `<table class='table table-sm'>
  <thead><tr>
  <th>Delete</th>
  <th>Edit</th>
  <th>Product Name</th>
  <th>Category</th>
  <th>Country</th>
  <th>Condition</th>
  <th>Price</th>
  <th>Quantity</th>
  <th>Last Update</th>
  </tr></thead>`;
  
  if (!dataArray || dataArray.length === 0) {
    // Jika dataArray kosong, tampilkan pesan "No data found!"
    result = "No data found!";
  } else {
    dataArray.forEach(row => {
      result += `<tr>
        <td><button class="btn btn-danger" onclick="deleteRecord(this)" data-id="${row[0]}">Delete</button></td>
        <td><button class='btn btn-warning btn-sm' onclick='editRecord("${row[0]}")'>Edit</button></td>
        <td>${row[1]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td> <!-- Country -->
        <td>${row[5]}</td>
        <td>Rp${row[6]}</td> <!-- Price -->
        <td>${row[7]}</td>
        <td>${row[8]}</td>
      </tr>`;
    });
    result += "</table>";
  }
  document.getElementById("dataTable").innerHTML = result;
}

// Search record by ID
async function handleSearchForm(event) {
  event.preventDefault();
  const searchText = document.getElementById('searchText').value.trim();
  
  if (searchText.length < 3) {
    alert("Please enter at least 3 characters.");
    return;
  }

  showSpinner(); // Tampilkan spinner sebelum fetch dimulai
  try {
    const response = await fetch(`http://localhost:3000/getSearchRecords/${encodeURIComponent(searchText)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.length === 0) {
      alert('No matching records found.');
    } else {
      createTable(data); // Tampilkan hasil pencarian dalam tabel
    }
  } catch (error) {
    console.error('Error searching records:', error);
    alert('Failed to search records. Check console for details.');
  } finally {
    hideSpinner(); // Sembunyikan spinner setelah fetch selesai (baik berhasil maupun gagal)
  }
}

// Delete record by ID
async function deleteRecord(buttonElement) {
  const idRecord = buttonElement.getAttribute("data-id");
  console.log("Deleting record with ID:", idRecord);
  
  if (!idRecord) {
    alert("Invalid record ID.");
    return;
  }
  
  if (!confirm("Are you sure you want to delete this record?")) {
    return;
  }
  
  try {
    showSpinner(); // Tampilkan spinner
    const response = await fetch(`http://localhost:3000/deleteRecord/${encodeURIComponent(idRecord)}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const result = await response.json();
    alert(result.message);
    
    // Muat ulang data setelah delete
    await loadRecords();

  } catch (error) {
    console.error("Error deleting record:", error);
    alert("Failed to delete record.");
  }
}

// Edit record by ID
async function editRecord(id) {
  try {
    showSpinnerTimer(); // Tampilkan spinner timer
    const response = await fetch(`http://localhost:3000/getRecord/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error(`Error fetching record: ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      alert("Record not found!");
      return;
    }

    // Isi form dengan data yang ada
    document.getElementById("name").value = data[1] || "";
    document.getElementById("description").value = data[2] || "";
    document.getElementById("category").value = data[3] || "";
    document.getElementById("country").value = data[4] || "";
    document.getElementById("condition").value = data[5] || "New";
    document.getElementById("price").value = data[6] || "0";
    document.getElementById("quantity").value = data[7] || "0";

    document.getElementById("cancelButton").style.display = "inline-block";

    // Simpan ID ke dalam form agar bisa digunakan saat submit
    document.getElementById("ProductDetails").dataset.recordId = id;
    // Scroll ke form
    document.getElementById("ProductDetails").scrollIntoView({ behavior: "smooth" });

    const deleteButtonOf = document.querySelectorAll(".btn-danger");
    deleteButtonOf.forEach(button => {
      button.disabled = true;
    });
  } catch (error) {
    console.error("Error fetching record:", error);
  }
}

// Cancel edit
function editCancel() {
  const form = document.getElementById("ProductDetails");
  form.reset(); // Reset form
  delete form.dataset.recordId; // Hapus ID yang disimpan

  // Aktifkan kembali tombol delete
  const deleteButtons = document.querySelectorAll('.btn-danger');
  deleteButtons.forEach(button => {
    button.disabled = false;
  });

}

// Initialize functions on load
window.addEventListener('load', async () => {
  fetchCountries(); // Ambil data negara saat halaman dimuat
  loadRecords(); // Ambil semua data saat halaman dimuat (10 data terbaru)
});