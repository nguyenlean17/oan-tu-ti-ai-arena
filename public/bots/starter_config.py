"""Starter Bot v2.0 (Zero-Code Starter Kit) — Oẳn Tù Tì 2.0 (Core 15 Quân).

Dành riêng cho Tân sinh viên K70:
Bạn KHÔNG CẦN viết thuật toán tìm kiếm phức tạp.
Chỉ cần tinh chỉnh 5 con số trong từ điển BOT_CONFIG dưới đây để tạo ra
phong cách thi đấu độc đáo của riêng đội mình!
"""

# ==============================================================================
# BẢNG THÔNG SỐ CẤU HÌNH CHIẾN THUẬT (BẠN CHỈ CẦN TINH CHỈNH CÁC SỐ NÀY)
# ==============================================================================
BOT_CONFIG = {
    # 1. Điểm thưởng khi đưa quân chạm đích thắng ngay (I1 với P1, A9 với P2)
    "DIEM_THANG_DICH": 100000.0,

    # 2. Điểm thưởng khi ăn được quân của đối phương (Tăng lên nếu thích lối đánh Hổ Báo / Săn Quân)
    "DIEM_AN_QUAN": 220.0,

    # 3. Điểm thưởng mỗi bước rút ngắn khoảng cách về đích (Tăng lên nếu thích Đua Tốc Độ)
    "DIEM_TIEN_DICH": 60.0,

    # 4. Điểm phạt khi bước vào ô bị thiên địch kề bên đe dọa (Tăng phạt nếu thích Phòng Thủ An Toàn)
    "DIEM_NE_NGUY_HIEM": -180.0,

    # 5. Điểm thưởng giữ quân chốt chặn bảo vệ cửa ngõ căn cứ nhà (Chống bị đối thủ đột kích)
    "DIEM_BAO_VE_DICH": 80.0,
}

# Quy luật khắc chế Oẳn Tù Tì: Búa ăn Kéo, Kéo ăn Bao, Bao ăn Búa
BEATS = {"ROCK": "SCISSORS", "SCISSORS": "PAPER", "PAPER": "ROCK"}
PREDATOR = {"ROCK": "PAPER", "PAPER": "SCISSORS", "SCISSORS": "ROCK"}


def choose_move(state: dict) -> dict:
    """Hàm quyết định nước đi chính thức cho bot thi đấu Oẳn Tù Tì 2.0."""
    legal_moves = state.get("legal_moves", [])
    if not legal_moves:
        return None

    player = state.get("player", "P1")
    board = state.get("board", [])
    history = state.get("history", [])

    opp = "P2" if player == "P1" else "P1"
    # P1 hướng về I1 (cột 8, hàng 0); P2 hướng về A9 (cột 0, hàng 8)
    gx, gy = (8, 0) if player == "P1" else (0, 8)
    hx, hy = (0, 8) if player == "P1" else (8, 0)
    my_goal_coord = "I1" if player == "P1" else "A9"

    def to_xy(coord_str: str):
        c = coord_str.upper()
        return ord(c[0]) - 65, int(c[1:]) - 1

    def chebyshev(x1, y1, x2, y2):
        return max(abs(x1 - x2), abs(y1 - y2))

    # 1. Ưu tiên tuyệt đối: Nước đi chạm đích thắng ngay lập tức
    for m in legal_moves:
        if m["to"].upper() == my_goal_coord:
            return {"from": m["from"], "to": m["to"]}

    # Hàm kiểm tra xem ô (tx, ty) có bị thiên địch của đối thủ kề bên đe dọa ăn không
    def is_cell_threatened(tx, ty, piece_type):
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = tx + dx, ty + dy
                if 0 <= nx < 9 and 0 <= ny < 9:
                    p = board[ny][nx]
                    if p and p["player"] == opp and p["type"] == PREDATOR.get(piece_type):
                        return True
        return False

    recent_tos = [m.get("to") for m in history[-6:] if m.get("player") == player]

    best_move = legal_moves[0]
    best_score = -999999.0

    for m in legal_moves:
        fx, fy = to_xy(m["from"])
        tx, ty = to_xy(m["to"])
        my_piece = board[fy][fx]
        if not my_piece:
            continue
        my_type = my_piece["type"]
        target = board[ty][tx]

        score = 0.0

        # Rút ngắn khoảng cách Chebyshev về đích
        dist_before = chebyshev(fx, fy, gx, gy)
        dist_after = chebyshev(tx, ty, gx, gy)
        gain = dist_before - dist_after
        score += gain * BOT_CONFIG["DIEM_TIEN_DICH"] - dist_after * 15.0

        # Thưởng điểm khi ăn quân đối thủ
        if target and target["player"] == opp:
            score += BOT_CONFIG["DIEM_AN_QUAN"]

        # Phạt điểm nếu bước vào vùng nguy hiểm (bị thiên địch ăn)
        if is_cell_threatened(tx, ty, my_type):
            score += BOT_CONFIG["DIEM_NE_NGUY_HIEM"]
        else:
            score += 20.0  # Thưởng an toàn

        # Thưởng điểm bảo vệ căn cứ nhà
        if chebyshev(tx, ty, hx, hy) <= 1:
            score += BOT_CONFIG["DIEM_BAO_VE_DICH"]

        # Chống đi lặp lại ô vừa đi
        if m["to"] in recent_tos:
            score -= 30.0

        if score > best_score:
            best_score = score
            best_move = m

    return {"from": best_move["from"], "to": best_move["to"]}


if __name__ == "__main__":
    import sys
    if "--self-test" in sys.argv:
        print("=== BỘ TỰ CHẨN ĐOÁN THÍ SINH (UC Berkeley Tri-Tier Support) ===")
        # 1. Thử nghiệm gọi hàm choose_move trên 1 thế cờ mẫu
        test_state = {
            "player": "P1",
            "board": [[None]*9 for _ in range(9)],
            "legal_moves": [{"from": "B8", "to": "B7"}, {"from": "B8", "to": "A7"}],
            "history": [],
            "turn": 0
        }
        test_state["board"][7][1] = {"player": "P1", "type": "ROCK"}
        res = choose_move(test_state)
        assert res in test_state["legal_moves"], f"[E03] Nước đi không hợp lệ: {res}"
        print(f"✅ [Tự Kiểm Tra]: Hàm choose_move hoạt động tốt, trả về: {res}")
        print("🎉 Bot của bạn ĐẠT CHUẨN để nộp bài vào giải đấu UET BattleCode 2026!")

