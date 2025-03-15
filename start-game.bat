@echo off
echo 正在启动角斗士(Blokus)游戏...
echo.

:: 设置编码为UTF-8
chcp 65001 > nul

:: 确保在正确的项目目录
cd /d "%~dp0"

:: 检查node_modules是否存在，如果不存在则安装依赖
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo 安装依赖失败！请检查你的Node.js环境。
        echo 请确保已安装Node.js并且版本大于12。
        pause
        exit /b 1
    )
    echo 依赖安装完成！
)

:: 启动开发服务器
echo 正在启动开发服务器...
echo 游戏将在浏览器中自动打开。如果没有自动打开，请手动访问 http://localhost:9000
echo.
echo 按下 Ctrl+C 可以停止服务器。
echo.

:: 尝试使用npm start命令启动
call npm start

:: 如果npm start不存在，尝试使用npm run dev
if %ERRORLEVEL% neq 0 (
    echo 尝试使用其他启动命令...
    call npm run dev
)

:: 如果npm run dev也不存在，尝试使用npm run serve
if %ERRORLEVEL% neq 0 (
    echo 尝试使用其他启动命令...
    call npm run serve
)

:: 如果所有命令都失败，提供错误信息
if %ERRORLEVEL% neq 0 (
    echo.
    echo 启动失败！请确认package.json中的启动脚本是否正确配置。
    echo 你可以手动尝试以下命令：
    echo - npm start
    echo - npm run dev
    echo - npm run serve
    echo - npx webpack serve
    pause
)

exit /b 0 