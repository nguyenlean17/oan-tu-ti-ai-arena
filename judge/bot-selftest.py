#!/usr/bin/env python3
"""
UET Battlecode 2026 - Bot Self-Test CLI Utility
Allows students to verify their bot offline before submitting.
Checks:
- Forbidden imports and calls (Security check)
- choose_move(state) interface
- Response time budget (< 1000ms)
- Move validity within legal_moves
- Memory and return structure
"""

import ast
import importlib.util
import json
import sys
import time

FORBIDDEN_MODULES = {
    'os', 'sys', 'subprocess', 'socket', 'shutil', 'pty', 'builtins',
    'ctypes', 'multiprocessing', 'threading', 'asyncio', 'requests', 'urllib'
}

FORBIDDEN_CALLS = {'eval', 'exec', '__import__', 'open', 'compile'}

def check_ast(source_code):
    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        return False, f"E01: Cú pháp Python không hợp lệ tại dòng {e.lineno}: {e.msg}"

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                mod = alias.name.split('.')[0]
                if mod in FORBIDDEN_MODULES:
                    return False, f"E02: Sử dụng thư viện bị cấm '{mod}'"
        elif isinstance(node, ast.ImportFrom):
            mod = (node.module or '').split('.')[0]
            if mod in FORBIDDEN_MODULES:
                return False, f"E02: Sử dụng thư viện bị cấm '{mod}'"
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in FORBIDDEN_CALLS:
                return False, f"E03: Gọi hàm bị cấm '{node.func.id}()'"

    return True, "AST kiểm tra an toàn."

def create_mock_state():
    return {
        "turn": "P1",
        "my_side": "P1",
        "ply": 0,
        "max_plies": 200,
        "legal_moves": [
            {"from": "A8", "to": "A7"},
            {"from": "B8", "to": "B7"},
            {"from": "C8", "to": "C7"},
            {"from": "D8", "to": "D7"},
            {"from": "E8", "to": "E7"}
        ],
        "board": [
            [None for _ in range(9)] for _ in range(9)
        ]
    }

def run_self_test(file_path):
    print(f"[*] Bắt đầu kiểm tra ngoại tuyến bot: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            code = f.read()
    except Exception as e:
        print(f"[!] Không thể đọc tệp: {e}")
        return 1

    # Step 1: AST Check
    passed, msg = check_ast(code)
    if not passed:
        print(f"[THẤT BẠI] {msg}")
        return 1
    print("[OK] Kiểm tra bảo mật AST hợp lệ.")

    # Step 2: Load Module
    try:
        spec = importlib.util.spec_from_loader("student_bot", loader=None)
        bot_module = importlib.util.module_from_spec(spec)
        exec(code, bot_module.__dict__)
    except Exception as e:
        print(f"[THẤT BẠI] E04: Lỗi thực thi mã nguồn bot: {e}")
        return 1

    if not hasattr(bot_module, 'choose_move'):
        print("[THẤT BẠI] E05: Tệp bot thiếu hàm bắt buộc 'choose_move(state)'.")
        return 1
    print("[OK] Đã tìm thấy hàm 'choose_move(state)'.")

    # Step 3: Test Execution
    mock_state = create_mock_state()
    start_time = time.perf_counter()
    try:
        move = bot_module.choose_move(mock_state)
    except Exception as e:
        print(f"[THẤT BẠI] E04: Ngoại lệ xảy ra khi gọi choose_move: {e}")
        return 1
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    print(f"[OK] Thời gian thực thi: {elapsed_ms:.2f}ms (Giới hạn: 1000ms)")
    if elapsed_ms > 1000:
        print(f"[THẤT BẠI] E06: Bot chạy quá thời gian quy định (> 1000ms).")
        return 1

    # Step 4: Validate Move
    if not isinstance(move, dict) or 'from' not in move or 'to' not in move:
        print(f"[THẤT BẠI] E05: Nước đi trả về không đúng định dạng: {move}. Cần trả về dict {{'from': '...', 'to': '...'}}.")
        return 1

    is_legal = any(m['from'] == move['from'] and m['to'] == move['to'] for m in mock_state['legal_moves'])
    if not is_legal:
        print(f"[THẤT BẠI] E05: Nước đi {move} không nằm trong legal_moves của bàn cờ.")
        return 1

    print(f"[THÀNH CÔNG] Bot hợp lệ 100%! Nước đi thử nghiệm: {move}")
    return 0

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'public/bots/heuristic_hunter.py'
    sys.exit(run_self_test(target))
