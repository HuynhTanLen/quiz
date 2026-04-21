@echo off
color 0b
echo ================================================================
echo       CHIA SE APP BO TRAC NGHIEM QUA INTERNET TUNG BUNG!
echo ================================================================
echo Truoc tien, ban phai dam bao da chay "start_app.bat" roi nhe!ýe
echo.
echo He thong dang tao mot duong link tam thoi tren mang (Public URL)
echo de nguoi khac du khao o dau (dung 4G, Wifi khac) cung vao duoc.
echo.
echo Khi man hinh hien ra cac dong chu co link (vi du: https://xxxxxxxx.localhost.run)
echo HAP DAN! - do chinh la link ban gui cho moi nguoi.
echo.
echo (Chon "yes" neu chuong trinh hoi luu fingerprint nhe)
echo ================================================================
ssh -p 443 -R0:localhost:8000 -o StrictHostKeyChecking=accept-new a.pinggy.io
pause
