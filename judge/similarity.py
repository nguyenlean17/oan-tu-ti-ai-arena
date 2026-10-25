"""Trusted, bounded AST parser. Submitted source is NEVER imported or executed."""
import ast
import collections
import json
import sys

try:
    import resource
    resource.setrlimit(resource.RLIMIT_AS, (384 * 1024 * 1024, 384 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_CPU, (12, 12))
except ImportError:
    pass


class Normalize(ast.NodeTransformer):
    def __init__(self):
        self.names = {}

    def name(self, value):
        if value in ('choose_move', 'state'):
            return value
        return self.names.setdefault(value, 'v' + str(len(self.names)))

    def visit_Name(self, node):
        node.id = self.name(node.id)
        return node

    def visit_arg(self, node):
        node.arg = self.name(node.arg)
        return node

    def visit_FunctionDef(self, node):
        node.name = self.name(node.name)
        return self.generic_visit(node)

    def visit_Expr(self, node):
        if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
            return None
        return self.generic_visit(node)


def parse(source):
    if not isinstance(source, str) or len(source.encode('utf-8')) > 65536:
        raise ValueError('Source size limit')
    tree = ast.parse(source)
    if sum(1 for _ in ast.walk(tree)) > 20000:
        raise ValueError('AST node limit')
    return tree


def template_fingerprint(source):
    tree = parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id in ('BOT_CONFIG', 'WEIGHTS') for t in node.targets):
            if isinstance(node.value, ast.Dict):
                for value in node.value.values:
                    if not isinstance(value, ast.Constant) or type(value.value) not in (int, float):
                        # Unary negative numeric literals also occur in the approved starter.
                        if not (isinstance(value, ast.UnaryOp) and isinstance(value.op, ast.USub) and isinstance(value.operand, ast.Constant) and type(value.operand.value) in (int, float)):
                            return None
                node.value = ast.Constant(value='APPROVED_CONFIG')
    return ast.dump(Normalize().visit(tree), include_attributes=False)


def tokens(source):
    tree = Normalize().visit(parse(source))
    values = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant):
            values.append('Constant:' + repr(node.value)[:80])
        elif isinstance(node, ast.Name):
            values.append('Name:' + node.id)
        elif isinstance(node, ast.Attribute):
            values.append('Attribute:' + node.attr)
        else:
            values.append(type(node).__name__)
    return collections.Counter(tuple(values[i:i + 4]) for i in range(max(0, len(values) - 3)))


def compare(data):
    submissions = data['submissions']
    if not isinstance(submissions, list) or len(submissions) > 100 or len({s['id'] for s in submissions}) != len(submissions):
        raise ValueError('Invalid submission identifiers/count')
    approved = {template_fingerprint(s) for s in data.get('templates', [])[:5]}
    approved.discard(None)
    parsed, exempt, errors = {}, [], []
    for item in submissions:
        try:
            fp = template_fingerprint(item['source'])
            if fp is not None and fp in approved:
                exempt.append(item['id'])
            else:
                parsed[item['id']] = tokens(item['source'])
        except (SyntaxError, ValueError, RecursionError):
            errors.append(item['id'])
    pairs = []
    ids = list(parsed)
    for i, a in enumerate(ids):
        for b in ids[i + 1:]:
            x, y = parsed[a], parsed[b]
            union = sum((x | y).values())
            score = 100 * sum((x & y).values()) / union if union else 0
            if score >= 85:
                pairs.append({'a': a, 'b': b, 'score': round(score, 1)})
    return {'compared': len(submissions), 'pairs': sorted(pairs, key=lambda p: -p['score'])[:100], 'templateExempt': exempt, 'errors': errors, 'partial': bool(data.get('partial')), 'advisory': True}


if __name__ == '__main__':
    raw = sys.stdin.buffer.read(8 * 1024 * 1024 + 1)
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError('Batch limit')
    print(json.dumps(compare(json.loads(raw)), separators=(',', ':')))
