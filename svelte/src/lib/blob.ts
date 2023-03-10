const b64ToBlob = (
  b64Data: string,
  contentType = '',
  sliceSize = 512
): Blob => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export default (data: string): string => {
  const b64Data = btoa(data);
  const blobRaw = b64ToBlob(b64Data, 'text/plain');
  const url = URL.createObjectURL(blobRaw);
  return url;
};
