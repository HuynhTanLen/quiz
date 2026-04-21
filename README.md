# Bo Trac Nghiem OCR

Ung dung web nhe de lam bai trac nghiem tu file PDF `450c-phap-luat-dai-cuong-cau-hoi-va-dap-an-on-tap.pdf`.

## Co gi san

- Script `scripts/extract_pdf.py` de trich PDF thanh `data/questions.json`
- Giao dien web offline trong `index.html`
- Che do lam bai, tim kiem cau hoi, gan dap an thu cong
- Khu vuc dan OCR/Text de parse them cau hoi moi
- Luu dap an da gan vao `localStorage` cua trinh duyet

## Cach dung

1. Chay script trich du lieu:

```powershell
py scripts/extract_pdf.py
```

2. Mo `index.html` bang trinh duyet.

Neu trinh duyet chan `fetch` file local, chay web server tinh:

```powershell
py -m http.server 8000
```

Sau do truy cap `http://localhost:8000`.

## Ghi chu

- PDF hien trich duoc noi dung cau hoi va lua chon rat tot.
- Dap an dung chua xuat hien ro trong text layer, nen app de san phan quan tri de bo sung dap an.
- Khi co nguon OCR hoac file dap an rieng, ban co the dan vao muc `Nhap OCR/Text` hoac import lai JSON da xuat.
