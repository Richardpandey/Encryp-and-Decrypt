// --- Helper: generate AES key from random bytes ---
async function getKeyFromBytes(keyBytes) {
    return crypto.subtle.importKey(
      'raw',
      keyBytes,
      'AES-GCM',
      true,
      ['encrypt','decrypt']
    );
  }
  
  // --- Convert bytes to hex string ---
  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  
  // --- Convert hex string to bytes ---
  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i*2,2),16);
    }
    return bytes;
  }
  
  // --- Encrypt + Compress ---
  document.getElementById('uploadBtn').onclick = async () => {
    const file = document.getElementById('fileInput').files[0];
    if (!file) return alert('Select a file!');
  
    const arrayBuffer = await file.arrayBuffer();
    const compressed = pako.gzip(new Uint8Array(arrayBuffer));
  
    const keyBytes = crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
    const key = await getKeyFromBytes(keyBytes);
    const iv = crypto.getRandomValues(new Uint8Array(12));
  
    const encrypted = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, compressed);
  
    const blob = new Blob([iv, new Uint8Array(encrypted)]);
    const url = URL.createObjectURL(blob);
  
    // Download encrypted file
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name + '.enc';
    a.click();
  
    // Show the key
    const hexKey = bytesToHex(keyBytes);
    const keyInput = document.getElementById('encryptionKey');
    keyInput.value = hexKey;
  };
  
  // --- Copy key to clipboard ---
  document.getElementById('copyKeyBtn').onclick = () => {
    const keyInput = document.getElementById('encryptionKey');
    keyInput.select();
    document.execCommand('copy');
    alert('Encryption key copied to clipboard!');
  };
  
  // --- Decrypt + Decompress ---
  document.getElementById('downloadBtn').onclick = async () => {
    const file = document.getElementById('encryptedInput').files[0];
    const hexKey = document.getElementById('keyInput').value.trim();
    if (!file || !hexKey) return alert('Select file & enter encryption key!');
  
    const keyBytes = hexToBytes(hexKey);
    const key = await getKeyFromBytes(keyBytes);
  
    const buffer = await file.arrayBuffer();
    const iv = buffer.slice(0,12);
    const encryptedData = buffer.slice(12);
  
    try {
      const decrypted = await crypto.subtle.decrypt({name:'AES-GCM', iv:new Uint8Array(iv)}, key, encryptedData);
      const original = pako.ungzip(new Uint8Array(decrypted));
  
      const originalBlob = new Blob([original]);
      const url = URL.createObjectURL(originalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace('.enc','');
      a.click();
  
      alert('File decrypted successfully!');
    } catch (err) {
      alert('Decryption failed! Wrong key or corrupted file.');
    }
  };
  