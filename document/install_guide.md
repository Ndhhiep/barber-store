# Hướng dẫn cài đặt và chạy dự án Barber Store

## 1. Clone repository
```powershell
git clone https://github.com/Ndhhiep/barber-store.git
cd "barber-store"
```

## 2. Cài đặt và chạy Backend
1. Chuyển vào thư mục backend:
   ```powershell
   cd backend
   ```
2. Cài đặt dependencies:
   ```powershell
   npm install
   ```
3. Chạy server:
   - Chế độ phát triển:
     ```powershell
     npm run dev
     ```
   - Chế độ production:
     ```powershell
     npm start
     ```

> Server sẽ chạy mặc định trên `http://localhost:5000`.

## 3. Cài đặt và chạy Frontend (Staff)
1. Mở terminal mới, chuyển vào `frontend/staff`:
   ```powershell
   cd frontend/staff
   ```
2. Cài đặt dependencies và chạy:
   ```powershell
   npm install
   npm start
   ```
3. Truy cập giao diện Staff: `http://localhost:3000`

## 4. Cài đặt và chạy Frontend (User)
1. Mở terminal mới, chuyển vào `frontend/user`:
   ```powershell
   cd frontend/user
   ```
2. Cài đặt và chạy tương tự:
   ```powershell
   npm install
   npm start
   ```
3. Truy cập giao diện User: `http://localhost:3000`

