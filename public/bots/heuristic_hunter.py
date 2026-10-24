"""Heuristic Hunter (Bot Mẫu Cấp Độ 2 — Trung Cấp).

Trích xuất từ Sổ Tay Thí Sinh UET BattleCode 2026 (Chương 4.2).
Dành cho sinh viên đã nắm vững cú pháp Python cơ bản và muốn tự thiết kế
hàm đánh giá thế cờ (Heuristic Evaluation Function).

Nguyên lý thiết kế:
  Score(move) = W_Goal * Chạm_Đích
              + W_Capture * Ăn_Quân
              + W_Progress * Tiến_Đích
              + W_Center * Kiểm_Soát_Trung_Tâm
              - W_Danger * Bị_Thiên_Địch_Đe_Dọa
              + W_Defense * Giữ_Chốt_Căn_Cứ
"""

# Bảng trọng số Heuristic mẫu
WEIGHTS = {
    "GOAL_WIN": 1000000.0,
    "CAPTURE": 240.0,
    "PROGRESS": 45.0,
    "CENTER": 20.0,
    "DANGER": 190.0,
    "DEFENSE": 60.0,
}

BEATS = {"ROCK": "SCISSORS", "SCISSORS": "PAPER", "PAPER": "ROCK"}
PREDATOR = {"ROCK": "PAPER", "PAPER": "SCISSORS", "SCISSORS": "ROCK"}


def choose_move(state: dict) -> dict:
    options = state.get("legal_moves", [])
    if not options:
        return None

    player = state.get("player", "P1")
    board = state.get("board", [])
    history = state.get("history", [])
    opp = "P2" if player == "P1" else "P1"

    # Tọa độ ô đích: P1 hướng về I1 (8, 0); P2 hướng về A9 (0, 8)
    gx, gy = (8, 0) if player == "P1" else (0, 8)
    hx, hy = (0, 8) if player == "P1" else (8, 0)
    my_goal_name = "I1" if player == "P1" else "A9"

    def to_pos(cell: str):
        c = cell.upper()
        return ord(c[0]) - 65, int(c[1:]) - 1

    def chebyshev(x1, y1, x2, y2):
        return max(abs(x1 - x2), abs(y1 - y2))

    # 1. BƯỚC 1: KIỂM TRA NƯỚC CHẠM ĐÍCH THẮNG NGAY
    for m in options:
        if m["to"].upper() == my_goal_name:
            return {"from": m["from"], "to": m["to"]}

    # 2. BƯỚC 2: HÀM ĐÁNH GIÁ THẾ CỜ HEURISTIC
    def evaluate_move(m):
        fx, fy = to_pos(m["from"])
        tx, ty = to_pos(m["to"])
        my_piece = board[fy][fx]
        if not my_piece:
            return -1e9
        my_type = my_piece["type"]
        target = board[ty][tx]

        score = 0.0

        # Tiêu chí 1: Rút ngắn khoảng cách Chebyshev về đích
        d_before = chebyshev(fx, fy, gx, gy)
        d_after = chebyshev(tx, ty, gx, gy)
        score += (d_before - d_after) * WEIGHTS["PROGRESS"] - d_after * 10.0

        # Tiêu chí 2: Thưởng ăn quân đối phương
        if target and target["player"] == opp:
            score += WEIGHTS["CAPTURE"]

        # Tiêu chí 3: Kiểm soát các cột trung tâm D, E, F (x = 3, 4, 5)
        dist_from_center_col = abs(tx - 4)
        score += (4 - dist_from_center_col) * WEIGHTS["CENTER"]

        # Tiêu chí 4: Né tránh quân thiên địch rình rập ở các ô kế cận
        in_danger = False
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = tx + dx, ty + dy
                if 0 <= nx < 9 and 0 <= ny < 9:
                    opp_p = board[ny][nx]
                    if opp_p and opp_p["player"] == opp and opp_p["type"] == PREDATOR.get(my_type):
                        in_danger = True
                        break
            if in_danger:
                break

        if in_danger:
            score -= WEIGHTS["DANGER"]

        # Tiêu chí 5: Bảo vệ cửa ngõ căn cứ nhà (hx, hy)
        if chebyshev(tx, ty, hx, hy) <= 1:
            score += WEIGHTS["DEFENSE"]

        # Chống lặp nước đi
        recent = [step.get("to") for step in history[-6:] if step.get("player") == player]
        if m["to"] in recent:
            score -= 25.0

        return score

    best_move = max(options, key=evaluate_move)
    return {"from": best_move["from"], "to": best_move["to"]}
