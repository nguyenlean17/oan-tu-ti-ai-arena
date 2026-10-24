"""CyberKnight v4.0: Grandmaster AI cho Oẳn Tù Tì 2.0 (Core 15 Quân).

Đặc tính chiến thuật cao cấp:
1. Phân tích Lính canh đích (Goal Guard Awareness):
   - Đích P1 là I1: Lính canh địch quanh I1 là H1 (ROCK), H2 (SCISSORS).
     -> Mũi nhọn tiếp cận I1 phải an toàn, tuyệt đối không đưa Kéo vào mồm Đấm ở H1.
   - Đích P2 là A9: Lính canh P1 quanh A9 là B8 (PAPER), B9 (ROCK).
     -> Mũi nhọn tiếp cận A9 phải an toàn, tuyệt đối không đưa Đấm vào mồm Lá ở B8.
2. Chốt chặn cửa ngõ bất tử (Impenetrable Home Gatekeeper):
   - Luôn giữ vững các vị trí then chốt chặn cửa đích nhà mình, không để đối thủ lọt vào A9/I1.
3. Dự đoán 1-Ply Lookahead: Không bao giờ bước vào ô bị thiên địch ăn ở lượt sau.
"""

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

    gx, gy = (8, 0) if player == "P1" else (0, 8)
    hx, hy = 8 - gx, 8 - gy
    my_goal = "I1" if player == "P1" else "A9"
    opp_goal = "A9" if player == "P1" else "I1"

    def to_xy(c: str):
        c = c.upper()
        return ord(c[0]) - 65, int(c[1:]) - 1

    # 1. THẮNG TỨC THÌ
    for m in options:
        if m["to"].upper() == my_goal:
            return {"from": m["from"], "to": m["to"]}

    # Kiểm tra các ô xung quanh đích nhà (hx, hy)
    gate_cells = []
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx, ny = hx + dx, hy + dy
            if 0 <= nx < 9 and 0 <= ny < 9:
                gate_cells.append((nx, ny))

    # Địch nào đang đứng ở cổng đích nhà ta?
    threats_at_gate = []
    for gx_gate, gy_gate in gate_cells:
        p = board[gy_gate][gx_gate]
        if p and p["player"] == opp:
            threats_at_gate.append((gx_gate, gy_gate, p["type"]))

    # 2. KHẨN CẤP: TIÊU DIỆT ĐỊCH ĐANG ĐỨNG Ở CỔNG ĐÍCH
    if threats_at_gate:
        for m in options:
            tx, ty = to_xy(m["to"])
            for tgx, tgy, tgtype in threats_at_gate:
                if tx == tgx and ty == tgy:
                    fx, fy = to_xy(m["from"])
                    my_p = board[fy][fx]
                    if my_p and BEATS.get(my_p["type"]) == tgtype:
                        return {"from": m["from"], "to": m["to"]}

    # 3. LƯỢNG GIÁ CHI TIẾT
    recent = [m.get("to") for m in history[-6:] if m.get("player") == player]

    best_move = options[0]
    best_score = -1e9

    for m in options:
        fx, fy = to_xy(m["from"])
        tx, ty = to_xy(m["to"])
        my_piece = board[fy][fx]
        if not my_piece:
            continue
        my_type = my_piece["type"]
        target = board[ty][tx]

        # Kiểm tra nếu ta đi nước này, cửa đích nhà có bị hở toang không
        home_defender = my_piece if (tx, ty) == (hx, hy) else None if (fx, fy) == (hx, hy) else board[hy][hx]
        leaves_gate_open = False
        for tgx, tgy, tgtype in threats_at_gate:
            if not home_defender or BEATS.get(tgtype) == home_defender["type"]:
                leaves_gate_open = True
                break

        if leaves_gate_open and (tx, ty) != (hx, hy):
            continue

        # Kiểm tra xem ô (tx, ty) có bị đối thủ kề bên ăn ngay không
        danger = False
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                nx, ny = tx + dx, ty + dy
                if 0 <= nx < 9 and 0 <= ny < 9:
                    if (nx, ny) == (fx, fy):
                        continue
                    p = board[ny][nx]
                    if p and p["player"] == opp and p["type"] == PREDATOR.get(my_type):
                        danger = True
                        break
            if danger:
                break

        dist_to_goal = max(abs(tx - gx), abs(ty - gy))
        manh_to_goal = abs(tx - gx) + abs(ty - gy)
        dist_before = max(abs(fx - gx), abs(fy - gy))
        tempo = dist_before - dist_to_goal

        # Trọng số đua tốc độ
        score = -dist_to_goal * 25.0 - manh_to_goal * 4.0 + tempo * 30.0

        # Thưởng ăn quân
        if target and target["player"] == opp:
            score += 180.0
            # Ăn quân đang xâm nhập nửa sân nhà
            if max(abs(tx - hx), abs(ty - hy)) <= 3:
                score += 120.0

        # Phạt nặng nguy hiểm (bước vào mồm địch)
        if danger:
            score -= 280.0
        else:
            score += 25.0

        # Kiểm tra lính canh ở đích của đối phương
        # Nếu đang ở cự ly 1-2 ô tới đích địch, kiểm tra xem có bị lính canh đích ăn không
        if dist_to_goal <= 2:
            guard_danger = False
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    nx, ny = gx + dx, gy + dy
                    if 0 <= nx < 9 and 0 <= ny < 9:
                        gp = board[ny][nx]
                        if gp and gp["player"] == opp and gp["type"] == PREDATOR.get(my_type):
                            guard_danger = True
                            break
            if guard_danger:
                score -= 150.0  # Không nên dùng quân này áp sát nếu bị lính canh khắc chế

        # Thưởng giữ chốt bảo vệ cổng nhà
        if (tx, ty) == (hx, hy) or (tx, ty) in [(0, 7), (1, 8)] if player == "P1" else [(8, 1), (7, 0)]:
            score += 40.0

        # Phạt lặp nước
        score -= recent.count(m["to"]) * 35.0

        if score > best_score:
            best_score = score
            best_move = m

    return {"from": best_move["from"], "to": best_move["to"]}
