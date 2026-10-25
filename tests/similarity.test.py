import importlib.util
import pathlib

spec = importlib.util.spec_from_file_location('review', pathlib.Path(__file__).resolve().parents[1] / 'judge' / 'similarity.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
base = 'BOT_CONFIG={"A":1}\ndef choose_move(state):\n    return state["legal_moves"][0]\n'
changed = base.replace('"A":1', '"A":999')
report = module.compare({'templates': [base], 'submissions': [{'id': 'a', 'source': base}, {'id': 'b', 'source': changed}]})
assert report['templateExempt'] == ['a', 'b']
clone = '# BOT_CONFIG\ndef choose_move(state):\n    if state["turn"]:\n        return state["legal_moves"][-1]\n    return state["legal_moves"][0]\n'
report = module.compare({'templates': [base], 'submissions': [{'id': 'unique-a', 'name': 'bot.py', 'source': clone}, {'id': 'unique-b', 'name': 'bot.py', 'source': clone}]})
assert report['templateExempt'] == []
assert report['pairs'][0] == {'a': 'unique-a', 'b': 'unique-b', 'score': 100.0}
# Untrusted statements are parsed only, never executed.
report = module.compare({'submissions': [{'id': 'never-execute', 'source': 'raise RuntimeError("EXECUTED")'}, {'id': 'syntax', 'source': 'def!'}]})
assert report['errors'] == ['syntax']
assert module.tokens('x=1') != module.tokens('x=999')
print('AST review: exact approved templates, comment bypass rejected, stable IDs, literal-sensitive tokens, no code execution.')
