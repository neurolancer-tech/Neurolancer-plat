@echo off
echo 🧪 Testing Authentication Endpoints with curl...
echo.

set API_URL=%NEXT_PUBLIC_API_URL%
if "%API_URL%"=="" set API_URL=https://neurolancer-plat.onrender.com/api

echo 📡 Testing Backend Connectivity...
curl -s -o nul -w "Backend Status: %%{http_code}\n" %API_URL%/auth/test-endpoint/
echo.

echo 🔐 Testing Registration Endpoint...
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

curl -X POST %API_URL%/auth/register/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser_%TIMESTAMP%\",\"email\":\"test_%TIMESTAMP%@example.com\",\"password\":\"TestPassword123!\",\"password_confirm\":\"TestPassword123!\",\"first_name\":\"Test\",\"last_name\":\"User\",\"user_type\":\"client\"}" ^
  -w "\nStatus: %%{http_code}\n"
echo.

echo 🔑 Testing Login Endpoint...
curl -X POST %API_URL%/auth/login/ ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser_%TIMESTAMP%\",\"password\":\"TestPassword123!\"}" ^
  -w "\nStatus: %%{http_code}\n"
echo.

echo 🌐 Testing Google OAuth Endpoint...
curl -X POST %API_URL%/auth/google/ ^
  -H "Content-Type: application/json" ^
  -d "{\"uid\":\"test_google_uid\",\"email\":\"test@gmail.com\",\"first_name\":\"Google\",\"last_name\":\"User\",\"photo_url\":\"https://example.com/photo.jpg\"}" ^
  -w "\nStatus: %%{http_code}\n"
echo.

echo ✅ Authentication endpoint tests completed!
echo.
echo 📋 Expected Status Codes:
echo - 200/201: Success
echo - 400: Bad Request (check request data)
echo - 404: Endpoint not found (check backend is running)
echo - 500: Server error (check backend logs)
echo.
echo 🎯 If you see 200/201 status codes, the authentication system is working correctly!

pause