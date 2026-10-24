#!/usr/bin/env python3
"""
Kiểm Định Liêm Chính Học Thuật Ban Tổ Chức (Stanford Honor Code AST Checker)
Trích xuất từ Sổ Tay Vận Hành BTC UET BattleCode 2026 (Mục 7.1).

Nguyên lý hoạt động:
1. Phân tích Cây Cú Pháp Trừu Tượng (Abstract Syntax Tree - AST) bằng thư viện `ast` chuẩn.
2. Chuẩn hóa hình thức: Loại bỏ hoàn toàn docstrings, chú thích, định dạng khoảng trắng.
3. Canonical Renaming: Tự động đổi tên các biến nội bộ, tham số về dạng chuẩn (_v0, _v1, ...)
   để phát hiện triệt để các trường hợp chỉ đổi tên biến để né tránh.
4. Cơ chế Miễn trừ Cấp 1 (Stanford Whitelist):
   Tự động miễn trừ kiểm tra đối với các bài nộp thuộc nhóm Zero-Code Starter Kit
   (chỉ tinh chỉnh tham số số học trong từ điển BOT_CONFIG).
5. So sánh cấu trúc logic và đưa ra cảnh báo trùng lặp >= 90%.
"""

from __future__ import annotations
import ast
import os
import sys
from typing import Dict, List, Tuple, Set


class ASTNormalizer(ast.NodeTransformer):
    """Bộ chuẩn hóa AST: Đổi tên biến cục bộ & tham số thành _v0, _v1,..."""

    def __init__(self):
        super().__init__()
        self.var_map: Dict[str, str] = {}
        self.var_counter = 0

    def get_canonical(self, name: str) -> str:
        # Giữ nguyên các hàm cốt lõi của giải đấu
        if name in ("choose_move", "state", "legal_moves", "board", "player", "history", "turn"):
            return name
        if name not in self.var_map:
            self.var_map[name] = f"_v{self.var_counter}"
            self.var_counter += 1
        return self.var_map[name]

    def visit_Name(self, node: ast.Name) -> ast.Name:
        return ast.Name(id=self.get_canonical(node.id), ctx=node.ctx)

    def visit_arg(self, node: ast.arg) -> ast.arg:
        return ast.arg(arg=self.get_canonical(node.arg), annotation=None)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.FunctionDef:
        # Không đổi tên hàm chính choose_move
        if node.name != "choose_move":
            node.name = self.get_canonical(node.name)
        self.generic_visit(node)
        return node


def is_level_1_starter(tree: ast.AST, source: str) -> bool:
    """Nhận diện xem bài nộp có phải thuộc diện Miễn trừ Cấp 1 (Starter Kit) hay không."""
    # Kiểm tra xem có định nghĩa BOT_CONFIG không
    has_bot_config = "BOT_CONFIG" in source
    # Đếm số lượng cấu trúc rẽ nhánh phức tạp
    branch_count = sum(1 for node in ast.walk(tree) if isinstance(node, (ast.If, ast.While, ast.For)))
    # Nếu là khung cơ bản chỉ có vòng lặp duyệt legal_moves và tính điểm theo config
    return has_bot_config and branch_count <= 8


def extract_ast_tokens(tree: ast.AST) -> List[str]:
    """Chuyển đổi cây AST chuẩn hóa thành chuỗi các token cấu trúc."""
    tokens = []
    for node in ast.walk(tree):
        # Bỏ qua docstring
        if isinstance(node, ast.Expr) and isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
            continue
        node_type = type(node).__name__
        if isinstance(node, ast.Name):
            tokens.append(f"Name({node.id})")
        elif isinstance(node, ast.Constant) and not isinstance(node.value, str):
            tokens.append(f"Const({type(node.value).__name__})")
        else:
            tokens.append(node_type)
    return tokens


def calculate_jaccard_similarity(tokens1: List[str], tokens2: List[str]) -> float:
    """Tính toán chỉ số tương đồng Jaccard theo n-gram token (n=3)."""
    if not tokens1 or not tokens2:
        return 0.0

    def get_ngrams(tokens: List[str], n: int = 3) -> Set[Tuple[str, ...]]:
        return set(tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1))

    ngrams1 = get_ngrams(tokens1)
    ngrams2 = get_ngrams(tokens2)

    if not ngrams1 or not ngrams2:
        return 0.0

    intersection = len(ngrams1.intersection(ngrams2))
    union = len(ngrams1.union(ngrams2))

    return (intersection / union) * 100.0 if union > 0 else 0.0


def check_files(file_paths: List[str], threshold: float = 85.0):
    print("=" * 75)
    print("BAN TỔ CHỨC UET BATTLECODE 2026 — HỆ THỐNG KIỂM ĐỊNH LIÊM CHÍNH HỌC THUẬT")
    print(f"Tiêu chuẩn: Stanford Honor Code • Ngưỡng cảnh báo: >= {threshold:.1f}%")
    print("=" * 75)

    bots_data = {}
    for path in file_paths:
        name = os.path.basename(path)
        try:
            with open(path, "r", encoding="utf-8") as f:
                src = f.read()
            parsed = ast.parse(src)
            exempt = is_level_1_starter(parsed, src)
            normalizer = ASTNormalizer()
            normalized_tree = normalizer.visit(parsed)
            tokens = extract_ast_tokens(normalized_tree)
            bots_data[name] = {"path": path, "tokens": tokens, "exempt": exempt, "lines": len(src.splitlines())}
        except Exception as e:
            print(f"⚠️  [Bỏ qua] {name}: Không thể phân tích cú pháp Python ({e})")

    names = list(bots_data.keys())
    print(f"\nĐã nạp và chuẩn hóa cấu trúc AST cho {len(names)} bot thi đấu.\n")

    suspicious_pairs = []

    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            n1, n2 = names[i], names[j]
            b1, b2 = bots_data[n1], bots_data[n2]

            # Kiểm tra cơ chế miễn trừ Cấp 1
            if b1["exempt"] and b2["exempt"]:
                print(f"🛡️  [Miễn trừ Cấp 1] {n1} vs {n2}: Dùng chung khung Starter Kit (Hợp lệ)")
                continue

            sim = calculate_jaccard_similarity(b1["tokens"], b2["tokens"])

            if sim >= threshold:
                suspicious_pairs.append((n1, n2, sim))
                print(f"🚨 [CẢNH BÁO ĐẠO CODE] {n1} vs {n2} -> Độ tương đồng AST: {sim:.1f}%")
            else:
                print(f"✅ [Hợp lệ]          {n1} vs {n2} -> Độ tương đồng AST: {sim:.1f}%")

    print("\n" + "=" * 75)
    print(f"TỔNG KẾT KIỂM ĐỊNH: Phát hiện {len(suspicious_pairs)} cặp bài nộp có dấu hiệu trùng lặp cấu trúc.")
    if suspicious_pairs:
        print("\nDanh sách cần Ban Giám Khảo xác minh:")
        for n1, n2, sim in suspicious_pairs:
            print(f"  - Cặp: {n1} và {n2} (Trùng {sim:.1f}%)")
    else:
        print("Tất cả các bài nộp đều độc lập và hợp lệ!")
    print("=" * 75)


if __name__ == "__main__":
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "public/bots"
    if os.path.isdir(target_dir):
        files = [
            os.path.join(target_dir, f)
            for f in sorted(os.listdir(target_dir))
            if f.endswith(".py") and not f.startswith("__")
        ]
    else:
        files = sys.argv[1:]

    if len(files) < 2:
        print(f"Cần ít nhất 2 file bot để so sánh. Đã tìm thấy: {files}")
        sys.exit(0)

    check_files(files)
