#!/usr/bin/env python3
"""
Bộ Công Cụ Tự Chẩn Đoán & Kiểm Tra Bot Nội Bộ (Diagnostic Linter & Self-Test)
Trích xuất từ Sổ Tay Vận Hành BTC UET BattleCode 2026 (Mục 8.2 — Mô Hình UC Berkeley CS61A).

Cung cấp hệ thống mã lỗi tiếng Việt chuẩn (E01 đến E06) giúp thí sinh
tự kiểm tra và sửa lỗi bot trên máy tính cá nhân trước khi nộp bài:
  - [E01]: Lỗi Cú Pháp (SyntaxError, IndentationError)
  - [E02]: Lỗi Giao Tiếp (Thiếu hàm choose_move)
  - [E03]: Lỗi Nước Đi Bất Hợp Lệ (Invalid Move / Không thuộc legal_moves)
  - [E04]: Lỗi Quá Thời Gian (TLE > 250ms trên máy cá nhân)
  - [E05]: Lỗi Sử Dụng Thư Viện Cấm (socket, requests, os, eval...)
  - [E06]: Lỗi Làm Biến Đổi Dữ Liệu Đầu Vào (Mutating Input State)
"""

from __future__ import annotations
import ast
import copy
import json
import os
import runpy
import sys
import time

BANNED_MODULES = {
    "socket", "requests", "urllib", "http", "ftplib", "subprocess",
    "multiprocessing", "threading", "os", "shutil", "ctypes"
}

BANNED_BUILTINS = {"eval", "exec", "open", "compile", "__import__"}


def check_ast_security(source_code: str) -> list[str]:
    """Kiểm tra AST phát hiện thư viện hoặc hàm cấm [E05]."""
    errors = []
    try:
        tree = ast.parse(source_code)
    except SyntaxError as e:
        return [f"[E01 - Lỗi Cú Pháp]: Dòng {e.lineno}, Cột {e.offset}: {e.msg}"]

    for node in ast.walk(tree):
        # Kiểm tra import cấm
        if isinstance(node, ast.Import):
            for alias in node.names:
                mod = alias.name.split(".")[0]
                if mod in BANNED_MODULES:
                    errors.append(f"[E05 - Lỗi Thư Viện Cấm]: Dòng {node.lineno}: Cấm 'import {alias.name}'. Hộp cát chấm thi sẽ từ chối thư viện này.")
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                mod = node.module.split(".")[0]
                if mod in BANNED_MODULES:
                    errors.append(f"[E05 - Lỗi Thư Viện Cấm]: Dòng {node.lineno}: Cấm 'from {node.module} import ...'.")
        # Kiểm tra hàm nguy hiểm
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in BANNED_BUILTINS:
                errors.append(f"[E05 - Lỗi Thư Viện Cấm]: Dòng {node.lineno}: Cấm sử dụng hàm nguy hiểm '{node.func.id}()'.")

    return errors


def generate_mock_state(player: str = "P1", turn: int = 0) -> dict:
    """Tạo trạng thái bàn cờ 9x9 chuẩn (15 quân) để thử nghiệm bot."""
    # Bàn cờ trống 9x9
    board = [[None for _ in range(9)] for _ in range(9)]

    # Hàng 1 (y=0): B1 -> H1 (P2 - 7 quân)
    p2_r1 = ["ROCK", "PAPER", "SCISSORS", "ROCK", "PAPER", "SCISSORS", "ROCK"]
    for x, t in enumerate(p2_r1, start=1):
        board[0][x] = {"player": "P2", "type": t}

    # Hàng 2 (y=1): A2 -> H2 (P2 - 8 quân)
    p2_r2 = ["PAPER", "SCISSORS", "ROCK", "PAPER", "SCISSORS", "ROCK", "PAPER", "SCISSORS"]
    for x, t in enumerate(p2_r2):
        board[1][x] = {"player": "P2", "type": t}

    # Hàng 8 (y=7): B8 -> I8 (P1 - 8 quân)
    p1_r8 = ["PAPER", "SCISSORS", "ROCK", "PAPER", "SCISSORS", "ROCK", "PAPER", "SCISSORS"]
    for x, t in enumerate(p1_r8, start=1):
        board[7][x] = {"player": "P1", "type": t}

    # Hàng 9 (y=8): B9 -> H9 (P1 - 7 quân)
    p1_r9 = ["ROCK", "SCISSORS", "PAPER", "ROCK", "SCISSORS", "PAPER", "ROCK"]
    for x, t in enumerate(p1_r9, start=1):
        board[8][x] = {"player": "P1", "type": t}

    # Tạo một số legal_moves mẫu theo chuẩn King's move
    COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
    legal_moves = []
    if player == "P1":
        for x in range(1, 9):
            legal_moves.append({"from": f"{COLS[x]}8", "to": f"{COLS[x]}7"})
            legal_moves.append({"from": f"{COLS[x]}8", "to": f"{COLS[x-1]}7"})
    else:
        for x in range(0, 8):
            legal_moves.append({"from": f"{COLS[x]}2", "to": f"{COLS[x]}3"})
            legal_moves.append({"from": f"{COLS[x]}2", "to": f"{COLS[x+1]}3"})

    return {
        "player": player,
        "board": board,
        "legal_moves": legal_moves,
        "history": [],
        "turn": turn
    }


def diagnose_bot(bot_path: str):
    print("=" * 75)
    print("BAN TỔ CHỨC UET BATTLECODE 2026 — BỘ CHẨN ĐOÁN MÃ LỖI BOT TỰ ĐỘNG")
    print(f"Đang kiểm định bài nộp: {bot_path}")
    print("Tiêu chuẩn: CPython WASI Sandbox • Bảng mã lỗi E01 - E06")
    print("=" * 75)

    if not os.path.isfile(bot_path):
        print(f"❌ [LỖI HỆ THỐNG]: Không tìm thấy tệp {bot_path} trên máy!")
        sys.exit(1)

    # 1. Kiểm tra kích thước tệp
    size_kb = os.path.getsize(bot_path) / 1024.0
    print(f"• Kích thước tệp: {size_kb:.2f} KB (Giới hạn quy định: < 100 KB)")
    if size_kb > 100.0:
        print("❌ [LỖI]: Kích thước tệp vượt quá trần 100 KB của giải đấu!")
        return False

    with open(bot_path, "r", encoding="utf-8") as f:
        src = f.read()

    # 2. Kiểm tra Cú pháp & Thư viện cấm [E01 & E05]
    print("• Đang quét cây cú pháp trừu tượng AST...")
    security_errors = check_ast_security(src)
    if security_errors:
        print("❌ PHÁT HIỆN LỖI AN TOÀN / CÚ PHÁP:")
        for err in security_errors:
            print(f"   {err}")
        return False
    print("   ✅ Cú pháp hợp lệ. Không sử dụng thư viện mạng hay lệnh cấm.")

    # 3. Nạp mã nguồn động & Kiểm tra hàm choose_move [E02]
    print("• Đang nạp hàm thực thi choose_move(state)...")
    try:
        scope = runpy.run_path(bot_path)
    except Exception as e:
        print(f"❌ [E01 - Lỗi Khởi Động]: Không thể thực thi file ({e})")
        return False

    if "choose_move" not in scope or not callable(scope["choose_move"]):
        print("❌ [E02 - Lỗi Giao Tiếp]: Không tìm thấy hàm 'def choose_move(state):' trong file!")
        print("   Hướng dẫn: Bạn phải định nghĩa hàm 'def choose_move(state):' nhận vào từ điển trạng thái.")
        return False
    print("   ✅ Đã tìm thấy hàm choose_move(state) hợp lệ.")

    choose_func = scope["choose_move"]

    # 4. Thử nghiệm thực thi trên 10 tình huống giả lập [E03, E04, E06]
    print("• Đang chạy thử nghiệm 10 thế cờ giả lập (Kiểm tra tốc độ & tính hợp lệ)...")
    max_elapsed = 0.0
    total_elapsed = 0.0

    for i in range(10):
        side = "P1" if i % 2 == 0 else "P2"
        mock_state = generate_mock_state(player=side, turn=i)
        state_backup = copy.deepcopy(mock_state)

        start = time.perf_counter()
        try:
            move = choose_func(mock_state)
        except Exception as e:
            print(f"❌ [E01 - Ngoại Lệ Chưa Xử Lý]: Vòng thử {i+1} ({side}) gặp lỗi: {e}")
            return False
        elapsed = time.perf_counter() - start

        max_elapsed = max(max_elapsed, elapsed)
        total_elapsed += elapsed

        # Kiểm tra E06: Biến đổi dữ liệu đầu vào
        if mock_state != state_backup:
            print(f"❌ [E06 - Lỗi Biến Đổi Dữ Liệu]: Bot của bạn đã chỉnh sửa trực tiếp biến state đầu vào!")
            print("   Hướng dẫn: Hãy copy dữ liệu trước khi chỉnh sửa để tránh bị xử thua lỗi Forfeit.")
            return False

        # Kiểm tra E03: Nước đi bất hợp lệ
        if not move or not isinstance(move, dict) or "from" not in move or "to" not in move:
            print(f"❌ [E03 - Lỗi Định Dạng Nước Đi]: Bot trả về: {move}")
            print("   Hướng dẫn: Bot phải trả về từ điển định dạng: {'from': 'A8', 'to': 'A7'}.")
            return False

        legal_set = { (m["from"], m["to"]) for m in mock_state["legal_moves"] }
        if (move["from"], move["to"]) not in legal_set:
            print(f"❌ [E03 - Lỗi Nước Đi Không Hợp Lệ]: Nước đi {move['from']} ➔ {move['to']} không nằm trong state['legal_moves']!")
            return False

        # Kiểm tra E04: Quá thời gian
        if elapsed > 0.25:
            print(f"⚠️  [E04 - CẢNH BÁO TỐC ĐỘ]: Lượt {i+1} mất {(elapsed*1000):.1f}ms (> 250ms). Có nguy cơ bị phạt TLE trên máy chủ!")

    avg_elapsed = (total_elapsed / 10.0) * 1000.0
    max_ms = max_elapsed * 1000.0

    print("=" * 75)
    print("KẾT QUẢ CHẨN ĐOÁN TOÀN DIỆN:")
    print(f"  • Thời gian phản hồi trung bình: {avg_elapsed:.2f} ms")
    print(f"  • Thời gian phản hồi chậm nhất:   {max_ms:.2f} ms (Giới hạn: < 2000 ms)")
    print(f"  • Đạt chuẩn an toàn Sandbox:    100% (Không dùng thư viện cấm)")
    print(f"  • Tính toàn vẹn dữ liệu:        100% (Không sửa đè state)")
    print(f"  • Tuân thủ luật cờ giải đấu:    100% (Nước đi hợp lệ)")
    print("=" * 75)
    print("🎉 CHÚC MỪNG: Bot của bạn ĐẠT CHUẨN 100% và sẵn sàng nộp vào giải đấu UET BattleCode 2026!")
    return True


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "public/bots/starter_config.py"
    success = diagnose_bot(target)
    sys.exit(0 if success else 1)
