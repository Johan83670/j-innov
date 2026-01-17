/* ======= Impression Page Logic ======= */
(function() {
	const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 Mo
	const VALID_PROMO_CODE = 'JINNOV20';
	const DISCOUNT_PERCENT = 20;

	// Elements
	const uploadZone = document.getElementById('uploadZone');
	const fileInput = document.getElementById('fileInput');
	const fileInfo = document.getElementById('fileInfo');
	const fileName = document.getElementById('fileName');
	const fileSize = document.getElementById('fileSize');
	const removeFileBtn = document.getElementById('removeFile');
	const errorMessage = document.getElementById('errorMessage');
	const orderSection = document.getElementById('orderSection');
	const qualityOptions = document.querySelectorAll('.quality-option');
	const decreaseQty = document.getElementById('decreaseQty');
	const increaseQty = document.getElementById('increaseQty');
	const quantityValue = document.getElementById('quantityValue');
	const promoCode = document.getElementById('promoCode');
	const applyPromo = document.getElementById('applyPromo');
	const promoApplied = document.getElementById('promoApplied');
	const discountRow = document.getElementById('discountRow');
	const summaryQuality = document.getElementById('summaryQuality');
	const summarySubtotal = document.getElementById('summarySubtotal');
	const summaryDiscount = document.getElementById('summaryDiscount');
	const summaryTotal = document.getElementById('summaryTotal');
	const payBtn = document.getElementById('payBtn');
	const successModal = document.getElementById('successModal');

	// Guard: only run on impression page
	if (!uploadZone) return;

	// State
	let selectedFile = null;
	let selectedQuality = 'standard';
	let selectedPrice = 15;
	let quantity = 1;
	let promoAppliedFlag = false;

	// Format currency
	function formatCurrency(amount) {
		return amount.toFixed(2).replace('.', ',') + ' €';
	}

	// Format file size
	function formatFileSize(bytes) {
		if (bytes < 1024) return bytes + ' octets';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
		return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
	}

	// Show error
	function showError(msg) {
		errorMessage.textContent = msg;
		errorMessage.classList.add('show');
		setTimeout(() => errorMessage.classList.remove('show'), 5000);
	}

	// Update order summary
	function updateSummary() {
		const qualityName = selectedQuality === 'standard' ? 'Standard' : 'Premium grain';
		summaryQuality.textContent = qualityName + ' × ' + quantity;
		
		const subtotal = selectedPrice * quantity;
		summarySubtotal.textContent = formatCurrency(subtotal);

		let total = subtotal;
		if (promoAppliedFlag) {
			const discount = subtotal * (DISCOUNT_PERCENT / 100);
			summaryDiscount.textContent = '−' + formatCurrency(discount);
			discountRow.style.display = 'flex';
			total = subtotal - discount;
		} else {
			discountRow.style.display = 'none';
		}

		summaryTotal.textContent = formatCurrency(total);
	}

	// Validate file
	function validateFile(file) {
		if (!file.name.toLowerCase().endsWith('.zip')) {
			showError('Seuls les fichiers .zip sont acceptés.');
			return false;
		}
		if (file.size > MAX_FILE_SIZE) {
			showError('Le fichier dépasse la taille maximale de 500 Mo.');
			return false;
		}
		return true;
	}

	// Handle file selection
	function handleFile(file) {
		if (!validateFile(file)) return;

		selectedFile = file;
		fileName.textContent = file.name;
		fileSize.textContent = formatFileSize(file.size);
		
		uploadZone.style.display = 'none';
		fileInfo.classList.add('show');
		orderSection.classList.add('show');
		errorMessage.classList.remove('show');

		// Store in IndexedDB for cross-page persistence
		storeFileInDB(file);
	}

	// IndexedDB storage for file persistence
	function openDB() {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('JinnovPrinting', 1);
			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve(request.result);
			request.onupgradeneeded = (e) => {
				const db = e.target.result;
				if (!db.objectStoreNames.contains('files')) {
					db.createObjectStore('files', { keyPath: 'id' });
				}
			};
		});
	}

	async function storeFileInDB(file) {
		try {
			const db = await openDB();
			const tx = db.transaction('files', 'readwrite');
			const store = tx.objectStore('files');
			store.put({ id: 'pendingFile', file: file, name: file.name, size: file.size });
		} catch (e) {
			console.log('IndexedDB not available:', e);
		}
	}

	async function loadFileFromDB() {
		try {
			const db = await openDB();
			const tx = db.transaction('files', 'readonly');
			const store = tx.objectStore('files');
			const request = store.get('pendingFile');
			return new Promise((resolve) => {
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => resolve(null);
			});
		} catch (e) {
			return null;
		}
	}

	async function clearFileFromDB() {
		try {
			const db = await openDB();
			const tx = db.transaction('files', 'readwrite');
			const store = tx.objectStore('files');
			store.delete('pendingFile');
		} catch (e) {
			console.log('Could not clear DB:', e);
		}
	}

	// Upload zone events
	uploadZone.addEventListener('click', () => fileInput.click());
	
	uploadZone.addEventListener('dragover', (e) => {
		e.preventDefault();
		uploadZone.classList.add('dragover');
	});

	uploadZone.addEventListener('dragleave', () => {
		uploadZone.classList.remove('dragover');
	});

	uploadZone.addEventListener('drop', (e) => {
		e.preventDefault();
		uploadZone.classList.remove('dragover');
		const files = e.dataTransfer.files;
		if (files.length > 0) handleFile(files[0]);
	});

	fileInput.addEventListener('change', (e) => {
		if (e.target.files.length > 0) handleFile(e.target.files[0]);
	});

	// Remove file
	removeFileBtn.addEventListener('click', () => {
		selectedFile = null;
		fileInput.value = '';
		fileInfo.classList.remove('show');
		orderSection.classList.remove('show');
		uploadZone.style.display = 'block';
		clearFileFromDB();
	});

	// Quality selection
	qualityOptions.forEach(option => {
		option.addEventListener('click', () => {
			qualityOptions.forEach(o => o.classList.remove('selected'));
			option.classList.add('selected');
			selectedQuality = option.dataset.quality;
			selectedPrice = parseInt(option.dataset.price);
			updateSummary();
		});
	});

	// Quantity controls
	decreaseQty.addEventListener('click', () => {
		if (quantity > 1) {
			quantity--;
			quantityValue.textContent = quantity;
			updateSummary();
		}
	});

	increaseQty.addEventListener('click', () => {
		if (quantity < 99) {
			quantity++;
			quantityValue.textContent = quantity;
			updateSummary();
		}
	});

	// Promo code
	applyPromo.addEventListener('click', () => {
		const code = promoCode.value.trim().toUpperCase();
		if (code === VALID_PROMO_CODE) {
			promoAppliedFlag = true;
			promoApplied.classList.add('show');
			promoCode.disabled = true;
			applyPromo.disabled = true;
			updateSummary();
		} else {
			showError('Code promo invalide.');
		}
	});

	// Pay button
	payBtn.addEventListener('click', () => {
		if (!selectedFile) {
			showError('Veuillez sélectionner un fichier ZIP.');
			return;
		}
		successModal.classList.add('show');
		clearFileFromDB();
	});

	// Close modal on background click
	successModal.addEventListener('click', (e) => {
		if (e.target === successModal) {
			successModal.classList.remove('show');
		}
	});

	// Check for promo code from URL (coming from album page)
	const params = new URLSearchParams(window.location.search);
	const urlPromo = params.get('promo');
	if (urlPromo && urlPromo.toUpperCase() === VALID_PROMO_CODE) {
		promoCode.value = VALID_PROMO_CODE;
		promoAppliedFlag = true;
		promoApplied.classList.add('show');
		promoCode.disabled = true;
		applyPromo.disabled = true;
	}

	// Check for pre-loaded file from IndexedDB
	(async function() {
		const stored = await loadFileFromDB();
		if (stored && stored.file) {
			selectedFile = stored.file;
			fileName.textContent = stored.name;
			fileSize.textContent = formatFileSize(stored.size);
			uploadZone.style.display = 'none';
			fileInfo.classList.add('show');
			orderSection.classList.add('show');
		}
		updateSummary();
	})();
})();
